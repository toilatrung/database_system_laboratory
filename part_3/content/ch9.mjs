export default {
  number: 9,
  slug: 'ch9_app_dev',
  title: 'Application Development',
  titleVi: 'Phát triển ứng dụng',

  summary: `
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
| **Prepared statement** | biên dịch một lần, chạy nhiều lần; tham số được truyền riêng → chống injection | \`prepare q(int) as select ... where id = $1; execute q(5);\` |
| **Phân trang offset** | trang k, n dòng/trang | \`order by created_at desc limit n offset (k-1)*n\` |
| **Phân trang keyset** | trang sau, không quét lại các dòng trước, ổn định khi có dòng mới | \`where created_at < :last_seen order by created_at desc limit n\` |
| **Upsert** | đếm lượt xem, lưu cấu hình | \`insert ... on conflict (key) do update set views = t.views + 1\` |
| **Giao dịch cho một request** | chuyển tiền, đặt hàng: tất cả hoặc không | \`begin; ...; commit;\` (hoặc một hàm — chạy nguyên tử) |
| **View + grant** | ứng dụng chỉ thấy cột cần thiết | \`create view ...; grant select on view to app_role\` |
| **Row-level security** | mỗi người chỉ thấy dòng của mình | \`alter table t enable row level security; create policy ... using (owner = current_user)\` |

### 4. Hiệu năng (slide 9.30–9.33, PE 9.6, 9.7)
- **Connection pooling**: mở sẵn một nhóm kết nối, request mượn rồi **trả lại** thay vì mở/đóng mỗi lần. Nếu code quên trả (không đóng trong \`finally\` / try-with-resources), số kết nối **tăng mãi** → hết kết nối (PE 9.5, 9.7). Kiểm tra bằng \`netstat\`: truy cập trang nhiều lần; với pool, số kết nối tăng tới một mức rồi **dừng**; nếu tiếp tục tăng là rò rỉ.
- **Caching**: (1) pool kết nối; (2) cache **kết quả truy vấn** (query result / materialized view); (3) cache **trang HTML** đã sinh. Cache phải được **làm mới (invalidate)** khi dữ liệu thay đổi.
- Materialized view trong PostgreSQL: \`create materialized view v as ...\`, dữ liệu **cũ** cho tới khi \`refresh materialized view v\`.

### 5. Bảo mật ứng dụng (slide 9.34–9.50)
**SQL injection** (PE 9.8):
\`\`\`
"select * from app_user where username = '" + name + "'"
name = x' or '1'='1   →   ... where username = 'x' or '1'='1'   -- trả về mọi user
\`\`\`
Phòng chống: **prepared statement / tham số** (\`?\`, \`$1\`); trong PL/pgSQL dynamic SQL dùng \`execute ... using\` hoặc \`format('%L', x)\`. Kiểm thử: nhập chuỗi có dấu nháy đơn vào **mọi** ô nhập (kể cả dropdown, hidden field, cookie — người dùng sửa được DOM/request).

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
- Hàm \`sha256(bytea)\` của PostgreSQL: \`encode(sha256(convert_to(salt || pw, 'UTF8')), 'hex')\`.
- \`try_sql($$...$$)\` trả về \`ok\` hoặc SQLSTATE (23514 vi phạm check, 42501 không có quyền) — dùng để thấy một lệnh bị từ chối mà không làm hỏng cả bài.
- Prepared statement không bị rollback cùng giao dịch, nên bài prepare chạy trên database mới.
`,

  quiz: [
    {
      q: 'Vì sao servlet nhanh hơn CGI dù Java thường chậm hơn C?',
      options: ['Servlet được biên dịch sang mã máy', 'CGI tạo một process mới cho mỗi request; servlet chạy dưới dạng thread trong process có sẵn', 'Servlet không dùng HTTP', 'CGI không hỗ trợ cookie'],
      answer: 1,
      explain: 'Chi phí tạo process và giao tiếp giữa các process lớn hơn chênh lệch tốc độ ngôn ngữ (PE 9.1).',
    },
    {
      q: 'HTTP là giao thức connectionless. Hệ quả nào **không** đúng?',
      options: ['Server phục vụ được nhiều client hơn', 'Dễ chuyển request sang server khác khi một server hỏng', 'Không cần gửi lại thông tin phiên ở mỗi request', 'Phải thiết lập kết nối lại cho mỗi request'],
      answer: 2,
      explain: 'Ngược lại: thông tin phiên phải đi kèm mỗi request (cookie/hidden field) — PE 9.2.',
    },
    {
      q: 'Lỗ hổng khi ứng dụng lấy giá sản phẩm từ hidden form field để tính tiền?',
      options: ['Trình duyệt không gửi hidden field', 'Người dùng sửa HTML/request để đổi giá', 'Hidden field làm trang chậm', 'Không có lỗ hổng'],
      answer: 1,
      explain: 'Mọi thứ từ client đều sửa được; giá phải lấy từ CSDL phía server (PE 9.3).',
    },
    {
      q: 'Cách đúng nhất chống SQL injection?',
      options: ['Xoá mọi dấu nháy đơn khỏi đầu vào', 'Dùng prepared statement / tham số hoá truy vấn', 'Chỉ cho nhập từ dropdown', 'Kiểm tra độ dài chuỗi'],
      answer: 1,
      explain: 'Tham số được truyền tách khỏi câu SQL nên không thể đổi cấu trúc câu lệnh. Dropdown vẫn bị sửa được (PE 9.8b).',
    },
    {
      q: 'Trong lược đồ lưu mật khẩu của PE 9.12, salt dùng để làm gì?',
      options: ['Giải mã mật khẩu khi cần', 'Hai người cùng mật khẩu có hash khác nhau, chống tấn công từ điển/bảng tra sẵn', 'Tăng tốc đăng nhập', 'Thay cho hàm băm'],
      answer: 1,
      explain: 'Salt ngẫu nhiên lưu cùng user; hash(salt || password) không giải mã được, chỉ tính lại để so sánh.',
    },
    {
      q: 'Phân trang **keyset** (`where created_at < :last order by created_at desc limit 10`) hơn **offset** ở điểm nào?',
      options: ['Nhảy tới trang bất kỳ dễ hơn', 'Không phải quét và bỏ qua các dòng của những trang trước; ổn định khi có dòng mới', 'Không cần index', 'Trả về nhiều dòng hơn'],
      answer: 1,
      explain: 'Offset lớn vẫn phải đọc rồi bỏ đi offset dòng, và dòng mới chèn vào làm lệch trang.',
    },
    {
      q: '`refresh materialized view` cần thiết vì?',
      options: ['Materialized view tự cập nhật khi bảng gốc đổi', 'Materialized view lưu kết quả tại lúc refresh; bảng gốc đổi thì nó vẫn giữ dữ liệu cũ', 'Để tạo index', 'Để đổi tên view'],
      answer: 1,
      explain: 'Đó là một dạng cache kết quả truy vấn (PE 9.6) — phải làm mới.',
    },
    {
      q: 'Dùng netstat với connection pooling: dấu hiệu trang **không trả kết nối** về pool là?',
      options: ['Số kết nối bằng 0 sau mỗi request', 'Số kết nối tăng tới một mức rồi đứng yên', 'Số kết nối tiếp tục tăng khi truy cập trang lặp lại', 'Số kết nối dao động quanh một giá trị'],
      answer: 2,
      explain: 'Với pool, kết nối không đóng ngay nhưng phải ổn định; tăng mãi là rò rỉ (PE 9.7).',
    },
    {
      q: 'Vì sao CSDL không cho mã hoá thuộc tính khoá chính (mã hoá có salt)?',
      options: ['Khoá chính quá ngắn', 'Không kiểm tra được trùng khoá và không index được trên bản mã', 'Mã hoá làm mất kiểu dữ liệu', 'Luật pháp cấm'],
      answer: 1,
      explain: 'Cùng giá trị cho bản mã khác nhau → không phát hiện vi phạm primary key (PE 9.9).',
    },
    {
      q: 'Mã hoá toàn bộ CSDL tránh được vấn đề của mã hoá từng thuộc tính vì?',
      options: ['Dữ liệu không bao giờ được giải mã', 'Dữ liệu chỉ được mã hoá trên đĩa, giải mã khi đọc vào bộ nhớ nên index và ràng buộc khoá vẫn chạy bình thường', 'Không cần khoá mã hoá', 'Mọi giá trị dùng chung một bản mã'],
      answer: 1,
      explain: 'Chỉ tầng truy cập dữ liệu phải sửa (PE 9.10).',
    },
    {
      q: 'Row-level security giải quyết vấn đề gì của web app?',
      options: ['Ứng dụng kết nối bằng một user chung nên CSDL không phân biệt người dùng cuối; policy giới hạn dòng mỗi người thấy', 'Mã hoá dữ liệu trên đĩa', 'Tăng tốc truy vấn', 'Chống XSS'],
      answer: 0,
      explain: 'Policy `using (owner = current_user)` (hoặc biến phiên) lọc dòng ngay trong CSDL.',
    },
  ],

  questions: [
    {
      pe: '9.1',
      q: 'Vì sao servlet cho hiệu năng tốt hơn chương trình CGI, dù Java thường chạy chậm hơn C/C++?',
      answer: `CGI khởi động **một process mới cho mỗi request** — chi phí hệ điều hành lớn (tạo process, nạp chương trình, mở kết nối CSDL lại từ đầu). Servlet chạy như **thread** trong một process đã có sẵn (thường chính là web/application server), nên không tốn chi phí tạo process và giao tiếp giữa các process; servlet còn giữ được tài nguyên dùng chung (pool kết nối CSDL, cache) giữa các request. Với tác vụ nhỏ/vừa, phần tiết kiệm này lớn hơn chênh lệch tốc độ của Java. Với tác vụ nặng CPU, CGI + C/C++ có thể vẫn nhanh hơn.`,
    },
    {
      pe: '9.2',
      q: 'Nêu ưu và nhược điểm của giao thức connectionless so với giao thức duy trì kết nối.',
      answer: `**Ưu**: máy tính giới hạn số kết nối đồng thời; kết nối được đóng ngay khi xong request nên **nhiều client** được phục vụ hơn. Mỗi request có thể chuyển tới **bất kỳ server nào** → cân bằng tải; server hỏng thì server khác tiếp quản mà client không nhận ra.

**Nhược**: phải **thiết lập lại kết nối** cho mỗi request; thông tin phiên phải **gửi lại mỗi lần** (cookie, hidden field) và server phải tra lại trạng thái → chậm hơn giao thức có kết nối khi cần nhiều trạng thái.`,
    },
    {
      pe: '9.3',
      q: 'Ứng dụng bán hàng lưu giá sản phẩm trong hidden form field rồi dùng giá trị gửi lên để tính hoá đơn. Lỗ hổng là gì?',
      answer: `Hidden field chỉ "ẩn" khi hiển thị; người dùng có thể **sửa mã HTML** (hoặc DOM, hoặc request HTTP bằng công cụ) để đổi giá trị \`price\`, rồi gửi form — ứng dụng dùng luôn giá đã bị sửa để tính tiền. Sửa: chỉ gửi **product_id và số lượng**, giá luôn lấy từ CSDL phía server (bài CH9.03–CH9.04 phát hiện các dòng bị sửa giá và tính lại hoá đơn đúng). Nguyên tắc chung: **không tin bất cứ dữ liệu nào từ client**.`,
    },
    {
      pe: '9.4',
      q: 'Servlet chỉ kiểm tra có session hợp lệ, không kiểm tra người dùng có quyền xem trang, vì link chỉ hiện cho người có quyền. Rủi ro là gì?',
      answer: `Người không có quyền có thể **biết URL** bằng cách khác (người khác cho biết, lịch sử/proxy log, đoán đường dẫn). Họ đăng nhập (session hợp lệ) rồi gõ thẳng URL → servlet chỉ kiểm tra session nên **trả về trang**. Kiểm tra HTTP referer chặn được cách khai thác ngây thơ nhưng referer do trình duyệt đặt nên **giả được**. Sửa đúng: **mọi** trang kiểm tra quyền phía server (ví dụ bảng ACL page–role, bài CH9.05–CH9.06), không dựa vào giao diện.`,
    },
    {
      pe: '9.5',
      q: 'Vì sao nên mở kết nối JDBC bằng try-with-resources?',
      answer: `try-with-resources tự động gọi \`close()\` cho Connection/Statement/ResultSet khi khối kết thúc — **kể cả khi có exception**. Nếu tự đóng mà quên, hoặc exception xảy ra trước lệnh close, kết nối bị rò rỉ: CSDL (hoặc pool) cạn kết nối và ứng dụng treo/lỗi. Với connection pool, \`close()\` là **trả kết nối về pool**.`,
    },
    {
      pe: '9.6',
      q: 'Nêu ba cách dùng caching để tăng hiệu năng web server.',
      answer: `1. **Connection pooling**: mở sẵn các kết nối CSDL, mỗi request mượn một kết nối thay vì mở mới (mở kết nối rất tốn thời gian).
2. **Cache kết quả truy vấn**: request lặp lại cùng truy vấn thì dùng kết quả đã lưu (trong bộ nhớ, hoặc materialized view) thay vì truy vấn lại CSDL.
3. **Cache trang web đã sinh**: request giống hệt thì trả lại trang HTML đã sinh.

Cả ba phải xử lý **làm mới cache** khi dữ liệu đổi. Bài CH9.15 dùng materialized view làm cache; CH9.16 dùng nhật ký truy vấn để chọn truy vấn đáng cache.`,
    },
    {
      pe: '9.7',
      q: 'Dùng netstat thế nào để phát hiện một trang web không đóng kết nối (hoặc không trả kết nối về pool), biết rằng với pool kết nối có thể không đóng ngay?',
      answer: `1. Chạy netstat để đếm các kết nối tới máy/cổng của CSDL (chạy ở máy ứng dụng hoặc máy CSDL).
2. Truy cập trang cần kiểm tra **lặp đi lặp lại** (tự động bằng công cụ như JMeter).
3. Theo dõi số kết nối: với pool, số kết nối tăng từ 0 lên một mức (số kết nối pool giữ lại) rồi **ngừng tăng**. Nếu số kết nối **tiếp tục tăng** theo số lần truy cập thì code của trang không đóng/không trả kết nối.

Bài CH9.17 làm phân tích này trên bảng mẫu \`app_netstat\`.`,
    },
    {
      pe: '9.8',
      q: '(a) Đề xuất cách kiểm thử ứng dụng có bị SQL injection qua ô nhập text. (b) SQL injection có xảy ra với kiểu input HTML khác không? Kiểm thử thế nào?',
      answer: `a. Nhập chuỗi chứa **dấu nháy đơn** (ví dụ \`O'Brien\`, hoặc \`x' or '1'='1\`) vào **từng** ô text của **từng** form. Nếu giá trị không được lưu/tìm đúng, hoặc ứng dụng báo lỗi SQL, hoặc trả về nhiều dữ liệu hơn mong đợi → có lỗ hổng.

b. **Có**. Dropdown, radio, checkbox, hidden field, cookie, tham số URL đều do trình duyệt gửi lên; người dùng sửa được giá trị (sửa trang, sửa cây DOM bằng công cụ của trình duyệt, hoặc tự tạo request). Kiểm thử: sửa giá trị gửi lên của các input đó thành chuỗi có dấu nháy đơn và quan sát như (a). Phòng chống ở mọi trường hợp: prepared statement. Bài CH9.07–CH9.08.`,
    },
    {
      pe: '9.9',
      q: 'Vì sao CSDL không hỗ trợ index trên thuộc tính được mã hoá? Từ đó giải thích vì sao không cho mã hoá thuộc tính khoá chính.',
      answer: `Index cần so sánh/sắp xếp giá trị. Bản mã không giữ thứ tự nên **không** hỗ trợ truy vấn khoảng. Chỉ khi mọi lần xuất hiện của một giá trị được mã hoá thành **cùng** một bản mã thì mới so sánh bằng được — nhưng như vậy kẻ tấn công **phân tích tần suất** đoán được giá trị phổ biến. Thêm salt ngẫu nhiên chống được phân tích nhưng khiến index (kể cả so sánh bằng) không thể dùng. Lưu index không mã hoá thì lộ dữ liệu; mã hoá index thì CSDL phải biết khoá và giải mã từng phần index khi chạy — phải sửa rất nhiều mã nguồn nên thường không hỗ trợ.

Khoá chính phải được **kiểm tra không trùng** mỗi lần chèn (và khoá ngoại phải tra được); với giá trị mã hoá kiểu trên thì CSDL không phát hiện được vi phạm, nên CSDL không cho mã hoá khoá chính (và khoá ngoại). Bài CH9.19 minh hoạ: băm tất định so khớp được, băm có salt thì không.`,
    },
    {
      pe: '9.10',
      q: 'Một số CSDL mã hoá toàn bộ cơ sở dữ liệu. Vì sao cách này tránh được các vấn đề của PE 9.9?',
      answer: `Khi mã hoá toàn bộ, CSDL **giải mã khi đọc dữ liệu từ đĩa vào bộ nhớ** và mã hoá khi ghi xuống; trong bộ nhớ dữ liệu ở dạng rõ. Mọi thứ trên đĩa (bảng, **index**, log) đều được mã hoá, nhưng các tầng phía trên làm việc với dữ liệu rõ như bình thường: index dùng được nguyên vẹn, ràng buộc khoá chính/khoá ngoại được kiểm tra không cần thay đổi. Chỉ **tầng truy cập dữ liệu** (đọc/ghi trang) phải sửa. Đổi lại, nó bảo vệ dữ liệu khi bị lấy cắp đĩa/bản sao lưu, không bảo vệ trước người dùng có quyền truy cập CSDL.`,
    },
    {
      pe: '9.11',
      q: 'Kẻ mạo danh một công ty và được CA cấp chứng chỉ. Ảnh hưởng tới những thứ (đơn đặt hàng, chương trình) được "chứng thực" bởi công ty bị mạo danh và bởi các công ty khác?',
      answer: `Kẻ mạo danh C có chứng chỉ chứa **khoá công khai của C** nhưng mang tên công ty X. Bên Y kiểm tra chứng chỉ thấy hợp lệ nên tin mọi thứ C ký là của X: có thể tiết lộ thông tin mật cho C, nhận đơn đặt hàng giả, chạy chương trình độc hại "của X". Vấn đề cốt lõi: chứng chỉ dùng offline **không thu hồi được** — dù CA phát hiện, Y vẫn bị lừa nếu không tra danh sách thu hồi (giao thức không bắt buộc).

Những thứ do X thật ký (bằng khoá thật) vẫn đúng, nhưng Y không còn phân biệt được với đồ giả mang tên X. Chứng chỉ và chữ ký của **các công ty khác không bị ảnh hưởng** — trừ khi X là một CA: kẻ mạo danh có thể cấp tiếp chứng chỉ giả, nên cả **nhánh** dưới X trong chuỗi chứng chỉ bị ảnh hưởng; chứng chỉ ngoài nhánh đó vẫn an toàn (bài CH9.18).`,
    },
    {
      pe: '9.12',
      q: 'Đề xuất lược đồ lưu mật khẩu an toàn mà vẫn kiểm tra được mật khẩu người dùng nhập khi đăng nhập.',
      answer: `- Khi đăng ký: sinh **salt ngẫu nhiên** cho từng user, lưu \`(user_id, salt, hash(salt || password))\` với hash là hàm băm một chiều an toàn (SHA-2; tốt hơn nữa là hàm chậm như bcrypt/scrypt/Argon2). Không lưu mật khẩu rõ, không cần (và không có) mã giải mã.
- Khi đăng nhập: tìm user (index trên user_id/username), lấy salt, tính \`hash(salt || mật khẩu nhập)\` và **so với hash đã lưu**.
- Salt khiến hai người cùng mật khẩu có hash khác nhau và vô hiệu hoá bảng tra sẵn (dictionary/rainbow table); kẻ lấy được bảng phải dò từng user một.
- Bảo vệ thêm: quyền đọc bảng mật khẩu chỉ cho dịch vụ xác thực (view không có cột hash cho phần còn lại của ứng dụng — bài CH9.20), giới hạn số lần thử.

Bài CH9.01–CH9.02 hiện thực đăng nhập và đăng ký với \`sha256\`.`,
    },
  ],

  exercises: [
    // ---------------- Passwords ----------------
    {
      id: 'CH9.01', topic: 'PE 9.12 kiểm tra đăng nhập', level: 2, pe: '9.12',
      prompt: `\`app_user(user_id, username, role, salt, pw_hash)\` lưu \`pw_hash = encode(sha256(convert_to(salt || password, 'UTF8')), 'hex')\`. Cho các lần thử đăng nhập
\`\`\`
(values ('alice', 'secret1'), ('bob', 'wrong'), ('dave', 'secret1'), ('zed', 'secret1')) as a(username, password)
\`\`\`
trả về \`username\` và \`login_ok\` (boolean; username không tồn tại → false) cho từng lần thử.`,
      solution: `select a.username,
       coalesce(u.pw_hash = encode(sha256(convert_to(u.salt || a.password, 'UTF8')), 'hex'), false) as login_ok
from (values ('alice', 'secret1'), ('bob', 'wrong'), ('dave', 'secret1'), ('zed', 'secret1')) as a(username, password)
     left join app_user u on u.username = a.username;`,
    },
    {
      id: 'CH9.02', topic: 'PE 9.12 đăng ký, salt', level: 2, pe: '9.12',
      prompt: "Đăng ký user mới: `user_id` 6, username `frank`, role `customer`, salt `Ab12c`, mật khẩu `qwerty` — lưu đúng **hash**, không lưu mật khẩu rõ. Hệ thống kiểm tra đăng nhập đúng/sai cho frank và so sánh hash của alice và dave (cùng mật khẩu `secret1`).",
      solution: `insert into app_user (user_id, username, role, salt, pw_hash)
values (6, 'frank', 'customer', 'Ab12c', encode(sha256(convert_to('Ab12c' || 'qwerty', 'UTF8')), 'hex'));`,
      check: `select
  (select pw_hash = encode(sha256(convert_to(salt || 'qwerty', 'UTF8')), 'hex') from app_user where username = 'frank') as right_pw,
  (select pw_hash = encode(sha256(convert_to(salt || 'qwerty1', 'UTF8')), 'hex') from app_user where username = 'frank') as wrong_pw,
  (select count(*) from app_user where pw_hash like '%qwerty%') as plaintext_rows,
  (select a.pw_hash = d.pw_hash from app_user a, app_user d where a.username = 'alice' and d.username = 'dave') as alice_dave_same_hash;`,
    },
    // ---------------- Never trust the client ----------------
    {
      id: 'CH9.03', topic: 'PE 9.3 phát hiện giá bị sửa', level: 1, pe: '9.3',
      prompt: '`app_cart_submission(submission_id, user_id, product_id, qty, submitted_price)` là dữ liệu form gửi lên (giá lấy từ hidden field). Liệt kê các dòng có giá gửi lên **khác** giá trong `app_product`: submission_id, username, product name, submitted_price, price.',
      solution: `select c.submission_id, u.username, p.name, c.submitted_price, p.price
from app_cart_submission c
     join app_product p on p.product_id = c.product_id
     join app_user u on u.user_id = c.user_id
where c.submitted_price <> p.price;`,
    },
    {
      id: 'CH9.04', topic: 'PE 9.3 tính hoá đơn phía server', level: 2, pe: '9.3',
      prompt: 'Với mỗi submission: `submission_id`, `client_total` (tính theo giá gửi lên) và `server_total` (tính theo giá trong CSDL) — số tiền mà ứng dụng **đúng ra** phải thu.',
      solution: `select c.submission_id,
       sum(c.qty * c.submitted_price) as client_total,
       sum(c.qty * p.price) as server_total
from app_cart_submission c join app_product p on p.product_id = c.product_id
group by c.submission_id;`,
    },
    // ---------------- Authorization ----------------
    {
      id: 'CH9.05', topic: 'PE 9.4 request trái quyền', level: 2, pe: '9.4',
      prompt: 'Servlet đã phục vụ các request trong `app_request(request_id, session_id, page, requested_at)` mà chỉ kiểm tra session. Dựa trên `app_session` → `app_user.role` và `app_page_acl(page, role)`, liệt kê các request mà người dùng **không có quyền** xem trang: request_id, username, role, page.',
      solution: `select r.request_id, u.username, u.role, r.page
from app_request r
     join app_session s on s.session_id = r.session_id
     join app_user u on u.user_id = s.user_id
where not exists (select * from app_page_acl a where a.page = r.page and a.role = u.role);`,
    },
    {
      id: 'CH9.06', topic: 'PE 9.4 hàm kiểm tra quyền', level: 3, pe: '9.4',
      prompt: 'Viết hàm `app_can_access(p_session varchar, p_page varchar, p_at timestamp) returns boolean`: true khi và chỉ khi session tồn tại, **chưa hết hạn** tại p_at (`p_at < expires_at`) **và** role của user được phép xem p_page. Hệ thống gọi hàm cho mọi request trong app_request.',
      solution: `create function app_can_access(p_session varchar, p_page varchar, p_at timestamp) returns boolean as $$
  select exists (
    select *
    from app_session s
         join app_user u on u.user_id = s.user_id
         join app_page_acl a on a.role = u.role
    where s.session_id = p_session and p_at < s.expires_at and a.page = p_page)
$$ language sql;`,
      check: `select request_id, app_can_access(session_id, page, requested_at) as allowed from app_request;`,
    },
    // ---------------- SQL injection ----------------
    {
      id: 'CH9.07', topic: 'PE 9.8 khai thác injection', level: 2, pe: '9.8a',
      prompt: "Hàm có sẵn `app_find_user_unsafe(name text)` ghép thẳng `name` vào câu SQL: `... where username = '` || name || `'`. Đóng vai người kiểm thử: viết một câu `select count(*) as n from app_find_user_unsafe(...)` với một đầu vào khiến hàm trả về **mọi** user (chỉ đổi chuỗi đầu vào).",
      hint: "Đầu vào kết thúc chuỗi bằng dấu nháy rồi thêm `or '1'='1`. Dùng $$...$$ để khỏi phải nhân đôi dấu nháy.",
      solution: `select count(*) as n from app_find_user_unsafe($$x' or '1'='1$$);`,
    },
    {
      id: 'CH9.08', topic: 'PE 9.8 sửa injection', level: 2, pe: '9.8',
      prompt: 'Viết hàm an toàn `app_find_user(name text) returns table (user_id integer, username varchar)` — vẫn dùng PL/pgSQL `return query execute` (dynamic SQL) nhưng **truyền tham số** bằng `using` (hoặc `format(\'%L\')`). Hệ thống gọi với `bob`, với chuỗi tấn công của CH9.07 và với `O\'Brien`.',
      solution: `create function app_find_user(name text)
returns table (user_id integer, username varchar) language plpgsql as $$
begin
  return query execute
    'select user_id, username from app_user where username = $1' using name;
end $$;`,
      check: `select (select count(*) from app_find_user('bob')) as bob,
       (select count(*) from app_find_user($$x' or '1'='1$$)) as attack,
       (select count(*) from app_find_user($$O'Brien$$)) as quote_name;`,
    },
    {
      id: 'CH9.09', topic: 'prepared statement', level: 2, fresh: true,
      prompt: 'Tạo prepared statement `cart_of(integer)` trả về `product_id`, `qty`, `price` (giá trong app_product) của các dòng trong app_cart_submission thuộc user có id là tham số; rồi **execute** nó với user 4. (Chạy trên database mới vì prepared statement không bị rollback.)',
      solution: `prepare cart_of(integer) as
  select c.product_id, c.qty, p.price
  from app_cart_submission c join app_product p on p.product_id = c.product_id
  where c.user_id = $1;
execute cart_of(4);`,
    },
    // ---------------- Pagination, upsert ----------------
    {
      id: 'CH9.10', topic: 'phân trang offset', level: 1, ordered: true,
      prompt: 'Trang danh sách bài viết hiển thị 10 bài/trang, mới nhất trước (`created_at desc`). Trả về `post_id`, `title` của **trang 3** bằng `limit/offset`. (Thứ tự được chấm.)',
      solution: `select post_id, title from app_post order by created_at desc limit 10 offset 20;`,
    },
    {
      id: 'CH9.11', topic: 'phân trang keyset', level: 2, ordered: true,
      prompt: 'Phân trang **keyset**: người dùng đang ở trang 1 và bài cuối cùng họ thấy là `post_id = 16`. Trả về 10 bài kế tiếp (post_id, title) **không dùng offset**, dựa trên created_at của bài 16. (Thứ tự được chấm.)',
      solution: `select post_id, title from app_post
where created_at < (select created_at from app_post where post_id = 16)
order by created_at desc
limit 10;`,
    },
    {
      id: 'CH9.12', topic: 'upsert on conflict', level: 2,
      prompt: 'Mỗi lượt xem trang tăng bộ đếm trong `app_page_view(page primary key, views)`; trang chưa có thì tạo với views = 1. Viết **một** câu `insert ... on conflict` ghi nhận một lượt xem cho mỗi trang `/shop`, `/admin`, `/orders`. Hệ thống đọc lại bảng.',
      solution: `insert into app_page_view (page, views)
values ('/shop', 1), ('/admin', 1), ('/orders', 1)
on conflict (page) do update set views = app_page_view.views + 1;`,
      check: `select page, views from app_page_view;`,
    },
    // ---------------- Transactions, security in the DB ----------------
    {
      id: 'CH9.13', topic: 'giao dịch nguyên tử cho một request', level: 3,
      prompt: 'Viết hàm `app_transfer(p_from integer, p_to integer, p_amount numeric) returns void` trừ tiền ví p_from và cộng ví p_to trong `app_wallet` (balance có `check (balance >= 0)`). Vì cả hàm chạy như một đơn vị, nếu trừ tiền vi phạm check thì cộng tiền cũng không được giữ lại. Hệ thống thử chuyển 50 từ user 2 sang 1 (không đủ tiền) và 40 từ user 4 sang 3, rồi đọc mọi ví.',
      hint: 'Thứ tự hai lệnh update quan trọng: cộng trước rồi trừ sau thì lệnh trừ lỗi cũng huỷ lệnh cộng — vì lỗi huỷ cả lời gọi hàm.',
      solution: `create function app_transfer(p_from integer, p_to integer, p_amount numeric) returns void as $$
  update app_wallet set balance = balance + p_amount where user_id = p_to;
  update app_wallet set balance = balance - p_amount where user_id = p_from;
$$ language sql;`,
      check: `select try_sql('select app_transfer(2, 1, 50)') as t1, try_sql('select app_transfer(4, 3, 40)') as t2,
       sql_value('select string_agg(user_id || ''='' || balance, '', '' order by user_id) from app_wallet') as wallets;`,
    },
    {
      id: 'CH9.14', topic: 'row-level security', level: 3,
      prompt: 'Web app dùng chung bảng `app_note(note_id, owner, body)`. Bật **row-level security** cho app_note với policy: mỗi người chỉ thấy dòng có `owner = current_user`. Tạo role `alice` và `bob`, cấp quyền select trên app_note cho cả hai. Hệ thống `set role bob` rồi đọc app_note.',
      solution: `alter table app_note enable row level security;
create policy app_note_owner on app_note using (owner = current_user);
create role alice;
create role bob;
grant select on app_note to alice, bob;`,
      check: `set role bob;
select note_id, body from app_note;`,
    },
    {
      id: 'CH9.15', topic: 'PE 9.6 cache bằng materialized view', level: 2, pe: '9.6',
      prompt: 'Cache danh mục sản phẩm: tạo materialized view `app_product_cache(product_id, name, price)` từ app_product. Hệ thống đổi giá Keyboard (101) thành 50, đọc giá trong cache, refresh, rồi đọc lại.',
      solution: `create materialized view app_product_cache as
select product_id, name, price from app_product;`,
      check: `update app_product set price = 50 where product_id = 101;
select sql_value('select price from app_product_cache where product_id = 101') as cached_before,
       try_sql('refresh materialized view app_product_cache') as refresh,
       sql_value('select price from app_product_cache where product_id = 101') as cached_after;`,
    },
    {
      id: 'CH9.16', topic: 'PE 9.6 chọn truy vấn để cache', level: 1, pe: '9.6',
      prompt: '`app_query_log(log_id, query_text, ms)` ghi lại các truy vấn ứng dụng đã chạy. Truy vấn nào đáng cache? Trả về `query_text`, `runs` (số lần chạy) và `total_ms` cho các truy vấn chạy **ít nhất 3 lần**.',
      solution: `select query_text, count(*) as runs, sum(ms) as total_ms
from app_query_log
group by query_text
having count(*) >= 3;`,
    },
    {
      id: 'CH9.17', topic: 'PE 9.7 netstat, window lag', level: 3, pe: '9.7',
      prompt: '`app_netstat(page, sample_no, open_conns)`: số kết nối CSDL đang mở sau mỗi lô truy cập một trang (có connection pool). Trang bị **rò rỉ kết nối** nếu số kết nối vẫn **tăng ngặt** ở **mọi** lần đo từ lần 4 trở đi (so với lần đo liền trước). Trả về page và `last_conns` (số kết nối ở lần đo cuối) của các trang rò rỉ.',
      hint: 'lag(open_conns) over (partition by page order by sample_no)',
      solution: `with d as (
  select page, sample_no, open_conns,
         open_conns - lag(open_conns) over (partition by page order by sample_no) as delta
  from app_netstat
)
select page, max(open_conns) filter (where sample_no = (select max(sample_no) from app_netstat n where n.page = d.page)) as last_conns
from d
group by page
having bool_and(delta > 0) filter (where sample_no >= 4);`,
    },
    {
      id: 'CH9.18', topic: 'PE 9.11 chuỗi chứng chỉ, recursive', level: 3, pe: '9.11',
      prompt: '`app_cert(cert_id, subject, issued_by)`: chứng chỉ và chứng chỉ của bên đã ký nó. Giả sử chứng chỉ `C1` (IntermediateCA) bị cấp cho kẻ mạo danh. Liệt kê mọi chứng chỉ **không còn đáng tin**: C1 và mọi chứng chỉ nằm dưới nó trong chuỗi (cert_id, subject, `depth` — C1 có depth 0).',
      solution: `with recursive affected(cert_id, subject, depth) as (
  select cert_id, subject, 0 from app_cert where cert_id = 'C1'
  union all
  select c.cert_id, c.subject, a.depth + 1
  from app_cert c join affected a on c.issued_by = a.cert_id
)
select cert_id, subject, depth from affected;`,
    },
    {
      id: 'CH9.19', topic: 'PE 9.9 băm tất định vs có salt', level: 2, pe: '9.9',
      prompt: '`app_card` lưu số thẻ dưới hai dạng: `det_hash` (băm tất định: cùng số thẻ → cùng giá trị) và `salted_hash` (băm kèm salt riêng mỗi dòng). Tìm các cặp thẻ (card_id1 < card_id2) **trùng số thẻ** bằng det_hash, và cho biết `salted_equal` — salted_hash của hai thẻ có bằng nhau không.',
      solution: `select a.card_id as card_id1, b.card_id as card_id2, a.salted_hash = b.salted_hash as salted_equal
from app_card a join app_card b on a.det_hash = b.det_hash and a.card_id < b.card_id;`,
    },
    {
      id: 'CH9.20', topic: 'view + grant cho role ứng dụng', level: 2,
      prompt: 'Phần lớn ứng dụng không được thấy salt và hash mật khẩu. Tạo view `app_public_user(user_id, username, role)` từ app_user, role `app_web`, và chỉ cấp **select trên view** cho app_web. Hệ thống `set role app_web`, đếm dòng qua view và thử đọc app_user.',
      solution: `create view app_public_user as select user_id, username, role from app_user;
create role app_web;
grant select on app_public_user to app_web;`,
      check: `set role app_web;
select (select count(*) from app_public_user) as visible_users,
       try_sql('select * from app_user') as read_app_user;`,
    },
  ],
};
