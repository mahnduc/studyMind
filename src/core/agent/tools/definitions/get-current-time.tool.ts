import { Tool } from "../tool.interface";

export const getCurrentTimeTool: Tool = {
  name: "get_current_time",
  description: "Lấy thời gian hiện tại",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },

  async execute() {
    return {
      currentTime: new Date().toLocaleString(),
    };
  },
};