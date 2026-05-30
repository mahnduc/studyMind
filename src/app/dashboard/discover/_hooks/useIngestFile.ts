import { useState } from "react";
import { ingestFromPath } from "@/lib/rag/api";
import { generateMCQBankFromOPFS, MCQQuestion } from "@/lib/rag/qa-generator"; 

export function useIngestFile(directoryName: string = "system-raw-file") {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  
  // Trạng thái mặc định hoặc đồng bộ với UI input
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [requestedQuestions, setRequestedQuestions] = useState<number>(10);
  const [generatedQuiz, setGeneratedQuiz] = useState<MCQQuestion[]>([]);

  const handleSelectFile = (fileName: string) => {
    if (isIngesting || isGeneratingQuiz) return;
    setSelectedFile(prev => (prev === fileName ? null : fileName));
    setGeneratedQuiz([]); 
  };

  /**
   * Hàm xử lý Ingest dữ liệu thô
   */
  const handleConfirmIngestion = async (): Promise<boolean> => {
    if (!selectedFile) return false;

    setIsIngesting(true);
    try {
      const filePath = `${directoryName}/${selectedFile}`;
      const response = await ingestFromPath(filePath);
      
      if (response.success) {
        return true; 
      } else {
        alert("Lỗi Ingest: " + response.error);
        return false;
      }
    } catch (error: any) {
      alert("Lỗi Ingest: " + (error?.message || "Không thể xử lý dữ liệu."));
      return false;
    } finally {
      setIsIngesting(false);
    }
  };

  /**
   * CẬP NHẬT: Cho phép truyền trực tiếp customCount và folderName từ UI
   * @param customCount Số lượng câu hỏi muốn tạo (nếu không truyền sẽ dùng state requestedQuestions)
   * @param folderName Tên thư mục chứa dữ liệu chunks trong OPFS
   */
  const handleCreateQuiz = async (customCount?: number, folderName?: string) => {
    // Ưu tiên số lượng câu hỏi truyền vào hàm, nếu không có mới dùng state
    const countToGenerate = customCount !== undefined ? customCount : requestedQuestions;
    
    // Giới hạn an toàn từ 1 đến 20 theo logic hàm lõi của bạn
    const finalCount = Math.min(Math.max(countToGenerate, 1), 20);

    const targetFolder = folderName || selectedFile?.split('.').slice(0, -1).join('.') || "default_kb";
    
    setIsGeneratingQuiz(true);
    try {
      // Gọi hàm sinh trắc nghiệm với số lượng câu hỏi đã quyết định
      const quizResult = await generateMCQBankFromOPFS(targetFolder, finalCount);
      
      setGeneratedQuiz(quizResult);
      alert(`Sinh bộ đề thành công! Đã tạo ${quizResult.length} câu hỏi và sao lưu vào hệ thống.`);
      return quizResult;
    } catch (error: any) {
      alert("Lỗi tạo Quiz: " + (error?.message || "Không thể sinh câu hỏi trắc nghiệm."));
      return null;
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  /**
   * CẬP NHẬT: Luồng tự động chạy cả 2 bước, có nhận số lượng câu hỏi mong muốn
   */
  const handleIngestAndCreateQuiz = async (customCount?: number) => {
    if (!selectedFile) return;
    const isSuccess = await handleConfirmIngestion();
    if (isSuccess) {
      // Truyền tiếp số lượng câu hỏi xuống hàm tạo quiz
      await handleCreateQuiz(customCount);
    }
  };

  return {
    selectedFile,
    setSelectedFile,
    isIngesting,
    handleSelectFile,
    handleConfirmIngestion,
    
    // Các trạng thái và hàm phục vụ việc sinh Quiz
    isGeneratingQuiz,
    requestedQuestions,     // Dùng để gắn vào giá trị mặc định của thẻ <input> nếu cần
    setRequestedQuestions,  // Dùng để thay đổi state từ UI
    generatedQuiz,
    handleCreateQuiz,          // Gọi: handleCreateQuiz(15) hoặc handleCreateQuiz()
    handleIngestAndCreateQuiz  // Gọi: handleIngestAndCreateQuiz(15)
  };
}