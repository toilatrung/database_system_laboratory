-- =====================================================================
-- CS4420 · Đề mẫu 4 · Thư viện — Đề mẫu 4 — 20 truy vấn trên Library database (Library Database: 20 SQL Query Exercises)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- gk10
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex GK10.01  [Q1 where]  ★☆☆
-- Cho mã và tên các bạn đọc loại Student. Kết quả: `member_id, name`.




-- @ex GK10.02  [Q2 where >=]  ★☆☆
-- Liệt kê các đầu sách từ 400 trang trở lên. Kết quả: `isbn, title, pages`.




-- @ex GK10.03  [Q3 where]  ★☆☆
-- Liệt kê tên các sách thể loại Science. Kết quả: `title`.




-- @ex GK10.04  [Q4 join]  ★☆☆
-- Với mỗi bạn đọc, cho mã, tên, chi nhánh đăng ký và quận (`district`) của chi nhánh đó. Kết quả: `member_id, name, branch_name, district`.




-- @ex GK10.05  [Q5 join + distinct]  ★☆☆
-- Tên các sách (không trùng) mà bạn đọc M01 đã mượn. Kết quả: `title`.




-- @ex GK10.06  [Q6 join + lọc ngày]  ★★☆
-- Mã và tên các bạn đọc đã mượn Dragon Gate II (B02) trong tháng 3/2025. Kết quả: `member_id, name`.




-- @ex GK10.07  [Q7 3 bảng, so cột]  ★★☆
-- Tìm thủ thư phụ trách bản sách đặt ở chi nhánh khác chi nhánh của mình. Kết quả: `name, lib_branch, copy_branch, title` — mỗi bộ một dòng.




-- @ex GK10.08  [Q8 join + distinct]  ★☆☆
-- Tên các bạn đọc (không trùng) đã mượn Dragon Gate (B01), bản nào cũng được. Kết quả: `name`.




-- @ex GK10.09  [Q9 join, so cột]  ★★☆
-- Mã và tên các bạn đọc đã mượn ít nhất một bản sách đặt ở chi nhánh khác chi nhánh đăng ký của mình. Kết quả: `member_id, name`.




-- @ex GK10.10  [Q10 not exists]  ★★☆
-- Mã và tên các bạn đọc chưa mượn lần nào. Kết quả: `member_id, name`.




-- @ex GK10.11  [Q11 not exists]  ★★☆
-- Mã và tên các đầu sách chưa từng được mượn. Kết quả: `isbn, title`.




-- @ex GK10.12  [Q12 phép chia]  ★★★
-- Mã và tên các bạn đọc đã mượn mọi sách thể loại Fantasy. Kết quả: `member_id, name`.




-- @ex GK10.13  [Q13 not exists, khoá 2 cột]  ★★☆
-- Tìm các bản sách chưa có thủ thư phụ trách. Kết quả: `isbn, copy_no, branch_name`.




-- @ex GK10.14  [Q14 so với trung bình]  ★★★
-- Tìm bạn đọc có số đầu sách khác nhau đã mượn lớn hơn trung bình số đầu sách khác nhau của mỗi bạn đọc (tính cả người chưa mượn). Kết quả: `member_id, name, book_count`.




-- @ex GK10.15  [Q15 đếm phân biệt]  ★★★
-- Tìm bạn đọc mượn cùng một đầu sách vào nhiều hơn một ngày khác nhau. Kết quả: `member_id, name, isbn, loan_count`.




-- @ex GK10.16  [Q16 min kể cả hoà]  ★★★
-- Tìm (các) thể loại có ít lượt mượn nhất, giữ các thể loại hoà, tính cả thể loại chưa có lượt mượn nào (= 0). Kết quả: `genre, loan_count`.
-- Gợi ý: lb_genre LEFT JOIN lb_book LEFT JOIN lb_loan, COUNT(l.member_id) chứ không phải COUNT(*).




-- @ex GK10.17  [Q17 join khoá 2 cột]  ★★★
-- Tìm bạn đọc đã mượn những bản sách do ít nhất 4 thủ thư khác nhau phụ trách; thủ thư phải phụ trách đúng bản (isbn và copy_no) đã mượn. Kết quả: `member_id, name, librarian_count`.




-- @ex GK10.18  [Q18 not exists lồng]  ★★★
-- Tìm bạn đọc đã mượn ít nhất một tập sau (có trong `lb_series`), và với mọi tập sau đã mượn thì đã đọc xong tập trước của nó (có lượt mượn tập trước đã trả, `return_date` khác NULL). Kết quả: `member_id, name`.




-- @ex GK10.19  [Q19 phép chia + tập rỗng]  ★★★
-- Tìm bạn đọc đã mượn (trong năm 2025) ở mọi chi nhánh có lượt mượn trong năm 2025 — chi nhánh tính theo nơi đặt bản sách. Nếu năm 2025 không có lượt mượn nào thì không trả về ai. Kết quả: `member_id, name`.




-- @ex GK10.20  [Q20 quy đổi + avg]  ★★★
-- Tìm thủ thư có điểm tình trạng trung bình (lúc trả) của các bản mình phụ trách lớn hơn trung bình chung của mọi lượt trả hợp lệ. Quy đổi New=4, Good=3, Worn=2, Damaged=1; bỏ `NULL` và giá trị lạ. Một lượt mượn tính cho mọi thủ thư phụ trách bản đó. Kết quả: `lib_id, name, avg_cond` (không làm tròn).


