import { MessageStrategy, TranslateStrategy } from ".";
import { TranslationResult } from "@/utils/translateAPI";
import * as vscode from "vscode";
import message from "@/utils/message";
import settings from "@/settings";

// 策略实现类: 保存html时候触发
export class SaveHtmlStrategy implements MessageStrategy {
  constructor(
    private translateStrategy: TranslateStrategy,
    private panel: vscode.WebviewPanel
  ) {}

  handle() {
    const translatedChinese = this.translateStrategy.getTranslatedChinese();

    if (translatedChinese.length === 0) {
      message.error("没有翻译数据");
    }

    this.panel.webview.postMessage({
      translatedChinese,
      valideLanguages: settings.valideLanguages,
    });
  }
}
