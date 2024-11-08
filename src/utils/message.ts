import * as vscode from "vscode";

export default {
  error(msg: string) {
    vscode.window.showErrorMessage(msg);
    console.error(msg);
  },
  info(msg: string) {
    vscode.window.showInformationMessage(msg);
    console.log(msg);
  },
  warn(msg: string) {
    vscode.window.showWarningMessage(msg);
    console.warn(msg);
  },
} as const;
