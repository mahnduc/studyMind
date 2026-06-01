import { keyApi } from "@/app/dashboard/settings/api-key/_api/key.api";
import { readJsonFromOPFS } from "./search-logic";

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

export interface SavedQuizData {
  knowledgeBase: string;
  createdAt: string;
  totalQuestions: number;
  questions: MCQQuestion[];
}

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
      const prompt = `Bạn là chuyên gia ra đề thi ngôn ngữ. Phân tích Ngữ liệu bên dưới, sau đó tạo đúng ${questionsToAskFromThisChunk} câu hỏi trắc nghiệm.

BƯỚC 1 — XÁC ĐỊNH LOẠI NGỮ LIỆU:
- Nếu ngữ liệu chứa từ vựng tiếng Anh, ngữ pháp, thành ngữ, hoặc giải thích ngôn ngữ → áp dụng QUY TẮC HỌC TIẾNG ANH
- Trường hợp còn lại → áp dụng QUY TẮC KIẾN THỨC CHUNG

---

QUY TẮC HỌC TIẾNG ANH:
Câu hỏi và đáp án đều viết bằng TIẾNG VIỆT.
Ưu tiên các dạng câu hỏi:
  + Từ vựng: "Từ '...' trong tiếng Anh có nghĩa là gì?", "Từ nào có nghĩa là '...'?"
  + Ngữ pháp: mô tả tình huống bằng tiếng Việt, yêu cầu chọn cấu trúc/thì đúng (viết bằng tiếng Việt)
  + Cụm từ: "Thành ngữ '...' có nghĩa là gì?", "Cụm từ nào diễn đạt nghĩa '...'?"
  + Dịch thuật: "Câu/từ '...' dịch sang tiếng Việt là gì?"

Ví dụ tốt (từ vựng):
{
  "question": "Từ 'resilient' trong tiếng Anh có nghĩa là gì?",
  "options": { "A": "Dễ vỡ, mong manh", "B": "Kiên cường, không bị đánh gục", "C": "Bướng bỉnh, cứng đầu", "D": "Thụ động, thiếu chủ động" },
  "answer": "B"
}

Ví dụ tốt (ngữ pháp):
{
  "question": "Khi diễn đạt hành động đã xảy ra và kéo dài trước một mốc thời gian trong quá khứ, ta dùng thì gì?",
  "options": { "A": "Quá khứ đơn", "B": "Quá khứ tiếp diễn", "C": "Quá khứ hoàn thành tiếp diễn", "D": "Hiện tại hoàn thành" },
  "answer": "C"
}

Ví dụ tốt (phrasal verb):
{
  "question": "Cụm động từ 'give up' có nghĩa là gì?",
  "options": { "A": "Trao tặng ai đó thứ gì", "B": "Từ bỏ", "C": "Đầu hàng trước kẻ thù", "D": "Phân phát cho nhiều người" },
  "answer": "B"
}

Ví dụ XẤU (TRÁNH):
{
  "question": "Theo đoạn văn trên, từ nào sau đây có nghĩa gần nhất với 'resilient' trong ngữ cảnh được đề cập?",
  "options": { "A": "Đây là từ mang nghĩa dễ vỡ và mong manh", "B": "Từ này mang nghĩa kiên cường và không bị đánh gục bởi khó khăn", ... }
}

---

QUY TẮC KIẾN THỨC CHUNG:
- Câu hỏi và đáp án viết bằng TIẾNG VIỆT.
- Hỏi về khái niệm, định nghĩa, nguyên nhân-kết quả, sự kiện chính.
- Câu hỏi ngắn gọn, trực tiếp. KHÔNG dùng: "Theo đoạn văn...", "Câu nào sau đây đúng nhất...".
- Đáp án song song về cấu trúc, súc tích, KHÔNG lặp lại thân câu hỏi.

Ví dụ tốt:
{
  "question": "Chức năng chính của ty thể trong tế bào là gì?",
  "options": { "A": "Tổng hợp protein", "B": "Sản xuất ATP", "C": "Tiêu hóa chất thải", "D": "Điều tiết chu kỳ tế bào" },
  "answer": "B"
}

---

QUY TẮC CHUNG CHO CẢ HAI LOẠI:
- Đúng 4 lựa chọn (A, B, C, D) mỗi câu.
- Trường "answer" phải là một trong: "A", "B", "C", "D".
- Đáp án nhiễu phải sai rõ ràng nhưng dễ nhầm.
- KHÔNG dùng mở đầu hoa mỹ, dài dòng cho câu hỏi.

OUTPUT: JSON hợp lệ, KHÔNG bọc markdown, KHÔNG giải thích thêm.

{
  "mcq_pairs": [
    {
      "question": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "answer": "A"
    }
  ]
}

Ngữ liệu:
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