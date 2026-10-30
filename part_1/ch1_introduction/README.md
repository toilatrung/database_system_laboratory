# Chương 1 — Giới thiệu về hệ cơ sở dữ liệu

*Introduction · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch1`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 1. Vì sao cần DBMS thay vì file system?
Các vấn đề khi lưu dữ liệu trực tiếp trên file:

| Vấn đề | Ý nghĩa | Ví dụ |
|---|---|---|
| Data redundancy & inconsistency | Cùng dữ liệu lưu ở nhiều file, sửa chỗ này quên chỗ kia | Địa chỉ sinh viên ở cả file Đào tạo và file Học phí |
| Difficulty in accessing data | Mỗi yêu cầu mới phải viết chương trình mới | "Liệt kê SV có > 60 tín chỉ" |
| Data isolation | Dữ liệu nằm rải rác nhiều file, nhiều định dạng | CSV, Excel, text… |
| Integrity problems | Ràng buộc bị "chôn" trong code, khó thêm/sửa | `balance > 0` viết trong 10 chương trình |
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
- **DDL** (Data Definition Language): định nghĩa schema — `create table`… DDL compiler ghi metadata vào **data dictionary** (schema, integrity constraints, authorization).
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

## 2. Trắc nghiệm (15 câu)

**Câu 1.** Hai người cùng đọc số dư 100 rồi mỗi người rút 50 cùng lúc, cuối cùng số dư còn 50. Đây là vấn đề nào của file system?

- A. Data isolation
- B. Concurrent access anomalies
- C. Atomicity of updates
- D. Data redundancy

<details><summary>Đáp án</summary>

**B** — Truy cập đồng thời không được kiểm soát → lost update. DBMS giải quyết bằng concurrency-control manager.

</details>

**Câu 2.** Chuyển tiền: hệ thống mất điện sau khi đã trừ tài khoản A nhưng chưa cộng vào B. Đây là vấn đề gì?

- A. Atomicity of updates
- B. Security problems
- C. Integrity problems
- D. Difficulty in accessing data

<details><summary>Đáp án</summary>

**A** — Atomicity: cập nhật phải xảy ra trọn vẹn hoặc không xảy ra.

</details>

**Câu 3.** Ràng buộc "balance > 0" được viết rải rác trong code của nhiều chương trình. Đây là vấn đề gì?

- A. Data isolation
- B. Integrity problems
- C. Concurrent access
- D. Redundancy

<details><summary>Đáp án</summary>

**B** — Integrity constraints bị "buried" trong program code thay vì khai báo tường minh.

</details>

**Câu 4.** Schema tương tự với khái niệm nào trong ngôn ngữ lập trình?

- A. Giá trị của biến
- B. Kiểu (type) của biến
- C. Một hàm
- D. Một vòng lặp

<details><summary>Đáp án</summary>

**B** — Schema ~ type; instance ~ value của biến tại một thời điểm.

</details>

**Câu 5.** Physical data independence là gì?

- A. Có thể sửa logical schema mà không cần sửa ứng dụng
- B. Có thể sửa physical schema mà không cần sửa logical schema
- C. Dữ liệu được lưu độc lập trên nhiều máy
- D. Mỗi bảng được lưu thành một file riêng

<details><summary>Đáp án</summary>

**B** — Ứng dụng chỉ phụ thuộc logical schema, nên thay đổi cách lưu vật lý (index, file…) không ảnh hưởng ứng dụng.

</details>

**Câu 6.** Data dictionary chứa gì?

- A. Dữ liệu người dùng
- B. Metadata: schema, integrity constraints, authorization
- C. Log của transaction
- D. Kết quả truy vấn được cache

<details><summary>Đáp án</summary>

**B** — Data dictionary = "data about data".

</details>

**Câu 7.** SQL thuộc loại DML nào?

- A. Procedural
- B. Declarative (non-procedural)
- C. Hierarchical
- D. Object-oriented

<details><summary>Đáp án</summary>

**B** — SQL chỉ mô tả CẦN dữ liệu gì, không mô tả CÁCH lấy.

</details>

**Câu 8.** Thành phần nào chọn evaluation plan có chi phí thấp nhất?

- A. DDL interpreter
- B. Buffer manager
- C. DML compiler (query optimizer)
- D. File manager

<details><summary>Đáp án</summary>

**C** — DML compiler dịch câu truy vấn thành evaluation plan và thực hiện query optimization.

</details>

**Câu 9.** Buffer manager thuộc thành phần nào của database engine?

- A. Query processor
- B. Storage manager
- C. Transaction manager
- D. Application server

<details><summary>Đáp án</summary>

**B** — Storage manager gồm: authorization & integrity manager, transaction manager, file manager, buffer manager.

</details>

**Câu 10.** Trong kiến trúc three-tier, client giao tiếp trực tiếp với ai?

- A. Database server
- B. Application server
- C. Data dictionary
- D. Storage manager

<details><summary>Đáp án</summary>

**B** — Client không chứa lệnh gọi DB trực tiếp; application server mới làm việc với DB.

</details>

**Câu 11.** Nhân viên ngân hàng dùng một form có sẵn để rút tiền cho khách thuộc loại người dùng nào?

- A. Naive user
- B. Application programmer
- C. Sophisticated user
- D. Specialized user

<details><summary>Đáp án</summary>

**A** — Naive users dùng các ứng dụng đã được viết sẵn.

</details>

**Câu 12.** Nhà phân tích viết trực tiếp câu SQL để làm báo cáo thuộc loại người dùng nào?

- A. Naive user
- B. Application programmer
- C. Sophisticated user
- D. DBA

<details><summary>Đáp án</summary>

**C** — Sophisticated users tương tác bằng query language hoặc công cụ phân tích, không viết chương trình.

</details>

**Câu 13.** Việc nào KHÔNG phải nhiệm vụ của DBA?

- A. Schema definition
- B. Granting authorization
- C. Periodically backing up
- D. Viết giao diện web cho khách hàng

<details><summary>Đáp án</summary>

**D** — Viết ứng dụng là việc của application programmer.

</details>

**Câu 14.** Ai đề xuất relational model?

- A. Michael Stonebraker
- B. Ted Codd
- C. Jim Gray
- D. Peter Chen

<details><summary>Đáp án</summary>

**B** — Ted Codd (IBM), nhận Turing Award năm 1981. Stonebraker làm Ingres; Peter Chen đề xuất E-R model.

</details>

**Câu 15.** Kiến trúc parallel nào mà mỗi node có CPU, RAM và đĩa riêng?

- A. Shared memory
- B. Shared disk
- C. Shared nothing
- D. Centralized

<details><summary>Đáp án</summary>

**C** — Shared nothing: các node chỉ giao tiếp qua mạng.

</details>

## 3. Câu hỏi tự luận (6 câu)

**Câu 1.** Liệt kê 7 nhược điểm của việc dùng file system để quản lý dữ liệu, mỗi nhược điểm cho một ví dụ trong hệ thống quản lý đại học.

<details><summary>Gợi ý đáp án</summary>

1. **Redundancy & inconsistency** — tên khoa của sinh viên lưu ở file đăng ký môn và file học phí, đổi tên khoa chỉ sửa một file.
2. **Difficulty in accessing data** — muốn "danh sách SV khoa CS có > 100 tín chỉ" phải viết chương trình mới.
3. **Data isolation** — dữ liệu điểm ở Excel, dữ liệu học phí ở CSV.
4. **Integrity problems** — "tot_cred >= 0" kiểm tra trong từng chương trình.
5. **Atomicity** — đăng ký môn: đã ghi vào file lớp nhưng chưa ghi vào file sinh viên thì máy sập.
6. **Concurrent access** — hai SV cùng đăng ký chỗ cuối cùng của một lớp.
7. **Security** — giảng viên chỉ được xem điểm lớp mình dạy.

</details>

**Câu 2.** Phân biệt schema và instance. Cho ví dụ với bảng instructor.

<details><summary>Gợi ý đáp án</summary>

- **Schema**: `instructor(ID, name, dept_name, salary)` — cấu trúc, gần như không đổi.
- **Instance**: tập các dòng hiện có, ví dụ `(10101, Srinivasan, Comp. Sci., 65000)`… — thay đổi mỗi khi insert/update/delete.

</details>

**Câu 3.** Phân biệt procedural DML và declarative DML. Relational algebra thuộc loại nào? SQL thuộc loại nào?

<details><summary>Gợi ý đáp án</summary>

Procedural: người dùng chỉ ra dữ liệu cần **và cách lấy**. Declarative: chỉ ra dữ liệu cần.
Relational algebra mang tính **procedural** (biểu thức chỉ rõ thứ tự phép toán), còn tuple/domain relational calculus và SQL là **declarative**.

</details>

**Câu 4.** Vì sao SQL thường được nhúng trong một host language? Hai cách nào để ứng dụng truy cập CSDL?

<details><summary>Gợi ý đáp án</summary>

SQL không Turing-complete và không làm được nhập/xuất với người dùng, hiển thị, giao tiếp mạng.
Hai cách: (1) **embedded SQL** (language extension, tiền xử lý `EXEC SQL`), (2) **API** như ODBC/JDBC gửi câu SQL tới server.

</details>

**Câu 5.** Vẽ (mô tả) luồng xử lý một câu truy vấn trong query processor.

<details><summary>Gợi ý đáp án</summary>

Query → **parser & translator** → relational-algebra expression → **optimizer** (dùng statistics về dữ liệu) → execution plan → **evaluation engine** (đọc dữ liệu) → query output.

</details>

**Câu 6.** So sánh kiến trúc two-tier và three-tier. Ứng dụng web ngày nay thường dùng kiến trúc nào? Vì sao?

<details><summary>Gợi ý đáp án</summary>

Two-tier: ứng dụng ở client gọi trực tiếp DB server (qua ODBC/JDBC).
Three-tier: client (browser) → application server (business logic) → DB.
Web dùng **three-tier**: bảo mật tốt hơn (client không có quyền DB trực tiếp), dễ mở rộng, business logic tập trung một chỗ.

</details>

## 4. Bài tập SQL (3 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| 1.01 | warm-up | ★☆☆ | Câu truy vấn đầu tiên trong slide: tìm name của tất cả instructor thuộc khoa `Comp. Sci.` |
| 1.02 | warm-up | ★☆☆ | Xem toàn bộ instance hiện tại của bảng `department` (mọi cột, mọi dòng). |
| 1.03 | data dictionary | ★★☆ | Data dictionary lưu metadata. Trong PostgreSQL có thể đọc nó qua `information_schema`. Liệt kê column_name và data_type của bảng `instructor`, theo đúng thứ tự cột (`ordinal_position`). |
