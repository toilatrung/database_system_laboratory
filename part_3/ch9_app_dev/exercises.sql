-- =====================================================================
-- CS4420 · Chương 9 — Phát triển ứng dụng (Application Development)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch9
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CH9.01  [PE 9.12 kiểm tra đăng nhập]  ★★☆
-- Đề gốc: Exercise 9.12. The passwords that control access to a database are arguably its most important data items. Propose a scheme for storing passwords securely. The scheme must still let the system check the passwords that users supply when they try to log in.
--
-- `app_user(user_id, username, role, salt, pw_hash)` lưu `pw_hash = encode(sha256(convert_to(salt || password, 'UTF8')), 'hex')`. Cho các lần thử đăng nhập
-- ```
-- (values ('alice', 'secret1'), ('bob', 'wrong'), ('dave', 'secret1'), ('zed', 'secret1')) as a(username, password)
-- ```
-- trả về `username` và `login_ok` (boolean; username không tồn tại → false) cho từng lần thử.




-- @ex CH9.02  [PE 9.12 đăng ký, salt]  ★★☆
-- Đề gốc: Exercise 9.12. The passwords that control access to a database are arguably its most important data items. Propose a scheme for storing passwords securely. The scheme must still let the system check the passwords that users supply when they try to log in.
--
-- Đăng ký user mới: `user_id` 6, username `frank`, role `customer`, salt `Ab12c`, mật khẩu `qwerty` — lưu đúng hash, không lưu mật khẩu rõ. Hệ thống kiểm tra đăng nhập đúng/sai cho frank và so sánh hash của alice và dave (cùng mật khẩu `secret1`).




-- @ex CH9.03  [PE 9.3 phát hiện giá bị sửa]  ★☆☆
-- Đề gốc: Exercise 9.3. A carelessly written online-shopping web application puts the price of each item in a hidden form variable on the page sent to the customer; when the customer submits the form, the value of that hidden variable is used to compute the customer’s bill. What is the loophole in this design? (Customers of a real online-shopping site actually exploited such a loophole before it was noticed and fixed.)
--
-- `app_cart_submission(submission_id, user_id, product_id, qty, submitted_price)` là dữ liệu form gửi lên (giá lấy từ hidden field). Liệt kê các dòng có giá gửi lên khác giá trong `app_product`: submission_id, username, product name, submitted_price, price.




-- @ex CH9.04  [PE 9.3 tính hoá đơn phía server]  ★★☆
-- Đề gốc: Exercise 9.3. A carelessly written online-shopping web application puts the price of each item in a hidden form variable on the page sent to the customer; when the customer submits the form, the value of that hidden variable is used to compute the customer’s bill. What is the loophole in this design? (Customers of a real online-shopping site actually exploited such a loophole before it was noticed and fixed.)
--
-- Với mỗi submission: `submission_id`, `client_total` (tính theo giá gửi lên) và `server_total` (tính theo giá trong CSDL) — số tiền mà ứng dụng đúng ra phải thu.




-- @ex CH9.05  [PE 9.4 request trái quyền]  ★★☆
-- Đề gốc: Exercise 9.4. Another carelessly written web application uses a servlet that checks whether there is an active session, but does not check whether the user is authorized to access the page; it relies on the fact that the link to the page is displayed only to authorized users. What is the risk in this approach? (In a real case, applicants to a college-admissions site logged in and used this loophole to view information they were not authorized to see; the access was detected, and those who did it were punished by being denied admission.)
--
-- Servlet đã phục vụ các request trong `app_request(request_id, session_id, page, requested_at)` mà chỉ kiểm tra session. Dựa trên `app_session` → `app_user.role` và `app_page_acl(page, role)`, liệt kê các request mà người dùng không có quyền xem trang: request_id, username, role, page.




-- @ex CH9.06  [PE 9.4 hàm kiểm tra quyền]  ★★★
-- Đề gốc: Exercise 9.4. Another carelessly written web application uses a servlet that checks whether there is an active session, but does not check whether the user is authorized to access the page; it relies on the fact that the link to the page is displayed only to authorized users. What is the risk in this approach? (In a real case, applicants to a college-admissions site logged in and used this loophole to view information they were not authorized to see; the access was detected, and those who did it were punished by being denied admission.)
--
-- Viết hàm `app_can_access(p_session varchar, p_page varchar, p_at timestamp) returns boolean`: true khi và chỉ khi session tồn tại, chưa hết hạn tại p_at (`p_at < expires_at`) và role của user được phép xem p_page. Hệ thống gọi hàm cho mọi request trong app_request.




-- @ex CH9.07  [PE 9.8 khai thác injection]  ★★☆
-- Đề gốc: Exercise 9.8 (a). Testing for SQL-injection vulnerability:
--
-- a. Propose an approach to test whether an application is vulnerable to SQL-injection attacks through text input.
--
-- Hàm có sẵn `app_find_user_unsafe(name text)` ghép thẳng `name` vào câu SQL: `... where username = '` || name || `'`. Đóng vai người kiểm thử: viết một câu `select count(*) as n from app_find_user_unsafe(...)` với một đầu vào khiến hàm trả về mọi user (chỉ đổi chuỗi đầu vào).
-- Gợi ý: Đầu vào kết thúc chuỗi bằng dấu nháy rồi thêm `or '1'='1`. Dùng $$...$$ để khỏi phải nhân đôi dấu nháy.




-- @ex CH9.08  [PE 9.8 sửa injection]  ★★☆
-- Đề gốc: Exercise 9.8. Testing for SQL-injection vulnerability:
--
-- a. Propose an approach to test whether an application is vulnerable to SQL-injection attacks through text input.
--
-- b. Can SQL injection happen through kinds of HTML input other than text boxes? If so, how would you test for that vulnerability?
--
-- Viết hàm an toàn `app_find_user(name text) returns table (user_id integer, username varchar)` — vẫn dùng PL/pgSQL `return query execute` (dynamic SQL) nhưng truyền tham số bằng `using` (hoặc `format('%L')`). Hệ thống gọi với `bob`, với chuỗi tấn công của CH9.07 và với `O'Brien`.




-- @ex CH9.09  [prepared statement]  ★★☆
-- Tạo prepared statement `cart_of(integer)` trả về `product_id`, `qty`, `price` (giá trong app_product) của các dòng trong app_cart_submission thuộc user có id là tham số; rồi execute nó với user 4. (Chạy trên database mới vì prepared statement không bị rollback.)
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)




-- @ex CH9.10  [phân trang offset]  ★☆☆
-- Trang danh sách bài viết hiển thị 10 bài/trang, mới nhất trước (`created_at desc`). Trả về `post_id`, `title` của trang 3 bằng `limit/offset`. (Thứ tự được chấm.)
-- (Thứ tự dòng được chấm.)




-- @ex CH9.11  [phân trang keyset]  ★★☆
-- Phân trang keyset: người dùng đang ở trang 1 và bài cuối cùng họ thấy là `post_id = 16`. Trả về 10 bài kế tiếp (post_id, title) không dùng offset, dựa trên created_at của bài 16. (Thứ tự được chấm.)
-- (Thứ tự dòng được chấm.)




-- @ex CH9.12  [upsert on conflict]  ★★☆
-- Mỗi lượt xem trang tăng bộ đếm trong `app_page_view(page primary key, views)`; trang chưa có thì tạo với views = 1. Viết một câu `insert ... on conflict` ghi nhận một lượt xem cho mỗi trang `/shop`, `/admin`, `/orders`. Hệ thống đọc lại bảng.




-- @ex CH9.13  [giao dịch nguyên tử cho một request]  ★★★
-- Viết hàm `app_transfer(p_from integer, p_to integer, p_amount numeric) returns void` trừ tiền ví p_from và cộng ví p_to trong `app_wallet` (balance có `check (balance >= 0)`). Vì cả hàm chạy như một đơn vị, nếu trừ tiền vi phạm check thì cộng tiền cũng không được giữ lại. Hệ thống thử chuyển 50 từ user 2 sang 1 (không đủ tiền) và 40 từ user 4 sang 3, rồi đọc mọi ví.
-- Gợi ý: Thứ tự hai lệnh update quan trọng: cộng trước rồi trừ sau thì lệnh trừ lỗi cũng huỷ lệnh cộng — vì lỗi huỷ cả lời gọi hàm.




-- @ex CH9.14  [row-level security]  ★★★
-- Web app dùng chung bảng `app_note(note_id, owner, body)`. Bật row-level security cho app_note với policy: mỗi người chỉ thấy dòng có `owner = current_user`. Tạo role `alice` và `bob`, cấp quyền select trên app_note cho cả hai. Hệ thống `set role bob` rồi đọc app_note.




-- @ex CH9.15  [PE 9.6 cache bằng materialized view]  ★★☆
-- Đề gốc: Exercise 9.6. List three ways in which caching can be used to improve the performance of a web server.
--
-- Cache danh mục sản phẩm: tạo materialized view `app_product_cache(product_id, name, price)` từ app_product. Hệ thống đổi giá Keyboard (101) thành 50, đọc giá trong cache, refresh, rồi đọc lại.




-- @ex CH9.16  [PE 9.6 chọn truy vấn để cache]  ★☆☆
-- Đề gốc: Exercise 9.6. List three ways in which caching can be used to improve the performance of a web server.
--
-- `app_query_log(log_id, query_text, ms)` ghi lại các truy vấn ứng dụng đã chạy. Truy vấn nào đáng cache? Trả về `query_text`, `runs` (số lần chạy) và `total_ms` cho các truy vấn chạy ít nhất 3 lần.




-- @ex CH9.17  [PE 9.7 netstat, window lag]  ★★★
-- Đề gốc: Exercise 9.7. The netstat command (on Linux and Windows) lists the active network connections of a computer. Explain how it can be used to discover whether a particular web page fails to close the connections it opens — or, when connection pooling is used, fails to return connections to the pool. Take into account that, with connection pooling, a connection may not be closed right away.
--
-- `app_netstat(page, sample_no, open_conns)`: số kết nối CSDL đang mở sau mỗi lô truy cập một trang (có connection pool). Trang bị rò rỉ kết nối nếu số kết nối vẫn tăng ngặt ở mọi lần đo từ lần 4 trở đi (so với lần đo liền trước). Trả về page và `last_conns` (số kết nối ở lần đo cuối) của các trang rò rỉ.
-- Gợi ý: lag(open_conns) over (partition by page order by sample_no)




-- @ex CH9.18  [PE 9.11 chuỗi chứng chỉ, recursive]  ★★★
-- Đề gốc: Exercise 9.11. Suppose someone pretends to be a company and obtains a certificate from a certificate-issuing authority. What is the effect on items (such as purchase orders or programs) certified by the company that was impersonated, and on items certified by other companies?
--
-- `app_cert(cert_id, subject, issued_by)`: chứng chỉ và chứng chỉ của bên đã ký nó. Giả sử chứng chỉ `C1` (IntermediateCA) bị cấp cho kẻ mạo danh. Liệt kê mọi chứng chỉ không còn đáng tin: C1 và mọi chứng chỉ nằm dưới nó trong chuỗi (cert_id, subject, `depth` — C1 có depth 0).




-- @ex CH9.19  [PE 9.9 băm tất định vs có salt]  ★★☆
-- Đề gốc: Exercise 9.9. The values of some attributes of a database relation may be stored encrypted for security. Why do database systems not support indexes on encrypted attributes? Using your answer, explain why database systems do not allow primary-key attributes to be encrypted.
--
-- `app_card` lưu số thẻ dưới hai dạng: `det_hash` (băm tất định: cùng số thẻ → cùng giá trị) và `salted_hash` (băm kèm salt riêng mỗi dòng). Tìm các cặp thẻ (card_id1 < card_id2) trùng số thẻ bằng det_hash, và cho biết `salted_equal` — salted_hash của hai thẻ có bằng nhau không.




-- @ex CH9.20  [view + grant cho role ứng dụng]  ★★☆
-- Phần lớn ứng dụng không được thấy salt và hash mật khẩu. Tạo view `app_public_user(user_id, username, role)` từ app_user, role `app_web`, và chỉ cấp select trên view cho app_web. Hệ thống `set role app_web`, đếm dòng qua view và thử đọc app_user.


