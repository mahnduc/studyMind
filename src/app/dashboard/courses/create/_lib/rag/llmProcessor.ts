// import { keyApi } from "@/app/dashboard/settings/api-key/_api/key.api";
// import { ProcessedChunk } from "./markdownChunker";

// // Định nghĩa cấu trúc node mà React Flow sẽ cần đọc
// export interface LLMTreeNode {
//   label: string;
//   chunkId?: string;
//   children?: LLMTreeNode[];
// }

// // System Prompt tinh chỉnh riêng cho Groq, nhúng thẳng cấu trúc mong muốn vào prompt
// const MINDMAP_SYSTEM_PROMPT = `
// Bạn là một chuyên gia phân tích dữ liệu và sơ đồ tư duy.
// Nhiệm vụ của bạn là xem xét danh sách các đoạn text (chunks), hiểu cấu trúc ngữ nghĩa và tổ chức chúng thành một cây sơ đồ tư duy (Mindmap Tree) khoa học.

// Quy tắc phân nhánh quan trọng:
// 1. Gốc (Root) sẽ là tên bộ tri thức.
// 2. Các nhánh trung gian (Branch) là các chủ đề lớn, chủ đề con được gom nhóm logic dựa trên nội dung chunks.
// 3. Các lá (Leaf) bắt buộc phải là các điểm nội dung cụ thể VÀ phải đính kèm chính xác 'chunkId' từ dữ liệu đầu vào.
// 4. Mọi text hiển thị ở 'label' phải ngắn gọn (dưới 10 từ), súc tích.

// BẮT BUỘC phải trả về dữ liệu dưới dạng một JSON Object tuân thủ chính xác cấu trúc mẫu sau:
// {
//   "label": "Tên bộ tri thức",
//   "children": [
//     {
//       "label": "Tên chủ đề lớn cấp 1",
//       "children": [
//         {
//           "label": "Ý chính cụ thể rút ra từ đoạn văn",
//           "chunkId": "chuỗi-id-gốc-ở-đây"
//         }
//       ]
//     }
//   ]
// }
// `;

// /**
//  * Pipeline xử lý tiền dữ liệu Mindmap chạy thuần Client-side với Groq Cloud API
//  */
// export async function generateMindmapWithLLM(
//   chunks: ProcessedChunk[],
//   kbName: string,
// ): Promise<LLMTreeNode> {
  
//   // 1. Chuẩn bị dữ liệu đầu vào siêu tinh gọn để tối ưu hóa Token
//   const simplifiedInput = chunks.map((chunk) => ({
//     chunkId: chunk.metadata.chunkId,
//     headings: chunk.metadata.headings || [],
//     // Lấy 250 ký tự đầu làm ngữ cảnh phân tích chủ đề, tránh gửi thừa thãi toàn bộ text dài
//     summary: chunk.content.substring(0, 250).replace(/\n/g, " ") + "..."
//   }));

//   // 2. Cấu hình Endpoint trực tiếp đến Groq API 
//   const url = "https://api.groq.com/openai/v1/chat/completions";

//   const apiKey = await keyApi.getRandomKey("groq");

//   const response = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${apiKey}` 
//     },
//     body: JSON.stringify({
//       model: "llama-3.3-70b-versatile", 
//       temperature: 0.2,
//       // SỬA ĐỔI TẠI ĐÂY: Quay lại dùng json_object tiêu chuẩn, loại bỏ hoàn toàn json_schema gây lỗi
//       response_format: {
//         type: "json_object"
//       },
//       messages: [
//         { 
//           role: "system", 
//           content: MINDMAP_SYSTEM_PROMPT 
//         },
//         { 
//           role: "user", 
//           content: `Tên bộ tri thức: ${kbName}\nDữ liệu các đoạn văn bản cấu thành:\n${JSON.stringify(simplifiedInput)}` 
//         }
//       ]
//     })
//   });

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}));
//     throw new Error(errorData?.error?.message || `Groq API thất bại với mã lỗi: ${response.status}`);
//   }

//   const data = await response.json();
  
//   try {
//     // Cách bóc tách dữ liệu JSON từ cấu trúc phản hồi OpenAI/Groq
//     const jsonText = data.choices[0].message.content;
//     const parsedTree: LLMTreeNode = JSON.parse(jsonText);
//     return parsedTree;
//   } catch (err) {
//     console.error("Lỗi parse cấu trúc cây từ Groq LLM:", err);
//     throw new Error("Mô hình Groq phản hồi sai định dạng cấu trúc cây sơ đồ.");
//   }
// }