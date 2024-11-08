export default {
  /* 翻译标签页名称 */
  translateTagName: "翻译页",

  /* 百度翻译 API 配置 */
  APP_ID: "20241102002192706", // 替换为你的应用 ID
  SECRET_KEY: "xqU9RmDI5OllaIBPiOnJ", // 替换为你的 Secret Key
  BAIDU_TRANSLATE_URL: "https://fanyi-api.baidu.com/api/trans/vip/translate",
  valideLanguages: [
    { name: "自动检测", code: "auto" },
    { name: "中文", code: "zh" },
    { name: "英语", code: "en" },
    { name: "粤语", code: "yue" },
    { name: "文言文", code: "wyw" },
    { name: "日语", code: "jp" },
    { name: "韩语", code: "kor" },
    { name: "法语", code: "fra" },
    { name: "西班牙语", code: "spa" },
    { name: "泰语", code: "th" },
    { name: "阿拉伯语", code: "ara" },
    { name: "俄语", code: "ru" },
    { name: "葡萄牙语", code: "pt" },
    { name: "德语", code: "de" },
    { name: "意大利语", code: "it" },
    { name: "希腊语", code: "el" },
    { name: "荷兰语", code: "nl" },
    { name: "波兰语", code: "pl" },
    { name: "保加利亚语", code: "bul" },
    { name: "爱沙尼亚语", code: "est" },
    { name: "丹麦语", code: "dan" },
    { name: "芬兰语", code: "fin" },
    { name: "捷克语", code: "cs" },
    { name: "罗马尼亚语", code: "rom" },
    { name: "斯洛文尼亚语", code: "slo" },
    { name: "瑞典语", code: "swe" },
    { name: "匈牙利语", code: "hu" },
    { name: "繁体中文", code: "cht" },
    { name: "越南语", code: "vie" },
  ],
} as const;
