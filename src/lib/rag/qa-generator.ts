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
 * @param folderName Tên bộ tri thức/thư mục chứa chunks gốc trong OPFS
 * @param requestedQuestions Số lượng câu hỏi người dùng muốn sinh (Giới hạn từ 1 - 20)
 * @returns Trả về mảng câu hỏi trắc nghiệm đã sinh và lưu trữ thành công
 */
export async function generateMCQBankFromOPFS(
  folderName: string,
  requestedQuestions: number = 10
): Promise<MCQQuestion[]> {
  const targetCount = Math.min(Math.max(requestedQuestions, 1), 20); // giới hạn số lượng câu hỏi

  const apiKey = await keyApi.getRandomKey("groq"); 
  if (!apiKey) {
    throw new Error("Không thể khởi tạo tiến trình: Không tìm thấy Groq API Key hợp lệ.");
  }

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

  const validChunks = chunksArray
    .map(item => item.chunk || item)
    .filter(chunk => chunk && chunk.content && chunk.content.length > 100)
    .sort(() => 0.5 - Math.random());

  if (validChunks.length === 0) {
    throw new Error("Không có đoạn dữ liệu nào đủ điều kiện để tiến hành sinh câu hỏi.");
  }

  const mcqBank: MCQQuestion[] = [];
  let chunkIndex = 0;

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

  if (mcqBank.length > 0) {
    const quizPayload: SavedQuizData = {
      knowledgeBase: folderName,
      createdAt: new Date().toISOString(),
      totalQuestions: mcqBank.length,
      questions: mcqBank
    };

    const fileName = `${folderName}_quiz.json`;
    
    const savedPath = await saveQuizToOPFSDirectory("quiz", fileName, quizPayload);
    console.log(`[OPFS Storage] Đã đồng bộ bộ đề trắc nghiệm thành công tại: ${savedPath}`);
  } else {
    throw new Error("Quá trình trích xuất hoàn tất nhưng không có câu hỏi hợp lệ nào được sinh ra.");
  }

  return mcqBank;
}

/**
 * Hàm xử lý lấy ra bộ câu hỏi trắc nghiệm đã được lưu trong OPFS
 * @param folderName Tên bộ tri thức / tên thư mục gốc của quiz
 * @returns Trả về dữ liệu toàn bộ cấu trúc Quiz đã lưu hoặc null nếu không tìm thấy
 */
export async function getSavedQuizFromOPFS(
  folderName: string
): Promise<SavedQuizData | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const quizDirHandle = await root.getDirectoryHandle("quiz");
    const fileName = `${folderName}_quiz.json`;
    
    const fileHandle = await quizDirHandle.getFileHandle(fileName);
    
    const file = await fileHandle.getFile();
    const fileContent = await file.text();
    
    if (!fileContent) return null;
    
    const quizData: SavedQuizData = JSON.parse(fileContent);
    return quizData;
    
  } catch (error: any) {
    if (error.name === "NotFoundError") {
      console.warn(`[OPFS Storage] Không tìm thấy bộ đề trắc nghiệm nào cho: ${folderName}`);
      return null;
    }
    
    console.error("Lỗi trong quá trình lấy dữ liệu Quiz từ OPFS:", error);
    throw new Error("Không thể truy xuất bộ đề trắc nghiệm từ hệ thống lưu trữ cục bộ.");
  }
}