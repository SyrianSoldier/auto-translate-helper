import * as vscode from "vscode";
import message from "@/utils/message";

export type _Position = {
  row: number;
  column: number;
};

export type _Selection = {
  start: _Position;
  end: _Position;
};

export interface JumpToArgs extends _Selection {
  value: string;
}

/**
 * 将光标跳转并选中指定的文本区域。
 *
 * @example
 * jumpTo({
 *   start: { row: 55, column: 20 },
 *   end: { row: 55, column: 22 },
 * });
 *
 */
export const jumpTo = ({ value, start, end }: JumpToArgs) => {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    message.error("当前活动编辑器不存在");
    return;
  }

  message.info(`已经跳转到${value}位置`);

  const startPosition = new vscode.Position(start.row - 1, start.column - 1);
  const endPosition = new vscode.Position(end.row - 1, end.column - 1);

  // 创建一个选区
  const selection = new vscode.Selection(startPosition, endPosition);

  // 将选区设置为当前编辑器的选区
  editor.selection = selection;

  // 使用 InCenter 来居中滚动
  editor.revealRange(selection, vscode.TextEditorRevealType.InCenter);
};
