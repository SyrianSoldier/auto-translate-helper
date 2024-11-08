import { TranslationResult } from "@/utils/translateAPI";
import { MessageStrategy } from ".";
import { getCustomConfig } from "@/utils";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import Message from "@/utils/message";
import { replaceChinese } from "../babel";

/**
 *  @description 点击保存时的策略
 */
export class SaveStrategy implements MessageStrategy {
  constructor(
    private panel: vscode.WebviewPanel,
    private editor: vscode.TextEditor,
    private parsedAST: any,
    private config = getCustomConfig()
  ) {}

  async handle(message: { payload: TranslationResult[] }) {
    // 生成国际化文件
    this.generateI18nFile(message.payload);

    // 关闭翻译标签页
    this.panel.dispose();

    // 生成替换的文本字符串, 打开之前的页签, 替换文本
    const document = await vscode.workspace.openTextDocument(
      this.editor.document.uri.fsPath
    );

    const editor = await vscode.window.showTextDocument(document);

    const result = replaceChinese(this.parsedAST, message.payload);
    editor.edit((editBuilder) => {
      const replaceRange = new vscode.Range(
        this.editor.document.positionAt(0),
        this.editor.document.positionAt(this.editor.document.getText().length)
      );
      editBuilder.replace(replaceRange, result.code);
    });
  }

  /**
   *  @description 获取语言包存放的目录
   */
  getLocalesDirPath() {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
      Message.error("请先打开一个工作区");
      return;
    }

    // 获取第一个工作区目录的路径
    const workspacePath = workspaceFolders[0].uri.fsPath;

    // 检查 src/locales(默认是locales) 目录是否存在
    const localesPath = path.join(workspacePath, "src", this.config.localesDir);

    return localesPath;
  }

  /**
   *  @description 获取当前语言的语言包
   *  @example
   *  {
   *   "key1": "value1",
   *   "key2": "value2"
   * }
   */
  getLangPackage(translatedChinese: TranslationResult[], lang: string) {
    return translatedChinese.reduce((prev, curr) => {
      const locale = curr.locales.find((item) => item.locale === lang);

      if (locale) {
        prev[curr.key] = locale.value;
      }

      return prev;
    }, {} as { [key: string]: string });
  }

  /**
   *  @description 将语言包对象写入文件
   */
  writeLanguagePackageToFile(
    filename: string,
    langPackage: Record<string, string>,
    lang: string
  ) {
    fs.writeFile(
      filename,
      "export default " + JSON.stringify(langPackage, null, 2),
      "utf-8",
      (error) => {
        if (error) {
          Message.error("语言包写入失败: " + error.message);
        } else {
          Message.info(`${lang} 语言包写入成功`);
        }
      }
    );
  }

  /**
   *
   * @description 生成国际化文件, 包括检测与创建语言包存放目录, 写入各个国家的语言包
   */
  generateI18nFile(translatedChinese: TranslationResult[]) {
    const langs = this.config.languages as string[];
    const localesPath = this.getLocalesDirPath();
    const suffix = this.config.suffix;

    if (!localesPath) {
      return;
    }

    // 如果目录不存在, 创建目录
    if (!fs.existsSync(localesPath)) {
      fs.mkdirSync(localesPath, { recursive: true });
    }

    // 创建语言包文件
    langs.forEach((lang) => {
      const filename = localesPath + `\\${lang}.${suffix}`;

      const langPackage = this.getLangPackage(translatedChinese, lang);

      fs.readFile(filename, "utf-8", (error, data) => {
        if (error) {
          // 原语言包不存在, 直接写入全量语言包
          if (error.code === "ENOENT") {
            this.writeLanguagePackageToFile(filename, langPackage, lang);
          } else {
            Message.error("语言包读取失败: " + error.message);
          }
        } else {
          try {
            // 读取原语言包
            const originLangPackage = JSON.parse(
              data.replace("export default", "")
            );
            // 合并语言包
            const newLangPackage = { ...originLangPackage, ...langPackage };
            // 写入语言包
            this.writeLanguagePackageToFile(filename, newLangPackage, lang);
          } catch (error) {
            Message.error("原语言包解析失败: " + error);
          }
        }
      });
    });
  }
}
