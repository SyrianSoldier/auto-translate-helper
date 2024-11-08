import { TranslationResult } from "@/utils/translateAPI";
import { getCustomConfig, getUtilsURIForWebview } from "@/utils";
import { MessageStrategy } from ".";
import * as vscode from "vscode";
import LoadingHtml from "@/public/loading.html";
import SaveHTML from "@/public/save.html";
import { ChineseSelection } from "../babel";
//@ts-ignore
import { nanoid } from "nanoid";
import traslateAPI from "@/utils/translateAPI";

// 策略实现类: 翻译时候触发
export class TranslateStrategy implements MessageStrategy {
  constructor(
    private panel: vscode.WebviewPanel,
    private context: vscode.ExtensionContext,

    private translatedChinese: TranslationResult[] = [],
    private config = getCustomConfig()
  ) {}

  handle(message: { payload: any }) {
    this.panel.webview.html = LoadingHtml; // 加载中

    const promises = (message.payload as ChineseSelection[]).map(
      async (item) => ({
        raw: item.value, // 原文
        key: nanoid(9), // key
        selection: {
          // 该文本在源码的位置
          start: item.start,
          end: item.end,
        },
        locales: await Promise.all(
          (this.config.languages as string[]).map(async (lang: string) => ({
            locale: lang,
            value: (await traslateAPI(item.value, { to: lang }))?.dst as string,
            status: "add",
          }))
        ),
      })
    );

    Promise.all(promises).then((data) => {
      this.translatedChinese = data;

      this.panel.webview.html = SaveHTML.replace(
        "{VUE_SRC}",
        getUtilsURIForWebview("vue.min.js", this.context, this.panel)
      );
    });
  }

  /**
   *
   * @returns 返回翻译后的中文
   */
  getTranslatedChinese() {
    return this.translatedChinese;
  }
}
