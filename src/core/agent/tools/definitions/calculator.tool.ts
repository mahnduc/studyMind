import { Tool } from "../tool.interface";

export const calculatorTool: Tool = {
  name: "calculator",

  description:
    "Thực hiện phép tính đơn giản",

  parameters: {
    type: "object",

    properties: {
      a: {
        type: "number",
      },

      b: {
        type: "number",
      },

      operation: {
        type: "string",

        enum: [
          "add",
          "subtract",
          "multiply",
          "divide",
        ],
      },
    },

    required: [
      "a",
      "b",
      "operation",
    ],
  },

  async execute(args) {
    const {
      a,
      b,
      operation,
    } = args as {
      a: number;

      b: number;

      operation: string;
    };

    switch (operation) {
      case "add":
        return {
          result: a + b,
        };

      case "subtract":
        return {
          result: a - b,
        };

      case "multiply":
        return {
          result: a * b,
        };

      case "divide":
        return {
          result: a / b,
        };

      default:
        throw new Error(
          "Phép tính không hợp lệ"
        );
    }
  },
};