export type WorkflowStatus =
  | "idle"             // Mới khởi tạo, chưa chạy
  | "running"          // Đang thực thi các bước tự động
  | "blocked"          // Bị chặn (do chờ người dùng hoặc điều kiện bên ngoài)
  | "paused"           // Tạm dừng do người dùng chủ động
  | "completed"        // Thành công
  | "failed"           // Thất bại (lỗi logic hoặc hệ thống)
  | "cancelled";       // Bị hủy bỏ giữa chừng