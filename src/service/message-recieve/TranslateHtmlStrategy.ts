import { MessageStrategy } from ".";
import * as vscode from "vscode";

/**
 * 翻译页面加载完毕, 希望webview传递数据
 * @param panel webview面板
 * @param data webview向html传递的数据
 */
export class TranslateHtmlStrategy implements MessageStrategy {
  constructor(private pannel: vscode.WebviewPanel, private data: any) {}

  handle() {
    this.pannel.webview.postMessage(this.data);
  }
}
