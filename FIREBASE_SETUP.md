# Thiết lập Firebase cho Sổ Chủ Nhiệm Online

Website đã dùng cấu hình web app của dự án Firebase `xonvccna8`. Để đưa dữ liệu thật vào hoạt động, thực hiện một lần các bước sau trong Firebase Console:

1. Trong **Authentication → Sign-in method**, bật **Email/Password**.
2. Trong **Firestore Database**, tạo cơ sở dữ liệu ở chế độ production, ưu tiên vùng gần Việt Nam.
3. Mở tab **Rules**, dán toàn bộ nội dung file `firestore.rules`, sau đó bấm **Publish**.
4. Đăng ký tài khoản đầu tiên từ website bằng email của giáo viên.
5. Trong **Firestore Database → users → tài liệu có UID của giáo viên**, đổi trường `role` từ `student` thành `teacher` và giữ nguyên các trường khác.
6. Đăng xuất rồi đăng nhập lại. Tài khoản sẽ mở bảng điều khiển giáo viên; các tài khoản đăng ký tiếp theo mặc định là học sinh.

Không chia sẻ mật khẩu giáo viên. Các khóa `NEXT_PUBLIC_FIREBASE_*` là cấu hình web công khai của Firebase; quyền dữ liệu được bảo vệ bằng Authentication và `firestore.rules`.
