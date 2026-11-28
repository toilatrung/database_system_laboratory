-- =====================================================================
-- CS4420 · Đề mẫu 4 · Thư viện — Đề mẫu 4 — 20 truy vấn trên Library database (Library Database: 20 SQL Query Exercises)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex GK10.01  [Q1 where]  ★☆☆
-- Cho mã và tên các bạn đọc loại Student. Kết quả: `member_id, name`.
SELECT member_id, name
FROM lb_member
WHERE type = 'Student';

-- @ex GK10.02  [Q2 where >=]  ★☆☆
-- Liệt kê các đầu sách từ 400 trang trở lên. Kết quả: `isbn, title, pages`.
SELECT isbn, title, pages
FROM lb_book
WHERE pages >= 400;

-- @ex GK10.03  [Q3 where]  ★☆☆
-- Liệt kê tên các sách thể loại Science. Kết quả: `title`.
SELECT title
FROM lb_book
WHERE genre = 'Science';

-- @ex GK10.04  [Q4 join]  ★☆☆
-- Với mỗi bạn đọc, cho mã, tên, chi nhánh đăng ký và quận (`district`) của chi nhánh đó. Kết quả: `member_id, name, branch_name, district`.
SELECT m.member_id, m.name, m.branch_name, b.district
FROM lb_member m
JOIN lb_branch b ON b.branch_name = m.branch_name;

-- @ex GK10.05  [Q5 join + distinct]  ★☆☆
-- Tên các sách (không trùng) mà bạn đọc M01 đã mượn. Kết quả: `title`.
SELECT DISTINCT b.title
FROM lb_loan l
JOIN lb_book b ON b.isbn = l.isbn
WHERE l.member_id = 'M01';

-- @ex GK10.06  [Q6 join + lọc ngày]  ★★☆
-- Mã và tên các bạn đọc đã mượn Dragon Gate II (B02) trong tháng 3/2025. Kết quả: `member_id, name`.
SELECT DISTINCT m.member_id, m.name
FROM lb_member m
JOIN lb_loan l ON l.member_id = m.member_id
WHERE l.isbn = 'B02'
  AND l.loan_date >= '2025-03-01' AND l.loan_date < '2025-04-01';

-- @ex GK10.07  [Q7 3 bảng, so cột]  ★★☆
-- Tìm thủ thư phụ trách bản sách đặt ở chi nhánh khác chi nhánh của mình. Kết quả: `name, lib_branch, copy_branch, title` — mỗi bộ một dòng.
SELECT DISTINCT li.name, li.branch_name AS lib_branch, c.branch_name AS copy_branch, b.title
FROM lb_librarian li
JOIN lb_handles h ON h.lib_id = li.lib_id
JOIN lb_copy c    ON c.isbn = h.isbn AND c.copy_no = h.copy_no
JOIN lb_book b    ON b.isbn = c.isbn
WHERE c.branch_name <> li.branch_name;

-- @ex GK10.08  [Q8 join + distinct]  ★☆☆
-- Tên các bạn đọc (không trùng) đã mượn Dragon Gate (B01), bản nào cũng được. Kết quả: `name`.
SELECT DISTINCT m.name
FROM lb_member m
JOIN lb_loan l ON l.member_id = m.member_id
WHERE l.isbn = 'B01';

-- @ex GK10.09  [Q9 join, so cột]  ★★☆
-- Mã và tên các bạn đọc đã mượn ít nhất một bản sách đặt ở chi nhánh khác chi nhánh đăng ký của mình. Kết quả: `member_id, name`.
SELECT DISTINCT m.member_id, m.name
FROM lb_member m
JOIN lb_loan l ON l.member_id = m.member_id
JOIN lb_copy c ON c.isbn = l.isbn AND c.copy_no = l.copy_no
WHERE c.branch_name <> m.branch_name;

-- @ex GK10.10  [Q10 not exists]  ★★☆
-- Mã và tên các bạn đọc chưa mượn lần nào. Kết quả: `member_id, name`.
SELECT m.member_id, m.name
FROM lb_member m
WHERE NOT EXISTS (SELECT 1 FROM lb_loan l WHERE l.member_id = m.member_id);

-- @ex GK10.11  [Q11 not exists]  ★★☆
-- Mã và tên các đầu sách chưa từng được mượn. Kết quả: `isbn, title`.
SELECT b.isbn, b.title
FROM lb_book b
WHERE NOT EXISTS (SELECT 1 FROM lb_loan l WHERE l.isbn = b.isbn);

-- @ex GK10.12  [Q12 phép chia]  ★★★
-- Mã và tên các bạn đọc đã mượn mọi sách thể loại Fantasy. Kết quả: `member_id, name`.
SELECT m.member_id, m.name
FROM lb_member m
WHERE NOT EXISTS (
  SELECT isbn FROM lb_book WHERE genre = 'Fantasy'
  EXCEPT
  SELECT l.isbn FROM lb_loan l WHERE l.member_id = m.member_id
);

-- @ex GK10.13  [Q13 not exists, khoá 2 cột]  ★★☆
-- Tìm các bản sách chưa có thủ thư phụ trách. Kết quả: `isbn, copy_no, branch_name`.
SELECT c.isbn, c.copy_no, c.branch_name
FROM lb_copy c
WHERE NOT EXISTS (
  SELECT 1 FROM lb_handles h
  WHERE h.isbn = c.isbn AND h.copy_no = c.copy_no
);

-- @ex GK10.14  [Q14 so với trung bình]  ★★★
-- Tìm bạn đọc có số đầu sách khác nhau đã mượn lớn hơn trung bình số đầu sách khác nhau của mỗi bạn đọc (tính cả người chưa mượn). Kết quả: `member_id, name, book_count`.
WITH cnt AS (
  SELECT m.member_id, m.name, COUNT(DISTINCT l.isbn) AS book_count
  FROM lb_member m
  LEFT JOIN lb_loan l ON l.member_id = m.member_id
  GROUP BY m.member_id, m.name
)
SELECT member_id, name, book_count
FROM cnt
WHERE book_count > (SELECT AVG(book_count) FROM cnt);

-- @ex GK10.15  [Q15 đếm phân biệt]  ★★★
-- Tìm bạn đọc mượn cùng một đầu sách vào nhiều hơn một ngày khác nhau. Kết quả: `member_id, name, isbn, loan_count`.
SELECT m.member_id, m.name, l.isbn, COUNT(DISTINCT l.loan_date) AS loan_count
FROM lb_loan l
JOIN lb_member m ON m.member_id = l.member_id
GROUP BY m.member_id, m.name, l.isbn
HAVING COUNT(DISTINCT l.loan_date) > 1;

-- @ex GK10.16  [Q16 min kể cả hoà]  ★★★
-- Tìm (các) thể loại có ít lượt mượn nhất, giữ các thể loại hoà, tính cả thể loại chưa có lượt mượn nào (= 0). Kết quả: `genre, loan_count`.
-- Gợi ý: lb_genre LEFT JOIN lb_book LEFT JOIN lb_loan, COUNT(l.member_id) chứ không phải COUNT(*).
WITH cnt AS (
  SELECT g.genre, COUNT(l.member_id) AS loan_count
  FROM lb_genre g
  LEFT JOIN lb_book b ON b.genre = g.genre
  LEFT JOIN lb_loan l ON l.isbn = b.isbn
  GROUP BY g.genre
)
SELECT genre, loan_count
FROM cnt
WHERE loan_count = (SELECT MIN(loan_count) FROM cnt);

-- @ex GK10.17  [Q17 join khoá 2 cột]  ★★★
-- Tìm bạn đọc đã mượn những bản sách do ít nhất 4 thủ thư khác nhau phụ trách; thủ thư phải phụ trách đúng bản (isbn và copy_no) đã mượn. Kết quả: `member_id, name, librarian_count`.
SELECT m.member_id, m.name, COUNT(DISTINCT h.lib_id) AS librarian_count
FROM lb_loan l
JOIN lb_handles h ON h.isbn = l.isbn AND h.copy_no = l.copy_no
JOIN lb_member m  ON m.member_id = l.member_id
GROUP BY m.member_id, m.name
HAVING COUNT(DISTINCT h.lib_id) >= 4;

-- @ex GK10.18  [Q18 not exists lồng]  ★★★
-- Tìm bạn đọc đã mượn ít nhất một tập sau (có trong `lb_series`), và với mọi tập sau đã mượn thì đã đọc xong tập trước của nó (có lượt mượn tập trước đã trả, `return_date` khác NULL). Kết quả: `member_id, name`.
SELECT m.member_id, m.name
FROM lb_member m
WHERE EXISTS (
        SELECT 1 FROM lb_loan l JOIN lb_series s ON s.isbn = l.isbn
        WHERE l.member_id = m.member_id)
  AND NOT EXISTS (
        SELECT 1 FROM lb_loan l JOIN lb_series s ON s.isbn = l.isbn
        WHERE l.member_id = m.member_id
          AND NOT EXISTS (SELECT 1 FROM lb_loan l2
                          WHERE l2.member_id = m.member_id AND l2.isbn = s.prev_isbn
                            AND l2.return_date IS NOT NULL));

-- @ex GK10.19  [Q19 phép chia + tập rỗng]  ★★★
-- Tìm bạn đọc đã mượn (trong năm 2025) ở mọi chi nhánh có lượt mượn trong năm 2025 — chi nhánh tính theo nơi đặt bản sách. Nếu năm 2025 không có lượt mượn nào thì không trả về ai. Kết quả: `member_id, name`.
WITH y AS (
  SELECT l.member_id, c.branch_name
  FROM lb_loan l
  JOIN lb_copy c ON c.isbn = l.isbn AND c.copy_no = l.copy_no
  WHERE EXTRACT(YEAR FROM l.loan_date) = 2025
)
SELECT m.member_id, m.name
FROM lb_member m
WHERE EXISTS (SELECT 1 FROM y)
  AND NOT EXISTS (
        SELECT branch_name FROM y
        EXCEPT
        SELECT branch_name FROM y WHERE y.member_id = m.member_id);

-- @ex GK10.20  [Q20 quy đổi + avg]  ★★★
-- Tìm thủ thư có điểm tình trạng trung bình (lúc trả) của các bản mình phụ trách lớn hơn trung bình chung của mọi lượt trả hợp lệ. Quy đổi New=4, Good=3, Worn=2, Damaged=1; bỏ `NULL` và giá trị lạ. Một lượt mượn tính cho mọi thủ thư phụ trách bản đó. Kết quả: `lib_id, name, avg_cond` (không làm tròn).
WITH cs(cond, score) AS (
  VALUES ('New', 4), ('Good', 3), ('Worn', 2), ('Damaged', 1)
),
rt AS (
  SELECT l.isbn, l.copy_no, cs.score
  FROM lb_loan l
  JOIN cs ON cs.cond = l.cond
)
SELECT li.lib_id, li.name, AVG(rt.score) AS avg_cond
FROM rt
JOIN lb_handles h    ON h.isbn = rt.isbn AND h.copy_no = rt.copy_no
JOIN lb_librarian li ON li.lib_id = h.lib_id
GROUP BY li.lib_id, li.name
HAVING AVG(rt.score) > (SELECT AVG(score) FROM rt);
