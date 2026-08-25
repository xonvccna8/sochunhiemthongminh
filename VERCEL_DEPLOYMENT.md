# Triển khai Sổ Chủ Nhiệm Online lên Vercel

## 1. Nhập dự án

Đẩy thư mục này lên GitHub/GitLab/Bitbucket, sau đó chọn **Add New → Project** trong Vercel và nhập repository. Cấu hình trong `vercel.json` sẽ giúp Vercel nhận đúng **Next.js**; không cần đặt Output Directory.

## 2. Khai báo biến môi trường

Trong **Project Settings → Environment Variables**, thêm các biến dưới đây cho cả **Production** và **Preview** bằng giá trị tương ứng trong `.env.local`:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

`NEXT_PUBLIC_SITE_URL` là tùy chọn. Nếu không khai báo, website tự dùng domain production do Vercel cung cấp.

Không đưa `.env.local` lên Git; file này đã được loại trừ trong `.gitignore`.

## 3. Triển khai và cho phép đăng nhập

Nhấn **Deploy**. Sau lần triển khai đầu tiên, sao chép domain `*.vercel.app`, rồi thêm domain đó vào **Firebase Console → Authentication → Settings → Authorized domains**. Nếu gắn tên miền riêng, thêm cả tên miền riêng vào danh sách này.

Firestore vẫn do Firebase vận hành. Hãy kiểm tra các bước trong `FIREBASE_SETUP.md` và xuất bản `firestore.rules` trước khi sử dụng dữ liệu thật.

## 4. Thiết lập Vercel dự kiến

- Framework Preset: `Next.js`
- Install Command: tự động (`npm install` từ `package-lock.json`)
- Build Command: `npm run build`
- Output Directory: để trống (Vercel tự quản lý output Next.js)
- Node.js: `24.x`
