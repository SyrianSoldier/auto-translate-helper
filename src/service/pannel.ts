import * as vscode from "vscode";
import settings from "@/settings";

export const createPannel = (context: any) => {
  // 创建一个新的标签页
  const panel = vscode.window.createWebviewPanel(
    "translateTable", // 面板标识
    settings.translateTagName, // 自定义标题
    vscode.ViewColumn.One, // 显示在第一个编辑器标签页
    {
      enableScripts: true, // 启用 Webview 中的 JavaScript
    }
  );
  return panel;
};
