// Đề mẫu 4 — 20 truy vấn cùng dạng với Đề mẫu GK7 nhưng trên Library database (lab/db/exam_library.sql).
export default {
  key: 'gk10',
  slug: 'gk10_sample_library',
  label: 'Đề mẫu 4 · Thư viện',
  navLabel: 'Đề mẫu 4',
  kind: 'Đề thi',
  short: 'GK-M4',
  title: 'Library Database: 20 SQL Query Exercises',
  titleVi: 'Đề mẫu 4 — 20 truy vấn trên Library database',
  dbPanel: 'lb_',

  summary: `
### 1. Đề này là gì
20 truy vấn cùng dạng với **Đề mẫu (GK7)** trên lược đồ thư viện. Qn ở đây cùng dạng với Qn của GK7. Bấm **Database** để xem bảng, **Debug** để chạy từng bước.

| Bảng | Ý nghĩa (so với University) |
|---|---|
| \`lb_branch(branch_name, district, budget)\` | chi nhánh (≈ \`department\`) |
| \`lb_genre(genre, shelf)\` | thể loại (Poetry, Comics **chưa có sách**) |
| \`lb_book(isbn, title, genre, pages)\` | đầu sách (≈ \`course\`) |
| \`lb_series(isbn, prev_isbn)\` | tập sau cần đọc tập trước (≈ \`prereq\`) |
| \`lb_copy(isbn, copy_no, branch_name)\` | bản sách cụ thể, khoá **2 cột** (≈ \`section\`) |
| \`lb_librarian\`, \`lb_handles(lib_id, isbn, copy_no)\` | thủ thư và bản sách họ phụ trách (≈ \`instructor\`/\`teaches\`) |
| \`lb_member(member_id, name, branch_name, type)\` | bạn đọc, \`branch_name\` = chi nhánh đăng ký (≈ \`student\`) |
| \`lb_loan(member_id, isbn, copy_no, loan_date, return_date, cond)\` | lượt mượn (≈ \`takes\`); \`return_date\` NULL = **chưa trả**; \`cond\` = tình trạng lúc trả |

### 2. Điểm mới so với GK7
- **Q16:** tìm **ít nhất** (kể cả hoà) thay vì nhiều nhất; thể loại chưa có lượt mượn nào phải được đếm là 0 → bắt buộc \`LEFT JOIN\`.
- **Q18:** "đã đọc xong tập trước" = đã mượn **và đã trả** (\`return_date IS NOT NULL\`).
- **Q19:** phép chia trên **chi nhánh** (mọi chi nhánh có lượt mượn năm 2025).

### 3. Bẫy hay gặp
- **Q5, Q8, Q15:** một người mượn lại cùng cuốn → \`DISTINCT\`; Q15 đếm **ngày mượn** phân biệt.
- **Q13, Q17, Q20:** \`lb_handles\` và \`lb_loan\` khớp **cả** \`isbn\` **và** \`copy_no\`. Chỉ khớp \`isbn\` thì bản B01-2 bị coi là có thủ thư (Q13), và Kim bị tính làm việc với 4 thủ thư (Q17).
- **Q14:** trung bình tính cả bạn đọc chưa mượn (Linh, Phuc).
- **Q16:** \`COUNT(l.member_id)\` (đếm cột bảng phải) chứ không phải \`COUNT(*)\` — \`COUNT(*)\` đếm cả dòng NULL của \`LEFT JOIN\`, thể loại rỗng thành 1.
- **Q20:** \`NULL\` (chưa trả) và \`'Lost'\` bị bỏ bằng inner join với bảng quy đổi.
`,

  quiz: [],

  questions: [
    {
      q: '**Q16** — So sánh `COUNT(*)` và `COUNT(l.member_id)` sau `lb_genre LEFT JOIN lb_book LEFT JOIN lb_loan`. Với thể loại Poetry (chưa có sách) mỗi cách cho bao nhiêu? Kết quả Q16 đổi thế nào?',
      answer: `Poetry không có sách nên \`LEFT JOIN\` sinh **một** dòng với \`b.*\` và \`l.*\` đều NULL.
- \`COUNT(*)\` đếm mọi dòng → Poetry = **1**.
- \`COUNT(l.member_id)\` bỏ giá trị NULL → Poetry = **0**.

Với \`COUNT(*)\`, Poetry và Comics thành 1; sách Night Train (Novel) chưa ai mượn cũng thêm 1 dòng NULL cho Novel. Kết quả "ít nhất" bị sai (không còn là các thể loại 0 lượt). Đúng: Poetry, Comics với 0 lượt mượn.`,
    },
    {
      q: '**Q18** — Hieu (M05) đã mượn Dragon Gate (B01) và Dragon Gate II (B02). Vì sao Hieu **không** thoả Q18, còn Cuong (M03) thì có?',
      answer: `B02 là tập sau của B01, nên người mượn B02 phải **đã đọc xong** B01 = có lượt mượn B01 với \`return_date IS NOT NULL\`.
- Hieu mượn B01 (bản 2) ngày 26/02 nhưng **chưa trả** (\`return_date\` NULL) → điều kiện hỏng → loại.
- Cuong mượn B01 ngày 05/02 và trả 25/02 (xong B01, đủ điều kiện cho B02); mượn B02 và trả 15/03 (đủ điều kiện cho B03) → mọi tập sau Cuong mượn đều có tập trước đã xong → thoả.`,
    },
  ],

  exercises: [
    // ───────────── Cơ bản (1–5)
    { id: 'GK10.01', topic: 'Q1 where', level: 1,
      prompt: 'Cho mã và tên các bạn đọc loại **Student**. Kết quả: `member_id, name`.',
      solution: `SELECT member_id, name
FROM lb_member
WHERE type = 'Student';` },
    { id: 'GK10.02', topic: 'Q2 where >=', level: 1,
      prompt: 'Liệt kê các đầu sách **từ 400 trang trở lên**. Kết quả: `isbn, title, pages`.',
      solution: `SELECT isbn, title, pages
FROM lb_book
WHERE pages >= 400;` },
    { id: 'GK10.03', topic: 'Q3 where', level: 1,
      prompt: 'Liệt kê tên các sách thể loại **Science**. Kết quả: `title`.',
      solution: `SELECT title
FROM lb_book
WHERE genre = 'Science';` },
    { id: 'GK10.04', topic: 'Q4 join', level: 1,
      prompt: 'Với mỗi bạn đọc, cho mã, tên, chi nhánh đăng ký và **quận** (`district`) của chi nhánh đó. Kết quả: `member_id, name, branch_name, district`.',
      solution: `SELECT m.member_id, m.name, m.branch_name, b.district
FROM lb_member m
JOIN lb_branch b ON b.branch_name = m.branch_name;` },
    { id: 'GK10.05', topic: 'Q5 join + distinct', level: 1,
      prompt: 'Tên các sách (không trùng) mà bạn đọc **M01** đã mượn. Kết quả: `title`.',
      solution: `SELECT DISTINCT b.title
FROM lb_loan l
JOIN lb_book b ON b.isbn = l.isbn
WHERE l.member_id = 'M01';` },

    // ───────────── Trung bình (6–13)
    { id: 'GK10.06', topic: 'Q6 join + lọc ngày', level: 2,
      prompt: 'Mã và tên các bạn đọc đã mượn **Dragon Gate II (B02)** trong **tháng 3/2025**. Kết quả: `member_id, name`.',
      solution: `SELECT DISTINCT m.member_id, m.name
FROM lb_member m
JOIN lb_loan l ON l.member_id = m.member_id
WHERE l.isbn = 'B02'
  AND l.loan_date >= '2025-03-01' AND l.loan_date < '2025-04-01';` },
    { id: 'GK10.07', topic: 'Q7 3 bảng, so cột', level: 2,
      prompt: 'Tìm thủ thư phụ trách bản sách **đặt ở chi nhánh khác** chi nhánh của mình. Kết quả: `name, lib_branch, copy_branch, title` — mỗi bộ một dòng.',
      solution: `SELECT DISTINCT li.name, li.branch_name AS lib_branch, c.branch_name AS copy_branch, b.title
FROM lb_librarian li
JOIN lb_handles h ON h.lib_id = li.lib_id
JOIN lb_copy c    ON c.isbn = h.isbn AND c.copy_no = h.copy_no
JOIN lb_book b    ON b.isbn = c.isbn
WHERE c.branch_name <> li.branch_name;` },
    { id: 'GK10.08', topic: 'Q8 join + distinct', level: 1,
      prompt: 'Tên các bạn đọc (không trùng) đã mượn **Dragon Gate (B01)**, bản nào cũng được. Kết quả: `name`.',
      solution: `SELECT DISTINCT m.name
FROM lb_member m
JOIN lb_loan l ON l.member_id = m.member_id
WHERE l.isbn = 'B01';` },
    { id: 'GK10.09', topic: 'Q9 join, so cột', level: 2,
      prompt: 'Mã và tên các bạn đọc đã mượn **ít nhất một bản sách đặt ở chi nhánh khác** chi nhánh đăng ký của mình. Kết quả: `member_id, name`.',
      solution: `SELECT DISTINCT m.member_id, m.name
FROM lb_member m
JOIN lb_loan l ON l.member_id = m.member_id
JOIN lb_copy c ON c.isbn = l.isbn AND c.copy_no = l.copy_no
WHERE c.branch_name <> m.branch_name;` },
    { id: 'GK10.10', topic: 'Q10 not exists', level: 2,
      prompt: 'Mã và tên các bạn đọc **chưa mượn lần nào**. Kết quả: `member_id, name`.',
      solution: `SELECT m.member_id, m.name
FROM lb_member m
WHERE NOT EXISTS (SELECT 1 FROM lb_loan l WHERE l.member_id = m.member_id);` },
    { id: 'GK10.11', topic: 'Q11 not exists', level: 2,
      prompt: 'Mã và tên các đầu sách **chưa từng được mượn**. Kết quả: `isbn, title`.',
      solution: `SELECT b.isbn, b.title
FROM lb_book b
WHERE NOT EXISTS (SELECT 1 FROM lb_loan l WHERE l.isbn = b.isbn);` },
    { id: 'GK10.12', topic: 'Q12 phép chia', level: 3,
      prompt: 'Mã và tên các bạn đọc đã mượn **mọi** sách thể loại **Fantasy**. Kết quả: `member_id, name`.',
      solution: `SELECT m.member_id, m.name
FROM lb_member m
WHERE NOT EXISTS (
  SELECT isbn FROM lb_book WHERE genre = 'Fantasy'
  EXCEPT
  SELECT l.isbn FROM lb_loan l WHERE l.member_id = m.member_id
);` },
    { id: 'GK10.13', topic: 'Q13 not exists, khoá 2 cột', level: 2,
      prompt: 'Tìm các bản sách **chưa có thủ thư phụ trách**. Kết quả: `isbn, copy_no, branch_name`.',
      solution: `SELECT c.isbn, c.copy_no, c.branch_name
FROM lb_copy c
WHERE NOT EXISTS (
  SELECT 1 FROM lb_handles h
  WHERE h.isbn = c.isbn AND h.copy_no = c.copy_no
);` },

    // ───────────── Khó (14–20)
    { id: 'GK10.14', topic: 'Q14 so với trung bình', level: 3,
      prompt: 'Tìm bạn đọc có **số đầu sách khác nhau đã mượn** lớn hơn **trung bình** số đầu sách khác nhau của mỗi bạn đọc (tính **cả người chưa mượn**). Kết quả: `member_id, name, book_count`.',
      solution: `WITH cnt AS (
  SELECT m.member_id, m.name, COUNT(DISTINCT l.isbn) AS book_count
  FROM lb_member m
  LEFT JOIN lb_loan l ON l.member_id = m.member_id
  GROUP BY m.member_id, m.name
)
SELECT member_id, name, book_count
FROM cnt
WHERE book_count > (SELECT AVG(book_count) FROM cnt);` },
    { id: 'GK10.15', topic: 'Q15 đếm phân biệt', level: 3,
      prompt: 'Tìm bạn đọc mượn **cùng một đầu sách** vào **nhiều hơn một** ngày khác nhau. Kết quả: `member_id, name, isbn, loan_count`.',
      solution: `SELECT m.member_id, m.name, l.isbn, COUNT(DISTINCT l.loan_date) AS loan_count
FROM lb_loan l
JOIN lb_member m ON m.member_id = l.member_id
GROUP BY m.member_id, m.name, l.isbn
HAVING COUNT(DISTINCT l.loan_date) > 1;` },
    { id: 'GK10.16', topic: 'Q16 min kể cả hoà', level: 3,
      prompt: 'Tìm (các) thể loại có **ít lượt mượn nhất**, giữ các thể loại **hoà**, tính cả thể loại **chưa có lượt mượn nào** (= 0). Kết quả: `genre, loan_count`.',
      hint: 'lb_genre LEFT JOIN lb_book LEFT JOIN lb_loan, COUNT(l.member_id) chứ không phải COUNT(*).',
      solution: `WITH cnt AS (
  SELECT g.genre, COUNT(l.member_id) AS loan_count
  FROM lb_genre g
  LEFT JOIN lb_book b ON b.genre = g.genre
  LEFT JOIN lb_loan l ON l.isbn = b.isbn
  GROUP BY g.genre
)
SELECT genre, loan_count
FROM cnt
WHERE loan_count = (SELECT MIN(loan_count) FROM cnt);` },
    { id: 'GK10.17', topic: 'Q17 join khoá 2 cột', level: 3,
      prompt: 'Tìm bạn đọc đã mượn những bản sách do **ít nhất 4 thủ thư khác nhau** phụ trách; thủ thư phải phụ trách **đúng bản** (isbn và copy_no) đã mượn. Kết quả: `member_id, name, librarian_count`.',
      solution: `SELECT m.member_id, m.name, COUNT(DISTINCT h.lib_id) AS librarian_count
FROM lb_loan l
JOIN lb_handles h ON h.isbn = l.isbn AND h.copy_no = l.copy_no
JOIN lb_member m  ON m.member_id = l.member_id
GROUP BY m.member_id, m.name
HAVING COUNT(DISTINCT h.lib_id) >= 4;` },
    { id: 'GK10.18', topic: 'Q18 not exists lồng', level: 3,
      prompt: 'Tìm bạn đọc đã mượn **ít nhất một tập sau** (có trong `lb_series`), và với **mọi** tập sau đã mượn thì đã **đọc xong tập trước** của nó (có lượt mượn tập trước đã trả, `return_date` khác NULL). Kết quả: `member_id, name`.',
      solution: `SELECT m.member_id, m.name
FROM lb_member m
WHERE EXISTS (
        SELECT 1 FROM lb_loan l JOIN lb_series s ON s.isbn = l.isbn
        WHERE l.member_id = m.member_id)
  AND NOT EXISTS (
        SELECT 1 FROM lb_loan l JOIN lb_series s ON s.isbn = l.isbn
        WHERE l.member_id = m.member_id
          AND NOT EXISTS (SELECT 1 FROM lb_loan l2
                          WHERE l2.member_id = m.member_id AND l2.isbn = s.prev_isbn
                            AND l2.return_date IS NOT NULL));` },
    { id: 'GK10.19', topic: 'Q19 phép chia + tập rỗng', level: 3,
      prompt: 'Tìm bạn đọc đã mượn (trong năm 2025) ở **mọi chi nhánh có lượt mượn trong năm 2025** — chi nhánh tính theo nơi đặt bản sách. Nếu năm 2025 không có lượt mượn nào thì **không** trả về ai. Kết quả: `member_id, name`.',
      solution: `WITH y AS (
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
        SELECT branch_name FROM y WHERE y.member_id = m.member_id);` },
    { id: 'GK10.20', topic: 'Q20 quy đổi + avg', level: 3,
      prompt: 'Tìm thủ thư có **điểm tình trạng trung bình** (lúc trả) của các bản mình phụ trách lớn hơn **trung bình chung của mọi lượt trả hợp lệ**. Quy đổi New=4, Good=3, Worn=2, Damaged=1; bỏ `NULL` và giá trị lạ. Một lượt mượn tính cho **mọi** thủ thư phụ trách bản đó. Kết quả: `lib_id, name, avg_cond` (không làm tròn).',
      solution: `WITH cs(cond, score) AS (
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
HAVING AVG(rt.score) > (SELECT AVG(score) FROM rt);` },
  ],
};
