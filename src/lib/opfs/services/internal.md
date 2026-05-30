# OPFS Internal Actions Service Development Guide

`internal.ts` đóng vai trò là tầng thực thi logic (Action Layer) của opfs service

### Cấu trúc của 1 action
Mọi hàm trong `internal.ts` phải tuân thủ chữ ký (signature) sau để có thể được tích hợp tự động và `OpfsService`

```typescript
/**
 * [Mô tả ngắn gọn chức năng]
 *
 * @param getHandle - Resolver để truy cập file system
 * @param path - Đường dẫn file
 * @param ...args - Các tham số bổ sung
 *
 * @returns [Mô tả giá trị trả về]
 *
 * @example
 * await functionName("/path/to/file");
 */
export const functionName = async (
  getHandle: HandleGetter,
  path: string,
  ...args: any[]
): Promise<any> => {
  const { currentDir, fileName } = await getHandle(/*param*/);

  // Logic xử lý tại đây

  return result;
};
```

*Tham số của `getHandle`*

Hàm được định nghĩa với chữ ký: `(path: string, create?: boolean) => Promise<GetHandleResult>`
- `path` (`string`): **tham số bắt buộc**
    - Mô tả: Chuỗi ký tự đại diện cho đường dẫn đến tệp tin hoặc thư mục mục tiêu.
    - Định dạng: Sử dụng dấu gạch chéo (/) để phân tách các cấp thư mục (vd: `photos/2024/vacation.jpg`).
    - Cơ chế xử lý:
        - Hàm sẽ tự động loại bỏ các khoảng trống hoặc dấu xuyệt thừa thông qua `.filter(Boolean)`.
        - Phần tử cuối cùng trong chuỗi luôn được coi là `fileName` (tên đối tượng mục tiêu).
        - Các phần tử đứng trước đó được coi là cấu trúc thư mục cha.
- `create?` (`boolean`): **tham số tùy chọn** (mặc định là `false`).
    - Mô tả: Quyết định việc hệ thống có tự động khởi tạo cấu trúc thư mục nếu chúng chưa tồn tại hay không.
    - Cách hoạt động:
        - `false` (Mặc định): Nếu đường dẫn dẫn đến một thư mục không tồn tại, hàm sẽ ném ra lỗi (thường dùng cho thao tác **Read** hoặc **Delete**).
        - `true`: Nếu các thư mục trong path chưa có, OPFS sẽ tự động tạo mới chúng (thường dùng cho thao tác **Write** hoặc **Touch**).

Dưới đây là tài liệu API chi tiết cho các **Internal Actions** của hệ thống OPFS mà bạn đã xây dựng. Tài liệu này tập trung vào logic xử lý nội bộ, nơi tham số đầu tiên luôn là `getHandle`.

---

## OPFS Internal API Documentation