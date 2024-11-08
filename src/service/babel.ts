import * as vscode from "vscode";
import * as t from "@babel/types";
const parser = require("@babel/parser");
import traverse, { NodePath } from "@babel/traverse";
import { _Selection } from "./editor";
import validators from "@/utils/validate";
import { TranslationResult } from "@/utils/translateAPI";
import generate from "@babel/generator";
import { get } from "axios";

export type TemplatePart = {
  type: string;
  node: t.Node;
};

export const genAST = (srcCode: string) => {
  // 使用 @babel/parser 解析代码为 AST
  const ast = parser.parse(srcCode, {
    sourceType: "module", // 指定为模块
    plugins: [
      "jsx", // 启用 JSX 语法
      "typescript", // 启用 TypeScript 支持
      "classProperties", // 启用类属性语法
      "exportDefaultFrom", // 启用默认导出语法
    ],
  });

  return ast;
};

export interface ChineseSelection extends _Selection {
  value: string; // 中文内容
}

export const collectAllChinese = (parsedAST: any): ChineseSelection[] => {
  const result: ChineseSelection[] = [];
  const setResult = (value: string, node: NodePath<any>["node"]) => {
    if (!node.loc) {
      return;
    }
    const start = node.loc.start;
    const end = node.loc.end;

    result.push({
      value,
      start: {
        row: start.line,
        column: start.column + 1,
      },
      end: {
        row: end.line,
        column: end.column + 1,
      },
    });
  };

  // 遍历 AST 并替换中文字符串
  traverse(parsedAST, {
    // 捕捉js文本的情况, 例 <div>你好</div>
    JSXText(path: NodePath<t.JSXText>) {
      if (validators.isChinese(path.node.value)) {
        setResult(path.node.value, path.node);
      }
    },

    // 捕捉 JSX 中的 props 为字符串的情况. 例 <Student name="你好"/>
    JSXAttribute(path: NodePath<t.JSXAttribute>) {
      const propValueNode = path.node.value;

      if (!propValueNode || !t.isStringLiteral(propValueNode)) {
        return;
      }

      if (validators.isChinese(propValueNode.value)) {
        setResult(propValueNode.value, propValueNode);
      }
    },

    // 变量是字符串
    StringLiteral(path: NodePath<t.StringLiteral>) {
      // 检查父节点是否是变量声明
      if (path.parentPath.isVariableDeclarator()) {
        const value = path.node.value;

        if (validators.isChinese(value)) {
          setResult(value, path.node);
        }
      }
    },

    // 变量是模板字符串
    TemplateLiteral(path: NodePath<t.TemplateLiteral>) {
      // 检查父节点, 是否变量声明的模板字符串
      if (path.parentPath.isVariableDeclarator()) {
        const quasis = path.node.quasis;

        quasis.forEach((quasi) => {
          if (validators.isChinese(quasi.value.raw)) {
            setResult(quasi.value.raw, quasi);
          }
        });
      }
    },
  });

  return result;
};

/**
 * 替换中文
 */
export const replaceChinese = (
  parsedAST: any,
  translatedChinese: TranslationResult[]
) => {
  // 检查当前节点是否需要替换(国家化)
  const getReplacementInfoIfNeeded = (loc: any) => {
    return translatedChinese.find((item) => {
      if (
        item.selection.start.row === loc.start.line &&
        item.selection.end.row === loc.end.line &&
        item.selection.start.column === loc.start.column + 1 &&
        item.selection.end.column === loc.end.column + 1
      ) {
        return true;
      }

      return false;
    });
  };

  // 生成替换节点(国际函数的调用)
  const generateCallExperssion = (info: TranslationResult) => {
    // 创建被调用的函数节点（这里是标识符 "t"）
    const calleeNode = t.identifier("t");

    // 创建调用参数节点数组（这里是一个字符串字面量 "key"）
    const argumentsArray = [t.stringLiteral(info.key)];

    // 使用 t.callExpression 创建调用表达式节点 t("key")
    const callExpressionNode = t.callExpression(calleeNode, argumentsArray);

    // 添加注释
    callExpressionNode.leadingComments = [
      {
        type: "CommentBlock",
        value: info.raw.trim(),
      },
    ];

    return callExpressionNode;
  };

  // 遍历 AST 并替换中文字符串
  traverse(parsedAST, {
    // 捕捉js文本的情况, 例 <div>你好</div>
    JSXText(path: NodePath<t.JSXText>) {
      if (validators.isChinese(path.node.value)) {
        const info = getReplacementInfoIfNeeded(path.node.loc);

        if (info) {
          const textIndex = (
            path.parentPath.node as t.JSXElement
          ).children.findIndex((item) => item === path.node);

          (path.parentPath.node as t.JSXElement).children.splice(
            textIndex,
            1,
            t.jSXExpressionContainer(generateCallExperssion(info))
          );
        }
      }
    },

    // 捕捉 JSX 中的 props 为字符串的情况.
    // 例 <Student name="你好"/> -->  <Student name={ /*你好*/ t("key")} />
    JSXAttribute(path: NodePath<t.JSXAttribute>) {
      const propValueNode = path.node.value;

      if (!propValueNode || !t.isStringLiteral(propValueNode)) {
        return;
      }
      if (validators.isChinese(propValueNode.value)) {
        const info = getReplacementInfoIfNeeded(propValueNode.loc);

        if (info) {
          path.node.value = t.jSXExpressionContainer(
            generateCallExperssion(info)
          );
        }
      }
    },

    // // 变量是字符串
    StringLiteral(path: NodePath<t.StringLiteral>) {
      // 检查父节点是否是变量声明
      if (path.parentPath.isVariableDeclarator()) {
        const value = path.node.value;

        if (validators.isChinese(value)) {
          const info = getReplacementInfoIfNeeded(path.node.loc);

          if (info) {
            (path.parentPath.node as t.VariableDeclarator).init =
              generateCallExperssion(info);
          }
        }
      }
    },

    // 变量是模板字符串
    TemplateLiteral(path: NodePath<t.TemplateLiteral>) {
      // 检查父节点, 是否变量声明的模板字符串
      if (path.parentPath.isVariableDeclarator()) {
        const quasis = path.node.quasis;
        const templateParts = mergeTemplateParts(path.node);

        quasis.forEach((quasi) => {
          if (validators.isChinese(quasi.value.raw)) {
            const info = getReplacementInfoIfNeeded(quasi.loc);

            if (info) {
              qusisToExpression(
                quasi,
                generateCallExperssion(info),
                templateParts
              );
            }
          }
        });
        // @ts-ignore
        path.node.quasis = templateParts
          .filter((item) => item.type === "quasi")
          .map((item) => item.node);

        // @ts-ignore
        path.node.expressions = templateParts
          .filter((item) => item.type === "expressions")
          .map((item) => item.node);
      }
    },
  });

  return generate(parsedAST, {});
};

/**
 * @description
 * 合并和处理模板字符串中的 `quasis` 和 `expressions`，以便于国际化替换。
 *
 * 此函数将模板字符串中的静态部分 (`quasis`) 和动态部分 (`expressions`) 按顺序排列在一起，
 * 方便后续处理。并根据国际化需求，将每个 `quasi` 部分替换为空字符串的 `quasi`，并插入相应的 `expressions`。
 *
 * 举个例子：
 * 假设有模板字符串 `你好${XXX}世界`，它将被转化为以下结构：
 * [
 *   {type: "quasi", node: "你好"},
 *   {type: "expressions", node: XXX},
 *   {type: "quasi", node: "世界"},
 * ]
 *
 * 当进行国际化后，字符串变为 `${v("key1")}${XXX}${v("key2")}`，对应的结构应为：
 * [
 *   {type: "quasi", node: ""},
 *   {type: "expressions", node: "v('key1')"},
 *   {type: "quasi", node: ""},
 *   {type: "expressions", node: XXX},
 *   {type: "quasi", node: ""},
 *   {type: "expressions", node: "v('key2')"},
 *   {type: "quasi", node: ""},
 * ]
 *
 * 每次更改一个 `quasi` 时，需要在其前后插入一个空字符串的 `quasi`，以确保模板字符串的完整性。
 * 最后，通过过滤 `type`，可以分别获取 `quasis` 和 `expressions`，确保它们的顺序和结构一致。
 */
const mergeTemplateParts = (
  templateNode: t.TemplateLiteral
): TemplatePart[] => {
  const result: TemplatePart[] = [];
  const quasis = templateNode.quasis;
  const expressions = templateNode.expressions;

  let pointer = 0;

  while (pointer < quasis.length) {
    const quasi = quasis[pointer];
    if (quasi) {
      result.push({
        type: "quasi",
        node: quasi,
      });
    }

    const exp = expressions[pointer];
    if (exp) {
      result.push({
        type: "expressions",
        node: exp,
      });
    }

    pointer++;
  }

  return result;
};

/**
 * @description
 * 实现mergeTemplateParts函数注释中, 对结构的修改操作
 *
 * @param target 需要修改的节点
 * @param to 修改后的节点
 */
const qusisToExpression = (
  target: t.Node,
  to: t.Node,
  parts: TemplatePart[]
): void => {
  const index = parts.findIndex(
    (item) => item.node === target && item.type === "quasi"
  );

  if (index !== -1) {
    // 在目标节点后添加一个空节点
    parts.splice(index + 1, 0, {
      type: "quasi",
      node: t.templateElement({ raw: "", cooked: "" }),
    });

    // 将目标节点替换为修改后的节点
    parts[index] = {
      type: "expressions",
      node: to,
    };

    // 在目标节点前添加一个空节点
    parts.splice(index, 0, {
      type: "quasi",
      node: t.templateElement({ raw: "", cooked: "" }),
    });
  }
};
