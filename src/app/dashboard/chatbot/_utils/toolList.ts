export const toolList = [
  {
    type: "function",
    function: {
      name: "bm25_search",
      description: "Hành động này được thực hiện khi người dùng muốn tìm kiếm thông tin, tra cứu tài liệu hoặc hỏi về kiến thức trong kho lưu trữ.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Từ khóa chính để tìm kiếm (ví dụ: 'quy trình nghỉ phép', 'hợp đồng mẫu').",
          },
        },
        required: ["query"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "get_capabilities",
      description: "Gọi khi người dùng hỏi bạn có thể làm được gì, bạn là ai, hoặc yêu cầu hiển thị menu chức năng.",
      parameters: { type: "object", properties: {} },
    },
  },
];