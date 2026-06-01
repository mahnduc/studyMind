'use client';

import { useEffect, useRef } from 'react';
import { requestGroq } from '@/agent/core/gateway';
import { GROQ_DEFAULT_MODEL } from '@/utils/constant';
import { appEmitter } from '@/utils/eventEmitter';

// Định nghĩa cấu trúc Object nhận được từ hệ thống của bạn
interface QuizPayload {
  attemptId: string;
  timestamp: string;
  score: number;
  totalQuestions: number;
  duration: number; // tính bằng giây
  accuracy: number; // tính bằng % (ví dụ: 40)
}

export default function EventEmitterInitializer() {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const learningHabitHandler = async (payloadString: string) => {
      try {
        let accuracyCategory = 'chua_tot';
        let speedCategory = 'binh_thuong';
        
        try {
          const data: QuizPayload = typeof payloadString === 'string' 
            ? JSON.parse(payloadString) 
            : (payloadString as unknown as QuizPayload);

          if (data.accuracy >= 80) {
            accuracyCategory = 'rat_tot';
          } else if (data.accuracy >= 50) {
            accuracyCategory = 'trung_binh';
          } else {
            accuracyCategory = 'chua_tot';
          }
          if (data.duration > 0 && data.duration <= 10) {
            speedCategory = 'sieu_nhanh';
          } else if (data.duration > 0 && (data.duration / data.totalQuestions) < 4) {
            speedCategory = 'sieu_nhanh';
          }
        } catch (e) {
          console.error('[LEARNING_HABIT] Lỗi phân tích payload, chuyển về fallback mặc định', e);
        }

        let userContext = `Hãy viết một lời nhận xét ngẫu hứng dựa trên tình trạng học tập sau đây:\n`;
        
        if (accuracyCategory === 'rat_tot') {
          userContext += `- Kết quả bài quiz: Xuất sắc, chính xác gần như toàn bộ, làm đúng hầu hết các câu hỏi.\n`;
        } else if (accuracyCategory === 'trung_binh') {
          userContext += `- Kết quả bài quiz: Tạm ổn, đúng được một nửa hoặc tầm tầm bậc trung, có tiến bộ nhưng cần cố gắng thêm.\n`;
        } else {
          userContext += `- Kết quả bài quiz: Khá thấp, sai khá nhiều câu, chưa đạt yêu cầu, cần học lại từ đầu để nắm vững kiến thức.\n`;
        }

        if (speedCategory === 'sieu_nhanh') {
          userContext += `- Tốc độ làm bài: Siêu nhanh, chớp nhoáng, nhanh bất thường như thể không cần đọc đề.\n`;
        }

        userContext += `\nYêu cầu đặc biệt: Viết dưới dạng một đoạn văn liền mạch ngắn gọn, KHÔNG kèm theo tiêu đề, KHÔNG liệt kê đầu dòng, và TUYỆT ĐỐI KHÔNG ĐƯỢC CHỨA BẤT KỲ CHỮ SỐ NÀO (0-9) HOẶC KÝ HIỆU %.`;

        const systemPrompt = `Bạn là một người bạn thân thiết, vui tính và cực kỳ lầy lội, chuyên đi nhận xét kết quả làm bài của user.

Nhiệm vụ: Hãy viết một lời nhận xét ngắn gọn, mang tính cà khịa nhẹ nhàng nhưng vẫn mang tính chất động viên người học dựa trên ngữ cảnh được cung cấp.

LỆNH CẤM TỐI CAO - VI PHẠM SẼ BỊ PHẠT ĐIỂM:
* TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP xuất hiện bất kỳ chữ số nào (0-9), ký hiệu phần trăm (%), phân số, số giây, số câu trong toàn bộ văn bản phản hồi.
* Không được viết các từ chỉ số lượng cụ thể dạng chữ như "hai câu", "bốn mươi phần trăm", "chín giây", "một nửa". 
* Nếu cần nói về thời gian hoặc điểm số, hãy thay bằng từ ngữ trừu tượng (ví dụ: "tốc độ bàn thờ", "chưa chạm tới đích", "sai sót kha khá", "kết quả hơi khiêm tốn").

Tham khảo văn phong chuẩn (Tuyệt đối không bắt chước y hệt):
- Trạng thái Thấp + Nhanh: "Lướt qua bài trắc nghiệm nhanh như cách người yêu cũ trở mặt vậy, kiến thức chưa kịp ngấm mà đã chọn xong rồi. Làm lại hiệp nữa cho cái đề biết tay bạn đi nào!"
- Trạng thái Khá: "Cũng ra gì và này nọ đấy, nhưng hình như thần may mắn chỉ gánh bạn được một đoạn thôi. Chịu khó đọc lại bài chút xíu là lần sau ngon ngay!"
- Trạng thái Tốt: "Bật mode thiên tài có khác, làm bài thần sầu thế này thì ai chơi lại bạn nữa! Quá đẳng cấp!"`;

        const aiResponse = await requestGroq({
          model: GROQ_DEFAULT_MODEL,
          temperature: 0.85,
          max_tokens: 150,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContext },
          ],
        });

        let aiComment = aiResponse.choices?.[0]?.message?.content ?? 'Kiến thức này lạ quá đúng không? Thử lại lần nữa xem sao nhé!';

        aiComment = aiComment.replace(/[0-9%]/g, '');

        const strictBlacklist = /\b(một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|phần trăm|phút|giây)\b/gi;
        aiComment = aiComment.replace(strictBlacklist, '... ');
        aiComment = aiComment.replace(/\s+/g, ' ').trim();

        console.log('[LEARNING_HABIT]', aiComment);
        await appEmitter.emit('SHOW_LEARNING_COACH', aiComment);
      } catch (error) {
        console.error('[LEARNING_HABIT]', error);
      }
    };

    appEmitter.on('LEARNING_HABIT', learningHabitHandler);

    return () => {
      appEmitter.off('LEARNING_HABIT', learningHabitHandler);
    };
  }, []);

  return null;
}