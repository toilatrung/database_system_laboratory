export default {
  number: 1,
  slug: 'ch1_introduction',
  title: 'Introduction',
  titleVi: 'Giới thiệu về hệ cơ sở dữ liệu',

  summary: `
### 1. Vì sao cần DBMS thay vì file system?
Các vấn đề khi lưu dữ liệu trực tiếp trên file:

| Vấn đề | Ý nghĩa | Ví dụ |
|---|---|---|
| Data redundancy & inconsistency | Cùng dữ liệu lưu ở nhiều file, sửa chỗ này quên chỗ kia | Địa chỉ sinh viên ở cả file Đào tạo và file Học phí |
| Difficulty in accessing data | Mỗi yêu cầu mới phải viết chương trình mới | "Liệt kê SV có > 60 tín chỉ" |
| Data isolation | Dữ liệu nằm rải rác nhiều file, nhiều định dạng | CSV, Excel, text… |
| Integrity problems | Ràng buộc bị "chôn" trong code, khó thêm/sửa | \`balance > 0\` viết trong 10 chương trình |
| Atomicity of updates | Lỗi giữa chừng để lại trạng thái dở dang | Chuyển tiền: đã trừ A nhưng chưa cộng B |
| Concurrent access anomalies | Nhiều người cùng cập nhật gây sai lệch | Hai người cùng rút 50 từ tài khoản 100 |
| Security problems | Khó cấp quyền cho một phần dữ liệu | Nhân viên chỉ được xem lương phòng mình |

### 2. Data models
Tập công cụ mô tả **data, relationships, semantics, constraints**:
- **Relational model** (Ted Codd, Turing Award 1981) — dữ liệu ở dạng bảng.
- **Entity-Relationship (E-R)** — chủ yếu dùng để thiết kế.
- **Object-based** (object-oriented, object-relational), **Semi-structured** (XML, JSON).
- Mô hình cũ: **Network**, **Hierarchical**.

### 3. Schema vs Instance — Data independence
- **Schema** ~ kiểu của biến (cấu trúc, ít thay đổi). Gồm *logical schema* và *physical schema*.
- **Instance** ~ giá trị của biến (nội dung tại một thời điểm).
- **Physical data independence**: sửa physical schema mà không phải sửa logical schema (ứng dụng chỉ phụ thuộc logical schema).
- Ba mức trừu tượng: **physical level → logical level → view level**.

### 4. Ngôn ngữ
- **DDL** (Data Definition Language): định nghĩa schema — \`create table\`… DDL compiler ghi metadata vào **data dictionary** (schema, integrity constraints, authorization).
- **DML** (Data Manipulation Language / query language): truy vấn & cập nhật.
  - *Procedural DML*: chỉ ra cần dữ liệu gì **và cách lấy**.
  - *Declarative (non-procedural) DML*: chỉ ra cần dữ liệu gì — ví dụ SQL.
  - Ngôn ngữ "pure": relational algebra, tuple relational calculus, domain relational calculus.
- SQL **không** Turing-complete → nhúng vào host language (C/Java/Python) qua **embedded SQL** hoặc **API (ODBC/JDBC)**.

### 5. Database design
- **Logical design**: chọn các relation schema "tốt" (quyết định nghiệp vụ + quyết định khoa học máy tính).
- **Physical design**: bố trí lưu trữ vật lý.

### 6. Database engine
- **Storage manager**: authorization & integrity manager, transaction manager, file manager, buffer manager. Quản lý *data files, data dictionary, indices*.
- **Query processor**: DDL interpreter, DML compiler (có **query optimization** — chọn evaluation plan chi phí thấp nhất), query evaluation engine. Các bước: *parsing & translation → optimization → evaluation*.
- **Transaction management**: đảm bảo CSDL nhất quán dù hệ thống/giao dịch lỗi; **concurrency-control manager** điều phối các transaction đồng thời.

### 7. Kiến trúc & người dùng
- Kiến trúc: centralized, client-server, parallel (shared memory / shared disk / shared nothing), distributed.
- Ứng dụng **two-tier** (client gọi DB trực tiếp) vs **three-tier** (client → application server → DB).
- Người dùng: **naive users**, **application programmers**, **sophisticated users**, **specialized users**.
- **DBA**: định nghĩa schema, cấu trúc lưu trữ & access method, sửa schema/tổ chức vật lý, cấp quyền, bảo trì (backup, dung lượng, giám sát hiệu năng).

### 8. Lịch sử (mốc chính)
1950s–60s: băng từ, thẻ đục lỗ → late 60s–70s: đĩa cứng, network/hierarchical; Codd đề xuất relational model; System R (IBM), Ingres (Berkeley), Oracle → 1980s: SQL thành chuẩn, parallel/distributed, OODB → 1990s: data warehouse, data mining, web → 2000s: big data, NoSQL, MapReduce → 2010s: "SQL reloaded", main-memory DB.
`,

  quiz: [
    {
      q: 'Hai người cùng đọc số dư 100 rồi mỗi người rút 50 cùng lúc, cuối cùng số dư còn 50. Đây là vấn đề nào của file system?',
      options: ['Data isolation', 'Concurrent access anomalies', 'Atomicity of updates', 'Data redundancy'],
      answer: 1,
      explain: 'Truy cập đồng thời không được kiểm soát → lost update. DBMS giải quyết bằng concurrency-control manager.',
    },
    {
      q: 'Chuyển tiền: hệ thống mất điện sau khi đã trừ tài khoản A nhưng chưa cộng vào B. Đây là vấn đề gì?',
      options: ['Atomicity of updates', 'Security problems', 'Integrity problems', 'Difficulty in accessing data'],
      answer: 0,
      explain: 'Atomicity: cập nhật phải xảy ra trọn vẹn hoặc không xảy ra.',
    },
    {
      q: 'Ràng buộc "balance > 0" được viết rải rác trong code của nhiều chương trình. Đây là vấn đề gì?',
      options: ['Data isolation', 'Integrity problems', 'Concurrent access', 'Redundancy'],
      answer: 1,
      explain: 'Integrity constraints bị "buried" trong program code thay vì khai báo tường minh.',
    },
    {
      q: 'Schema tương tự với khái niệm nào trong ngôn ngữ lập trình?',
      options: ['Giá trị của biến', 'Kiểu (type) của biến', 'Một hàm', 'Một vòng lặp'],
      answer: 1,
      explain: 'Schema ~ type; instance ~ value của biến tại một thời điểm.',
    },
    {
      q: 'Physical data independence là gì?',
      options: [
        'Có thể sửa logical schema mà không cần sửa ứng dụng',
        'Có thể sửa physical schema mà không cần sửa logical schema',
        'Dữ liệu được lưu độc lập trên nhiều máy',
        'Mỗi bảng được lưu thành một file riêng',
      ],
      answer: 1,
      explain: 'Ứng dụng chỉ phụ thuộc logical schema, nên thay đổi cách lưu vật lý (index, file…) không ảnh hưởng ứng dụng.',
    },
    {
      q: 'Data dictionary chứa gì?',
      options: ['Dữ liệu người dùng', 'Metadata: schema, integrity constraints, authorization', 'Log của transaction', 'Kết quả truy vấn được cache'],
      answer: 1,
      explain: 'Data dictionary = "data about data".',
    },
    {
      q: 'SQL thuộc loại DML nào?',
      options: ['Procedural', 'Declarative (non-procedural)', 'Hierarchical', 'Object-oriented'],
      answer: 1,
      explain: 'SQL chỉ mô tả CẦN dữ liệu gì, không mô tả CÁCH lấy.',
    },
    {
      q: 'Thành phần nào chọn evaluation plan có chi phí thấp nhất?',
      options: ['DDL interpreter', 'Buffer manager', 'DML compiler (query optimizer)', 'File manager'],
      answer: 2,
      explain: 'DML compiler dịch câu truy vấn thành evaluation plan và thực hiện query optimization.',
    },
    {
      q: 'Buffer manager thuộc thành phần nào của database engine?',
      options: ['Query processor', 'Storage manager', 'Transaction manager', 'Application server'],
      answer: 1,
      explain: 'Storage manager gồm: authorization & integrity manager, transaction manager, file manager, buffer manager.',
    },
    {
      q: 'Trong kiến trúc three-tier, client giao tiếp trực tiếp với ai?',
      options: ['Database server', 'Application server', 'Data dictionary', 'Storage manager'],
      answer: 1,
      explain: 'Client không chứa lệnh gọi DB trực tiếp; application server mới làm việc với DB.',
    },
    {
      q: 'Nhân viên ngân hàng dùng một form có sẵn để rút tiền cho khách thuộc loại người dùng nào?',
      options: ['Naive user', 'Application programmer', 'Sophisticated user', 'Specialized user'],
      answer: 0,
      explain: 'Naive users dùng các ứng dụng đã được viết sẵn.',
    },
    {
      q: 'Nhà phân tích viết trực tiếp câu SQL để làm báo cáo thuộc loại người dùng nào?',
      options: ['Naive user', 'Application programmer', 'Sophisticated user', 'DBA'],
      answer: 2,
      explain: 'Sophisticated users tương tác bằng query language hoặc công cụ phân tích, không viết chương trình.',
    },
    {
      q: 'Việc nào KHÔNG phải nhiệm vụ của DBA?',
      options: ['Schema definition', 'Granting authorization', 'Periodically backing up', 'Viết giao diện web cho khách hàng'],
      answer: 3,
      explain: 'Viết ứng dụng là việc của application programmer.',
    },
    {
      q: 'Ai đề xuất relational model?',
      options: ['Michael Stonebraker', 'Ted Codd', 'Jim Gray', 'Peter Chen'],
      answer: 1,
      explain: 'Ted Codd (IBM), nhận Turing Award năm 1981. Stonebraker làm Ingres; Peter Chen đề xuất E-R model.',
    },
    {
      q: 'Kiến trúc parallel nào mà mỗi node có CPU, RAM và đĩa riêng?',
      options: ['Shared memory', 'Shared disk', 'Shared nothing', 'Centralized'],
      answer: 2,
      explain: 'Shared nothing: các node chỉ giao tiếp qua mạng.',
    },
  ],

  questions: [
    {
      q: 'Liệt kê 7 nhược điểm của việc dùng file system để quản lý dữ liệu, mỗi nhược điểm cho một ví dụ trong hệ thống quản lý đại học.',
      answer: `1. **Redundancy & inconsistency** — tên khoa của sinh viên lưu ở file đăng ký môn và file học phí, đổi tên khoa chỉ sửa một file.
2. **Difficulty in accessing data** — muốn "danh sách SV khoa CS có > 100 tín chỉ" phải viết chương trình mới.
3. **Data isolation** — dữ liệu điểm ở Excel, dữ liệu học phí ở CSV.
4. **Integrity problems** — "tot_cred >= 0" kiểm tra trong từng chương trình.
5. **Atomicity** — đăng ký môn: đã ghi vào file lớp nhưng chưa ghi vào file sinh viên thì máy sập.
6. **Concurrent access** — hai SV cùng đăng ký chỗ cuối cùng của một lớp.
7. **Security** — giảng viên chỉ được xem điểm lớp mình dạy.`,
    },
    {
      q: 'Phân biệt schema và instance. Cho ví dụ với bảng instructor.',
      answer: `- **Schema**: \`instructor(ID, name, dept_name, salary)\` — cấu trúc, gần như không đổi.
- **Instance**: tập các dòng hiện có, ví dụ \`(10101, Srinivasan, Comp. Sci., 65000)\`… — thay đổi mỗi khi insert/update/delete.`,
    },
    {
      q: 'Phân biệt procedural DML và declarative DML. Relational algebra thuộc loại nào? SQL thuộc loại nào?',
      answer: `Procedural: người dùng chỉ ra dữ liệu cần **và cách lấy**. Declarative: chỉ ra dữ liệu cần.
Relational algebra mang tính **procedural** (biểu thức chỉ rõ thứ tự phép toán), còn tuple/domain relational calculus và SQL là **declarative**.`,
    },
    {
      q: 'Vì sao SQL thường được nhúng trong một host language? Hai cách nào để ứng dụng truy cập CSDL?',
      answer: `SQL không Turing-complete và không làm được nhập/xuất với người dùng, hiển thị, giao tiếp mạng.
Hai cách: (1) **embedded SQL** (language extension, tiền xử lý \`EXEC SQL\`), (2) **API** như ODBC/JDBC gửi câu SQL tới server.`,
    },
    {
      q: 'Vẽ (mô tả) luồng xử lý một câu truy vấn trong query processor.',
      answer: `Query → **parser & translator** → relational-algebra expression → **optimizer** (dùng statistics về dữ liệu) → execution plan → **evaluation engine** (đọc dữ liệu) → query output.`,
    },
    {
      q: 'So sánh kiến trúc two-tier và three-tier. Ứng dụng web ngày nay thường dùng kiến trúc nào? Vì sao?',
      answer: `Two-tier: ứng dụng ở client gọi trực tiếp DB server (qua ODBC/JDBC).
Three-tier: client (browser) → application server (business logic) → DB.
Web dùng **three-tier**: bảo mật tốt hơn (client không có quyền DB trực tiếp), dễ mở rộng, business logic tập trung một chỗ.`,
    },
  ],

  exercises: [
    {
      id: '1.01',
      topic: 'warm-up',
      level: 1,
      prompt: 'Câu truy vấn đầu tiên trong slide: tìm **name** của tất cả instructor thuộc khoa `Comp. Sci.`',
      hint: 'select ... from instructor where dept_name = ...',
      solution: `select name
from instructor
where dept_name = 'Comp. Sci.';`,
    },
    {
      id: '1.02',
      topic: 'warm-up',
      level: 1,
      prompt: 'Xem toàn bộ **instance** hiện tại của bảng `department` (mọi cột, mọi dòng).',
      hint: 'Dấu * nghĩa là "all attributes".',
      solution: `select * from department;`,
    },
    {
      id: '1.03',
      topic: 'data dictionary',
      level: 2,
      prompt: 'Data dictionary lưu metadata. Trong PostgreSQL có thể đọc nó qua `information_schema`. Liệt kê **column_name** và **data_type** của bảng `instructor`, theo đúng thứ tự cột (`ordinal_position`).',
      hint: 'Bảng information_schema.columns, lọc table_name = \'instructor\'.',
      solution: `select column_name, data_type
from information_schema.columns
where table_name = 'instructor'
order by ordinal_position;`,
      ordered: true,
    },
  ],
};
