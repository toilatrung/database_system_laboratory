# Chương 25 — Phát triển ứng dụng nâng cao

*Advanced Application Development · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch25`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 0. Nội dung chương
Ba chủ đề lớn khi đưa một ứng dụng CSDL vào vận hành: **tuning hiệu năng**, **benchmark** để đo và so sánh, và **chuẩn hoá** (standardization) để các hệ thống làm việc được với nhau. Thêm vào đó: **kiểm thử** ứng dụng, **chuyển đổi** (migration) ứng dụng cũ, và **directory system** (LDAP).

### 1. Tuning hiệu năng
- **Tìm bottleneck**: một hệ thống là mạng các *hàng đợi* (CPU, đĩa, lock, mạng…). Thời gian chủ yếu dồn vào vài thành phần; cải thiện thành phần không phải bottleneck gần như không có tác dụng. Hàng đợi với tỉ lệ sử dụng ρ có độ dài trung bình ≈ ρ/(1 − ρ) → giữ ρ dưới ~70%.
- Công cụ: `EXPLAIN` / `EXPLAIN ANALYZE`, thống kê truy vấn (pg_stat_statements), buffer hit ratio, chờ lock (pg_locks), tiện ích hệ điều hành (top, iostat, netstat) — PE 25.1.
- **Các mức tuning**:
  1. *Phần cứng*: thêm RAM (giảm I/O), SSD, thêm CPU. Quy tắc 5 phút: trang được truy cập thường hơn khoảng mỗi 5 phút (đĩa từ) thì nên giữ trong bộ nhớ; với SSD con số này khác.
  2. *Tham số hệ thống*: kích thước buffer, số tiến trình, checkpoint, mức log.
  3. *Lược đồ, index, view*: thêm/bỏ index theo **workload** (truy vấn nào chạy nhiều, chọn ít dòng mà phải quét cả bảng → thiếu index); clustered index; **materialized view** cho truy vấn tổng hợp lặp lại (đánh đổi chi phí cập nhật). Công cụ *tuning wizard* đề xuất index/view từ workload.
  4. *Transaction*: dùng thao tác **theo lô** (set-oriented) thay vì từng dòng, giảm số lần gọi qua mạng; stored procedure; tách transaction dài; tránh lock **hot spot** (ví dụ sequence counter — dùng sequence không theo 2PL, PE 25.2); dùng snapshot isolation cho truy vấn chỉ đọc dài.
- **Bulk load**: chèn rất nhiều bản ghi → bỏ index rồi tạo lại (bottom-up build rẻ hơn chèn từng khoá), hoặc dùng bulk-load sắp xếp rồi merge vào lá B<sup>+</sup>-tree (PE 25.4). Index tối ưu ghi (LSM) ít cần mẹo này.
- **Performance simulation**: mô hình hoá hàng đợi để dự đoán hiệu năng trước khi mua phần cứng.

### 2. Benchmark
- Đo **throughput** (giao dịch/giây) và **response time**. Với nhiều loại giao dịch có tốc độ khác nhau, throughput trung bình là **trung bình điều hoà có trọng số** theo tỉ lệ (mix), *không* phải trung bình cộng: T = 1 / Σ(p<sub>i</sub>/t<sub>i</sub>) (PE 25.6).
- **TPC** (Transaction Processing Performance Council):
  - **TPC-C**: OLTP (đơn hàng, kho) — đo tpmC và **giá/hiệu năng** ($/tpmC).
  - **TPC-E**: OLTP môi trường môi giới chứng khoán, thay thế dần TPC-C.
  - **TPC-H**: truy vấn ad hoc kiểu decision support (QphH); **TPC-DS**: data warehouse hiện đại.
  - Quy định: phải công bố toàn bộ cấu hình và **chi phí** hệ thống (kể cả bảo trì), kiểm toán độc lập, đáp ứng ACID.
- Các benchmark khác: YCSB cho key-value store, benchmark cho hệ thống phân tích.

### 3. Chuẩn hoá (standardization)
- **Anticipatory standard** (đi trước sản phẩm, định hướng ngành) vs **reactionary standard** (chuẩn hoá cái đã có trên thị trường) — PE 25.8.
- SQL: SQL-86/89, SQL-92, SQL:1999 (đệ quy, trigger, object-relational), SQL:2003 (XML, window), SQL:2006/2008/2011 (temporal), SQL:2016 (JSON)… Chuẩn chia thành nhiều phần (Framework, Foundation, CLI, PSM, MED, OLB…).
- Kết nối CSDL: **ODBC**, **JDBC**, ADO.NET, Python DB-API. Chuẩn dữ liệu: XML, JSON; chuẩn object: ODMG (cũ), JDO, JPA.

### 4. Directory system (LDAP)
- Thư mục = CSDL tối ưu cho **đọc nhiều, ghi ít**, dữ liệu dạng **cây phân cấp** (người, máy, dịch vụ).
- **LDAP**: mỗi entry có **distinguished name (DN)** gồm các RDN từ lá lên gốc, ví dụ `cn=Lan, ou=Sales, o=Acme, c=VN`; entry có các thuộc tính (một số đa trị) thuộc object class.
- Truy vấn: base DN + scope (base / one level / subtree) + filter.
- **Phân tán**: mỗi tổ chức quản lý một cây con (*directory information tree*, DIT); **referral** trỏ sang server khác. Referral cũng cho phép **nhiều cây phân cấp** (theo địa lý, theo phòng ban) trỏ tới cùng dữ liệu gốc mà không cần chép (PE 25.9).

### 5. Kiểm thử ứng dụng
- **Regression test**: lưu kết quả mong đợi, sau mỗi thay đổi chạy lại và so sánh (except hai chiều).
- Dữ liệu test cần bắt được lỗi: ví dụ dùng nhầm `natural join` thay cho `natural left outer join` chỉ lộ ra khi có tuple ở r **không khớp** s (PE 25.7); test cả giá trị null và tuple ở bảng được tham chiếu không có tuple tham chiếu (PE 4.5).
- **Mutation testing**: thay đổi nhỏ câu truy vấn (đổi join, đổi toán tử) và kiểm tra bộ test có phát hiện được không.
- **Load test**: kiểm tra hiệu năng dưới tải thật trước khi triển khai.

### 6. Chuyển đổi ứng dụng (migration)
- Ứng dụng cũ (legacy) thường thiếu tài liệu; **reverse engineering** để dựng lại mô hình dữ liệu (E-R).
- Chuyển dần: chạy song song hệ cũ và mới, đồng bộ dữ liệu, dùng *wrapper* cho phép ứng dụng mới truy cập hệ cũ; chuyển "big bang" rủi ro cao.

## 2. Trắc nghiệm (9 câu)

**Câu 1.** Hệ thống có CPU 95% còn đĩa 20%. Thêm đĩa nhanh hơn sẽ:

- A. Tăng throughput đáng kể
- B. Hầu như không cải thiện vì bottleneck là CPU
- C. Giảm CPU xuống 20%
- D. Gây deadlock

<details><summary>Đáp án</summary>

**B** — Chỉ cải thiện bottleneck mới tăng hiệu năng.

</details>

**Câu 2.** Ba loại giao dịch chạy 50, 100, 200 tps với tỉ lệ 25%, 25%, 50%. Throughput trung bình (không xung đột) là:

- A. 137.5 tps
- B. 116.7 tps
- C. 100 tps
- D. 200 tps

<details><summary>Đáp án</summary>

**C** — 1 / (0.25/50 + 0.25/100 + 0.5/200) = 1 / 0.01 = 100 (PE 25.6). 137.5 là trung bình cộng có trọng số — sai.

</details>

**Câu 3.** Sequence counter bị lock theo 2PL trở thành bottleneck vì:

- A. Counter quá lớn
- B. Lock giữ tới khi transaction kết thúc, các transaction khác phải chờ để lấy số
- C. Counter không được log
- D. Không thể rollback

<details><summary>Đáp án</summary>

**B** — Sequence không theo 2PL chỉ lock trong lúc tăng counter (PE 25.2).

</details>

**Câu 4.** Vì sao sequence không theo 2PL có thể để lại "lỗ hổng" trong các số của giao dịch đã commit?

- A. Do lỗi phần cứng
- B. Giao dịch abort không trả lại số đã lấy
- C. Do sắp xếp lại
- D. Do snapshot isolation

<details><summary>Đáp án</summary>

**B** — Trả lại số sẽ có nguy cơ cấp trùng số cho hai giao dịch commit.

</details>

**Câu 5.** TPC-H đo loại workload nào?

- A. OLTP đơn hàng
- B. Decision support / truy vấn ad hoc
- C. Key-value
- D. Web server

<details><summary>Đáp án</summary>

**B** — TPC-C/TPC-E cho OLTP; TPC-H, TPC-DS cho phân tích.

</details>

**Câu 6.** Kết quả TPC bắt buộc phải công bố thêm gì ngoài throughput?

- A. Mã nguồn
- B. Giá hệ thống và chỉ số giá/hiệu năng
- C. Số người dùng
- D. Phiên bản hệ điều hành

<details><summary>Đáp án</summary>

**B** — Price/performance (ví dụ $/tpmC) là một phần của kết quả.

</details>

**Câu 7.** Chèn hàng triệu bản ghi vào bảng có nhiều B+-tree index. Khuyến nghị thường gặp là:

- A. Chèn từng dòng trong transaction riêng
- B. Bỏ index, chèn, rồi tạo lại index
- C. Tăng isolation level
- D. Dùng hash index

<details><summary>Đáp án</summary>

**B** — Tạo index bottom-up một lần rẻ hơn hàng triệu lần chèn ngẫu nhiên (PE 25.4).

</details>

**Câu 8.** Trong LDAP, một entry có thể xuất hiện trong hai cây phân cấp khác nhau mà không chép dữ liệu nhờ:

- A. Trigger
- B. Referral
- C. Materialized view
- D. Replication

<details><summary>Đáp án</summary>

**B** — Entry trong cây thứ hai chỉ là referral trỏ tới entry gốc (PE 25.9).

</details>

**Câu 9.** Chuẩn được xây dựng trước khi có sản phẩm, nhằm định hướng ngành, gọi là:

- A. Reactionary standard
- B. Anticipatory standard
- C. De facto standard
- D. Proprietary standard

<details><summary>Đáp án</summary>

**B** — Reactionary standard chuẩn hoá những gì đã có trên thị trường (PE 25.8).

</details>

## 3. Câu hỏi tự luận (9 câu)

**Câu 1.** 

> **Exercise 25.1.** Find out all the performance information that your favorite database system provides. At a minimum look for: which queries are executing now or were executed recently; the resources (CPU and I/O) each of them consumed; what fraction of page requests caused buffer misses (per query, if available); and which locks are highly contended. Also obtain CPU, I/O, and network utilization, including the number of open network connections, using operating-system utilities.

**PE 25.1.** Tìm các thông tin hiệu năng mà hệ CSDL bạn dùng cung cấp (truy vấn đang chạy, tài nguyên tiêu thụ, buffer miss, lock tranh chấp) và thông tin CPU, I/O, mạng từ hệ điều hành.

<details><summary>Gợi ý đáp án</summary>

Với **PostgreSQL**:
- Truy vấn đang/vừa chạy: view `pg_stat_activity` (query, state, thời điểm bắt đầu, wait_event); extension `pg_stat_statements` (số lần gọi, tổng/mean thời gian, shared_blks_hit/read → tỉ lệ buffer miss mỗi truy vấn).
- Kế hoạch và chi phí: `EXPLAIN` (startup cost, total cost, số dòng ước lượng, độ rộng dòng) và `EXPLAIN (ANALYZE, BUFFERS)` (thời gian thật, số buffer hit/read).
- Buffer: `pg_statio_user_tables`, `pg_stat_database` (blks_hit, blks_read).
- Lock: `pg_locks` join `pg_stat_activity`; tham số `log_lock_waits`.
- Hệ điều hành: `top`/`htop` (CPU), `iostat`/`vmstat` (I/O), `netstat -an` hoặc `ss -s` (số kết nối mạng mở), `sar`.

SQL Server: SQL Profiler / Extended Events, Performance Monitor với các counter Buffer Manager, Locks, SQL Statistics…; Oracle: AWR, V$ views.

</details>

**Câu 2.** 

> **Exercise 25.2.** Many applications need to generate a sequence number for every transaction.
> 
> a. If a sequence counter is locked in a two-phase manner, it can become a concurrency bottleneck. Explain why.
> 
> b. Many database systems offer built-in sequence counters that are not locked two-phase: when a transaction asks for a sequence number, the counter is locked, incremented, and immediately unlocked.
> 
> 1. Explain how such counters can improve concurrency.
> 2. Explain why the sequence numbers of the transactions that finally commit may contain gaps.

**PE 25.2.** (a) Vì sao sequence counter lock theo 2PL thành bottleneck? (b) Sequence không theo 2PL: (i) cải thiện concurrency thế nào; (ii) vì sao số của các giao dịch commit có thể có lỗ hổng?

<details><summary>Gợi ý đáp án</summary>

a. Theo 2PL, lock X trên counter phải giữ ít nhất tới hết pha tăng lock (thực tế là tới commit với strict 2PL). Suốt thời gian đó mọi giao dịch khác cần số thứ tự phải **chờ**, dù dữ liệu chúng truy cập không hề xung đột → các giao dịch bị tuần tự hoá qua counter.
b. (i) Counter chỉ bị lock trong khoảnh khắc **tăng giá trị** rồi nhả ngay, nên nhiều giao dịch lấy số song song, không giữ lock tới cuối.
(ii) Nếu giao dịch đã lấy số rồi **abort**, số đó **không được trả lại**. Không thể khôi phục counter: giả sử T<sub>a</sub> lấy 100, T<sub>b</sub> lấy 101; nếu T<sub>a</sub> abort và counter quay về 100, giao dịch kế tiếp T<sub>c</sub> nhận 100 và T<sub>d</sub> nhận 101 — trùng với T<sub>b</sub>. Vì vậy số của các giao dịch commit có lỗ hổng (bài 25.05, 25.06).

</details>

**Câu 3.** 

> **Exercise 25.3.** You are given a relation r(a, b, c).
> 
> a. Give an example of a situation in which the performance of equality selection queries on attribute a depends greatly on how r is clustered.
> 
> b. Suppose there are also range selection queries on attribute b. Can r be clustered so that both the equality selections on r.a and the range selections on r.b are answered efficiently? Explain.
> 
> c. If such a clustering is not possible, suggest how both kinds of queries can be executed efficiently by choosing suitable indices.

**PE 25.3.** Relation r(a, b, c). (a) Khi nào hiệu năng truy vấn bằng trên a phụ thuộc mạnh vào cách cluster r? (b) Có thể cluster để cả truy vấn bằng trên a và truy vấn khoảng trên b đều nhanh không? (c) Nếu không, chọn index thế nào?

<details><summary>Gợi ý đáp án</summary>

a. Khi mỗi giá trị a khớp **nhiều** tuple. Nếu r không cluster theo a, các tuple cùng a rải khắp file → mỗi tuple một lần đọc khối (hoặc phải quét cả r). Cluster theo a + index trên a thì các tuple nằm liền nhau, đọc ít khối.
b. Nói chung **không**: thứ tự vật lý chỉ có một. Chỉ được khi a và b có quan hệ đặc biệt (ví dụ a tăng thì b tăng), khi đó cùng một thứ tự phục vụ cả hai.
c. Cluster r theo a (truy vấn bằng rất nhanh) và tạo **B<sup>+</sup>-tree secondary index trên b**. Truy vấn khoảng trên b lấy danh sách con trỏ từ index, **sắp xếp con trỏ theo địa chỉ khối** rồi mới đọc, để mỗi khối chỉ đọc một lần (bitmap heap scan trong PostgreSQL). Bài 25.10 tạo hash index cho a và B<sup>+</sup>-tree cho b.

</details>

**Câu 4.** 

> **Exercise 25.4.** When a large number of records are inserted into a relation within a short time, a common recommendation is to drop all indices and recreate them after the inserts have finished.
> 
> a. What is the motivation for this recommendation?
> 
> b. Dropping and recreating indices can be avoided by bulk-updating them. Suggest how this can be done efficiently for B<sup>+</sup>-tree indices.
> 
> c. Would this advice still make sense if the indices were write-optimized indices such as LSM trees?

**PE 25.4.** Khi chèn rất nhiều bản ghi trong thời gian ngắn: (a) vì sao nên bỏ index rồi tạo lại? (b) cập nhật B<sup>+</sup>-tree theo lô hiệu quả thế nào? (c) Với LSM tree lời khuyên còn ý nghĩa không?

<details><summary>Gợi ý đáp án</summary>

a. Mỗi lần chèn cập nhật mỗi index một lần, có thể tốn **1 random I/O cho mỗi bản ghi mỗi index** (~10 ms với đĩa từ). Với số bản ghi lớn, tạo lại index **bottom-up** (sắp xếp rồi dựng cây từ lá) rẻ hơn nhiều.
b. Gom các bản ghi mới thành lô, **sắp xếp theo khoá index**, rồi **merge** với tầng lá của B<sup>+</sup>-tree theo thứ tự: mỗi lá được đọc/ghi tối đa một lần, I/O gần như tuần tự.
c. Gần như không cần: LSM tree vốn được thiết kế để chèn bằng sequential I/O (ghi run rồi merge — chính là ý tưởng của (b)), nên không có phạt lớn khi chèn hàng loạt.

</details>

**Câu 5.** 

> **Exercise 25.5.** A database application seems to have no single bottleneck: CPU and disk utilization are both high and all database queues are roughly balanced. Does this mean the application cannot be tuned any further? Explain.

**PE 25.5.** CPU và đĩa đều bận, các hàng đợi cân bằng, không có bottleneck đơn lẻ. Ứng dụng có còn tune được không?

<details><summary>Gợi ý đáp án</summary>

**Vẫn có thể.** "Không có bottleneck đơn lẻ" chỉ nói tài nguyên được dùng cân bằng, không nói công việc là cần thiết. Tuning ở mức cao hơn có thể **giảm tổng khối lượng công việc**: thêm index để tránh quét bảng, materialized view cho truy vấn tổng hợp lặp lại, viết lại truy vấn kém, dùng thao tác theo lô, **cache** kết quả ở tầng ứng dụng để giảm tải cho CSDL. Những thay đổi này giảm cả CPU lẫn I/O. Ngoài ra có thể nâng cấp phần cứng đồng đều.

</details>

**Câu 6.** 

> **Exercise 25.6.** A system runs three types of transactions. Type A transactions run at 50 per second, type B at 100 per second, and type C at 200 per second. The transaction mix is 25 percent type A, 25 percent type B, and 50 percent type C.
> 
> a. Assuming no interference between transactions, what is the average transaction throughput of the system?
> 
> b. Which factors can cause interference between transactions of different types, making the computed throughput incorrect?

**PE 25.6.** Giao dịch loại A 50/s, B 100/s, C 200/s; tỉ lệ 25%, 25%, 50%. (a) Throughput trung bình nếu không xung đột? (b) Yếu tố nào làm kết quả tính sai?

<details><summary>Gợi ý đáp án</summary>

a. Xét 100 giao dịch: 25 A mất 25/50 = 0.5 s, 25 B mất 0.25 s, 50 C mất 0.25 s → tổng 1 s → **100 giao dịch/giây** (bài 25.03). Trung bình cộng có trọng số (137.5) là sai.
b. **Tranh chấp lock**: ví dụ A, B cập nhật, C đọc; A giữ lock trên dữ liệu nóng trong khi chờ ghi đĩa, các giao dịch khác chờ lock → lãng phí CPU, throughput thấp hơn. **Deadlock, abort và restart** (cả trong optimistic concurrency control) cũng làm giảm. Ngược lại, nếu A, B nặng về đĩa còn C nặng về CPU và không tranh chấp lock, chúng chạy chồng lên nhau → throughput thực tế có thể **cao hơn** tính toán. Giới hạn kích thước cấu trúc dữ liệu, chi phí quản lý giao dịch thay đổi cũng gây sai lệch.

</details>

**Câu 7.** 

> **Exercise 25.7.** An application programmer was supposed to write the query
> 
> ```sql
> select *
> from r natural left outer join s;
> ```
> 
> on relations r(A, B) and s(B, C), but wrote instead
> 
> ```sql
> select *
> from r natural join s;
> ```
> 
> a. Give sample data for r and s on which the two queries produce the same result.
> 
> b. Give sample data for r and s on which the two queries produce different results, thereby exposing the mistake.

**PE 25.7.** Cần viết `r natural left outer join s` (r(A, B), s(B, C)) nhưng lại viết `r natural join s`. (a) Dữ liệu cho hai câu cùng kết quả; (b) dữ liệu làm lộ lỗi.

<details><summary>Gợi ý đáp án</summary>

a. Mọi tuple của r đều khớp ít nhất một tuple của s, ví dụ r = {(a1, 1), (a2, 2)}, s = {(1, c1), (2, c2)} → hai câu đều ra {(a1, 1, c1), (a2, 2, c2)}. (s có thể có thêm tuple không khớp r, vẫn cùng kết quả.)
b. Có tuple của r **không khớp** s, ví dụ thêm (a3, 3) vào r: left outer join có thêm (a3, 3, null), natural join thì không. Dữ liệu `at_r`, `at_s` trong bài 25.07 có hai tuple như vậy. Bài học: dữ liệu test phải chứa tuple không khớp.

</details>

**Câu 8.** 

> **Exercise 25.8.** List some benefits and drawbacks of an anticipatory standard compared with a reactionary standard.

**PE 25.8.** Lợi ích và hạn chế của anticipatory standard so với reactionary standard.

<details><summary>Gợi ý đáp án</summary>

- **Anticipatory** (chuẩn đi trước sản phẩm): các sản phẩm từ đầu đã theo cùng chuẩn nên **tương thích**, tránh việc mỗi hãng một kiểu rồi khó hoà giải (vấn đề gặp khi chuẩn hoá cú pháp con trỏ của ODMG). Nhưng thiếu kinh nghiệm thực tế, dễ **quá tham vọng**: nhiều tính năng phức tạp, lâu mới được hiện thực, có tính năng tỏ ra không phù hợp (SQL:1999 là ví dụ).
- **Reactionary** (chuẩn hoá cái đã có): dựa trên kinh nghiệm dùng sản phẩm thật nên **thực dụng**, đã được kiểm chứng. Nhưng phải hoà giải khác biệt giữa các sản phẩm đã tồn tại, có hãng phải sửa sản phẩm, và chuẩn ra đời muộn.

</details>

**Câu 9.** 

> **Exercise 25.9.** Describe how LDAP can provide several hierarchical views of the same data without replicating the base-level data.

**PE 25.9.** LDAP cung cấp nhiều cây phân cấp cho cùng dữ liệu mà không nhân bản dữ liệu gốc thế nào?

<details><summary>Gợi ý đáp án</summary>

Dùng **referral**. Ví dụ thông tin phòng ban có thể tổ chức theo **địa lý** (mọi phòng ban tại một địa điểm) hoặc theo **cấu trúc** (một phòng ban ở mọi địa điểm). Chọn một cây làm nơi lưu **dữ liệu gốc** (ví dụ phòng ban tại từng địa điểm). Cây thứ hai được định nghĩa bằng schema riêng nhưng các entry của nó chỉ là **referral** trỏ tới entry gốc; client đi theo referral để lấy dữ liệu. Dữ liệu chỉ lưu một lần, cập nhật một chỗ. Bài 25.11 dựng đường dẫn DN trong cây theo địa lý.

</details>

## 4. Bài tập SQL (12 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH25.01 | tuning: thiếu index | ★★☆ | Từ workload `at_workload` và danh sách index đang có `at_index`, tìm các ứng viên index còn thiếu: mẫu truy vấn trên cột chưa có index và có độ chọn lọc rows_returned / rows_scanned dưới 0.05. Trả về `table_name`, `column_name`, `calls_per_hour`. |
| CH25.02 | tuning: bảng nóng | ★☆☆ | Với mỗi bảng trong `at_workload`, tính tổng số dòng phải đọc mỗi giờ (calls_per_hour × rows_scanned, đặt tên `rows_per_hour`). Sắp xếp giảm dần. |
| CH25.03 | throughput theo mix | ★★☆ | Exercise 25.6 (a). A system runs three types of transactions. Type A transactions run at 50 per second, type B at 100 per second, and type C at 200 per second. The transaction mix is 25 percent type A, 25 percent type B, and 50 percent type C.  a. Assuming no interference between transactions, what is the average transaction throughput of the system?<br>Từ `at_txn_type(txn_type, rate_per_sec, mix_pct)`, tính throughput trung bình của hệ thống khi không có xung đột: 1 / Σ(mix[i] / rate[i]) với mix là tỉ lệ (mix_pct / 100). Trả về `throughput` làm tròn 2 chữ số, và `naive_avg` — trung bình cộng có trọng số Σ mix[i] × rate[i] (sai) để so sánh. |
| CH25.04 | lock hot spot | ★★☆ | Từ `at_lock_wait`, tìm các tài nguyên "nóng": thời gian chờ trung bình mỗi lần (total_wait_ms / waits) lớn hơn thời gian chờ trung bình chung của mọi lần chờ (tổng total_wait_ms / tổng waits). Trả về `resource`, `avg_wait_ms` (làm tròn 1 chữ số). |
| CH25.05 | sequence gaps | ★★☆ | Exercise 25.2. Many applications need to generate a sequence number for every transaction.  a. If a sequence counter is locked in a two-phase manner, it can become a concurrency bottleneck. Explain why.  b. Many database systems offer built-in sequence counters that are not locked two-phase: when a transaction asks for a sequence number, the counter is locked, incremented, and immediately unlocked.  1. Explain how such counters can improve concurrency. 2. Explain why the sequence numbers of the transactions that finally commit may contain gaps.<br>Bảng `at_txn` ghi số thứ tự `seq_no` mà mỗi transaction đã lấy và trạng thái cuối. Xét các transaction đã commit: trả về các số thứ tự bị thiếu (cột `missing_seq`) trong khoảng từ seq_no nhỏ nhất tới lớn nhất của chúng. |
| CH25.06 | sequence không rollback | ★★☆ | Exercise 25.2 (b). Many applications need to generate a sequence number for every transaction.  b. Many database systems offer built-in sequence counters that are not locked two-phase: when a transaction asks for a sequence number, the counter is locked, incremented, and immediately unlocked.  1. Explain how such counters can improve concurrency. 2. Explain why the sequence numbers of the transactions that finally commit may contain gaps.<br>Chứng minh sequence không bị rollback: tạo sequence `at_order_seq` và commit; mở transaction mới, gọi `nextval` hai lần, rồi rollback; sau đó gọi `nextval` lần nữa. Câu cuối trả về giá trị nhận được (cột `next_value`). (Bài chạy trên database mới, được dùng begin/rollback.) |
| CH25.07 | test bắt lỗi join | ★★☆ | Exercise 25.7. An application programmer was supposed to write the query  ```sql select * from r natural left outer join s; ```  on relations r(A, B) and s(B, C), but wrote instead  ```sql select * from r natural join s; ```  a. Give sample data for r and s on which the two queries produce the same result.  b. Give sample data for r and s on which the two queries produce different results, thereby exposing the mistake.<br>Với `at_r(a, b)` và `at_s(b, c)`: trả về các dòng có trong kết quả `at_r natural left outer join at_s` nhưng không có trong `at_r natural join at_s` — chính là các dòng làm lộ lỗi viết nhầm join. Cột b, a, c. |
| CH25.08 | regression test | ★★★ | Regression test: `at_expected(dept_name, num_instructors)` là kết quả mong đợi của truy vấn "số instructor mỗi khoa (chỉ khoa có instructor)". Chạy truy vấn thật trên bảng instructor và so sánh hai chiều. Trả về `side` ('missing' = có trong mong đợi nhưng không có trong kết quả thật, 'unexpected' = ngược lại), `dept_name`, `num_instructors`. |
| CH25.09 | materialized view | ★★☆ | Exercise 25.5. A database application seems to have no single bottleneck: CPU and disk utilization are both high and all database queues are roughly balanced. Does this mean the application cannot be tuned any further? Explain.<br>Tuning bằng materialized view: tạo materialized view `at_dept_payroll(dept_name, total_salary, num_instructors)` tổng lương và số instructor mỗi khoa. Hệ thống tăng lương mọi instructor khoa Music thêm 1000 sau khi tạo view, rồi so sánh tổng lương Music trong view trước và sau `refresh materialized view`. |
| CH25.10 | chọn loại index | ★★☆ | Exercise 25.3. You are given a relation r(a, b, c).  a. Give an example of a situation in which the performance of equality selection queries on attribute a depends greatly on how r is clustered.  b. Suppose there are also range selection queries on attribute b. Can r be clustered so that both the equality selections on r.a and the range selections on r.b are answered efficiently? Explain.  c. If such a clustering is not possible, suggest how both kinds of queries can be executed efficiently by choosing suitable indices.<br>Bảng `at_sale(sale_id, a, b, c)` có truy vấn bằng trên a và truy vấn khoảng trên b. Tạo index `at_sale_a_idx` kiểu hash trên a và `at_sale_b_idx` kiểu B+-tree (btree) trên b. Hệ thống đọc `pg_indexes`. |
| CH25.11 | LDAP DN | ★★★ | Exercise 25.9. Describe how LDAP can provide several hierarchical views of the same data without replicating the base-level data.<br>Cây thư mục `at_ldap(node_id, parent_id, rdn, person_id)`. Với mỗi entry là một người (person_id khác null), trả về `person_id` và `dn` — distinguished name ghép các RDN từ lá lên gốc, ngăn cách bởi ', ' (ví dụ 'cn=Lan, ou=Sales, ou=Hanoi, o=Acme'). |
| CH25.12 | benchmark TPC | ★★☆ | Từ `at_bench(system, txns_completed, seconds, total_cost_usd)`, tính cho mỗi hệ thống: `tps` = txns_completed / seconds (làm tròn 1), `price_per_tps` = total_cost_usd / tps (làm tròn 2). Sắp theo price_per_tps tăng dần (hệ thống "đáng tiền" nhất trước). |
