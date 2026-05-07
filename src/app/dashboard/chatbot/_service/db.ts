import { PGlite } from "@electric-sql/pglite";

let dbPromise: Promise<PGlite> | null = null;

export const getDB = async (): Promise<PGlite> => {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    try {
      const db = new PGlite("idb://chat-db");

      await db.exec(`
        CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS chat_history (
          id SERIAL PRIMARY KEY,
          conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          role TEXT NOT NULL, 
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      return db;
    } catch (error) {
      dbPromise = null;
      console.error("Critical Database Initialization Error:", error);
      throw new Error("Không thể khởi tạo hệ thống lưu trữ dữ liệu.");
    }
  })();

  return dbPromise;
};

/**
 * Lưu tin nhắn vào DB.
 */
export const saveMessage = async (
  message: string,
  conversationId?: number | null,
  role: "user" | "assistant" = "user" // Thêm tham số role
) => {
  const trimmedMessage = message?.trim();
  if (!trimmedMessage) throw new Error("Nội dung trống.");

  const db = await getDB();

  try {
    return await db.transaction(async (tx) => {
      let finalId = conversationId;

      // 1. Tạo hội thoại mới nếu chưa có
      if (!finalId) {
        const autoTitle = trimmedMessage.length > 40 
          ? trimmedMessage.substring(0, 40) + "..." 
          : trimmedMessage;

        const convRes = await tx.query<{ id: number }>(
          `INSERT INTO conversations (title, updated_at) 
           VALUES ($1, CURRENT_TIMESTAMP) 
           RETURNING id;`,
          [autoTitle]
        );
        
        if (!convRes.rows.length) throw new Error("Không thể tạo cuộc hội thoại.");
        finalId = convRes.rows[0].id;
      }

      // 2. Lưu tin nhắn với role tương ứng
      const msgRes = await tx.query(
        `INSERT INTO chat_history (conversation_id, role, content) 
         VALUES ($1, $2, $3) 
         RETURNING *;`,
        [finalId, role, trimmedMessage]
      );

      // 3. Cập nhật thời gian cho hội thoại
      await tx.query(
        `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [finalId]
      );

      return {
        conversationId: finalId,
        message: msgRes.rows[0],
        isNewConversation: !conversationId
      };
    });
  } catch (error: any) {
    throw new Error(`Lưu thất bại: ${error.message}`);
  }
};

/**
 * Lấy danh sách tất cả hội thoại, sắp xếp theo thời gian mới nhất
 */
export const getConversations = async () => {
  const db = await getDB();
  const res = await db.query<any>(
    `SELECT * FROM conversations ORDER BY updated_at DESC`
  );
  // Map lại field cho khớp với interface React (createdAt)
  return res.rows.map(row => ({
    id: row.id,
    title: row.title,
    createdAt: row.updated_at, 
  }));
};

/**
 * Xóa một hội thoại (chat_history sẽ tự xóa nhờ ON DELETE CASCADE)
 */
export const deleteConversation = async (id: number) => {
  const db = await getDB();
  await db.query(`DELETE FROM conversations WHERE id = $1`, [id]);
};

/**
 * Lấy lịch sử tin nhắn của một hội thoại cụ thể
 */
export const getChatHistory = async (conversationId: number) => {
  const db = await getDB();
  const res = await db.query<any>(
    `SELECT * FROM chat_history WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [conversationId]
  );
  return res.rows;
};