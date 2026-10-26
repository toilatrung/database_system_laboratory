# CS4420 · Database System Laboratory

Bộ luyện tập Database System Concepts (7th Ed.). Nội dung nằm trong [`part_1/`](part_1/README.md).

## Deploy lên Vercel

Website là trang tĩnh (`part_1/playground.html`, PostgreSQL chạy trong trình duyệt bằng PGlite) và được bảo vệ bằng mật khẩu qua [`middleware.js`](middleware.js).

1. Push repo lên GitHub.
2. Vercel → **Add New → Project** → import repo. Giữ nguyên **Root Directory** là thư mục gốc, **Framework Preset: Other**, không cần build command.
3. **Settings → Environment Variables** → thêm `PERSONAL_PASSCODE` (giá trị mặc định `230303`) cho Production và Preview, rồi redeploy.

Nếu chưa đặt biến môi trường, middleware dùng mật khẩu mặc định `230303`.

### Cách hoạt động
- Mọi request (trang, file `.sql`, `.md`…) đều qua middleware; chưa có cookie hợp lệ thì hiện trang nhập mật khẩu.
- Cookie là session cookie (không có hạn), nên đóng trình duyệt là phải nhập lại mật khẩu.
- Đổi `PERSONAL_PASSCODE` trên Vercel sẽ đăng xuất mọi người.
- `/` được rewrite tới `/part_1/playground.html`.

## Chạy cục bộ
```bash
cd part_1
npm install
npm run serve
```
(Server cục bộ không yêu cầu mật khẩu. Muốn thử cả middleware: `npx vercel dev` ở thư mục gốc.)
