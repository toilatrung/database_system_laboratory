-- =====================================================================
-- CS4420 · Chương 10 — Dữ liệu lớn (Big Data) (Big Data)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch10
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CH10.01  [MapReduce word count]  ★☆☆
-- Bảng `bd_doc(doc_id, body)` chứa văn bản chữ thường, các từ cách nhau đúng một dấu cách. Viết word count kiểu MapReduce bằng SQL: map = tách mỗi body thành các từ (`regexp_split_to_table(body, ' ')`), reduce = đếm. Trả về `word` và `n` (số lần xuất hiện trong toàn bộ tập văn bản).
-- Gợi ý: `from bd_doc, regexp_split_to_table(body, ' ') as word group by word`




-- @ex CH10.02  [top-k words]  ★☆☆
-- Tiếp CH10.01: chỉ trả về các từ xuất hiện ít nhất 2 lần, sắp theo `n` giảm dần, cùng `n` thì theo `word` tăng dần.
-- (Thứ tự dòng được chấm.)




-- @ex CH10.03  [inverted index]  ★★☆
-- Inverted index (chỉ mục ngược, dùng trong search engine) ánh xạ mỗi từ tới danh sách document chứa nó. Trả về `word` và `docs` — mảng các doc_id không trùng, tăng dần — chỉ cho các từ có mặt trong ít nhất 2 document.
-- Gợi ý: `array_agg(distinct doc_id order by doc_id)`; điều kiện đặt ở having với `count(distinct doc_id)`.




-- @ex CH10.04  [PE 10.7 N]  ★☆☆
-- Đề gốc: Exercise 10.7. For a collection of documents, let n[i] be the number of occurrences of word w[i] in the whole collection and N the total number of word occurrences over all documents. For every pair of consecutive words (w[i], w[j]) in a document, let n[i,j] be the number of occurrences of that pair over all documents.
--
-- Write an Apache Spark program that, for a collection of documents in a directory, computes N, all pairs (w[i], n[i]), and all pairs ((w[i], w[j]), n[i,j]). Then output every word pair with n[i,j]/N ≥ 10 × (n[i]/N) × (n[j]/N) — pairs that occur at least 10 times as often as expected if the two words occurred independently.
--
-- The join operation on RDDs is useful in the last step to bring the related counts together. To keep it simple, ignore word pairs that span lines, and assume words are lowercase only and there is no punctuation.
--
-- Phần đầu của PE 10.7 trên `bd_doc`: trả về một dòng hai cột `total_words` = N (tổng số lần xuất hiện của mọi từ) và `distinct_words` (số từ khác nhau).




-- @ex CH10.05  [PE 10.7 word pairs]  ★★★
-- Đề gốc: Exercise 10.7. For a collection of documents, let n[i] be the number of occurrences of word w[i] in the whole collection and N the total number of word occurrences over all documents. For every pair of consecutive words (w[i], w[j]) in a document, let n[i,j] be the number of occurrences of that pair over all documents.
--
-- Write an Apache Spark program that, for a collection of documents in a directory, computes N, all pairs (w[i], n[i]), and all pairs ((w[i], w[j]), n[i,j]). Then output every word pair with n[i,j]/N ≥ 10 × (n[i]/N) × (n[j]/N) — pairs that occur at least 10 times as often as expected if the two words occurred independently.
--
-- The join operation on RDDs is useful in the last step to bring the related counts together. To keep it simple, ignore word pairs that span lines, and assume words are lowercase only and there is no punctuation.
--
-- PE 10.7 bằng SQL trên `bd_doc` (mỗi body là một dòng; không có cặp vắt qua hai document). Gọi n[i] là số lần xuất hiện của từ w[i], N là tổng số lần xuất hiện, n[i,j] là số lần cặp liên tiếp (w[i], w[j]) xuất hiện. Trả về `w1`, `w2`, `n` (= n[i,j]) của mọi cặp thoả n[i,j]/N ≥ 10 · (n[i]/N) · (n[j]/N).
-- Gợi ý: `regexp_split_to_table(body, ' ') with ordinality as t(word, pos)` cho vị trí từ; cặp liên tiếp: self-join cùng doc_id và `b.pos = a.pos + 1`. Ép numeric để không chia nguyên.




-- @ex CH10.06  [PE 10.5 parallel sum]  ★☆☆
-- Đề gốc: Exercise 10.5. The following Apache Spark snippet is meant to process very large data. What is the conceptual problem with it? (collect() returns a Java collection, and Java collections — from Java 8 on — support map and reduce.)
--
-- ```java
-- JavaRDD lines = sc.textFile("logDirectory");
-- int totalLength = lines.collect().map(s -> s.length())
--                        .reduce(0, (a, b) -> a + b);
-- ```
--
-- Phiên bản đúng của đoạn Spark trong PE 10.5: tính tổng độ dài (số ký tự) của mọi dòng trong `bd_log(line_no, line)` bằng một phép aggregate (mỗi dòng map thành độ dài, reduce bằng cộng). Trả về một cột `total_length`.




-- @ex CH10.07  [PE 10.2 jsonb access]  ★☆☆
-- Đề gốc: Exercise 10.2. Data about a very large number of students is to be kept in a distributed document store such as MongoDB, where each student’s data corresponds to the data in the *student* and *takes* relations. How would you represent this data so that all the data of one particular student can be accessed efficiently? Show an example of the representation for one student.
--
-- `bd_student_doc(id, doc jsonb)` lưu mỗi sinh viên thành một document như PE 10.2: `{"ID", "name", "dept_name", "tot_cred", "takes": [{course_id, sec_id, semester, year, grade}, …]}`. Lấy `name` (text) và `num_takes` (số phần tử của mảng takes) của sinh viên `12345` — chỉ dùng bd_student_doc.
-- Gợi ý: `doc->>'name'`, `jsonb_array_length(doc->'takes')`.




-- @ex CH10.08  [jsonb unnest]  ★★☆
-- Từ `bd_student_doc`, "bung" mảng takes thành dòng: trả về `id`, `course_id`, `year` (integer) của mọi môn mà sinh viên đạt điểm `A`.
-- Gợi ý: `cross join lateral jsonb_array_elements(doc->'takes') as t(e)`; `(e->>'year')::int`.




-- @ex CH10.09  [build a document]  ★★☆
-- Đề gốc: Exercise 10.2. Data about a very large number of students is to be kept in a distributed document store such as MongoDB, where each student’s data corresponds to the data in the *student* and *takes* relations. How would you represent this data so that all the data of one particular student can be accessed efficiently? Show an example of the representation for one student.
--
-- Tạo view `bd_student_summary(id, doc)` từ bảng student và takes (không dùng bd_student_doc): với mỗi sinh viên, `doc` là jsonb `{"name": …, "courses": [...]}` trong đó courses là mảng các course_id không trùng, tăng dần sinh viên đã học (mảng rỗng `[]` nếu chưa học môn nào). Hệ thống đọc document của 45678 và 70557.
-- Gợi ý: `jsonb_build_object`, `coalesce((select jsonb_agg(distinct course_id order by course_id) from takes where ...), '[]'::jsonb)`.




-- @ex CH10.10  [jsonb containment]  ★★☆
-- Dùng toán tử chứa `@>` của jsonb để tìm `id` của mọi sinh viên trong `bd_student_doc` có học course `CS-101` (ở bất kỳ học kỳ nào).
-- Gợi ý: `doc->'takes' @> '[{"course_id": "CS-101"}]'`




-- @ex CH10.11  [PE 10.3 composite key]  ★★☆
-- Đề gốc: Exercise 10.3. Utility bills of a large number of users are to be stored; each bill is identified by a customer ID and a date. Queries ask for the bills of a given customer within a given date range. How would you store the bills in a key-value store that supports range queries?
--
-- Mô phỏng key-value store của PE 10.3. Tạo view `bd_bill_kv(key, amount)` từ `bd_bill(customer_id, bill_date, amount)`, với `key` = customer_id + `'/'` + ngày dạng `YYYY/MM/DD` (ví dụ `C1/2018/02/28`). Hệ thống chạy range query trên key: hoá đơn của C1 từ 2018/02/01 đến 2018/03/31 — kết quả không được lẫn hoá đơn của C10.
-- Gợi ý: `customer_id || '/' || to_char(bill_date, 'YYYY/MM/DD')`




-- @ex CH10.12  [PE 10.4 MapReduce join]  ★★★
-- Đề gốc: Exercise 10.4. Give pseudocode that computes the join r ⋈[r.A=s.A] s in a single MapReduce step. Assume map() is called on every tuple of both r and s, and that map() can obtain the name of the relation of its input via context.relname().
--
-- Tính `bd_r ⋈ bd_s` theo r.a = s.a theo đúng hai bước MapReduce của PE 10.4 (không join thẳng hai bảng):
-- 1. *map*: một CTE `map_out(key, rel, val)` = các tuple của bd_r thành (a, 'r', b) union all các tuple của bd_s thành (a, 's', c);
-- 2. *reduce*: với mỗi key, ghép mọi val của 'r' với mọi val của 's'.
--
-- Trả về `a`, `b`, `c`.
-- Gợi ý: Self-join map_out m1, m2 trên key với m1.rel = 'r' và m2.rel = 's'.




-- @ex CH10.13  [range partitioning]  ★★☆
-- Mô phỏng sharding theo range bằng declarative partitioning. Tạo bảng `bd_bill_month(customer_id varchar(5), bill_date date, amount numeric(8,2))` partition by range (bill_date) với 4 partition theo tháng của năm 2018: `bd_bill_m1` (tháng 1), `bd_bill_m2`, `bd_bill_m3`, `bd_bill_m4`; rồi chép toàn bộ bd_bill vào. Hệ thống đếm số dòng trong từng partition.
-- Gợi ý: `create table bd_bill_m1 partition of bd_bill_month for values from ('2018-01-01') to ('2018-02-01');`




-- @ex CH10.14  [hash partitioning]  ★★☆
-- Mô phỏng sharding theo hash của customer_id: tạo `bd_bill_hash(customer_id varchar(5), bill_date date, amount numeric(8,2))` partition by hash (customer_id) với 3 partition `bd_bill_h0`, `bd_bill_h1`, `bd_bill_h2` (modulus 3, remainder 0/1/2), rồi chép bd_bill vào. Hệ thống kiểm tra: tổng số dòng, và mọi hoá đơn của một khách nằm trong cùng một partition.




-- @ex CH10.15  [PE 10.8 tumbling window]  ★★☆
-- Đề gốc: Exercise 10.8. Consider this query that uses the tumbling-window operator:
--
-- ```sql
-- select item, System.Timestamp as window_end, sum(amount)
-- from order timestamp by datetime
-- group by itemid, tumblingwindow(hour, 1)
-- ```
--
-- Write an equivalent query with ordinary SQL constructs, without the tumbling-window operator. You may assume a function to_seconds(timestamp) that converts a timestamp to the integer number of seconds since midnight, January 1, 1970, the usual arithmetic functions, and floor(a), which returns the largest integer ≤ a.
--
-- PE 10.8 trên `bd_order(order_id, itemid, datetime, amount)`: tổng `amount` của mỗi item trong mỗi tumbling window 1 giờ. Trả về `itemid`, `window_end` (timestamp — thời điểm kết thúc cửa sổ, ví dụ đơn lúc 09:20 thuộc cửa sổ kết thúc 10:00, đơn lúc đúng 10:00:00 thuộc cửa sổ kết thúc 11:00) và `total`. Không dùng date_trunc/date_bin: dùng số giây `extract(epoch from datetime)` và `floor` như đề.
-- Gợi ý: Group by `itemid, floor(extract(epoch from datetime) / 3600)`; `to_timestamp((floor(...) + 1) * 3600) at time zone 'UTC'` đổi về timestamp.




-- @ex CH10.16  [stream: 30-min windows]  ★★☆
-- Đếm số đơn hàng (mọi item) trong mỗi tumbling window 30 phút tính từ `2019-05-01 00:00`. Trả về `window_start` (timestamp) và `num_orders`, chỉ các cửa sổ có đơn.
-- Gợi ý: `date_bin('30 minutes', datetime, timestamp '2019-05-01')`




-- @ex CH10.17  [sliding window]  ★★★
-- Sliding window quanh mỗi sự kiện: với mỗi đơn trong bd_order, trả về `order_id`, `itemid` và `last_hour` = tổng amount của cùng item trong khoảng 1 giờ tính tới thời điểm đơn đó (gồm cả đơn đó, tức các đơn có datetime trong (datetime − 1 giờ, datetime]).
-- Gợi ý: Window function với frame theo thời gian: `sum(amount) over (partition by itemid order by datetime range between interval '1 hour' preceding and current row)` — lưu ý frame range lấy cả mốc đúng 1 giờ trước; dùng `interval '59 minutes 59 seconds'` hoặc subquery.




-- @ex CH10.18  [PE 10.9 graph edges]  ★★☆
-- Đề gốc: Exercise 10.9. The university schema is to be modeled as a graph. For each relation below, explain whether it would become a node or an edge: (i) *student*, (ii) *instructor*, (iii) *course*, (iv) *section*, (v) *takes*, (vi) *teaches*. Does the model capture the connections between sections and courses?
--
-- Mô hình University thành đồ thị như PE 10.9. Tạo view `bd_univ_edge(src, label, dst)`: mỗi tuple takes thành cạnh (student ID, `'takes'`, section_key) và mỗi tuple teaches thành cạnh (instructor ID, `'teaches'`, section_key), với section_key = course_id-sec_id-semester-year nối bằng dấu `-` (ví dụ `CS-101-1-Fall-2017`). Hệ thống đếm số cạnh theo label và liệt kê các cạnh tới section `CS-190-2-Spring-2017`.




-- @ex CH10.19  [degree]  ★☆☆
-- Đồ thị trang web `bd_node(node, label)`, `bd_edge(src, dst)`. Với mọi node, trả về `node`, `out_degree` (số cạnh đi ra) và `in_degree` (số cạnh đi vào), 0 nếu không có.




-- @ex CH10.20  [reachability]  ★★★
-- Từ node `A`, tìm mọi node khác A đến được theo các cạnh của bd_edge cùng số bước ngắn nhất `hops`. Đồ thị có chu trình (A → B → C → A) nên phải giới hạn độ sâu (ví dụ tối đa 5 bước) hoặc chặn lặp.
-- Gợi ý: `with recursive r(node, hops)` bắt đầu từ các cạnh đi ra của A; điều kiện dừng `r.hops < 5`; cuối cùng `min(hops)` theo node.




-- @ex CH10.21  [PageRank iteration]  ★★★
-- Một vòng lặp PageRank trên bd_node/bd_edge, bắt đầu từ rank đều 1/N (N = số node, kể cả node không có cạnh). Với d = 0.85:
--
-- rank(v) = (1 − d)/N + d · Σ[u→v] rank(u)/outdeg(u)
--
-- Trả về `node` và `rank` làm tròn 4 chữ số cho mọi node.
-- Gợi ý: outdeg bằng một CTE `group by src`; node không có cạnh vào có tổng = 0 (coalesce).


