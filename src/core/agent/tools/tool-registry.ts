import { calculatorTool } from "./definitions/calculator.tool";
import { getCurrentTimeTool } from "./definitions/get-current-time.tool";

export class ToolRegistry {
  private tools = new Map([
    [
      getCurrentTimeTool.name,
      getCurrentTimeTool,
    ],
    [
      calculatorTool.name,
      calculatorTool,
    ],
  ]);

  get(name: string) {
    return this.tools.get(name);
  }

  getDefinitions() {
    return Array.from(this.tools.values()).map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }
}