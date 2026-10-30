# CS4420 · Practice Part 4 — Ôn tập cuối kỳ

Thi cuối kỳ ở **tuần 15**, trọng tâm **Chương 6 (E-R)** và **Chương 7 (Normalization)**. Tuần 13–14 là thuyết trình project, nên Part này được chia nhỏ để ôn song song. Đề chủ yếu lấy từ **Practice Exercises**, nên hai phần đầu đi qua **toàn bộ** Practice Exercises 6.1–6.13 và 7.1–7.20, đánh số đúng như sách.

| Phần | Nội dung | Trắc nghiệm | Tự luận | Bài SQL |
|---|---|---|---|---|
| [CK1](ck1_pe_ch6/README.md) | PE 6.1–6.13: lời giải đầy đủ kèm sơ đồ E-R dạng ASCII và lược đồ quan hệ; DDL cho car insurance, marks (ternary/binary), thống kê đội bóng, ràng buộc 1-1/total participation, dữ liệu theo thời gian | 17 | 13 | 15 |
| [CK2](ck2_pe_ch7/README.md) | PE 7.1–7.20: lossless, liệt kê FD trên một instance, chứng minh bằng Armstrong, F⁺ và khoá, canonical cover, kiểm tra FD bằng SQL, BCNF/3NF, 2NF, 4NF | 16 | 20 | 14 |
| [CK3](ck3_sql_refresher/README.md) | Ôn nhanh SQL & đại số quan hệ phòng khi đề có câu tổng hợp | 12 | 4 | 15 |
| [Đề CK](ck4_mock_final/README.md) | Đề thi thử 120 phút: thiết kế E-R, chuyển E-R sang bảng, bài FD trên lược đồ mới, SQL; kế hoạch ôn tuần 13–15, checklist | 25 | 6 | 10 |

## Cách ôn
1. Đọc lại [Part 2](../part_2/README.md) nếu chưa chắc lý thuyết.
2. CK1, CK2: **tự giải từng Practice Exercise ra giấy** ở phần tự luận rồi mới mở lời giải. Bài FD (bao đóng, khoá, canonical cover, BCNF/3NF) thì đối chiếu với **Công cụ › Phụ thuộc hàm (FD)** trong playground, có sẵn ví dụ PE 7.1/7.6, 7.14, 7.17.
3. CK3 nếu đề có phần SQL tổng hợp.
4. Làm **Đề CK** trong 120 phút, không xem đáp án.

Nội dung có ghi chú chỗ sách sai hoặc thiếu (7.2 ghi nhầm số hình; 7.14 còn một canonical cover thứ ba X→Z, Y→Z, Z→XY; lời giải 7.20; PostgreSQL không có `create assertion` nên 6.11 và 7.9 dùng trigger).

## Bắt đầu
Mở [`playground.html`](playground.html), hoặc làm trong `my_answers.sql` của từng phần rồi chấm trong `lab/`: `npm run grade -- ck2`.

## Dữ liệu
University database, các lược đồ Practice Exercises chương 2–4 (`lab/db/practice_datasets.sql`), bảng `er_*` và `nf_*` của Part 2, và `lab/db/final_tables.sql` (`fr_enrollment`, `fr_supply`: bảng chưa chuẩn hoá cho đề thi thử).
