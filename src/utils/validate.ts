import settings from "@/settings";

export const regs = {
  chinese: /[\u4e00-\u9fa5]/,
} as const;

type ValidatorFunc = (...args: any[]) => boolean;
export type Validators = {
  isChinese: ValidatorFunc;
  isValidLang: ValidatorFunc;
};

const validators: Validators = {
  isChinese(str: string) {
    return regs.chinese.test(str);
  },

  isValidLang(lang: string) {
    return settings.valideLanguages.some((item) => item.code === lang);
  },
};

export default validators;
