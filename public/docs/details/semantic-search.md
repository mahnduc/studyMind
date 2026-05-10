# Tìm kiếm ngữ nghĩa
*Quy trình xây dựng tìm kiếm ngữ nghĩa (No embedding)*

## Phân rã cấu trúc tài liệu

### Chuyển đổi Markdown thành AST (Abstract Syntax Tree)

### Trích xuất Section và Context Path
#### Section là gì? 
Một Section được coi là một đơn vị thông tin độc lập tương đối, bắt đầu từ một tiêu đề (Heading) và kết thúc khi gặp một tiêu đề khác có cấp độ tương đương hoặc cao hơn.

Đặc điểm của một Section:
- Phạm vi: Bao gồm chính tiêu đề đó và tất cả các nội dung (Paragraph, List, Code, Table) nằm dưới nó cho đến khi gặp tiêu đề mới.
- Tính phân cấp: Section có thể chứa các Sub-section (Section con).
- Vai trò: Section là "vùng bao" để gom nhóm các Block dữ liệu có cùng một chủ đề nhỏ.

#### Context Path (Đường dẫn ngữ cảnh) là gì?
Context Path là một chuỗi (thường là mảng hoặc chuỗi nối bởi dấu >) mô tả vị trí của một đoạn văn bản trong toàn bộ cấu trúc phân cấp của tài liệu.

Context Path được xây dựng bằng cách cộng dồn các tiêu đề từ cấp cao nhất (H1) xuống đến cấp hiện tại của đoạn văn bản đó.

```markdown
# DeepWhale AI Agent
## Kiến trúc hệ thống
### Model Context Protocol (MCP)
Đoạn văn bản: "MCP giúp kết nối AI với dữ liệu cục bộ..."
```
- Section: Là toàn bộ phần nội dung dưới tiêu đề "Model Context Protocol (MCP)".
- Context Path: DeepWhale AI Agent > Kiến trúc hệ thống > Model Context Protocol (MCP).

### Phân loại và xử lý Block
#### Block là gì?
Block là một khối văn bản liên tục có cùng một kiểu định dạng (type) trong một Section. Trong Markdown, một Block thường được ngăn cách với các khối khác bằng ít nhất một dòng trống.

Khi bạn phân rã một Section (ví dụ: Section "Cài đặt"), nó sẽ bao gồm nhiều Block con như: 1 đoạn mô tả (Paragraph), 1 danh sách các bước (List), và 1 đoạn code mẫu (Code Block).

#### Phân loại và Cách xử lý từng loại Block
1. Text Block
2. Heading Block (H1 -> H6)
3. Code Block
4. List Block
5. Table block

>Sau khi thực hiện phân rã cấu trúc tài liệu, output thu được sẽ là các mảng đối tượng đã được cấu trúc hóa. Chúng ta sẽ dùng các mảng này để đóng gói thành những đơn vị thông tin.

## Phân đoạn (Chunking)
Cấu trúc của 1 chunk lý tưởng
>- Phần dẫn (Prefix): Chính là nội dung của thẻ Heading (H) hoặc Context Path.
>- Phần thân (Body): Các Block nội dung (Paragraph, Code...) nằm dưới Heading đó.
>- Phần bổ trợ (Suffix): Các từ khóa hoặc thực thể quan trọng được trích xuất.

### Gom các Block có liên quan
Chúng ta sẽ gom các Block lại dựa trên một giới hạn kích thước (thường là số từ hoặc số token).
- Logic: Duyệt qua mảng Block[]. Nếu tổng độ dài của Block[n] và Block[n+1] vẫn nằm trong giới hạn (ví dụ: < 500 từ), chúng sẽ được gộp vào cùng một Chunk.
- Điểm dừng logic: Quá trình gộp sẽ dừng lại ngay lập tức nếu gặp một Heading có cấp độ cao (H1, H2) để tránh việc gộp hai chủ đề hoàn toàn khác nhau vào một đoạn.

### Tạo khoảng chồng lấp (Sliding Window/Overlap)
- Cách làm: Khi một Chunk đạt giới hạn độ dài, Chunk tiếp theo sẽ không bắt đầu từ Block mới hoàn toàn mà sẽ "lấy lại" 1 hoặc 2 Block cuối cùng của Chunk trước đó.
- Mục tiêu: Đảm bảo rằng nếu một từ khóa nằm ở ranh giới giữa hai đoạn, ngữ cảnh xung quanh nó vẫn được bảo toàn ở cả hai Chunk. Điều này giúp tăng tỉ lệ Recall trong tìm kiếm.

### Kế thừa và Làm giàu Metadata (Context Injection)
- Context Flattening: Chuyển mảng context_path từ dạng mảng thành một chuỗi văn bản để máy tính có thể tìm kiếm toàn văn (Full-text search).

- Summary Generation (Tùy chọn): Nếu một Chunk quá kỹ thuật (toàn code), hệ thống có thể lấy tiêu đề gần nhất làm tiền tố (prefix) cho nội dung để tăng tính mô tả.

Ví dụ: Nội dung "npm install fastmcp" sẽ được lưu thành "Cài đặt DeepWhale: npm install fastmcp".

### Tính toán chỉ số thống kê (Chunk Stats)
- Term Frequency (TF): Đếm tần suất xuất hiện của các từ trong Chunk đó.
- Vector hóa từ khóa đơn giản: Tạo một mảng các từ khóa (Keywords) đặc trưng nhất của Chunk đó dựa trên thuật toán TF-IDF cục bộ.

Đánh điểm chất lượng (Quality Score): Loại bỏ hoặc đánh dấu các Chunk "rác" (quá ngắn, chỉ có ký tự đặc biệt, hoặc code lỗi).

## Trích xuất đặc trưng
>Thực hiện tiền xử lý văn bản trước khi trích xuất
- Tokenization (Tách từ): Với tiếng Việt, đây là bước khó nhất. Bạn cần tách "trí tuệ nhân tạo" thành một cụm thay vì ba từ rời rạc "trí", "tuệ", "nhân".
- Lowercasing: Chuyển tất cả về chữ thường.
- Stopwords Removal: Loại bỏ các từ hư từ không mang nghĩa tìm kiếm (ví dụ: "của", "là", "những", "thì", "mà"...).
- Punctuation & Special Characters: Loại bỏ dấu câu, trừ các ký tự đặc biệt trong lập trình (nếu là Code Block).

1. Trích xuất từ khóa
2. Nhận diện thực thể
*Nhận diện các danh từ riêng có trọng số ưu tiên cao*
3. Xây dựng mạng lưới đồng nghĩa
5. Tính toán trọng số theo vùng

## Xây dựng tri thức 
? Đưa model LLM vào bước này 
## Xây dựng bộ chỉ mục
### Chỉ mục ngược (Inverted Index)
### Kho lưu trữ thuộc tính (Metadata Store)
### Thống kê toàn cục (Global Stats)
### Bản đồ thực thể và Đồng nghĩa (Synonym & Entity Index)

## Logic tìm kiếm

## Danh sách các dữ liệu cần lưu trữ
1. Bước phân đoạn (Chunking)
- raw_content: Nội dung Markdown nguyên bản (để hiển thị UI đẹp).
- clean_content: Nội dung đã lọc bỏ định dạng (để máy tính xử lý).
- context_path: Chuỗi hoặc mảng tiêu đề phân cấp.
- metadata: Loại block, ngôn ngữ lập trình, tên file gốc.

2. Bước trích xuất đặc trưng
- keywords_map: Danh sách các từ khóa quan trọng kèm trọng số (Score) riêng cho từng Chunk.
- entities: Các thực thể (tên riêng, công nghệ) trích xuất được.

3. Bước tạo chỉ mục
- Inverted Index Table: Bảng ánh xạ: Từ khóa -> Danh sách các Chunk ID chứa nó.
- Synonym Table: Bảng từ điển đồng nghĩa (được xây dựng một lần hoặc cập nhật định kỳ).

4. Bước buildStats (Dữ liệu thống kê hệ thống)
- avg_chunk_length: Độ dài trung bình của tất cả các Chunk trong hệ thống.
- total_chunks: Tổng số lượng Chunk đang có.
- df_counts (Document Frequency): Mỗi từ khóa xuất hiện trong bao nhiêu tài liệu.


Bảng thiết kế chi tiết

| Giai đoạn | Hàm xử lý | Input      | Output                | Mục tiêu |
| --------- | ----------| -----------| --------------------- | ---------|
| Parse Markdown     | `parseMarkdown()`                      | `markdown: string`         | `ParsedDocument`      | Phân tích markdown thành cấu trúc heading + content |
| Tạo Sections       | `buildSections()`                      | `ParsedDocument`           | `Section[]`           | Chuyển markdown tree → section semantic             |
| Chunking           | `createChunks()`                       | `Section[]`                | `Chunk[]`             | Chia nội dung thành đơn vị search-ready             |
| Vocabulary Builder | `buildVocabulary()`                    | `Chunk[]`                  | `VocabularyResult`    | Tạo dictionary corpus                               |
| Inverted Index     | `buildInvertedIndex()`                 | `Chunk[]`                  | `InvertedIndexResult` | Tạo mapping term → chunks                           |
| Document Frequency | `buildDocumentFrequency()`             | `InvertedIndex`            | `DocumentFrequency`   | Đếm số document chứa term                           |
| BM25               | `buildBM25Scorer()` hoặc `scoreBM25()` | Query + Index + DF + Stats | `BM25Result[]`        | Chấm điểm relevance                                 |
| Graph Builder      | `buildConceptGraph()`                  | `Chunk[]`                  | `ConceptGraph`        | Xây semantic relation                               |
| Ranking            | `rankResults()`                        | BM25 + Graph + Metadata    | `RankedResult[]`      | Sắp xếp kết quả cuối                                |
