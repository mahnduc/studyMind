import { keyApi } from "@/app/dashboard/settings/api-key/_api/key.api";
import { readJsonFromOPFS } from "./search-logic";

// Định nghĩa cấu trúc câu hỏi trắc nghiệm chuẩn
export interface MCQQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: "A" | "B" | "C" | "D";
  chunkId: string;
}

// Định nghĩa cấu trúc file Quiz lưu trữ trong hệ thống
export interface SavedQuizData {
  knowledgeBase: string;
  createdAt: string;
  totalQuestions: number;
  questions: MCQQuestion[];
}

/**
 * Hàm helper xử lý ghi tệp cấu trúc JSON vào một thư mục cụ thể trong OPFS
 */
async function saveQuizToOPFSDirectory(
  folderName: string,
  fileName: string,
  data: SavedQuizData
): Promise<string> {
  try {
    const root = await navigator.storage.getDirectory();
    // Khởi tạo hoặc truy cập thẳng vào thư mục chuyên biệt 'quiz' ở gốc OPFS
    const quizDirHandle = await root.getDirectoryHandle(folderName, { create: true });
    const fileHandle = await quizDirHandle.getFileHandle(fileName, { create: true });
    
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    
    return `/${folderName}/${fileName}`;
  } catch (error) {
    console.error("Lỗi trong quá trình ghi file Quiz vào OPFS:", error);
    throw new Error("Không thể sao lưu bộ đề trắc nghiệm vào hệ thống lưu trữ cục bộ.");
  }
}

/**
 * Hàm sinh bộ câu hỏi trắc nghiệm từ dữ liệu OPFS và tự động lưu trữ vào thư mục quiz
 * @param folderName Tên bộ tri thức/thư mục chứa chunks gốc trong OPFS
 * @param requestedQuestions Số lượng câu hỏi người dùng muốn sinh (Giới hạn từ 1 - 20)
 * @returns Trả về mảng câu hỏi trắc nghiệm đã sinh và lưu trữ thành công
 */
export async function generateMCQBankFromOPFS(
  folderName: string,
  requestedQuestions: number = 10
): Promise<MCQQuestion[]> {
  // Giới hạn số lượng câu hỏi đầu vào trong khoảng hợp lệ [1, 20]
  const targetCount = Math.min(Math.max(requestedQuestions, 1), 20);

  // 1. Lấy API Key Groq từ hệ thống quản lý key
  const apiKey = await keyApi.getRandomKey("groq"); 
  if (!apiKey) {
    throw new Error("Không thể khởi tạo tiến trình: Không tìm thấy Groq API Key hợp lệ.");
  }

  // 2. Đọc và tiền xử lý dữ liệu chunks từ OPFS
  let allChunksData = await readJsonFromOPFS<any>(folderName, "chunks.json");
  if (!allChunksData) throw new Error("Không thể đọc tệp chunks.json hoặc tệp trống.");

  if (typeof allChunksData === "string") {
    allChunksData = JSON.parse(allChunksData);
  }

  const chunksArray: any[] = Array.isArray(allChunksData)
    ? allChunksData
    : (allChunksData.chunks || allChunksData.data || []);

  if (chunksArray.length === 0) {
    throw new Error("Không tìm thấy dữ liệu chunk hợp lệ trong tệp chunks.json");
  }

  // Lọc và làm sạch danh sách chunk, chọn lọc các đoạn có độ dài text tối thiểu
  const validChunks = chunksArray
    .map(item => item.chunk || item)
    .filter(chunk => chunk && chunk.content && chunk.content.length > 100)
    .sort(() => 0.5 - Math.random()); // Trộn ngẫu nhiên tăng tính khách quan cho đề thi

  if (validChunks.length === 0) {
    throw new Error("Không có đoạn dữ liệu nào đủ điều kiện để tiến hành sinh câu hỏi.");
  }

  const mcqBank: MCQQuestion[] = [];
  let chunkIndex = 0;

  // 3. Vòng lặp lấy dữ liệu và gọi API
  while (mcqBank.length < targetCount && chunkIndex < validChunks.length) {
    const remainingToGenerate = targetCount - mcqBank.length;
    const questionsToAskFromThisChunk = remainingToGenerate >= 2 ? 2 : 1;
    
    const chunk = validChunks[chunkIndex];
    chunkIndex++;

    try {
      const prompt = `You are an expert exam creator. Based on the provided Context, generate exactly ${questionsToAskFromThisChunk} multiple-choice question(s) in Vietnamese.

CRITICAL REQUIREMENTS:
- Each question must have exactly 4 choices (A, B, C, D).
- The "answer" field MUST strictly be one of the keys: "A", "B", "C", or "D".
- The output MUST be a valid JSON object containing an "mcq_pairs" array.
- Do NOT include any markdown formatting wrappers (like \`\`\`json ... \`\`\`), introduction, or extra explanation.

Desired JSON Structure:
{
  "mcq_pairs": [
    {
      "question": "Nội dung câu hỏi trắc nghiệm 1?",
      "options": {
        "A": "Đáp án lựa chọn A",
        "B": "Đáp án lựa chọn B",
        "C": "Đáp án lựa chọn C",
        "D": "Đáp án lựa chọn D"
      },
      "answer": "A"
    }
  ]
}

Context:
${chunk.content}`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          response_format: { type: "json_object" } 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Groq Error! Status: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.choices[0]?.message?.content?.trim();
      if (!rawText) continue;

      const parsedOutput = JSON.parse(rawText);
      const questions = parsedOutput.mcq_pairs || parsedOutput.questions || (Array.isArray(parsedOutput) ? parsedOutput : []);

      if (Array.isArray(questions)) {
        for (const q of questions) {
          if (q.question && q.options && q.options.A && q.answer && mcqBank.length < targetCount) {
            mcqBank.push({
              question: q.question.trim(),
              options: {
                A: q.options.A.trim(),
                B: q.options.B?.trim() || "",
                C: q.options.C?.trim() || "",
                D: q.options.D?.trim() || ""
              },
              answer: q.answer.trim().toUpperCase() as "A" | "B" | "C" | "D",
              chunkId: chunk.metadata?.chunkId || "unknown_chunk"
            });
          }
        }
      }
    } catch (err) {
      console.error(`Bỏ qua lỗi xử lý tại chunk ${chunk.metadata?.chunkId || 'N/A'}:`, err);
    }
  }

  // 4. Tự động đóng gói và lưu trữ vào thư mục 'quiz' trong OPFS
  if (mcqBank.length > 0) {
    const quizPayload: SavedQuizData = {
      knowledgeBase: folderName,
      createdAt: new Date().toISOString(),
      totalQuestions: mcqBank.length,
      questions: mcqBank
    };

    // Quy hoạch tên tệp lưu trữ theo định dạng: [tên_kho_tri_thức]_quiz.json
    const fileName = `${folderName}_quiz.json`;
    
    // Thực thi lưu vào thư mục 'quiz' tập trung thay vì lưu trùng trong thư mục tri thức
    const savedPath = await saveQuizToOPFSDirectory("quiz", fileName, quizPayload);
    console.log(`[OPFS Storage] Đã đồng bộ bộ đề trắc nghiệm thành công tại: ${savedPath}`);
  } else {
    throw new Error("Quá trình trích xuất hoàn tất nhưng không có câu hỏi hợp lệ nào được sinh ra.");
  }

  return mcqBank;
}