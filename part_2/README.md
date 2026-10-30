# CS4420 · Practice Part 2 — Chương 6 và 7

Luyện tập **Database System Concepts (7th Ed.)** chương 6–7 (tuần 9–12): tóm tắt theo đúng phạm vi slide trên lớp, trắc nghiệm, tự luận có lời giải từng bước và **39 bài SQL tự chấm** chạy trên PostgreSQL thật ngay trong trình duyệt.

| Chương | Tuần | Nội dung | Trắc nghiệm | Tự luận | Bài SQL |
|---|---|---|---|---|---|
| [6. E-R Model](ch6_er_model/README.md) | 9 (slide 6.1–6.43), 10 (6.44–6.73) | Entity/relationship set, thuộc tính phức hợp, cardinality, participation, weak entity, chuyển E-R sang lược đồ quan hệ, specialization/generalization, aggregation, các quyết định thiết kế | 19 | 10 | 20 |
| [7. Normalization](ch7_normalization/README.md) | 11 (slide 7.1–7.21), 12 (7.21–7.35) | Lossless decomposition, phụ thuộc hàm, dependency preservation, BCNF, 3NF, động lực của 4NF; phần *Mở rộng* (F⁺, Armstrong, bao đóng thuộc tính, canonical cover, thuật toán BCNF/3NF, MVD/4NF, 1NF/2NF) cần cho Practice Exercises | 18 | 12 | 19 |

Số slide là số in ở chân trang slide của sách. Practice Exercises chương 6–7 (đề thi cuối kỳ lấy chủ yếu từ đây) được làm đầy đủ trong [Part 4](../part_4/README.md).

## Bắt đầu
Mở [`playground.html`](playground.html) (lần đầu cần Internet để tải PostgreSQL WebAssembly). Nếu trình duyệt chặn trang mở từ ổ đĩa: `cd ../lab && npm run serve` rồi vào http://localhost:4420.

- Bài SQL chương 6 là **hiện thực thiết kế**: viết DDL từ một sơ đồ E-R; hệ thống chấm bằng câu truy vấn kiểm tra (`information_schema`, `try_sql` thử chèn dữ liệu vi phạm).
- Bài SQL chương 7 chạy trên dữ liệu thật: kiểm tra một phụ thuộc hàm có đúng trên bảng không (`group by … having count(distinct …) > 1`), tìm dòng vi phạm, so sánh phân rã lossy/lossless bằng join + `except`, phân rã BCNF/3NF/4NF.
- **Công cụ › Phụ thuộc hàm (FD)**: nhập R và F → bao đóng thuộc tính, mọi candidate key, canonical cover (ghi từng bước), kiểm tra BCNF/3NF, phân rã BCNF và 3NF, kiểm tra một phân rã có lossless và bảo toàn phụ thuộc không. Có sẵn các ví dụ của slide và Practice Exercises. Hãy làm tay trước rồi mới dùng để đối chiếu.
- Làm trong file: viết vào `my_answers.sql` của chương rồi chấm trong `lab/`: `npm run grade -- ch6` (hoặc `ch7`).

## Dữ liệu
- University database của sách (11 bảng) + bảng phụ của Part 1.
- `lab/db/er_tables.sql` (`er_*`): specialization person/employee/student, aggregation proj_guide/eval_for, dữ liệu thống kê đội bóng (PE 6.3), dữ liệu theo thời gian (PE 6.13).
- `lab/db/normalization_tables.sql` (`nf_*`): in_dep, class, ví dụ lossy employee, dept_advisor, cust_banker_branch, inst_info, dữ liệu "bẩn" để tìm dòng vi phạm FD, và các instance của Practice Exercises 7.x.
