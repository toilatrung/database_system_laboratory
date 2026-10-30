# CS4420 · Practice Part 3 — Ôn tập giữa kỳ

Thi giữa kỳ ở **tuần 8**, phạm vi **Chương 1–4** (Introduction, Relational Model, Introduction to SQL, Intermediate SQL). Đề thi **không có trắc nghiệm**: chỉ gồm **tự luận lý thuyết** và **viết SQL**, chủ yếu lấy từ **Practice Exercises** của sách, nên Part này đi qua **toàn bộ** Practice Exercises 1.1–4.13 (từng ý a, b, c…), đánh số đúng như sách, cho chạy được trên dữ liệu mẫu, rồi kết thúc bằng một đề thi thử.

| Phần | Nội dung | Tự luận lý thuyết | Bài SQL |
|---|---|---|---|
| [GK1](gk1_pe_ch1_2/README.md) | PE 1.1–1.5, 2.1–2.9: lý thuyết, khoá, foreign key, đại số quan hệ (kèm SQL tương đương), phép chia | 14 | 16 |
| [GK2](gk2_pe_ch3/README.md) | PE 3.1–3.10: truy vấn trên University, grade_points/GPA, insert/update/delete, insurance, marks + `case`, bank, employee | 3 | 36 |
| [GK3](gk3_pe_ch4/README.md) | PE 4.1–4.13: bẫy natural join, outer join, viết lại outer join, view GPA, DDL employee, ràng buộc, cascade, `coalesce`, phân quyền | 8 | 16 |
| [Đề GK](gk4_mock_midterm/README.md) | Đề thi thử 90 phút: biến thể của Practice Exercises (đổi lược đồ, đổi điều kiện), A. tự luận 8 câu (4đ) + B. SQL 12 bài (6đ), kế hoạch ôn 7 ngày, checklist | 8 | 12 |

## Cách ôn (tuần 7 → 8)
1. Mỗi phần GK1–GK3 làm như đi thi: **Tự luận lý thuyết** — đọc đề gốc tiếng Anh, viết câu trả lời ra giấy rồi mới mở gợi ý đáp án và đánh dấu "Đã tự chấm" → **Bài tập SQL** — viết nháp trên giấy, gõ vào để chạy và chấm → **Ghi nhớ nhanh** (cheat sheet + bảng PE → câu/bài + các bẫy hay gặp) để đọc lại trước khi thi.
   Câu SQL của Practice Exercises (3.x, 4.2, 4.3, 4.6, 4.7, 4.10) nằm ở phần Bài tập SQL; phần tự luận chỉ giữ các câu lý thuyết.
2. Câu nào sai, quay lại chương tương ứng ở [Part 1](../part_1/README.md).
3. Cuối cùng làm **Đề GK** trong 90 phút, không xem đáp án.

Nội dung có ghi chú các chỗ lời giải trong sách bị lỗi hoặc không chạy được trên PostgreSQL (ví dụ 3.8b `S.customer_id`, 3.10b ký tự `<`, `decode` của Oracle ở 4.2c/4.6, `manager_iid` ở 4.7, `count(distinct a, b)` ở 4.8).

## Bắt đầu
Mở [`playground.html`](playground.html), hoặc làm trong `my_answers.sql` của từng phần rồi chấm trong `lab/`: `npm run grade -- gk2`.

## Dữ liệu
Sách không kèm dữ liệu cho các lược đồ trong Practice Exercises, nên [`lab/db/practice_datasets.sql`](../lab/db/practice_datasets.sql) cung cấp dữ liệu được thiết kế để mỗi câu có kết quả có ý nghĩa (có hoà ở 3.9f, người lái khác chủ xe ở 3.4a, một manager được tăng 3% và một được 10% ở 3.10b…):

- **Employee database** (Figure 2.17, 3.19, 4.12): `employee`, `works`, `company` (khoá `(company_name, city)` vì 3.9e cho phép một công ty ở nhiều thành phố), `manages`.
- **Bank database** (Figure 2.18, 3.18): `branch`, `customer`, `loan`, `borrower`, `account`, `depositor`.
- **Insurance database** (Figure 3.17): `person`, `car`, `accident`, `owns`, `participated`.
- `marks` (3.5), `emp_title`/`emp_salary` (a, b của 4.10), `grade_points` (3.2, 4.6), cùng University database.

Một số tình huống biên mà dữ liệu mẫu không có (section không có sinh viên, section không có giảng viên…) được chấm bằng cách: đề yêu cầu tạo view có tên cho trước, câu kiểm tra chèn thêm dữ liệu biên rồi đọc view.
