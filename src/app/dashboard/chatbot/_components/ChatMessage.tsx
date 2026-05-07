import { BotMessage } from './BotMessage';
import { UserMessageComponent } from './UserMessageComponent';
import { Message } from '../_service/message'; // Import từ service mới

type Props = {
  message: Message;
};

export const ChatMessage = ({ message }: Props) => {
  const { role, type, content, metadata } = message;

  // 1. XỬ LÝ TIN NHẮN NGƯỜI DÙNG (USER)
  if (role === 'user') {
    switch (type) {
      case 'markdown':
        return <UserMessageComponent content={content} isMarkdown />;
      
      case 'error':
        return <UserMessageComponent content={content} isError />;

      // 'text' hoặc mặc định
      default:
        return <UserMessageComponent content={content} />;
    }
  }

  // 2. XỬ LÝ TIN NHẮN AI (ASSISTANT)
  if (role === 'assistant') {
    switch (type) {
      case 'loading':
        return <BotMessage isLoading />;

      case 'markdown':
        return (
          <BotMessage 
            content={content} 
            metadata={metadata} 
            isMarkdown 
          />
        );

      case 'error':
        return (
          <BotMessage 
            content={content || 'Đã xảy ra lỗi hệ thống.'} 
            isError 
          />
        );

      case 'action':
        return (
          <BotMessage 
            content={content} 
            metadata={metadata} 
            isAction 
          />
        );

      // 'text' hoặc mặc định
      default:
        return (
          <BotMessage 
            content={content} 
            metadata={metadata} 
          />
        );
    }
  }

  // 3. XỬ LÝ TIN NHẮN HỆ THỐNG (SYSTEM) - Nếu cần hiển thị
  if (role === 'system') {
    return (
      <div className="text-center text-[10px] text-gray-400 my-2 uppercase font-bold tracking-widest">
        {content}
      </div>
    );
  }

  // FALLBACK
  return null;
};