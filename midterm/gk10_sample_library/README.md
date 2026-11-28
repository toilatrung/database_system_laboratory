# Đề mẫu 4 · Thư viện — Đề mẫu 4 — 20 truy vấn trên Library database

*Library Database: 20 SQL Query Exercises · Database System Concepts, 7th Ed.*

> **Cách học:** *Tự luận lý thuyết* → *Bài tập SQL* → *Ghi nhớ nhanh*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- gk10`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tự luận lý thuyết (2 câu)

**Câu 1.** **Q16** — So sánh `COUNT(*)` và `COUNT(l.member_id)` sau `lb_genre LEFT JOIN lb_book LEFT JOIN lb_loan`. Với thể loại Poetry (chưa có sách) mỗi cách cho bao nhiêu? Kết quả Q16 đổi thế nào?

<details><summary>Gợi ý đáp án</summary>

Poetry không có sách nên `LEFT JOIN` sinh **một** dòng với `b.*` và `l.*` đều NULL.
- `COUNT(*)` đếm mọi dòng → Poetry = **1**.
- `COUNT(l.member_id)` bỏ giá trị NULL → Poetry = **0**.

Với `COUNT(*)`, Poetry và Comics thành 1; sách Night Train (Novel) chưa ai mượn cũng thêm 1 dòng NULL cho Novel. Kết quả "ít nhất" bị sai (không còn là các thể loại 0 lượt). Đúng: Poetry, Comics với 0 lượt mượn.

</details>

**Câu 2.** **Q18** — Hieu (M05) đã mượn Dragon Gate (B01) và Dragon Gate II (B02). Vì sao Hieu **không** thoả Q18, còn Cuong (M03) thì có?

<details><summary>Gợi ý đáp án</summary>

B02 là tập sau của B01, nên người mượn B02 phải **đã đọc xong** B01 = có lượt mượn B01 với `return_date IS NOT NULL`.
- Hieu mượn B01 (bản 2) ngày 26/02 nhưng **chưa trả** (`return_date` NULL) → điều kiện hỏng → loại.
- Cuong mượn B01 ngày 05/02 và trả 25/02 (xong B01, đủ điều kiện cho B02); mượn B02 và trả 15/03 (đủ điều kiện cho B03) → mọi tập sau Cuong mượn đều có tập trước đã xong → thoả.

</details>

## 2. Bài tập SQL (20 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| GK10.01 | Q1 where | ★☆☆ | Cho mã và tên các bạn đọc loại Student. Kết quả: `member_id, name`. |
| GK10.02 | Q2 where >= | ★☆☆ | Liệt kê các đầu sách từ 400 trang trở lên. Kết quả: `isbn, title, pages`. |
| GK10.03 | Q3 where | ★☆☆ | Liệt kê tên các sách thể loại Science. Kết quả: `title`. |
| GK10.04 | Q4 join | ★☆☆ | Với mỗi bạn đọc, cho mã, tên, chi nhánh đăng ký và quận (`district`) của chi nhánh đó. Kết quả: `member_id, name, branch_name, district`. |
| GK10.05 | Q5 join + distinct | ★☆☆ | Tên các sách (không trùng) mà bạn đọc M01 đã mượn. Kết quả: `title`. |
| GK10.06 | Q6 join + lọc ngày | ★★☆ | Mã và tên các bạn đọc đã mượn Dragon Gate II (B02) trong tháng 3/2025. Kết quả: `member_id, name`. |
| GK10.07 | Q7 3 bảng, so cột | ★★☆ | Tìm thủ thư phụ trách bản sách đặt ở chi nhánh khác chi nhánh của mình. Kết quả: `name, lib_branch, copy_branch, title` — mỗi bộ một dòng. |
| GK10.08 | Q8 join + distinct | ★☆☆ | Tên các bạn đọc (không trùng) đã mượn Dragon Gate (B01), bản nào cũng được. Kết quả: `name`. |
| GK10.09 | Q9 join, so cột | ★★☆ | Mã và tên các bạn đọc đã mượn ít nhất một bản sách đặt ở chi nhánh khác chi nhánh đăng ký của mình. Kết quả: `member_id, name`. |
| GK10.10 | Q10 not exists | ★★☆ | Mã và tên các bạn đọc chưa mượn lần nào. Kết quả: `member_id, name`. |
| GK10.11 | Q11 not exists | ★★☆ | Mã và tên các đầu sách chưa từng được mượn. Kết quả: `isbn, title`. |
| GK10.12 | Q12 phép chia | ★★★ | Mã và tên các bạn đọc đã mượn mọi sách thể loại Fantasy. Kết quả: `member_id, name`. |
| GK10.13 | Q13 not exists, khoá 2 cột | ★★☆ | Tìm các bản sách chưa có thủ thư phụ trách. Kết quả: `isbn, copy_no, branch_name`. |
| GK10.14 | Q14 so với trung bình | ★★★ | Tìm bạn đọc có số đầu sách khác nhau đã mượn lớn hơn trung bình số đầu sách khác nhau của mỗi bạn đọc (tính cả người chưa mượn). Kết quả: `member_id, name, book_count`. |
| GK10.15 | Q15 đếm phân biệt | ★★★ | Tìm bạn đọc mượn cùng một đầu sách vào nhiều hơn một ngày khác nhau. Kết quả: `member_id, name, isbn, loan_count`. |
| GK10.16 | Q16 min kể cả hoà | ★★★ | Tìm (các) thể loại có ít lượt mượn nhất, giữ các thể loại hoà, tính cả thể loại chưa có lượt mượn nào (= 0). Kết quả: `genre, loan_count`. |
| GK10.17 | Q17 join khoá 2 cột | ★★★ | Tìm bạn đọc đã mượn những bản sách do ít nhất 4 thủ thư khác nhau phụ trách; thủ thư phải phụ trách đúng bản (isbn và copy_no) đã mượn. Kết quả: `member_id, name, librarian_count`. |
| GK10.18 | Q18 not exists lồng | ★★★ | Tìm bạn đọc đã mượn ít nhất một tập sau (có trong `lb_series`), và với mọi tập sau đã mượn thì đã đọc xong tập trước của nó (có lượt mượn tập trước đã trả, `return_date` khác NULL). Kết quả: `member_id, name`. |
| GK10.19 | Q19 phép chia + tập rỗng | ★★★ | Tìm bạn đọc đã mượn (trong năm 2025) ở mọi chi nhánh có lượt mượn trong năm 2025 — chi nhánh tính theo nơi đặt bản sách. Nếu năm 2025 không có lượt mượn nào thì không trả về ai. Kết quả: `member_id, name`. |
| GK10.20 | Q20 quy đổi + avg | ★★★ | Tìm thủ thư có điểm tình trạng trung bình (lúc trả) của các bản mình phụ trách lớn hơn trung bình chung của mọi lượt trả hợp lệ. Quy đổi New=4, Good=3, Worn=2, Damaged=1; bỏ `NULL` và giá trị lạ. Một lượt mượn tính cho mọi thủ thư phụ trách bản đó. Kết quả: `lib_id, name, avg_cond` (không làm tròn). |

## 3. Ghi nhớ nhanh

### 1. Đề này là gì
20 truy vấn cùng dạng với **Đề mẫu (GK7)** trên lược đồ thư viện. Qn ở đây cùng dạng với Qn của GK7. Bấm **Database** để xem bảng, **Debug** để chạy từng bước.

| Bảng | Ý nghĩa (so với University) |
|---|---|
| `lb_branch(branch_name, district, budget)` | chi nhánh (≈ `department`) |
| `lb_genre(genre, shelf)` | thể loại (Poetry, Comics **chưa có sách**) |
| `lb_book(isbn, title, genre, pages)` | đầu sách (≈ `course`) |
| `lb_series(isbn, prev_isbn)` | tập sau cần đọc tập trước (≈ `prereq`) |
| `lb_copy(isbn, copy_no, branch_name)` | bản sách cụ thể, khoá **2 cột** (≈ `section`) |
| `lb_librarian`, `lb_handles(lib_id, isbn, copy_no)` | thủ thư và bản sách họ phụ trách (≈ `instructor`/`teaches`) |
| `lb_member(member_id, name, branch_name, type)` | bạn đọc, `branch_name` = chi nhánh đăng ký (≈ `student`) |
| `lb_loan(member_id, isbn, copy_no, loan_date, return_date, cond)` | lượt mượn (≈ `takes`); `return_date` NULL = **chưa trả**; `cond` = tình trạng lúc trả |

### 2. Điểm mới so với GK7
- **Q16:** tìm **ít nhất** (kể cả hoà) thay vì nhiều nhất; thể loại chưa có lượt mượn nào phải được đếm là 0 → bắt buộc `LEFT JOIN`.
- **Q18:** "đã đọc xong tập trước" = đã mượn **và đã trả** (`return_date IS NOT NULL`).
- **Q19:** phép chia trên **chi nhánh** (mọi chi nhánh có lượt mượn năm 2025).

### 3. Bẫy hay gặp
- **Q5, Q8, Q15:** một người mượn lại cùng cuốn → `DISTINCT`; Q15 đếm **ngày mượn** phân biệt.
- **Q13, Q17, Q20:** `lb_handles` và `lb_loan` khớp **cả** `isbn` **và** `copy_no`. Chỉ khớp `isbn` thì bản B01-2 bị coi là có thủ thư (Q13), và Kim bị tính làm việc với 4 thủ thư (Q17).
- **Q14:** trung bình tính cả bạn đọc chưa mượn (Linh, Phuc).
- **Q16:** `COUNT(l.member_id)` (đếm cột bảng phải) chứ không phải `COUNT(*)` — `COUNT(*)` đếm cả dòng NULL của `LEFT JOIN`, thể loại rỗng thành 1.
- **Q20:** `NULL` (chưa trả) và `'Lost'` bị bỏ bằng inner join với bảng quy đổi.
