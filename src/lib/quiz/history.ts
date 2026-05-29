import { QuizHistoryAttempt, QuizHistoryFile } from "@/types/quiz.type";

export async function saveQuizAttemptToOPFS(knowledgeBase: string, attempt: QuizHistoryAttempt) {
  try {
    const root = await navigator.storage.getDirectory();
    // 1. Mở hoặc tạo thư mục 'history_quiz'
    const historyDir = await root.getDirectoryHandle("history_quiz", { create: true });
    
    // 2. Định danh tên file lưu trữ dựa trên tên bộ trắc nghiệm (knowledgeBase)
    const historyFileName = `${knowledgeBase}_history.json`;
    
    let historyData: QuizHistoryFile = {
      quizFileName: `${knowledgeBase}.json`,
      attempts: []
    };

    try {
      // 3. Đọc dữ liệu cũ nếu file đã tồn tại
      const fileHandle = await historyDir.getFileHandle(historyFileName);
      const file = await fileHandle.getFile();
      const text = await file.text();
      if (text) {
        historyData = JSON.parse(text);
      }
    } catch (e) {
      // File chưa tồn tại, tiến hành tạo mới hoàn toàn ở bước sau
    }

    // 4. Đẩy kết quả lượt làm mới này lên đầu danh sách
    historyData.attempts.unshift(attempt);

    // 5. Ghi file mới/Ghi đè lại vào OPFS
    const fileHandle = await historyDir.getFileHandle(historyFileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(historyData, null, 2));
    await writable.close();
    
    console.log(`[OPFS] Đã lưu lịch sử thành công vào file: ${historyFileName}`);
  } catch (error) {
    console.error("[OPFS] Lỗi ghi lịch sử làm bài:", error);
  }
}