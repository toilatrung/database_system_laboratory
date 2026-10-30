# CS4420 · Database System Laboratory

Bộ luyện tập *Database System Concepts* (7th Ed.) bám theo lịch học CS4420. Mọi câu SQL chạy trên PostgreSQL thật ngay trong trình duyệt (PGlite), bài tập tự chấm.

| Part | Nội dung | Tuần |
|---|---|---|
| [Part 1](part_1/README.md) | Chương 1–5: Introduction, Relational Model, Intro SQL, Intermediate SQL, Advanced SQL | 1–7 |
| [Part 2](part_2/README.md) | Chương 6–7: E-R Model, Normalization (kèm công cụ Phụ thuộc hàm) | 9–12 |
| [Part 3](part_3/README.md) | **Ôn tập giữa kỳ**: toàn bộ Practice Exercises chương 1–4 + đề thi thử | 7–8 |
| [Part 4](part_4/README.md) | **Ôn tập cuối kỳ**: toàn bộ Practice Exercises chương 6–7, ôn nhanh SQL + đề thi thử | 13–15 |

Trang tổng [`index.html`](index.html) liệt kê các part và **lịch học & kế hoạch thi** (tuần 8 thi giữa kỳ, tuần 15 thi cuối kỳ), mỗi tuần có liên kết thẳng tới phần luyện tập tương ứng. Lịch nằm trong [`lab/schedule.mjs`](lab/schedule.mjs).

Nguồn: slide <https://www.db-book.com/slides-dir/index.html> và Practice Exercises <https://www.db-book.com/Practice-Exercises/index-solu.html>. Đề thi chủ yếu lấy từ Practice Exercises, nên Part 3 và Part 4 đi qua **từng** Practice Exercise (đánh số đúng như sách) và cho chạy được trên dữ liệu mẫu.

## Chạy cục bộ
```bash
cd lab
npm install          # lần đầu
npm run serve        # http://localhost:4420 — trang tổng + mọi part
```
Có thể mở thẳng `index.html` hoặc `part_N/playground.html` bằng trình duyệt; nếu trình duyệt chặn trang mở từ ổ đĩa thì dùng `npm run serve`.

Các lệnh khác (đều chạy trong `lab/`):

| Lệnh | Việc |
|---|---|
| `npm run grade -- ch3` | chấm `my_answers.sql` của một chương/phần (`ch1`…`ch7`, `gk1`…`gk4`, `ck1`…`ck4`) |
| `npm run sql` | SQL shell có bảng của mọi part (`-- --part 3` để chỉ nạp Part 3) |
| `npm run verify` | kiểm tra mọi đáp án (`-- --part 2` cho một part) |
| `npm run build` | sinh lại `playground.html`, README/SQL của từng chương và `index.html` |
| `npm run demo` | demo JDBC/SQL injection của chương 5 |

## Cấu trúc
```
index.html            trang tổng (được sinh ra)
lab/                  dùng chung: package.json, tools/ (build, chấm, shell, server, fd.mjs), db/ (schema + dữ liệu), schedule.mjs
part_N/
├── part.mjs          cấu hình part: tiêu đề, các chương/phần, file dữ liệu cần nạp
├── content/*.mjs     NGUỒN nội dung (tóm tắt, trắc nghiệm, tự luận, bài SQL + đáp án)
├── <chương>/         README.md · exercises.sql · solutions.sql · my_answers.sql (được sinh ra; my_answers.sql không bao giờ bị ghi đè)
└── playground.html   Practice Lab (được sinh ra — đừng sửa tay)
```

## Deploy lên Vercel

Website là trang tĩnh, được bảo vệ bằng mật khẩu qua [`middleware.js`](middleware.js).

1. Push repo lên GitHub.
2. Vercel → **Add New → Project** → import repo. Giữ nguyên **Root Directory** là thư mục gốc, **Framework Preset: Other**, không cần build command (không có `package.json` ở gốc nên Vercel không tự build; các file HTML đã được sinh sẵn và commit).
3. **Settings → Environment Variables** → thêm `PERSONAL_PASSCODE` (giá trị mặc định `230303`) cho Production và Preview, rồi redeploy.

Nếu chưa đặt biến môi trường, middleware dùng mật khẩu mặc định `230303`.

### Cách hoạt động
- Mọi request (trang, file `.sql`, `.md`…) đều qua middleware; chưa có cookie hợp lệ thì hiện trang nhập mật khẩu.
- Cookie là session cookie (không có hạn), nên đóng trình duyệt là phải nhập lại mật khẩu.
- Đổi `PERSONAL_PASSCODE` trên Vercel sẽ đăng xuất mọi người.
- `/` là trang tổng `index.html`; từng part ở `/part_N/playground.html`.

(Server cục bộ không yêu cầu mật khẩu. Muốn thử cả middleware: `npx vercel dev` ở thư mục gốc.)
