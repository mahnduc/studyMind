Quy tắc xây dựng **"Sự phụ thuộc chỉ được hướng vào tâm"**. Các vòng bên trong không bao giờ được biết đến sự tồn tại của các vòng bên ngoài.

## Kiến trúc ứng dụng vòng tròn đồng tâm
Mã nguồn được tổ chức thành 4 vòng tròn đồng tâm chính:

### 1. Tâm vòng tròn (Vòng 1 - Core)
Tầng chứa các quy tắc nghiệp cụ cốt lõi, các cấu hình gốc

### 2. Logic ứng dụng (Vòng 2 - Usecases)
Vòng chứa các kịch bản sử dụng cụ thể của phần mềm, thực hiện điều phối dữ liệu đến và đi của các Enities

### 3. Bộ chuyển đổi (Vòng 3 - Interface Adapters)
Tầng này đóng vai trò là "thông dịch viên" giữa tầng Use Cases và tầng Công nghệ bên ngoài.

### 4. Cơ sở hạ tầng (Vòng 4 - Frameworks & Drivers)
Vòng ngoài cùng, nơi chứa các công nghệ cụ thể, công cụ và chi tiết thực thi thô như UI(NextJS), database,...

## Cơ chế giao tiếp xuyên vòng (Boundaries)

Hướng vào (Request): UI gọi Controller -> Controller gọi Use Case. Dữ liệu đi qua ranh giới là các Simple Data Objects (DTO).

Hướng ra (Response): Use Case thực hiện xong, nó không trả về Entity gốc (để bảo vệ tâm), mà trả về một Output Data Structure. Presenter sẽ nhận cái này và cập nhật UI.

Lưu trữ: Use Case gọi Interface save(). Tại thời điểm chạy (Runtime), nhờ Dependency Injection, lớp OPFSRepository ở Vòng 4 sẽ được "tiêm" vào để thực hiện việc ghi file thực tế.