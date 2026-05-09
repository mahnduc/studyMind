// Định nghĩa "Từ điển" lỗi (Source of Truth)
const ERROR_DEFINITIONS = {
  VALIDATION: { status: 400, code: 'ERR_VALIDATION' },
  AUTH: { status: 401, code: 'ERR_UNAUTHORIZED' },
  NOT_FOUND: { status: 404, code: 'ERR_NOT_FOUND' },
  STORAGE: { status: 507, code: 'ERR_STORAGE' },
  INTERNAL: { status: 500, code: 'ERR_INTERNAL' },
  NOT_FOUND_KEY: { status: 404, code: 'ERR_NOT_FOUND_KEY' },
} as const;

// Class lỗi tiêu chuẩn
export class AppError extends Error {
  constructor(
    public message: string = "An unexpected error occurred",
    public status: number = 500,
    public code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// helper function
/**
 * @param type - Key từ ERROR_DEFINITIONS
 * @param message - Mô tả lỗi
 */
export const throwError = (type: keyof typeof ERROR_DEFINITIONS, message?: string): never => {
  const config = ERROR_DEFINITIONS[type];
  throw new AppError(message, config.status, config.code);
};

// --- Cách sử dụng trong code ---
// if (!user) {
//   throwError('NOT_FOUND', 'Người dùng không tồn tại trong hệ thống');
// }

/**
 * Lưới bắt lỗi tập trung (Error Wrapper)
 * Chuyển đổi luồng từ Exception-based (throw) sang Result-based (return [err, data])
 */
export async function catchError<T>(
  task: Promise<T> | (() => T | Promise<T>)
): Promise<[AppError | null, T | null]> {
  try {
    const data = typeof task === "function" ? await task() : await task;
    return [null, data];
  } catch (error) {
    // Nếu là lỗi chúng ta chủ động throw qua throwError()
    if (error instanceof AppError) return [error, null];

    // Nếu là lỗi hệ thống không xác định (crash, bug, network hỏng...)
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return [new AppError(message, 500, "ERR_INTERNAL"), null];
  }
}
// HDSD
// SERVICE
// async function getUserService(id: string) {
//   const user = await db.find(id);
//   if (!user) {
//     throwError('NOT_FOUND', `Không tìm thấy user với ID: ${id}`);
//   }
//   return user;
// }
// BUSINESS
// async function setupUserAccount(id: string) {
//   // Bắt đầu lưới bảo vệ
//   const [err, result] = await catchError(async () => {
//     // Bước A: Lấy user
//     const user = await getUserService(id);
    
//     // Bước B: Kiểm tra quyền (Nếu sai, throw tiếp)
//     if (user.role !== 'admin') throwError('FORBIDDEN', 'Bạn không có quyền');

//     // Bước C: Lưu log
//     return await db.saveLog(id);
//   });

//   // Kiểm tra "Lưới" có bắt được gì không
//   if (err) {
//     console.error(`Xử lý thất bại [${err.code}]: ${err.message}`);
//     return { success: false, msg: err.message };
//   }

//   // Nếu không có lỗi, result chắc chắn có dữ liệu
//   return { success: true, data: result };
// }