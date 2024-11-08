import * as vscode from "vscode";
import { MessageStrategy } from ".";
import { jumpTo } from "@/service/editor";

// 策略实现类: 跳转到选区
export class JumpToStrategy implements MessageStrategy {
  constructor(private panel: vscode.WebviewPanel) {}

  handle(message: { payload: any }) {
    this.panel.dispose(); // 关闭标签页
    setTimeout(() => {
      jumpTo(message.payload); // 跳转到选区
    }, 100);
  }
}
