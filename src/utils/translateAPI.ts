import axios from "axios";
import md5 from "md5";
import * as vscode from "vscode";
import settings from "../settings";
import validators from "./validate";
import message from "./message";
import { _Selection } from "@/service/editor";

const { BAIDU_TRANSLATE_URL, APP_ID, SECRET_KEY } = settings;

type Options = {
  from?: string;
  to?: string;
};

type TranslateAPIResult = Promise<
  | {
      src: string; // 翻译原文字;
      dst: string; // 翻译后的文字;
    }
  | undefined
>;

/**
 * @example
 * const res = await traslateAPI("你好,世界");
 * console.log(res?.dst);
 */
const traslateAPI = async (
  text: string,
  opts?: Options
): TranslateAPIResult => {
  try {
    const { from = "zh", to = "en" } = opts || {};

    if (!validators.isValidLang(from)) {
      throw new Error(`无效的翻译语言, from: ${from}`);
    }

    if (!validators.isValidLang(to)) {
      throw new Error(`无效的翻译语言, to: ${to}`);
    }

    const salt = Date.now();
    const res = await axios.get(BAIDU_TRANSLATE_URL, {
      params: {
        /* 待翻译文字 */
        q: text,
        from,
        to,
        appid: APP_ID,
        salt,
        sign: md5(APP_ID + text + salt + SECRET_KEY), // sign的计算方式: (appid + 翻译文本 + salt + 密钥)的MD5值
      },
    });

    return res.data.trans_result[0];
  } catch (error) {
    vscode.window.showErrorMessage(`翻译失败: ${text}`);
    console.log(error);
  }
};

export default traslateAPI;

export interface LocaleTranslation {
  locale: string; // 语言区域
  value: string; // 翻译的值
  status: string; // 状态，例如 'done'
}

// 翻译后的文本的类型
export interface TranslationResult {
  raw: string; // 原始文本
  key: string; // 唯一标识符
  locales: LocaleTranslation[]; // 该条目对应的多语言翻译
  selection: _Selection; // 文本的坐标
}
