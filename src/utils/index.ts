import * as vscode from "vscode";

/**
 * @description 获取webview内嵌html用的uri
 */
export const getURIForWebview = (
  dirname: string,
  filename: string,
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel
): string => {
  const onDiskPath = vscode.Uri.joinPath(
    context.extensionUri,
    dirname,
    filename
  );
  // 注入vue
  const URI = panel.webview.asWebviewUri(onDiskPath);

  return URI.toString();
};

/**
 * @description 获取webview内嵌html用的uri, 相对于utils目录
 */

export const getUtilsURIForWebview = (
  filename: string,
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel
): string => {
  return getURIForWebview("src/utils", filename, context, panel);
};

/**
 * @description 获取配置
 */
export const getCustomConfig = () => {
  const config = vscode.workspace.getConfiguration("auto-translate-helper");
  return config;
};
