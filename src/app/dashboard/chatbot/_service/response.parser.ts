// _services/response.parser.ts

import type { ToolCall } from '../_types/groq.types';

export function parseAssistantContent(
  content?: string | null,
  toolCalls?: ToolCall[]
): string {
  if (toolCalls?.length) {
    const name =
      toolCalls[0].function.name;

    switch (name) {
      case 'get_capabilities':
        return '[SHOW_CAPABILITIES_CMPT]';

      case 'bm25_search':
        return '[CALL_TOOL_BM25_SEARCH]';

      case 'show_chart':
        return '[SHOW_CHART_CMPT]';
    }
  }

  return (
    content ??
    'Tôi không tìm thấy thông tin phù hợp.'
  );
}