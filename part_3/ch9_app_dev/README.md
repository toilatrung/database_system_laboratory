# Chương 9 — Phát triển ứng dụng

*Application Development · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch9`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 0. Phạm vi
Chương 9 không nằm trong lịch học CS4420 (Chương 5 đã học JDBC/Python và SQL injection). Slide gồm:

| Slide | Nội dung |
|---|---|
| 9.2 – 9.12 | Giao diện ứng dụng, Web cơ bản: URL, HTML, HTTP, session, cookie |
| 9.13 – 9.25 | Servlet, JSP/PHP, kiến trúc ứng dụng (presentation – business logic – data access), ORM, web service, REST |
| 9.26 – 9.33 | Phía client: JavaScript, Ajax, mobile app; tăng hiệu năng: **caching**, connection pooling |
| 9.34 – 9.50 | **Bảo mật ứng dụng**: SQL injection, XSS, CSRF, password leakage, xác thực (2-factor, single sign-on), phân quyền ở mức ứng dụng, audit trail, **mã hoá** và chứng chỉ số |

Bài SQL của chương mô phỏng phần **CSDL phía sau một web app**: những câu SQL mà ứng dụng gửi cho mỗi request.

### 1. Web và HTTP (slide 9.5–9.12)
- Trình duyệt gửi **HTTP request** (GET/POST) tới URL; server trả về HTML/JSON.
- HTTP là giao thức **connectionless / stateless**: mỗi request độc lập. Ưu: server phục vụ được nhiều client, dễ cân bằng tải, một server hỏng thì server khác thay. Nhược: phải thiết lập lại kết nối và gửi lại thông tin phiên mỗi lần (PE 9.2).
- **Session** được duy trì bằng **cookie** (session id) hoặc hidden field; server lưu trạng thái phiên (thường trong bảng session).

### 2. Phía server (slide 9.13–9.25)
- **CGI**: mỗi request khởi động một process mới → tốn kém. **Servlet** chạy như thread trong process của web/application server → rẻ hơn nhiều dù Java chậm hơn C (PE 9.1).
- Server-side scripting: JSP, PHP, ASP.NET; framework (Django, Rails, Spring, Node.js).
- Kiến trúc ba tầng: **presentation** (HTML, MVC) → **business logic** → **data access** (JDBC, ORM như Hibernate).
- **Web service**: ứng dụng gọi nhau qua HTTP, dữ liệu JSON/XML; **REST** dùng URL + GET/POST/PUT/DELETE.

### 3. SQL mà ứng dụng gửi
| Kỹ thuật | Mục đích | SQL |
|---|---|---|
| **Prepared statement** | biên dịch một lần, chạy nhiều lần; tham số được truyền riêng → chống injection | `prepare q(int) as select ... where id = $1; execute q(5);` |
| **Phân trang offset** | trang k, n dòng/trang | `order by created_at desc limit n offset (k-1)*n` |
| **Phân trang keyset** | trang sau, không quét lại các dòng trước, ổn định khi có dòng mới | `where created_at < :last_seen order by created_at desc limit n` |
| **Upsert** | đếm lượt xem, lưu cấu hình | `insert ... on conflict (key) do update set views = t.views + 1` |
| **Giao dịch cho một request** | chuyển tiền, đặt hàng: tất cả hoặc không | `begin; ...; commit;` (hoặc một hàm — chạy nguyên tử) |
| **View + grant** | ứng dụng chỉ thấy cột cần thiết | `create view ...; grant select on view to app_role` |
| **Row-level security** | mỗi người chỉ thấy dòng của mình | `alter table t enable row level security; create policy ... using (owner = current_user)` |

### 4. Hiệu năng (slide 9.30–9.33, PE 9.6, 9.7)
- **Connection pooling**: mở sẵn một nhóm kết nối, request mượn rồi **trả lại** thay vì mở/đóng mỗi lần. Nếu code quên trả (không đóng trong `finally` / try-with-resources), số kết nối **tăng mãi** → hết kết nối (PE 9.5, 9.7). Kiểm tra bằng `netstat`: truy cập trang nhiều lần; với pool, số kết nối tăng tới một mức rồi **dừng**; nếu tiếp tục tăng là rò rỉ.
- **Caching**: (1) pool kết nối; (2) cache **kết quả truy vấn** (query result / materialized view); (3) cache **trang HTML** đã sinh. Cache phải được **làm mới (invalidate)** khi dữ liệu thay đổi.
- Materialized view trong PostgreSQL: `create materialized view v as ...`, dữ liệu **cũ** cho tới khi `refresh materialized view v`.

### 5. Bảo mật ứng dụng (slide 9.34–9.50)
**SQL injection** (PE 9.8):
```
"select * from app_user where username = '" + name + "'"
name = x' or '1'='1   →   ... where username = 'x' or '1'='1'   -- trả về mọi user
```
Phòng chống: **prepared statement / tham số** (`?`, `$1`); trong PL/pgSQL dynamic SQL dùng `execute ... using` hoặc `format('%L', x)`. Kiểm thử: nhập chuỗi có dấu nháy đơn vào **mọi** ô nhập (kể cả dropdown, hidden field, cookie — người dùng sửa được DOM/request).

**Các lỗi kinh điển**:
- Tin dữ liệu từ client: giá trong **hidden field** (PE 9.3) — người dùng sửa HTML là đổi được giá. Luôn lấy giá từ CSDL.
- Chỉ "giấu link" thay vì **kiểm tra quyền** ở mỗi trang (PE 9.4): ai biết URL là vào được. Mọi request phải kiểm tra cả session **và** quyền (bảng ACL theo role).
- **XSS**: chèn script vào dữ liệu hiển thị lại → escape khi xuất HTML. **CSRF**: trang khác lừa trình duyệt gửi request kèm cookie → token chống CSRF, kiểm tra referer (có thể bị giả).
- **Lộ mật khẩu**: không lưu mật khẩu dạng rõ. Lưu **hash(salt || password)** với salt ngẫu nhiên riêng cho từng user (PE 9.12); khi đăng nhập tính lại và so sánh. Salt làm hai người cùng mật khẩu có hash khác nhau, chống *dictionary/rainbow table*. (Thực tế dùng hàm băm chậm: bcrypt, scrypt, Argon2.)

**Xác thực và phân quyền**: 2-factor, single sign-on (SAML, OAuth/OpenID), phân quyền ở mức ứng dụng vì CSDL thường chỉ thấy một user chung của ứng dụng → **row-level security** / view theo người dùng; **audit trail** ghi lại ai làm gì.

**Mã hoá** (PE 9.9–9.11):
- Mã hoá đối xứng (AES) và khoá công khai (RSA); chữ ký số; **chứng chỉ số** do CA ký, tạo thành **chuỗi tin cậy** tới root CA.
- Mã hoá **từng thuộc tính**: nếu mã hoá tất định (cùng giá trị → cùng bản mã) thì chỉ hỗ trợ so sánh bằng và dễ bị phân tích tần suất; thêm salt ngẫu nhiên thì không index/so sánh được → CSDL **không cho mã hoá khoá chính/khoá ngoại** (không kiểm tra được trùng khoá).
- Mã hoá **toàn bộ CSDL**: dữ liệu mã hoá trên đĩa, giải mã khi đọc vào bộ nhớ → index, khoá chính, khoá ngoại hoạt động bình thường; chỉ tầng truy cập dữ liệu phải sửa.
- Chứng chỉ bị cấp nhầm cho kẻ mạo danh (PE 9.11): mọi thứ "ký bởi" công ty bị mạo danh đều không còn đáng tin (chỉ kiểm tra được nếu client tra danh sách thu hồi); chứng chỉ của công ty khác **không** bị ảnh hưởng — trừ khi bên bị mạo danh là một CA, khi đó cả nhánh dưới nó bị ảnh hưởng.

### Mẹo làm bài
- Hàm `sha256(bytea)` của PostgreSQL: `encode(sha256(convert_to(salt || pw, 'UTF8')), 'hex')`.
- `try_sql($$...$$)` trả về `ok` hoặc SQLSTATE (23514 vi phạm check, 42501 không có quyền) — dùng để thấy một lệnh bị từ chối mà không làm hỏng cả bài.
- Prepared statement không bị rollback cùng giao dịch, nên bài prepare chạy trên database mới.

## 2. Trắc nghiệm (11 câu)

**Câu 1.** Vì sao servlet nhanh hơn CGI dù Java thường chậm hơn C?

- A. Servlet được biên dịch sang mã máy
- B. CGI tạo một process mới cho mỗi request; servlet chạy dưới dạng thread trong process có sẵn
- C. Servlet không dùng HTTP
- D. CGI không hỗ trợ cookie

<details><summary>Đáp án</summary>

**B** — Chi phí tạo process và giao tiếp giữa các process lớn hơn chênh lệch tốc độ ngôn ngữ (PE 9.1).

</details>

**Câu 2.** HTTP là giao thức connectionless. Hệ quả nào **không** đúng?

- A. Server phục vụ được nhiều client hơn
- B. Dễ chuyển request sang server khác khi một server hỏng
- C. Không cần gửi lại thông tin phiên ở mỗi request
- D. Phải thiết lập kết nối lại cho mỗi request

<details><summary>Đáp án</summary>

**C** — Ngược lại: thông tin phiên phải đi kèm mỗi request (cookie/hidden field) — PE 9.2.

</details>

**Câu 3.** Lỗ hổng khi ứng dụng lấy giá sản phẩm từ hidden form field để tính tiền?

- A. Trình duyệt không gửi hidden field
- B. Người dùng sửa HTML/request để đổi giá
- C. Hidden field làm trang chậm
- D. Không có lỗ hổng

<details><summary>Đáp án</summary>

**B** — Mọi thứ từ client đều sửa được; giá phải lấy từ CSDL phía server (PE 9.3).

</details>

**Câu 4.** Cách đúng nhất chống SQL injection?

- A. Xoá mọi dấu nháy đơn khỏi đầu vào
- B. Dùng prepared statement / tham số hoá truy vấn
- C. Chỉ cho nhập từ dropdown
- D. Kiểm tra độ dài chuỗi

<details><summary>Đáp án</summary>

**B** — Tham số được truyền tách khỏi câu SQL nên không thể đổi cấu trúc câu lệnh. Dropdown vẫn bị sửa được (PE 9.8b).

</details>

**Câu 5.** Trong lược đồ lưu mật khẩu của PE 9.12, salt dùng để làm gì?

- A. Giải mã mật khẩu khi cần
- B. Hai người cùng mật khẩu có hash khác nhau, chống tấn công từ điển/bảng tra sẵn
- C. Tăng tốc đăng nhập
- D. Thay cho hàm băm

<details><summary>Đáp án</summary>

**B** — Salt ngẫu nhiên lưu cùng user; hash(salt || password) không giải mã được, chỉ tính lại để so sánh.

</details>

**Câu 6.** Phân trang **keyset** (`where created_at < :last order by created_at desc limit 10`) hơn **offset** ở điểm nào?

- A. Nhảy tới trang bất kỳ dễ hơn
- B. Không phải quét và bỏ qua các dòng của những trang trước; ổn định khi có dòng mới
- C. Không cần index
- D. Trả về nhiều dòng hơn

<details><summary>Đáp án</summary>

**B** — Offset lớn vẫn phải đọc rồi bỏ đi offset dòng, và dòng mới chèn vào làm lệch trang.

</details>

**Câu 7.** `refresh materialized view` cần thiết vì?

- A. Materialized view tự cập nhật khi bảng gốc đổi
- B. Materialized view lưu kết quả tại lúc refresh; bảng gốc đổi thì nó vẫn giữ dữ liệu cũ
- C. Để tạo index
- D. Để đổi tên view

<details><summary>Đáp án</summary>

**B** — Đó là một dạng cache kết quả truy vấn (PE 9.6) — phải làm mới.

</details>

**Câu 8.** Dùng netstat với connection pooling: dấu hiệu trang **không trả kết nối** về pool là?

- A. Số kết nối bằng 0 sau mỗi request
- B. Số kết nối tăng tới một mức rồi đứng yên
- C. Số kết nối tiếp tục tăng khi truy cập trang lặp lại
- D. Số kết nối dao động quanh một giá trị

<details><summary>Đáp án</summary>

**C** — Với pool, kết nối không đóng ngay nhưng phải ổn định; tăng mãi là rò rỉ (PE 9.7).

</details>

**Câu 9.** Vì sao CSDL không cho mã hoá thuộc tính khoá chính (mã hoá có salt)?

- A. Khoá chính quá ngắn
- B. Không kiểm tra được trùng khoá và không index được trên bản mã
- C. Mã hoá làm mất kiểu dữ liệu
- D. Luật pháp cấm

<details><summary>Đáp án</summary>

**B** — Cùng giá trị cho bản mã khác nhau → không phát hiện vi phạm primary key (PE 9.9).

</details>

**Câu 10.** Mã hoá toàn bộ CSDL tránh được vấn đề của mã hoá từng thuộc tính vì?

- A. Dữ liệu không bao giờ được giải mã
- B. Dữ liệu chỉ được mã hoá trên đĩa, giải mã khi đọc vào bộ nhớ nên index và ràng buộc khoá vẫn chạy bình thường
- C. Không cần khoá mã hoá
- D. Mọi giá trị dùng chung một bản mã

<details><summary>Đáp án</summary>

**B** — Chỉ tầng truy cập dữ liệu phải sửa (PE 9.10).

</details>

**Câu 11.** Row-level security giải quyết vấn đề gì của web app?

- A. Ứng dụng kết nối bằng một user chung nên CSDL không phân biệt người dùng cuối; policy giới hạn dòng mỗi người thấy
- B. Mã hoá dữ liệu trên đĩa
- C. Tăng tốc truy vấn
- D. Chống XSS

<details><summary>Đáp án</summary>

**A** — Policy `using (owner = current_user)` (hoặc biến phiên) lọc dòng ngay trong CSDL.

</details>

## 3. Câu hỏi tự luận (12 câu)

**Câu 1.** 

> **Exercise 9.1.** Java programs usually run more slowly than C or C++ programs. Why, then, do servlets perform better than programs that use the common gateway interface (CGI)? Give the main reason.

Vì sao servlet cho hiệu năng tốt hơn chương trình CGI, dù Java thường chạy chậm hơn C/C++?

<details><summary>Gợi ý đáp án</summary>

CGI khởi động **một process mới cho mỗi request** — chi phí hệ điều hành lớn (tạo process, nạp chương trình, mở kết nối CSDL lại từ đầu). Servlet chạy như **thread** trong một process đã có sẵn (thường chính là web/application server), nên không tốn chi phí tạo process và giao tiếp giữa các process; servlet còn giữ được tài nguyên dùng chung (pool kết nối CSDL, cache) giữa các request. Với tác vụ nhỏ/vừa, phần tiết kiệm này lớn hơn chênh lệch tốc độ của Java. Với tác vụ nặng CPU, CGI + C/C++ có thể vẫn nhanh hơn.

</details>

**Câu 2.** 

> **Exercise 9.2.** List some advantages and disadvantages of connectionless protocols compared with protocols that keep connections open.

Nêu ưu và nhược điểm của giao thức connectionless so với giao thức duy trì kết nối.

<details><summary>Gợi ý đáp án</summary>

**Ưu**: máy tính giới hạn số kết nối đồng thời; kết nối được đóng ngay khi xong request nên **nhiều client** được phục vụ hơn. Mỗi request có thể chuyển tới **bất kỳ server nào** → cân bằng tải; server hỏng thì server khác tiếp quản mà client không nhận ra.

**Nhược**: phải **thiết lập lại kết nối** cho mỗi request; thông tin phiên phải **gửi lại mỗi lần** (cookie, hidden field) và server phải tra lại trạng thái → chậm hơn giao thức có kết nối khi cần nhiều trạng thái.

</details>

**Câu 3.** 

> **Exercise 9.3.** A carelessly written online-shopping web application puts the price of each item in a hidden form variable on the page sent to the customer; when the customer submits the form, the value of that hidden variable is used to compute the customer’s bill. What is the loophole in this design? (Customers of a real online-shopping site actually exploited such a loophole before it was noticed and fixed.)

Ứng dụng bán hàng lưu giá sản phẩm trong hidden form field rồi dùng giá trị gửi lên để tính hoá đơn. Lỗ hổng là gì?

<details><summary>Gợi ý đáp án</summary>

Hidden field chỉ "ẩn" khi hiển thị; người dùng có thể **sửa mã HTML** (hoặc DOM, hoặc request HTTP bằng công cụ) để đổi giá trị `price`, rồi gửi form — ứng dụng dùng luôn giá đã bị sửa để tính tiền. Sửa: chỉ gửi **product_id và số lượng**, giá luôn lấy từ CSDL phía server (bài CH9.03–CH9.04 phát hiện các dòng bị sửa giá và tính lại hoá đơn đúng). Nguyên tắc chung: **không tin bất cứ dữ liệu nào từ client**.

</details>

**Câu 4.** 

> **Exercise 9.4.** Another carelessly written web application uses a servlet that checks whether there is an active session, but does not check whether the user is authorized to access the page; it relies on the fact that the link to the page is displayed only to authorized users. What is the risk in this approach? (In a real case, applicants to a college-admissions site logged in and used this loophole to view information they were not authorized to see; the access was detected, and those who did it were punished by being denied admission.)

Servlet chỉ kiểm tra có session hợp lệ, không kiểm tra người dùng có quyền xem trang, vì link chỉ hiện cho người có quyền. Rủi ro là gì?

<details><summary>Gợi ý đáp án</summary>

Người không có quyền có thể **biết URL** bằng cách khác (người khác cho biết, lịch sử/proxy log, đoán đường dẫn). Họ đăng nhập (session hợp lệ) rồi gõ thẳng URL → servlet chỉ kiểm tra session nên **trả về trang**. Kiểm tra HTTP referer chặn được cách khai thác ngây thơ nhưng referer do trình duyệt đặt nên **giả được**. Sửa đúng: **mọi** trang kiểm tra quyền phía server (ví dụ bảng ACL page–role, bài CH9.05–CH9.06), không dựa vào giao diện.

</details>

**Câu 5.** 

> **Exercise 9.5.** Why is it important to open JDBC connections with the try-with-resources syntax, `try (…) { … }`?

Vì sao nên mở kết nối JDBC bằng try-with-resources?

<details><summary>Gợi ý đáp án</summary>

try-with-resources tự động gọi `close()` cho Connection/Statement/ResultSet khi khối kết thúc — **kể cả khi có exception**. Nếu tự đóng mà quên, hoặc exception xảy ra trước lệnh close, kết nối bị rò rỉ: CSDL (hoặc pool) cạn kết nối và ứng dụng treo/lỗi. Với connection pool, `close()` là **trả kết nối về pool**.

</details>

**Câu 6.** 

> **Exercise 9.6.** List three ways in which caching can be used to improve the performance of a web server.

Nêu ba cách dùng caching để tăng hiệu năng web server.

<details><summary>Gợi ý đáp án</summary>

1. **Connection pooling**: mở sẵn các kết nối CSDL, mỗi request mượn một kết nối thay vì mở mới (mở kết nối rất tốn thời gian).
2. **Cache kết quả truy vấn**: request lặp lại cùng truy vấn thì dùng kết quả đã lưu (trong bộ nhớ, hoặc materialized view) thay vì truy vấn lại CSDL.
3. **Cache trang web đã sinh**: request giống hệt thì trả lại trang HTML đã sinh.

Cả ba phải xử lý **làm mới cache** khi dữ liệu đổi. Bài CH9.15 dùng materialized view làm cache; CH9.16 dùng nhật ký truy vấn để chọn truy vấn đáng cache.

</details>

**Câu 7.** 

> **Exercise 9.7.** The netstat command (on Linux and Windows) lists the active network connections of a computer. Explain how it can be used to discover whether a particular web page fails to close the connections it opens — or, when connection pooling is used, fails to return connections to the pool. Take into account that, with connection pooling, a connection may not be closed right away.

Dùng netstat thế nào để phát hiện một trang web không đóng kết nối (hoặc không trả kết nối về pool), biết rằng với pool kết nối có thể không đóng ngay?

<details><summary>Gợi ý đáp án</summary>

1. Chạy netstat để đếm các kết nối tới máy/cổng của CSDL (chạy ở máy ứng dụng hoặc máy CSDL).
2. Truy cập trang cần kiểm tra **lặp đi lặp lại** (tự động bằng công cụ như JMeter).
3. Theo dõi số kết nối: với pool, số kết nối tăng từ 0 lên một mức (số kết nối pool giữ lại) rồi **ngừng tăng**. Nếu số kết nối **tiếp tục tăng** theo số lần truy cập thì code của trang không đóng/không trả kết nối.

Bài CH9.17 làm phân tích này trên bảng mẫu `app_netstat`.

</details>

**Câu 8.** 

> **Exercise 9.8.** Testing for SQL-injection vulnerability:
> 
> a. Propose an approach to test whether an application is vulnerable to SQL-injection attacks through text input.
> 
> b. Can SQL injection happen through kinds of HTML input other than text boxes? If so, how would you test for that vulnerability?

(a) Đề xuất cách kiểm thử ứng dụng có bị SQL injection qua ô nhập text. (b) SQL injection có xảy ra với kiểu input HTML khác không? Kiểm thử thế nào?

<details><summary>Gợi ý đáp án</summary>

a. Nhập chuỗi chứa **dấu nháy đơn** (ví dụ `O'Brien`, hoặc `x' or '1'='1`) vào **từng** ô text của **từng** form. Nếu giá trị không được lưu/tìm đúng, hoặc ứng dụng báo lỗi SQL, hoặc trả về nhiều dữ liệu hơn mong đợi → có lỗ hổng.

b. **Có**. Dropdown, radio, checkbox, hidden field, cookie, tham số URL đều do trình duyệt gửi lên; người dùng sửa được giá trị (sửa trang, sửa cây DOM bằng công cụ của trình duyệt, hoặc tự tạo request). Kiểm thử: sửa giá trị gửi lên của các input đó thành chuỗi có dấu nháy đơn và quan sát như (a). Phòng chống ở mọi trường hợp: prepared statement. Bài CH9.07–CH9.08.

</details>

**Câu 9.** 

> **Exercise 9.9.** The values of some attributes of a database relation may be stored encrypted for security. Why do database systems not support indexes on encrypted attributes? Using your answer, explain why database systems do not allow primary-key attributes to be encrypted.

Vì sao CSDL không hỗ trợ index trên thuộc tính được mã hoá? Từ đó giải thích vì sao không cho mã hoá thuộc tính khoá chính.

<details><summary>Gợi ý đáp án</summary>

Index cần so sánh/sắp xếp giá trị. Bản mã không giữ thứ tự nên **không** hỗ trợ truy vấn khoảng. Chỉ khi mọi lần xuất hiện của một giá trị được mã hoá thành **cùng** một bản mã thì mới so sánh bằng được — nhưng như vậy kẻ tấn công **phân tích tần suất** đoán được giá trị phổ biến. Thêm salt ngẫu nhiên chống được phân tích nhưng khiến index (kể cả so sánh bằng) không thể dùng. Lưu index không mã hoá thì lộ dữ liệu; mã hoá index thì CSDL phải biết khoá và giải mã từng phần index khi chạy — phải sửa rất nhiều mã nguồn nên thường không hỗ trợ.

Khoá chính phải được **kiểm tra không trùng** mỗi lần chèn (và khoá ngoại phải tra được); với giá trị mã hoá kiểu trên thì CSDL không phát hiện được vi phạm, nên CSDL không cho mã hoá khoá chính (và khoá ngoại). Bài CH9.19 minh hoạ: băm tất định so khớp được, băm có salt thì không.

</details>

**Câu 10.** 

> **Exercise 9.10.** Exercise 9.9 deals with encrypting particular attributes. Some database systems, however, can encrypt the whole database. Explain how encrypting the entire database avoids the problems raised in Exercise 9.9.

Một số CSDL mã hoá toàn bộ cơ sở dữ liệu. Vì sao cách này tránh được các vấn đề của PE 9.9?

<details><summary>Gợi ý đáp án</summary>

Khi mã hoá toàn bộ, CSDL **giải mã khi đọc dữ liệu từ đĩa vào bộ nhớ** và mã hoá khi ghi xuống; trong bộ nhớ dữ liệu ở dạng rõ. Mọi thứ trên đĩa (bảng, **index**, log) đều được mã hoá, nhưng các tầng phía trên làm việc với dữ liệu rõ như bình thường: index dùng được nguyên vẹn, ràng buộc khoá chính/khoá ngoại được kiểm tra không cần thay đổi. Chỉ **tầng truy cập dữ liệu** (đọc/ghi trang) phải sửa. Đổi lại, nó bảo vệ dữ liệu khi bị lấy cắp đĩa/bản sao lưu, không bảo vệ trước người dùng có quyền truy cập CSDL.

</details>

**Câu 11.** 

> **Exercise 9.11.** Suppose someone pretends to be a company and obtains a certificate from a certificate-issuing authority. What is the effect on items (such as purchase orders or programs) certified by the company that was impersonated, and on items certified by other companies?

Kẻ mạo danh một công ty và được CA cấp chứng chỉ. Ảnh hưởng tới những thứ (đơn đặt hàng, chương trình) được "chứng thực" bởi công ty bị mạo danh và bởi các công ty khác?

<details><summary>Gợi ý đáp án</summary>

Kẻ mạo danh C có chứng chỉ chứa **khoá công khai của C** nhưng mang tên công ty X. Bên Y kiểm tra chứng chỉ thấy hợp lệ nên tin mọi thứ C ký là của X: có thể tiết lộ thông tin mật cho C, nhận đơn đặt hàng giả, chạy chương trình độc hại "của X". Vấn đề cốt lõi: chứng chỉ dùng offline **không thu hồi được** — dù CA phát hiện, Y vẫn bị lừa nếu không tra danh sách thu hồi (giao thức không bắt buộc).

Những thứ do X thật ký (bằng khoá thật) vẫn đúng, nhưng Y không còn phân biệt được với đồ giả mang tên X. Chứng chỉ và chữ ký của **các công ty khác không bị ảnh hưởng** — trừ khi X là một CA: kẻ mạo danh có thể cấp tiếp chứng chỉ giả, nên cả **nhánh** dưới X trong chuỗi chứng chỉ bị ảnh hưởng; chứng chỉ ngoài nhánh đó vẫn an toàn (bài CH9.18).

</details>

**Câu 12.** 

> **Exercise 9.12.** The passwords that control access to a database are arguably its most important data items. Propose a scheme for storing passwords securely. The scheme must still let the system check the passwords that users supply when they try to log in.

Đề xuất lược đồ lưu mật khẩu an toàn mà vẫn kiểm tra được mật khẩu người dùng nhập khi đăng nhập.

<details><summary>Gợi ý đáp án</summary>

- Khi đăng ký: sinh **salt ngẫu nhiên** cho từng user, lưu `(user_id, salt, hash(salt || password))` với hash là hàm băm một chiều an toàn (SHA-2; tốt hơn nữa là hàm chậm như bcrypt/scrypt/Argon2). Không lưu mật khẩu rõ, không cần (và không có) mã giải mã.
- Khi đăng nhập: tìm user (index trên user_id/username), lấy salt, tính `hash(salt || mật khẩu nhập)` và **so với hash đã lưu**.
- Salt khiến hai người cùng mật khẩu có hash khác nhau và vô hiệu hoá bảng tra sẵn (dictionary/rainbow table); kẻ lấy được bảng phải dò từng user một.
- Bảo vệ thêm: quyền đọc bảng mật khẩu chỉ cho dịch vụ xác thực (view không có cột hash cho phần còn lại của ứng dụng — bài CH9.20), giới hạn số lần thử.

Bài CH9.01–CH9.02 hiện thực đăng nhập và đăng ký với `sha256`.

</details>

## 4. Bài tập SQL (20 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH9.01 | PE 9.12 kiểm tra đăng nhập | ★★☆ | Exercise 9.12. The passwords that control access to a database are arguably its most important data items. Propose a scheme for storing passwords securely. The scheme must still let the system check the passwords that users supply when they try to log in.<br>`app_user(user_id, username, role, salt, pw_hash)` lưu `pw_hash = encode(sha256(convert_to(salt \|\| password, 'UTF8')), 'hex')`. Cho các lần thử đăng nhập ``` (values ('alice', 'secret1'), ('bob', 'wrong'), ('dave', 'secret1'), ('zed', 'secret1')) as a(username, password) ``` trả về `username` và `login_ok` (boolean; username không tồn tại → false) cho từng lần thử. |
| CH9.02 | PE 9.12 đăng ký, salt | ★★☆ | Exercise 9.12. The passwords that control access to a database are arguably its most important data items. Propose a scheme for storing passwords securely. The scheme must still let the system check the passwords that users supply when they try to log in.<br>Đăng ký user mới: `user_id` 6, username `frank`, role `customer`, salt `Ab12c`, mật khẩu `qwerty` — lưu đúng hash, không lưu mật khẩu rõ. Hệ thống kiểm tra đăng nhập đúng/sai cho frank và so sánh hash của alice và dave (cùng mật khẩu `secret1`). |
| CH9.03 | PE 9.3 phát hiện giá bị sửa | ★☆☆ | Exercise 9.3. A carelessly written online-shopping web application puts the price of each item in a hidden form variable on the page sent to the customer; when the customer submits the form, the value of that hidden variable is used to compute the customer’s bill. What is the loophole in this design? (Customers of a real online-shopping site actually exploited such a loophole before it was noticed and fixed.)<br>`app_cart_submission(submission_id, user_id, product_id, qty, submitted_price)` là dữ liệu form gửi lên (giá lấy từ hidden field). Liệt kê các dòng có giá gửi lên khác giá trong `app_product`: submission_id, username, product name, submitted_price, price. |
| CH9.04 | PE 9.3 tính hoá đơn phía server | ★★☆ | Exercise 9.3. A carelessly written online-shopping web application puts the price of each item in a hidden form variable on the page sent to the customer; when the customer submits the form, the value of that hidden variable is used to compute the customer’s bill. What is the loophole in this design? (Customers of a real online-shopping site actually exploited such a loophole before it was noticed and fixed.)<br>Với mỗi submission: `submission_id`, `client_total` (tính theo giá gửi lên) và `server_total` (tính theo giá trong CSDL) — số tiền mà ứng dụng đúng ra phải thu. |
| CH9.05 | PE 9.4 request trái quyền | ★★☆ | Exercise 9.4. Another carelessly written web application uses a servlet that checks whether there is an active session, but does not check whether the user is authorized to access the page; it relies on the fact that the link to the page is displayed only to authorized users. What is the risk in this approach? (In a real case, applicants to a college-admissions site logged in and used this loophole to view information they were not authorized to see; the access was detected, and those who did it were punished by being denied admission.)<br>Servlet đã phục vụ các request trong `app_request(request_id, session_id, page, requested_at)` mà chỉ kiểm tra session. Dựa trên `app_session` → `app_user.role` và `app_page_acl(page, role)`, liệt kê các request mà người dùng không có quyền xem trang: request_id, username, role, page. |
| CH9.06 | PE 9.4 hàm kiểm tra quyền | ★★★ | Exercise 9.4. Another carelessly written web application uses a servlet that checks whether there is an active session, but does not check whether the user is authorized to access the page; it relies on the fact that the link to the page is displayed only to authorized users. What is the risk in this approach? (In a real case, applicants to a college-admissions site logged in and used this loophole to view information they were not authorized to see; the access was detected, and those who did it were punished by being denied admission.)<br>Viết hàm `app_can_access(p_session varchar, p_page varchar, p_at timestamp) returns boolean`: true khi và chỉ khi session tồn tại, chưa hết hạn tại p_at (`p_at < expires_at`) và role của user được phép xem p_page. Hệ thống gọi hàm cho mọi request trong app_request. |
| CH9.07 | PE 9.8 khai thác injection | ★★☆ | Exercise 9.8 (a). Testing for SQL-injection vulnerability:  a. Propose an approach to test whether an application is vulnerable to SQL-injection attacks through text input.<br>Hàm có sẵn `app_find_user_unsafe(name text)` ghép thẳng `name` vào câu SQL: `... where username = '` \|\| name \|\| `'`. Đóng vai người kiểm thử: viết một câu `select count(*) as n from app_find_user_unsafe(...)` với một đầu vào khiến hàm trả về mọi user (chỉ đổi chuỗi đầu vào). |
| CH9.08 | PE 9.8 sửa injection | ★★☆ | Exercise 9.8. Testing for SQL-injection vulnerability:  a. Propose an approach to test whether an application is vulnerable to SQL-injection attacks through text input.  b. Can SQL injection happen through kinds of HTML input other than text boxes? If so, how would you test for that vulnerability?<br>Viết hàm an toàn `app_find_user(name text) returns table (user_id integer, username varchar)` — vẫn dùng PL/pgSQL `return query execute` (dynamic SQL) nhưng truyền tham số bằng `using` (hoặc `format('%L')`). Hệ thống gọi với `bob`, với chuỗi tấn công của CH9.07 và với `O'Brien`. |
| CH9.09 | prepared statement | ★★☆ | Tạo prepared statement `cart_of(integer)` trả về `product_id`, `qty`, `price` (giá trong app_product) của các dòng trong app_cart_submission thuộc user có id là tham số; rồi execute nó với user 4. (Chạy trên database mới vì prepared statement không bị rollback.) |
| CH9.10 | phân trang offset | ★☆☆ | Trang danh sách bài viết hiển thị 10 bài/trang, mới nhất trước (`created_at desc`). Trả về `post_id`, `title` của trang 3 bằng `limit/offset`. (Thứ tự được chấm.) |
| CH9.11 | phân trang keyset | ★★☆ | Phân trang keyset: người dùng đang ở trang 1 và bài cuối cùng họ thấy là `post_id = 16`. Trả về 10 bài kế tiếp (post_id, title) không dùng offset, dựa trên created_at của bài 16. (Thứ tự được chấm.) |
| CH9.12 | upsert on conflict | ★★☆ | Mỗi lượt xem trang tăng bộ đếm trong `app_page_view(page primary key, views)`; trang chưa có thì tạo với views = 1. Viết một câu `insert ... on conflict` ghi nhận một lượt xem cho mỗi trang `/shop`, `/admin`, `/orders`. Hệ thống đọc lại bảng. |
| CH9.13 | giao dịch nguyên tử cho một request | ★★★ | Viết hàm `app_transfer(p_from integer, p_to integer, p_amount numeric) returns void` trừ tiền ví p_from và cộng ví p_to trong `app_wallet` (balance có `check (balance >= 0)`). Vì cả hàm chạy như một đơn vị, nếu trừ tiền vi phạm check thì cộng tiền cũng không được giữ lại. Hệ thống thử chuyển 50 từ user 2 sang 1 (không đủ tiền) và 40 từ user 4 sang 3, rồi đọc mọi ví. |
| CH9.14 | row-level security | ★★★ | Web app dùng chung bảng `app_note(note_id, owner, body)`. Bật row-level security cho app_note với policy: mỗi người chỉ thấy dòng có `owner = current_user`. Tạo role `alice` và `bob`, cấp quyền select trên app_note cho cả hai. Hệ thống `set role bob` rồi đọc app_note. |
| CH9.15 | PE 9.6 cache bằng materialized view | ★★☆ | Exercise 9.6. List three ways in which caching can be used to improve the performance of a web server.<br>Cache danh mục sản phẩm: tạo materialized view `app_product_cache(product_id, name, price)` từ app_product. Hệ thống đổi giá Keyboard (101) thành 50, đọc giá trong cache, refresh, rồi đọc lại. |
| CH9.16 | PE 9.6 chọn truy vấn để cache | ★☆☆ | Exercise 9.6. List three ways in which caching can be used to improve the performance of a web server.<br>`app_query_log(log_id, query_text, ms)` ghi lại các truy vấn ứng dụng đã chạy. Truy vấn nào đáng cache? Trả về `query_text`, `runs` (số lần chạy) và `total_ms` cho các truy vấn chạy ít nhất 3 lần. |
| CH9.17 | PE 9.7 netstat, window lag | ★★★ | Exercise 9.7. The netstat command (on Linux and Windows) lists the active network connections of a computer. Explain how it can be used to discover whether a particular web page fails to close the connections it opens — or, when connection pooling is used, fails to return connections to the pool. Take into account that, with connection pooling, a connection may not be closed right away.<br>`app_netstat(page, sample_no, open_conns)`: số kết nối CSDL đang mở sau mỗi lô truy cập một trang (có connection pool). Trang bị rò rỉ kết nối nếu số kết nối vẫn tăng ngặt ở mọi lần đo từ lần 4 trở đi (so với lần đo liền trước). Trả về page và `last_conns` (số kết nối ở lần đo cuối) của các trang rò rỉ. |
| CH9.18 | PE 9.11 chuỗi chứng chỉ, recursive | ★★★ | Exercise 9.11. Suppose someone pretends to be a company and obtains a certificate from a certificate-issuing authority. What is the effect on items (such as purchase orders or programs) certified by the company that was impersonated, and on items certified by other companies?<br>`app_cert(cert_id, subject, issued_by)`: chứng chỉ và chứng chỉ của bên đã ký nó. Giả sử chứng chỉ `C1` (IntermediateCA) bị cấp cho kẻ mạo danh. Liệt kê mọi chứng chỉ không còn đáng tin: C1 và mọi chứng chỉ nằm dưới nó trong chuỗi (cert_id, subject, `depth` — C1 có depth 0). |
| CH9.19 | PE 9.9 băm tất định vs có salt | ★★☆ | Exercise 9.9. The values of some attributes of a database relation may be stored encrypted for security. Why do database systems not support indexes on encrypted attributes? Using your answer, explain why database systems do not allow primary-key attributes to be encrypted.<br>`app_card` lưu số thẻ dưới hai dạng: `det_hash` (băm tất định: cùng số thẻ → cùng giá trị) và `salted_hash` (băm kèm salt riêng mỗi dòng). Tìm các cặp thẻ (card_id1 < card_id2) trùng số thẻ bằng det_hash, và cho biết `salted_equal` — salted_hash của hai thẻ có bằng nhau không. |
| CH9.20 | view + grant cho role ứng dụng | ★★☆ | Phần lớn ứng dụng không được thấy salt và hash mật khẩu. Tạo view `app_public_user(user_id, username, role)` từ app_user, role `app_web`, và chỉ cấp select trên view cho app_web. Hệ thống `set role app_web`, đếm dòng qua view và thử đọc app_user. |
