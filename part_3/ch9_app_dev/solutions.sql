-- =====================================================================
-- CS4420 · Chương 9 — Phát triển ứng dụng (Application Development)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CH9.01  [PE 9.12 kiểm tra đăng nhập]  ★★☆
-- Đề gốc: Exercise 9.12. The passwords that control access to a database are arguably its most important data items. Propose a scheme for storing passwords securely. The scheme must still let the system check the passwords that users supply when they try to log in.
--
-- `app_user(user_id, username, role, salt, pw_hash)` lưu `pw_hash = encode(sha256(convert_to(salt || password, 'UTF8')), 'hex')`. Cho các lần thử đăng nhập
-- ```
-- (values ('alice', 'secret1'), ('bob', 'wrong'), ('dave', 'secret1'), ('zed', 'secret1')) as a(username, password)
-- ```
-- trả về `username` và `login_ok` (boolean; username không tồn tại → false) cho từng lần thử.
select a.username,
       coalesce(u.pw_hash = encode(sha256(convert_to(u.salt || a.password, 'UTF8')), 'hex'), false) as login_ok
from (values ('alice', 'secret1'), ('bob', 'wrong'), ('dave', 'secret1'), ('zed', 'secret1')) as a(username, password)
     left join app_user u on u.username = a.username;

-- @ex CH9.02  [PE 9.12 đăng ký, salt]  ★★☆
-- Đề gốc: Exercise 9.12. The passwords that control access to a database are arguably its most important data items. Propose a scheme for storing passwords securely. The scheme must still let the system check the passwords that users supply when they try to log in.
--
-- Đăng ký user mới: `user_id` 6, username `frank`, role `customer`, salt `Ab12c`, mật khẩu `qwerty` — lưu đúng hash, không lưu mật khẩu rõ. Hệ thống kiểm tra đăng nhập đúng/sai cho frank và so sánh hash của alice và dave (cùng mật khẩu `secret1`).
insert into app_user (user_id, username, role, salt, pw_hash)
values (6, 'frank', 'customer', 'Ab12c', encode(sha256(convert_to('Ab12c' || 'qwerty', 'UTF8')), 'hex'));

-- Câu truy vấn hệ thống dùng để chấm:
--   select
--     (select pw_hash = encode(sha256(convert_to(salt || 'qwerty', 'UTF8')), 'hex') from app_user where username = 'frank') as right_pw,
--     (select pw_hash = encode(sha256(convert_to(salt || 'qwerty1', 'UTF8')), 'hex') from app_user where username = 'frank') as wrong_pw,
--     (select count(*) from app_user where pw_hash like '%qwerty%') as plaintext_rows,
--     (select a.pw_hash = d.pw_hash from app_user a, app_user d where a.username = 'alice' and d.username = 'dave') as alice_dave_same_hash;

-- @ex CH9.03  [PE 9.3 phát hiện giá bị sửa]  ★☆☆
-- Đề gốc: Exercise 9.3. A carelessly written online-shopping web application puts the price of each item in a hidden form variable on the page sent to the customer; when the customer submits the form, the value of that hidden variable is used to compute the customer’s bill. What is the loophole in this design? (Customers of a real online-shopping site actually exploited such a loophole before it was noticed and fixed.)
--
-- `app_cart_submission(submission_id, user_id, product_id, qty, submitted_price)` là dữ liệu form gửi lên (giá lấy từ hidden field). Liệt kê các dòng có giá gửi lên khác giá trong `app_product`: submission_id, username, product name, submitted_price, price.
select c.submission_id, u.username, p.name, c.submitted_price, p.price
from app_cart_submission c
     join app_product p on p.product_id = c.product_id
     join app_user u on u.user_id = c.user_id
where c.submitted_price <> p.price;

-- @ex CH9.04  [PE 9.3 tính hoá đơn phía server]  ★★☆
-- Đề gốc: Exercise 9.3. A carelessly written online-shopping web application puts the price of each item in a hidden form variable on the page sent to the customer; when the customer submits the form, the value of that hidden variable is used to compute the customer’s bill. What is the loophole in this design? (Customers of a real online-shopping site actually exploited such a loophole before it was noticed and fixed.)
--
-- Với mỗi submission: `submission_id`, `client_total` (tính theo giá gửi lên) và `server_total` (tính theo giá trong CSDL) — số tiền mà ứng dụng đúng ra phải thu.
select c.submission_id,
       sum(c.qty * c.submitted_price) as client_total,
       sum(c.qty * p.price) as server_total
from app_cart_submission c join app_product p on p.product_id = c.product_id
group by c.submission_id;

-- @ex CH9.05  [PE 9.4 request trái quyền]  ★★☆
-- Đề gốc: Exercise 9.4. Another carelessly written web application uses a servlet that checks whether there is an active session, but does not check whether the user is authorized to access the page; it relies on the fact that the link to the page is displayed only to authorized users. What is the risk in this approach? (In a real case, applicants to a college-admissions site logged in and used this loophole to view information they were not authorized to see; the access was detected, and those who did it were punished by being denied admission.)
--
-- Servlet đã phục vụ các request trong `app_request(request_id, session_id, page, requested_at)` mà chỉ kiểm tra session. Dựa trên `app_session` → `app_user.role` và `app_page_acl(page, role)`, liệt kê các request mà người dùng không có quyền xem trang: request_id, username, role, page.
select r.request_id, u.username, u.role, r.page
from app_request r
     join app_session s on s.session_id = r.session_id
     join app_user u on u.user_id = s.user_id
where not exists (select * from app_page_acl a where a.page = r.page and a.role = u.role);

-- @ex CH9.06  [PE 9.4 hàm kiểm tra quyền]  ★★★
-- Đề gốc: Exercise 9.4. Another carelessly written web application uses a servlet that checks whether there is an active session, but does not check whether the user is authorized to access the page; it relies on the fact that the link to the page is displayed only to authorized users. What is the risk in this approach? (In a real case, applicants to a college-admissions site logged in and used this loophole to view information they were not authorized to see; the access was detected, and those who did it were punished by being denied admission.)
--
-- Viết hàm `app_can_access(p_session varchar, p_page varchar, p_at timestamp) returns boolean`: true khi và chỉ khi session tồn tại, chưa hết hạn tại p_at (`p_at < expires_at`) và role của user được phép xem p_page. Hệ thống gọi hàm cho mọi request trong app_request.
create function app_can_access(p_session varchar, p_page varchar, p_at timestamp) returns boolean as $$
  select exists (
    select *
    from app_session s
         join app_user u on u.user_id = s.user_id
         join app_page_acl a on a.role = u.role
    where s.session_id = p_session and p_at < s.expires_at and a.page = p_page)
$$ language sql;

-- Câu truy vấn hệ thống dùng để chấm:
--   select request_id, app_can_access(session_id, page, requested_at) as allowed from app_request;

-- @ex CH9.07  [PE 9.8 khai thác injection]  ★★☆
-- Đề gốc: Exercise 9.8 (a). Testing for SQL-injection vulnerability:
--
-- a. Propose an approach to test whether an application is vulnerable to SQL-injection attacks through text input.
--
-- Hàm có sẵn `app_find_user_unsafe(name text)` ghép thẳng `name` vào câu SQL: `... where username = '` || name || `'`. Đóng vai người kiểm thử: viết một câu `select count(*) as n from app_find_user_unsafe(...)` với một đầu vào khiến hàm trả về mọi user (chỉ đổi chuỗi đầu vào).
-- Gợi ý: Đầu vào kết thúc chuỗi bằng dấu nháy rồi thêm `or '1'='1`. Dùng $$...$$ để khỏi phải nhân đôi dấu nháy.
select count(*) as n from app_find_user_unsafe($$x' or '1'='1$$);

-- @ex CH9.08  [PE 9.8 sửa injection]  ★★☆
-- Đề gốc: Exercise 9.8. Testing for SQL-injection vulnerability:
--
-- a. Propose an approach to test whether an application is vulnerable to SQL-injection attacks through text input.
--
-- b. Can SQL injection happen through kinds of HTML input other than text boxes? If so, how would you test for that vulnerability?
--
-- Viết hàm an toàn `app_find_user(name text) returns table (user_id integer, username varchar)` — vẫn dùng PL/pgSQL `return query execute` (dynamic SQL) nhưng truyền tham số bằng `using` (hoặc `format('%L')`). Hệ thống gọi với `bob`, với chuỗi tấn công của CH9.07 và với `O'Brien`.
create function app_find_user(name text)
returns table (user_id integer, username varchar) language plpgsql as $$
begin
  return query execute
    'select user_id, username from app_user where username = $1' using name;
end $$;

-- Câu truy vấn hệ thống dùng để chấm:
--   select (select count(*) from app_find_user('bob')) as bob,
--          (select count(*) from app_find_user($$x' or '1'='1$$)) as attack,
--          (select count(*) from app_find_user($$O'Brien$$)) as quote_name;

-- @ex CH9.09  [prepared statement]  ★★☆
-- Tạo prepared statement `cart_of(integer)` trả về `product_id`, `qty`, `price` (giá trong app_product) của các dòng trong app_cart_submission thuộc user có id là tham số; rồi execute nó với user 4. (Chạy trên database mới vì prepared statement không bị rollback.)
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)
prepare cart_of(integer) as
  select c.product_id, c.qty, p.price
  from app_cart_submission c join app_product p on p.product_id = c.product_id
  where c.user_id = $1;
execute cart_of(4);

-- @ex CH9.10  [phân trang offset]  ★☆☆
-- Trang danh sách bài viết hiển thị 10 bài/trang, mới nhất trước (`created_at desc`). Trả về `post_id`, `title` của trang 3 bằng `limit/offset`. (Thứ tự được chấm.)
-- (Thứ tự dòng được chấm.)
select post_id, title from app_post order by created_at desc limit 10 offset 20;

-- @ex CH9.11  [phân trang keyset]  ★★☆
-- Phân trang keyset: người dùng đang ở trang 1 và bài cuối cùng họ thấy là `post_id = 16`. Trả về 10 bài kế tiếp (post_id, title) không dùng offset, dựa trên created_at của bài 16. (Thứ tự được chấm.)
-- (Thứ tự dòng được chấm.)
select post_id, title from app_post
where created_at < (select created_at from app_post where post_id = 16)
order by created_at desc
limit 10;

-- @ex CH9.12  [upsert on conflict]  ★★☆
-- Mỗi lượt xem trang tăng bộ đếm trong `app_page_view(page primary key, views)`; trang chưa có thì tạo với views = 1. Viết một câu `insert ... on conflict` ghi nhận một lượt xem cho mỗi trang `/shop`, `/admin`, `/orders`. Hệ thống đọc lại bảng.
insert into app_page_view (page, views)
values ('/shop', 1), ('/admin', 1), ('/orders', 1)
on conflict (page) do update set views = app_page_view.views + 1;

-- Câu truy vấn hệ thống dùng để chấm:
--   select page, views from app_page_view;

-- @ex CH9.13  [giao dịch nguyên tử cho một request]  ★★★
-- Viết hàm `app_transfer(p_from integer, p_to integer, p_amount numeric) returns void` trừ tiền ví p_from và cộng ví p_to trong `app_wallet` (balance có `check (balance >= 0)`). Vì cả hàm chạy như một đơn vị, nếu trừ tiền vi phạm check thì cộng tiền cũng không được giữ lại. Hệ thống thử chuyển 50 từ user 2 sang 1 (không đủ tiền) và 40 từ user 4 sang 3, rồi đọc mọi ví.
-- Gợi ý: Thứ tự hai lệnh update quan trọng: cộng trước rồi trừ sau thì lệnh trừ lỗi cũng huỷ lệnh cộng — vì lỗi huỷ cả lời gọi hàm.
create function app_transfer(p_from integer, p_to integer, p_amount numeric) returns void as $$
  update app_wallet set balance = balance + p_amount where user_id = p_to;
  update app_wallet set balance = balance - p_amount where user_id = p_from;
$$ language sql;

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql('select app_transfer(2, 1, 50)') as t1, try_sql('select app_transfer(4, 3, 40)') as t2,
--          sql_value('select string_agg(user_id || ''='' || balance, '', '' order by user_id) from app_wallet') as wallets;

-- @ex CH9.14  [row-level security]  ★★★
-- Web app dùng chung bảng `app_note(note_id, owner, body)`. Bật row-level security cho app_note với policy: mỗi người chỉ thấy dòng có `owner = current_user`. Tạo role `alice` và `bob`, cấp quyền select trên app_note cho cả hai. Hệ thống `set role bob` rồi đọc app_note.
alter table app_note enable row level security;
create policy app_note_owner on app_note using (owner = current_user);
create role alice;
create role bob;
grant select on app_note to alice, bob;

-- Câu truy vấn hệ thống dùng để chấm:
--   set role bob;
--   select note_id, body from app_note;

-- @ex CH9.15  [PE 9.6 cache bằng materialized view]  ★★☆
-- Đề gốc: Exercise 9.6. List three ways in which caching can be used to improve the performance of a web server.
--
-- Cache danh mục sản phẩm: tạo materialized view `app_product_cache(product_id, name, price)` từ app_product. Hệ thống đổi giá Keyboard (101) thành 50, đọc giá trong cache, refresh, rồi đọc lại.
create materialized view app_product_cache as
select product_id, name, price from app_product;

-- Câu truy vấn hệ thống dùng để chấm:
--   update app_product set price = 50 where product_id = 101;
--   select sql_value('select price from app_product_cache where product_id = 101') as cached_before,
--          try_sql('refresh materialized view app_product_cache') as refresh,
--          sql_value('select price from app_product_cache where product_id = 101') as cached_after;

-- @ex CH9.16  [PE 9.6 chọn truy vấn để cache]  ★☆☆
-- Đề gốc: Exercise 9.6. List three ways in which caching can be used to improve the performance of a web server.
--
-- `app_query_log(log_id, query_text, ms)` ghi lại các truy vấn ứng dụng đã chạy. Truy vấn nào đáng cache? Trả về `query_text`, `runs` (số lần chạy) và `total_ms` cho các truy vấn chạy ít nhất 3 lần.
select query_text, count(*) as runs, sum(ms) as total_ms
from app_query_log
group by query_text
having count(*) >= 3;

-- @ex CH9.17  [PE 9.7 netstat, window lag]  ★★★
-- Đề gốc: Exercise 9.7. The netstat command (on Linux and Windows) lists the active network connections of a computer. Explain how it can be used to discover whether a particular web page fails to close the connections it opens — or, when connection pooling is used, fails to return connections to the pool. Take into account that, with connection pooling, a connection may not be closed right away.
--
-- `app_netstat(page, sample_no, open_conns)`: số kết nối CSDL đang mở sau mỗi lô truy cập một trang (có connection pool). Trang bị rò rỉ kết nối nếu số kết nối vẫn tăng ngặt ở mọi lần đo từ lần 4 trở đi (so với lần đo liền trước). Trả về page và `last_conns` (số kết nối ở lần đo cuối) của các trang rò rỉ.
-- Gợi ý: lag(open_conns) over (partition by page order by sample_no)
with d as (
  select page, sample_no, open_conns,
         open_conns - lag(open_conns) over (partition by page order by sample_no) as delta
  from app_netstat
)
select page, max(open_conns) filter (where sample_no = (select max(sample_no) from app_netstat n where n.page = d.page)) as last_conns
from d
group by page
having bool_and(delta > 0) filter (where sample_no >= 4);

-- @ex CH9.18  [PE 9.11 chuỗi chứng chỉ, recursive]  ★★★
-- Đề gốc: Exercise 9.11. Suppose someone pretends to be a company and obtains a certificate from a certificate-issuing authority. What is the effect on items (such as purchase orders or programs) certified by the company that was impersonated, and on items certified by other companies?
--
-- `app_cert(cert_id, subject, issued_by)`: chứng chỉ và chứng chỉ của bên đã ký nó. Giả sử chứng chỉ `C1` (IntermediateCA) bị cấp cho kẻ mạo danh. Liệt kê mọi chứng chỉ không còn đáng tin: C1 và mọi chứng chỉ nằm dưới nó trong chuỗi (cert_id, subject, `depth` — C1 có depth 0).
with recursive affected(cert_id, subject, depth) as (
  select cert_id, subject, 0 from app_cert where cert_id = 'C1'
  union all
  select c.cert_id, c.subject, a.depth + 1
  from app_cert c join affected a on c.issued_by = a.cert_id
)
select cert_id, subject, depth from affected;

-- @ex CH9.19  [PE 9.9 băm tất định vs có salt]  ★★☆
-- Đề gốc: Exercise 9.9. The values of some attributes of a database relation may be stored encrypted for security. Why do database systems not support indexes on encrypted attributes? Using your answer, explain why database systems do not allow primary-key attributes to be encrypted.
--
-- `app_card` lưu số thẻ dưới hai dạng: `det_hash` (băm tất định: cùng số thẻ → cùng giá trị) và `salted_hash` (băm kèm salt riêng mỗi dòng). Tìm các cặp thẻ (card_id1 < card_id2) trùng số thẻ bằng det_hash, và cho biết `salted_equal` — salted_hash của hai thẻ có bằng nhau không.
select a.card_id as card_id1, b.card_id as card_id2, a.salted_hash = b.salted_hash as salted_equal
from app_card a join app_card b on a.det_hash = b.det_hash and a.card_id < b.card_id;

-- @ex CH9.20  [view + grant cho role ứng dụng]  ★★☆
-- Phần lớn ứng dụng không được thấy salt và hash mật khẩu. Tạo view `app_public_user(user_id, username, role)` từ app_user, role `app_web`, và chỉ cấp select trên view cho app_web. Hệ thống `set role app_web`, đếm dòng qua view và thử đọc app_user.
create view app_public_user as select user_id, username, role from app_user;
create role app_web;
grant select on app_public_user to app_web;

-- Câu truy vấn hệ thống dùng để chấm:
--   set role app_web;
--   select (select count(*) from app_public_user) as visible_users,
--          try_sql('select * from app_user') as read_app_user;
