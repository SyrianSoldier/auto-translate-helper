import { getCustomConfig } from "@/utils";
import message from "@/utils/message";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

/**
 *  检查文件是否存在
 *
 * @param path 文件路径
 * @param isCreate 当目录不存在时候是否创建新文件
 * @returns {boolean} 是否存在目录
 */
export const checkDirExist = (path: string, isCreate?: boolean) => {
  if (fs.existsSync(path)) {
    return true;
  }

  if (isCreate) {
    fs.mkdirSync(path, { recursive: true });
    return true;
  }

  return false;
};

/**
 * @description 检查用户工作区的目录是否存在
 */
export const checkWorkSpaceLocalDirExist = (isCreate: boolean) => {
  const config = getCustomConfig();

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    message.error("请先打开一个工作区");
    return;
  }

  // 获取第一个工作区目录的路径
  const workspacePath = workspaceFolders[0].uri.fsPath;

  // 检查 src/locales(默认是locales) 目录是否存在
  const localesPath = path.join(workspacePath, "src", config.localesDir);

  return checkDirExist(localesPath, isCreate);
};

export const checkWorkSpaceLocalFileExist = (isCreate: boolean) => {
  const config = getCustomConfig();

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    message.error("请先打开一个工作区");
    return;
  }

  // 获取第一个工作区目录的路径
  const workspacePath = workspaceFolders[0].uri.fsPath;

  // 检查 src/locales(默认是locales) 目录是否存在
  const localesPath = path.join(workspacePath, "src", config.localesDir);

  return checkDirExist(localesPath, isCreate);
};
