# CS4420 · Ôn tập giữa kỳ

Thi giữa kỳ ở **tuần 8**, phạm vi **Chương 1–4** (Introduction, Relational Model, Introduction to SQL, Intermediate SQL). Đề thi **không có trắc nghiệm**: chỉ gồm **tự luận lý thuyết** và **viết SQL**. Mỗi phần cho chạy và chấm được trên dữ liệu mẫu.

| Phần | Nội dung | Tự luận lý thuyết | Bài SQL |
|---|---|---|---|
| [GK Nguyên bản](gk5_exam_original/README.md) | **Đề thi từ 4 file Word bài tập của bạn**: Question 1–19 và Exercise 3.1–3.13, giữ nguyên đề | 8 | 61 |
| [GK Biến tấu](gk6_exam_variants/README.md) | **Biến thể** của các bài trên: đổi điều kiện, nhóm rỗng, NULL, hoà, thứ tự xoá theo FK, DDL mới | 8 | 42 |
| [Đề mẫu](gk7_sample_20_queries/README.md) | **20 truy vấn trên University database** (cơ bản → khó: phép chia, so với trung bình, hoà, quy đổi điểm), kèm popup **Database** để xem bảng và chạy thử truy vấn | 4 | 20 |

## Cách ôn (tuần 7 → 8)
1. Làm **GK Nguyên bản** như đi thi: viết nháp trên giấy, gõ vào để chạy và chấm; đọc lại **Ghi nhớ nhanh** trước khi thi.
2. Làm **GK Biến tấu** cùng chủ đề để chắc là hiểu chứ không học thuộc.
3. Cuối cùng làm **Đề mẫu** 20 truy vấn. Khi làm, bấm nút **Database** ở góc phải dưới để mở popup: xem cột/dữ liệu của 11 bảng và chạy thử truy vấn (chạy trong transaction rồi rollback, không đổi dữ liệu).
4. Câu nào sai, quay lại chương tương ứng ở [Part 1](../part_1/README.md).

## Bắt đầu
Mở [`playground.html`](playground.html), hoặc làm trong `my_answers.sql` của từng phần rồi chấm trong `lab/`: `npm run grade -- gk7`.

## Dữ liệu
- **University database** của sách ([`lab/db/university_data.sql`](../lab/db/university_data.sql)).
- [`lab/db/practice_datasets.sql`](../lab/db/practice_datasets.sql): Employee, Bank, Insurance database, `marks`, `grade_points`… cho các bài Exercise 3.x.
- [`lab/db/exam_sample_2025.sql`](../lab/db/exam_sample_2025.sql): vài section/teaches/takes **năm 2025** chỉ dành cho **Đề mẫu** (đề hỏi Fall 2025 và "mọi học kỳ năm 2025", còn dữ liệu của sách chỉ có 2017–2018). File này được nạp trong transaction của mỗi lần chạy bài Đề mẫu, nên không ảnh hưởng các phần khác.
