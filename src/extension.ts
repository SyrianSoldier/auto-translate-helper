import * as vscode from "vscode";
import Message from "@/utils/message";
import { collectAllChinese, genAST } from "./service/babel";
import { createPannel } from "./service/pannel";
import LoadingHtml from "@/public/loading.html";
import TranslateHtml from "@/public/translate.html";
import { getUtilsURIForWebview, getCustomConfig } from "./utils";
import {
  JumpToStrategy,
  SaveHtmlStrategy,
  TranslateHtmlStrategy,
  TranslateStrategy,
  WebviewRecieveMsgContext,
  SaveStrategy,
} from "./service/message-recieve";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "auto-translate-helper.translate",
    async () => {
      // 创建新标签页(面板)
      const panel = createPannel(context);

      // 获取当前文件源代码, 解析成AST语法树, 收集所有中文
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return Message.error("国际化失败: 请先打开一个文件");
      }
      const srcCode = editor.document.getText();
      const parsedAST = genAST(srcCode);
      const chienses = collectAllChinese(parsedAST);

      // 嵌入翻译页面的html
      panel.webview.html = TranslateHtml.replace(
        "{VUE_SRC}",
        getUtilsURIForWebview("vue.min.js", context, panel)
      );

      // 注册webview与html的通信事件策略
      const recieveMsgContext = new WebviewRecieveMsgContext();

      // 批量注册策略
      recieveMsgContext.registerStrategies({
        // 翻译页面加载完毕, 希望webview传递数据
        translateHtmlWantRecieveData: new TranslateHtmlStrategy(
          panel,
          chienses
        ),
        // 翻译页面点击中文, 可以跳转
        jumpTo: new JumpToStrategy(panel),

        // 翻译页面点击翻译按钮
        translate: new TranslateStrategy(panel, context),

        // 保存页面加载完毕, 希望webview传递数据
        get saveHtmlWantRecieveData() {
          return new SaveHtmlStrategy(this.translate, panel);
        },

        // 点击保存按钮
        save: new SaveStrategy(panel, editor, parsedAST),
      });

      panel.webview.onDidReceiveMessage((message) => {
        // 根据策略执行对应操作
        recieveMsgContext.executeCommand(message.command, message);
      });
    }
  );
  context.subscriptions.push(disposable);
}

// 当扩展停用时调用
export function deactivate() {}
