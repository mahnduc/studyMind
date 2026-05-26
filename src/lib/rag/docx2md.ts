import { convertToHtml } from "mammoth";
import TurndownService from "turndown";

/**
 * Hàm hỗ trợ tìm File hoặc Directory Handle dựa trên đường dẫn tương đối (path).
 * Giúp định vị chính xác file nằm ở bất kỳ cấp thư mục nào trong OPFS.
 */
async function getFileHandleFromPath(
  root: FileSystemDirectoryHandle, 
  path: string, 
  options?: FileSystemGetFileOptions
): Promise<FileSystemFileHandle> {
  // Tách đường dẫn thành mảng các thư mục và tên file (ví dụ: "a/b/c.docx" -> ["a", "b", "c.docx"])
  const parts = path.split(/[/\\]/).filter(Boolean);
  const fileName = parts.pop(); // Lấy tên file cuối cùng
  
  let currentDir = root;
  
  // Duyệt qua từng cấp thư mục con
  for (const part of parts) {
    currentDir = await currentDir.getDirectoryHandle(part, { create: options?.create });
  }
  
  if (!fileName) {
    throw new Error(`Đường dẫn không hợp lệ: ${path}`);
  }
  
  // Lấy file handle ở thư mục cuối cùng
  return await currentDir.getFileHandle(fileName, options);
}

export async function convertDocxToMdInOPFS(docxFilePath: string): Promise<string> {
  const root = await navigator.storage.getDirectory();
  
  // 1. Tìm và đọc file .docx gốc chính xác theo đường dẫn được truyền vào
  const docxFileHandle = await getFileHandleFromPath(root, docxFilePath);
  const docxFile = await docxFileHandle.getFile();
  const arrayBuffer = await docxFile.arrayBuffer();

  // 2. Thực hiện chuyển đổi nội dung từ DOCX -> HTML -> Markdown
  const result = await convertToHtml({ arrayBuffer });
  const htmlContent = result.value; 

  const turndownService = new TurndownService({
    headingStyle: "atx", 
    hr: "---",
    bulletListMarker: "*",
    strongDelimiter: "**",
    emDelimiter: "_"
  });
  
  const markdownContent = turndownService.turndown(htmlContent);

  // 3. Giữ nguyên cấu trúc đường dẫn cũ, chỉ thay đuôi file thành .md
  // Ví dụ: "my-workspace/sub-folder/file.docx" -> "my-workspace/sub-folder/file.md"
  const mdFilePath = docxFilePath.replace(/\.docx$/i, '.md');

  // 4. Lưu ngược file .md vào đúng thư mục chứa file .docx ban đầu
  const mdFileHandle = await getFileHandleFromPath(root, mdFilePath, { create: true });
  const writable = await mdFileHandle.createWritable();
  await writable.write(markdownContent);
  await writable.close();

  // 5. Trả về đúng đường dẫn đầy đủ của file .md mới trong OPFS
  return mdFilePath;
}