# Chạy, ném và Bắt (Try - Catch - Throw)
*Hệ thống quản lý lỗi tập trung (Centralized Error Handling System)* : *`app/lib/eror`*

### 1. Tổng quan
Hệ thống này giải quyết vấn đề "`callback hell`" của các khối `try-catch` lồng nhau. Thay vì viết `try-catch` ở khắp nơi, chúng ta tập trung định nghĩa lỗi tại một nơi duy nhất và sử dụng một "Lưới bắt lỗi" (`catchError`) để chuẩn hóa đầu ra dưới dạng `[error, data]`.

### 2. Các thành phần chính
`ERROR_DEFINITIONS`: Tất cả các loại lỗi được phép xảy ra trong hệ thống phải được khai báo tại đây.
```typescript
const ERROR_DEFINITIONS = {
  INTERNAL: { status: 500, code: 'ERR_INTERNAL' },
  // tùy chỉnh định nghĩa lỗi
} as const;
```

---
Class `AppError`: mở rộng từ class `Error` mặc định của JavaScript, bổ sung thêm các thuộc tính.

---
Hepler `throwError`: hàm tiện ích giúp ném lỗi theo định nghĩa.
```typescript
const getUserById = (id: string) => {
  const user = db.find(id);

  if (!user) {
    // Sử dụng key từ ERROR_DEFINITIONS
    throwError('NOT_FOUND', `Không tìm thấy người dùng với ID: ${id}`);
  }

  return user;
};
```

---
Lưới bắt lỗi `catchError()`: bao bọc một tác vụ (Task) và trả về một `Tuple: [AppError | null, T | null]`.
```typescript
const [err, data] = await catchError(yourFunction());

if (err) {
  // Xử lý lỗi tại đây (log, return response, v.v.)
  console.error(`[${err.code}]: ${err.message}`);
  return;
}

console.log(data);
```