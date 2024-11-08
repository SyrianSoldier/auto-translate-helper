export * from "./JumpToStrategy";
export * from "./SaveHtmlStrategy";
export * from "./TranslateHtmlStrategy";
export * from "./TranslateStrategy";
export * from "./SaveStrategy";
// 策略的接口
export interface MessageStrategy {
  handle(message: any): void;
}

// 执行策略的上下文
export class WebviewRecieveMsgContext {
  constructor(
    private strategies: { [command: string]: MessageStrategy } = {}
  ) {}

  // 注册策略
  registerStrategy(command: string, strategy: MessageStrategy) {
    if (this.strategies[command]) {
      return console.error("注册命令失败，命令已存在");
    }

    this.strategies[command] = strategy;
  }

  // 批量注册策略
  registerStrategies(mapping: { [command: string]: MessageStrategy }) {
    for (const [command, strategy] of Object.entries(mapping)) {
      this.registerStrategy(command, strategy);
    }
  }

  // 执行策略
  executeCommand(command: string, message: any) {
    if (!this.strategies[command]) {
      return console.error("执行命令失败，命令不存在");
    }

    this.strategies[command].handle(message);
  }
}
