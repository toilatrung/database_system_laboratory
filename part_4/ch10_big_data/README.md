# Chương 10 — Dữ liệu lớn (Big Data)

*Big Data · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch10`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 0. Phạm vi
Chương 10 không nằm trong lịch thi CS4420 (lịch chỉ tới Chương 7), nhưng là phần nối tiếp tự nhiên: khi dữ liệu quá lớn cho một máy, cách lưu trữ và truy vấn thay đổi thế nào. Slide: *Chapter 10 — Big Data* (db-book.com). Mọi hệ thống phân tán ở đây (HDFS, MongoDB, Spark, Kafka, Neo4j) không chạy được trong trình duyệt, nên bài SQL **mô phỏng ý tưởng** của chúng trên PostgreSQL.

### 1. Big Data là gì (slide 10.2–10.5)
Ba chữ V:
- **Volume**: khối lượng vượt quá khả năng của một máy (web log, dữ liệu cảm biến, mạng xã hội).
- **Velocity**: dữ liệu đến liên tục với tốc độ cao (stream), cần xử lý gần thời gian thực.
- **Variety**: không chỉ bảng quan hệ mà còn JSON, văn bản, đồ thị, ảnh.

Hệ quản trị quan hệ truyền thống chạy song song được, nhưng chi phí cao và khó mở rộng tới hàng nghìn máy. Hệ Big Data đánh đổi: bỏ bớt tính năng (transaction đầy đủ, join tổng quát, schema cố định) để **scale out** trên nhiều máy rẻ.

Ví dụ ứng dụng: phân tích **web log/clickstream** (người dùng bấm gì, ở trang nào bao lâu), dữ liệu mạng xã hội, Internet of Things.

### 2. Lưu trữ Big Data (slide 10.6–10.20)
| Hệ thống | Ý tưởng | Ví dụ |
|---|---|---|
| **Distributed file system** | File rất lớn chia thành **block** (vài chục–vài trăm MB), mỗi block nhân bản trên nhiều máy (replication). Một **NameNode** giữ metadata (file → block → máy), các **DataNode** giữ dữ liệu | Google File System, **HDFS** |
| **Sharding** | Chia dữ liệu theo khoá cho nhiều database (partition theo **range** hoặc **hash**). Ứng dụng/route phải biết khoá nằm ở shard nào | MySQL sharding |
| **Key-value store** | Chỉ có get(key), put(key, value), delete(key); dữ liệu chia theo khoá, nhân bản, mở rộng tự động. Một số hỗ trợ **range query** trên khoá có thứ tự | Bigtable, HBase, Cassandra, DynamoDB, Redis |
| **Document store** | Value là một **document** (JSON) có cấu trúc lồng nhau; truy vấn được theo trường bên trong | MongoDB, Couchbase |
| **Parallel / distributed database** | Database quan hệ chạy trên nhiều máy | Teradata, Google Spanner |

Đặc điểm của key-value store:
- Không hỗ trợ (hoặc hỗ trợ rất hạn chế) join và transaction nhiều khoá.
- Thường chỉ đảm bảo **eventual consistency** (các bản sao cuối cùng sẽ giống nhau) thay vì nhất quán mạnh — liên quan tới **CAP theorem**: khi có phân mảnh mạng (Partition) phải chọn giữa Consistency và Availability.
- Thiết kế khoá rất quan trọng: muốn range query theo (customer, date) thì ghép khoá `customer_id/yyyy/mm/dd` (PE 10.3).

Distributed file system hợp với **ít file nhưng rất lớn**; với rất nhiều file nhỏ thì key-value store tốt hơn vì mỗi block DFS lớn hàng MB, và NameNode phải giữ metadata của từng file (PE 10.1).

Trong PostgreSQL, `jsonb` cho phép mô phỏng document store: `doc->'takes'`, `doc->>'name'`, `jsonb_array_elements`, toán tử chứa `@>`. **Declarative partitioning** (`partition by range / hash / list`) mô phỏng sharding trong một máy.

### 3. MapReduce (slide 10.21–10.35)
Mô hình lập trình song song cho tác vụ xử lý hàng loạt (batch):
- **map(k, v)** → danh sách cặp (k', v'): chạy song song trên từng phần của input.
- Hệ thống **shuffle/sort**: gom mọi giá trị có cùng k' về cùng một máy.
- **reduce(k', danh sách v')** → kết quả: chạy song song theo từng khoá.

Ví dụ word count:
```
map(doc_id, text):     for each word w in text: emit(w, 1)
reduce(w, values):     emit(w, sum(values))
```
Tương đương SQL: `select word, count(*) from words group by word` — map ≈ tách và chiếu, shuffle ≈ group by, reduce ≈ hàm aggregate.

Join bằng MapReduce (PE 10.4): map phát ra (giá trị A, (tên relation, tuple)) cho cả r và s; reduce nhận mọi tuple cùng A, chia thành nhóm r và nhóm s rồi phát ra mọi cặp (r-tuple, s-tuple).

Hadoop là hiện thực mã nguồn mở của MapReduce (đọc/ghi HDFS). Viết MapReduce trực tiếp tốn công nên có các ngôn ngữ cấp cao dịch sang nó: **Hive** (HiveQL giống SQL), **Pig**.

Hạn chế: mỗi bước MapReduce ghi kết quả ra đĩa; chuỗi nhiều bước (join, lặp như PageRank) chậm.

### 4. Algebraic operations — Apache Spark (slide 10.36–10.45)
- **RDD** (Resilient Distributed Dataset): tập dữ liệu chia partition trên nhiều máy; mỗi **transformation** (map, filter, join, reduceByKey, groupByKey…) chạy song song trên các partition.
- **Lazy evaluation**: transformation chỉ xây dựng **cây biểu thức** (lineage); chỉ khi gọi **action** (`collect()`, `count()`, `saveAsTextFile()`) Spark mới thực thi. Lợi ích: tối ưu hoá cả cây (giống query optimizer), **pipeline** dữ liệu giữa các phép mà không ghi đĩa, tính lại partition hỏng nhờ lineage.
- Giữ dữ liệu trong **bộ nhớ** giữa các bước → nhanh hơn MapReduce nhiều cho tác vụ lặp.
- **DataFrame / Dataset** và **Spark SQL**: dữ liệu có schema, truy vấn bằng SQL, có optimizer.
- Cạm bẫy (PE 10.5): `collect()` kéo **toàn bộ** RDD về một máy driver — mọi tính toán sau đó (map, reduce trên Java collection) chạy tuần tự trên một máy, và có thể tràn bộ nhớ. Phải gọi `lines.map(...).reduce(...)` trên RDD.

### 5. Streaming data (slide 10.46–10.55)
Dữ liệu đến liên tục, không có "điểm kết thúc": giao dịch thẻ, cảm biến, log, giá chứng khoán.
- **Continuous query**: truy vấn chạy mãi, cho kết quả mỗi khi có dữ liệu mới.
- **Window**: chỉ tính trên một cửa sổ thời gian.
  - **Tumbling window**: cửa sổ cố định không chồng nhau (mỗi giờ một cửa sổ).
  - **Hopping window**: kích thước cố định, trượt theo bước nhỏ hơn kích thước (chồng nhau).
  - **Sliding window**: cửa sổ quanh mỗi sự kiện (ví dụ 10 phút trước sự kiện).
  - **Session window**: nhóm các sự kiện cách nhau không quá một khoảng.
- Tumbling window bằng SQL thường (PE 10.8): `group by itemid, floor(to_seconds(datetime) / 3600)`; điểm cuối cửa sổ = `(floor(...) + 1) * 3600`. Trong PostgreSQL dùng `extract(epoch from ...)` hoặc `date_bin`/`date_trunc`.
- Hệ thống: **publish-subscribe** (Apache **Kafka**) chuyển dòng sự kiện; xử lý dòng bằng Apache Storm, Flink, Spark Streaming. **Lambda architecture**: một nhánh xử lý batch chính xác + một nhánh stream nhanh, gộp kết quả.

### 6. Graph databases (slide 10.56–10.62)
- Dữ liệu là **node** (thực thể) và **edge** (quan hệ), cả hai có thể có thuộc tính. Ví dụ Neo4j với ngôn ngữ **Cypher**: `match (i:instructor)<-[:advisor]-(s:student) return i.name, s.name`.
- Trong mô hình quan hệ: entity → node, relationship (takes, teaches, advisor) → edge (PE 10.9). Liên kết section–course bị gộp vào bảng section (cột course_id), nên muốn có cạnh section → course phải tách thành relation riêng.
- Truy vấn đường đi/reachability trong SQL dùng **recursive query** (`with recursive`, Chương 5).
- Xử lý đồ thị lớn song song: **Pregel** / Apache Giraph, GraphX — mô hình **bulk synchronous**: mỗi vòng (superstep) mỗi node nhận message, cập nhật trạng thái, gửi message cho hàng xóm. Ví dụ **PageRank**: rank(v) = (1 − d)/N + d · Σ<sub>u→v</sub> rank(u)/outdeg(u), lặp tới khi hội tụ (d thường = 0.85).

### 7. Ghi nhớ nhanh
| Câu hỏi | Trả lời ngắn |
|---|---|
| Nhiều file nhỏ? | Key-value store, không phải DFS |
| Truy cập mọi dữ liệu của một sinh viên nhanh? | Một document: thông tin student + mảng takes lồng bên trong |
| Range query theo (khách, ngày)? | Khoá ghép `customer_id/yyyy/mm/dd` |
| Join trong MapReduce? | Khoá reduce = thuộc tính join, kèm tên relation |
| Vì sao `collect().map` sai? | Gom về một máy, mất song song |
| Lazy evaluation? | Chỉ chạy khi có action; cho phép tối ưu và pipeline |
| Tumbling window bằng SQL? | group by floor(seconds / kích thước cửa sổ) |
| takes trong graph? | Edge giữa student và section |

## 2. Trắc nghiệm (11 câu)

**Câu 1.** Chữ V nào của Big Data nói về việc dữ liệu đến liên tục với tốc độ cao?

- A. Volume
- B. Velocity
- C. Variety
- D. Veracity

<details><summary>Đáp án</summary>

**B** — Velocity = tốc độ đến của dữ liệu (stream).

</details>

**Câu 2.** Vì sao HDFS không phù hợp để lưu hàng tỉ file 2 KB?

- A. HDFS không hỗ trợ file nhỏ hơn 1 MB
- B. Mỗi file chiếm ít nhất một block lớn và NameNode phải giữ metadata cho từng file
- C. HDFS không nhân bản dữ liệu
- D. HDFS chỉ lưu được JSON

<details><summary>Đáp án</summary>

**B** — DFS thiết kế cho số lượng vừa phải các file rất lớn (PE 10.1).

</details>

**Câu 3.** Key-value store hỗ trợ range query theo khoá. Khoá nào giúp lấy hoá đơn của khách C1 trong một khoảng ngày?

- A. yyyy/mm/dd/customer_id
- B. customer_id/yyyy/mm/dd
- C. amount/customer_id
- D. Một số ngẫu nhiên

<details><summary>Đáp án</summary>

**B** — Khoá bắt đầu bằng customer_id rồi tới ngày dạng năm/tháng/ngày → các hoá đơn của một khách nằm liền nhau và theo thứ tự ngày (PE 10.3).

</details>

**Câu 4.** Trong word count bằng MapReduce, hàm reduce nhận gì?

- A. Một document
- B. Một từ và danh sách các số 1 được phát cho từ đó
- C. Toàn bộ tập dữ liệu
- D. Một cặp (doc_id, từ)

<details><summary>Đáp án</summary>

**B** — Shuffle gom mọi cặp (w, 1) cùng w về một reduce; reduce cộng lại.

</details>

**Câu 5.** Phép SQL nào tương ứng với bước shuffle của MapReduce?

- A. where
- B. group by
- C. order by
- D. union

<details><summary>Đáp án</summary>

**B** — Shuffle gom các giá trị theo khoá, giống group by; reduce giống hàm aggregate.

</details>

**Câu 6.** Spark "lazy evaluation" nghĩa là gì?

- A. Spark chạy chậm để tiết kiệm điện
- B. Transformation chỉ được ghi lại; chỉ thực thi khi gọi một action như collect() hay count()
- C. Spark không bao giờ ghi ra đĩa
- D. Mỗi transformation chạy trên một máy

<details><summary>Đáp án</summary>

**B** — Nhờ vậy Spark tối ưu được cả cây phép toán và pipeline dữ liệu (PE 10.6).

</details>

**Câu 7.** `lines.collect().map(s -> s.length()).reduce(0, (a, b) -> a + b)` có vấn đề gì?

- A. Sai cú pháp Java
- B. collect() đưa mọi dòng về driver nên map/reduce chạy trên một máy
- C. reduce không có giá trị khởi tạo
- D. Không có vấn đề

<details><summary>Đáp án</summary>

**B** — Phải gọi map/reduce trên RDD để chạy song song (PE 10.5).

</details>

**Câu 8.** Tumbling window 1 giờ khác hopping window 1 giờ bước 15 phút thế nào?

- A. Tumbling không chồng nhau; hopping chồng nhau (một sự kiện thuộc nhiều cửa sổ)
- B. Tumbling chồng nhau; hopping không chồng nhau
- C. Cả hai giống nhau
- D. Hopping chỉ dùng cho graph

<details><summary>Đáp án</summary>

**A** — Hopping trượt bước nhỏ hơn kích thước nên các cửa sổ chồng lên nhau.

</details>

**Câu 9.** Khi mô hình University thành đồ thị, takes là gì?

- A. Node
- B. Edge giữa student và section
- C. Thuộc tính của course
- D. Không biểu diễn được

<details><summary>Đáp án</summary>

**B** — Relationship → edge; entity (student, section) → node (PE 10.9).

</details>

**Câu 10.** CAP theorem nói gì?

- A. Hệ phân tán luôn có cả Consistency, Availability, Partition tolerance
- B. Khi xảy ra phân mảnh mạng, hệ phân tán phải chọn giữa nhất quán và sẵn sàng
- C. Mọi key-value store đều nhất quán mạnh
- D. Chỉ áp dụng cho database một máy

<details><summary>Đáp án</summary>

**B** — Nhiều key-value store chọn Availability và chấp nhận eventual consistency.

</details>

**Câu 11.** Trong PageRank, node không có cạnh nào trỏ tới (E trong bd_edge) có rank bao nhiêu sau một vòng (d = 0.85, N = 5)?

- A. 0
- B. (1 − 0.85)/5 = 0.03
- C. 0.2
- D. 1

<details><summary>Đáp án</summary>

**B** — Không có hàng xóm trỏ tới nên chỉ còn phần (1 − d)/N.

</details>

## 3. Câu hỏi tự luận (9 câu)

**Câu 1.** 

> **Exercise 10.1.** You must store a very large number of small files, each about 2 kilobytes. Choosing between a distributed file system and a distributed key-value store, which would you pick? Explain why.

**PE 10.1.** Lưu rất nhiều file nhỏ (~2 KB): chọn distributed file system hay distributed key-value store? Vì sao?

<details><summary>Gợi ý đáp án</summary>

Chọn **key-value store**. Distributed file system (HDFS, GFS) được thiết kế cho **số lượng vừa phải các file rất lớn**: dữ liệu chia thành block hàng chục–hàng trăm MB, và NameNode giữ metadata của **mọi** file trong bộ nhớ. Với hàng tỉ file 2 KB, mỗi file vẫn tốn một mục metadata (và một block), NameNode quá tải, đọc/ghi từng file nhỏ có overhead lớn → lãng phí và chậm. Key-value store lưu mỗi file là một value nhỏ theo khoá, phân tán và nhân bản theo khoá, get/put một value nhỏ rất hiệu quả.

</details>

**Câu 2.** 

> **Exercise 10.2.** Data about a very large number of students is to be kept in a distributed document store such as MongoDB, where each student’s data corresponds to the data in the *student* and *takes* relations. How would you represent this data so that all the data of one particular student can be accessed efficiently? Show an example of the representation for one student.

**PE 10.2.** Lưu dữ liệu student và takes của rất nhiều sinh viên trong document store (MongoDB) sao cho lấy toàn bộ dữ liệu của một sinh viên hiệu quả. Biểu diễn thế nào? Cho ví dụ.

<details><summary>Gợi ý đáp án</summary>

Mỗi sinh viên là **một document JSON**, khoá là ID; các tuple takes của sinh viên đó **lồng** bên trong thành một mảng object. Một lần get theo ID trả về mọi thứ, không cần join, và toàn bộ document nằm trên cùng một máy.

```json
{
  "ID": "12345", "name": "Shankar", "dept_name": "Comp. Sci.", "tot_cred": 32,
  "takes": [
    { "course_id": "CS-101", "sec_id": "1", "semester": "Fall",   "year": 2017, "grade": "C" },
    { "course_id": "CS-347", "sec_id": "1", "semester": "Fall",   "year": 2017, "grade": "A" },
    { "course_id": "CS-190", "sec_id": "2", "semester": "Spring", "year": 2017, "grade": "A" },
    { "course_id": "CS-315", "sec_id": "1", "semester": "Spring", "year": 2018, "grade": "A" }
  ]
}
```
Bảng `bd_student_doc` trong lab chứa đúng các document như vậy (bài CH10.07–CH10.10). Đổi lại, truy vấn "mọi sinh viên học CS-101" phải quét mọi document (hoặc cần index trên `takes.course_id`).

</details>

**Câu 3.** 

> **Exercise 10.3.** Utility bills of a large number of users are to be stored; each bill is identified by a customer ID and a date. Queries ask for the bills of a given customer within a given date range. How would you store the bills in a key-value store that supports range queries?

**PE 10.3.** Lưu hoá đơn (định danh bằng customer ID và ngày) trong key-value store hỗ trợ range query, khi truy vấn hỏi hoá đơn của một khách trong một khoảng ngày.

<details><summary>Gợi ý đáp án</summary>

Dùng khoá **ghép**: customer ID nối với ngày ở dạng **năm/tháng/ngày** (để thứ tự chuỗi trùng thứ tự thời gian), ví dụ `C1/2018/02/28`. Các hoá đơn của một khách nằm liền nhau và theo thứ tự ngày, nên "C1 từ 2018-02-01 tới 2018-03-31" là range query `key between 'C1/2018/02/01' and 'C1/2018/03/31'`.

Lưu ý: cần dấu phân cách (hoặc độ dài ID cố định) để khoá của C10 không xen vào giữa các khoá của C1; với `/` thì `'C1/…' < 'C10…'` vì `/` đứng trước chữ số. Bài CH10.11.

</details>

**Câu 4.** 

> **Exercise 10.4.** Give pseudocode that computes the join r ⋈<sub>r.A=s.A</sub> s in a single MapReduce step. Assume map() is called on every tuple of both r and s, and that map() can obtain the name of the relation of its input via context.relname().

**PE 10.4.** Viết pseudocode tính r ⋈<sub>r.A=s.A</sub> s bằng một bước MapReduce, map() được gọi trên mọi tuple của r và s, lấy tên relation bằng context.relname().

<details><summary>Gợi ý đáp án</summary>

```
map(key, t):
    rel = context.relname()          // "r" hoặc "s"
    emit(t.A, (rel, t))              // khoá reduce = giá trị thuộc tính join

reduce(a, values):                   // mọi tuple của r và s có A = a
    rs = [t for (rel, t) in values if rel == "r"]
    ss = [t for (rel, t) in values if rel == "s"]
    for tr in rs:
        for ts in ss:
            emit(null, concat(tr, ts))
```
Shuffle đưa mọi tuple cùng giá trị A về cùng một reduce, nên reduce chỉ cần ghép chéo hai nhóm. Đây là **repartition (hash) join**. Bài CH10.12 mô phỏng đúng hai bước này bằng SQL.

</details>

**Câu 5.** 

> **Exercise 10.5.** The following Apache Spark snippet is meant to process very large data. What is the conceptual problem with it? (collect() returns a Java collection, and Java collections — from Java 8 on — support map and reduce.)
> 
> ```java
> JavaRDD<String> lines = sc.textFile("logDirectory");
> int totalLength = lines.collect().map(s -> s.length())
>                        .reduce(0, (a, b) -> a + b);
> ```

**PE 10.5.** Đoạn Spark `lines.collect().map(s -> s.length()).reduce(0, (a,b) -> a+b)` có vấn đề khái niệm gì?

<details><summary>Gợi ý đáp án</summary>

`collect()` là một **action** gom **toàn bộ** RDD về **một** máy (driver) thành Java collection. Sau đó map và reduce chạy trên collection đó, tức là **tuần tự trên một máy** chứ không song song trên cluster như mong muốn — và với dữ liệu rất lớn sẽ tràn bộ nhớ. Đúng: `lines.map(s -> s.length()).reduce((a, b) -> a + b)` trên RDD; chỉ kết quả cuối (một số) về driver. Tương đương SQL: `select sum(length(line)) from bd_log` (bài CH10.06).

</details>

**Câu 6.** 

> **Exercise 10.6.** Apache Spark:
> 
> a. How does Apache Spark carry out computations in parallel?
> 
> b. Explain what is meant by saying that Spark applies transformations on RDDs lazily.
> 
> c. What benefits does lazy evaluation of operations bring in Apache Spark?

**PE 10.6.** (a) Spark tính song song thế nào? (b) "Spark áp dụng transformation trên RDD một cách lazy" nghĩa là gì? (c) Lợi ích của lazy evaluation?

<details><summary>Gợi ý đáp án</summary>

a. RDD được **chia partition** trên nhiều máy; mỗi transformation (map, filter, join, reduceByKey…) chạy song song trên các partition, dữ liệu được chia lại (shuffle) khi cần.

b. Gọi transformation **không thực thi ngay**: Spark chỉ ghi lại phép toán vào một cây (lineage/DAG). Việc tính chỉ xảy ra khi cần kết quả bởi một **action** như `collect()`, `count()`, `saveAsTextFile()`.

c. Lợi ích:
- Có cả cây phép toán nên **tối ưu hoá** được (gộp phép, đổi thứ tự, đẩy filter xuống) giống query optimizer.
- **Pipeline**: kết quả của phép này chuyển thẳng sang phép sau trong bộ nhớ, không ghi đĩa giữa các bước (khác MapReduce).
- Không tính những gì không bao giờ được dùng; khi mất partition có thể tính lại từ lineage (fault tolerance).

</details>

**Câu 7.** 

> **Exercise 10.7.** For a collection of documents, let n<sub>i</sub> be the number of occurrences of word w<sub>i</sub> in the whole collection and N the total number of word occurrences over all documents. For every pair of consecutive words (w<sub>i</sub>, w<sub>j</sub>) in a document, let n<sub>i,j</sub> be the number of occurrences of that pair over all documents.
> 
> Write an Apache Spark program that, for a collection of documents in a directory, computes N, all pairs (w<sub>i</sub>, n<sub>i</sub>), and all pairs ((w<sub>i</sub>, w<sub>j</sub>), n<sub>i,j</sub>). Then output every word pair with n<sub>i,j</sub>/N ≥ 10 × (n<sub>i</sub>/N) × (n<sub>j</sub>/N) — pairs that occur at least 10 times as often as expected if the two words occurred independently.
> 
> The join operation on RDDs is useful in the last step to bring the related counts together. To keep it simple, ignore word pairs that span lines, and assume words are lowercase only and there is no punctuation.

**PE 10.7.** Viết chương trình Spark tính N, mọi (w<sub>i</sub>, n<sub>i</sub>), mọi ((w<sub>i</sub>, w<sub>j</sub>), n<sub>i,j</sub>) rồi xuất các cặp từ có n<sub>i,j</sub>/N ≥ 10 · (n<sub>i</sub>/N) · (n<sub>j</sub>/N).

<details><summary>Gợi ý đáp án</summary>

Ý tưởng (Java, Spark):
```java
JavaRDD<String> lines = sc.textFile("docDirectory");
JavaRDD<String[]> words = lines.map(l -> l.split(" "));

// n_i và N
JavaPairRDD<String, Long> wordCounts = words
    .flatMap(ws -> Arrays.asList(ws).iterator())
    .mapToPair(w -> new Tuple2<>(w, 1L))
    .reduceByKey(Long::sum);
long N = wordCounts.values().reduce(Long::sum);

// n_ij cho cặp từ liên tiếp trong cùng một dòng
JavaPairRDD<Tuple2<String, String>, Long> pairCounts = words
    .flatMap(ws -> { List<Tuple2<String, String>> p = new ArrayList<>();
                     for (int k = 0; k + 1 < ws.length; k++) p.add(new Tuple2<>(ws[k], ws[k + 1]));
                     return p.iterator(); })
    .mapToPair(p -> new Tuple2<>(p, 1L))
    .reduceByKey(Long::sum);

// join để mang n_i rồi n_j tới mỗi cặp
JavaPairRDD<String, Tuple2<String, Long>> byFirst =
    pairCounts.mapToPair(e -> new Tuple2<>(e._1()._1(), new Tuple2<>(e._1()._2(), e._2())));
JavaPairRDD<String, Tuple2<Tuple2<String, Long>, Long>> withNi = byFirst.join(wordCounts);
// (wi, ((wj, nij), ni)) -> (wj, (wi, nij, ni))
JavaPairRDD<String, Tuple3<String, Long, Long>> bySecond = withNi.mapToPair(e ->
    new Tuple2<>(e._2()._1()._1(), new Tuple3<>(e._1(), e._2()._1()._2(), e._2()._2())));
JavaPairRDD<String, Tuple2<Tuple3<String, Long, Long>, Long>> withNj = bySecond.join(wordCounts);

withNj.filter(e -> { double nij = e._2()._1()._2(), ni = e._2()._1()._3(), nj = e._2()._2();
                     return nij / N >= 10 * (ni / N) * (nj / N); })
      .map(e -> e._2()._1()._1() + " " + e._1())
      .saveAsTextFile("output");
```
Tách theo dòng nên tự động không có cặp vắt qua hai dòng. Điều kiện tương đương n<sub>i,j</sub> · N ≥ 10 · n<sub>i</sub> · n<sub>j</sub> (tránh chia). Bài CH10.05 làm đúng phép tính này bằng SQL.

</details>

**Câu 8.** 

> **Exercise 10.8.** Consider this query that uses the tumbling-window operator:
> 
> ```sql
> select item, System.Timestamp as window_end, sum(amount)
> from order timestamp by datetime
> group by itemid, tumblingwindow(hour, 1)
> ```
> 
> Write an equivalent query with ordinary SQL constructs, without the tumbling-window operator. You may assume a function to_seconds(timestamp) that converts a timestamp to the integer number of seconds since midnight, January 1, 1970, the usual arithmetic functions, and floor(a), which returns the largest integer ≤ a.

**PE 10.8.** Viết lại truy vấn dùng `tumblingwindow(hour, 1)` bằng SQL thông thường, với to_seconds(timestamp) và floor(a).

<details><summary>Gợi ý đáp án</summary>

Mỗi giờ là một cửa sổ: số thứ tự cửa sổ = `floor(to_seconds(datetime) / 3600)`; điểm cuối cửa sổ = `(số thứ tự + 1) * 3600`.
```sql
select itemid, (floor(to_seconds(datetime) / 3600) + 1) * 3600 as window_end, sum(amount)
from order
group by itemid, floor(to_seconds(datetime) / 3600)
```
(window_end ở đây là số giây; đổi lại thành timestamp nếu cần.) Trong PostgreSQL: `to_seconds` ≈ `extract(epoch from datetime)`, đổi ngược bằng `to_timestamp(...)` — bài CH10.15. Lưu ý sự kiện lúc đúng 10:00:00 thuộc cửa sổ 10:00–11:00, không thuộc cửa sổ kết thúc lúc 10:00.

</details>

**Câu 9.** 

> **Exercise 10.9.** The university schema is to be modeled as a graph. For each relation below, explain whether it would become a node or an edge: (i) *student*, (ii) *instructor*, (iii) *course*, (iv) *section*, (v) *takes*, (vi) *teaches*. Does the model capture the connections between sections and courses?

**PE 10.9.** Mô hình University thành đồ thị: student, instructor, course, section, takes, teaches là node hay edge? Có biểu diễn được liên kết section–course không?

<details><summary>Gợi ý đáp án</summary>

- **Node**: (i) student, (ii) instructor, (iii) course, (iv) section — đều là entity.
- **Edge**: (v) takes (student → section, thuộc tính grade), (vi) teaches (instructor → section).
- Liên kết section–course: trong lược đồ quan hệ, relationship sec_course đã được **gộp vào bảng section** (cột course_id là một phần khoá), nên với cách chuyển trên nó **không** trở thành edge. Muốn có cạnh section → course phải tách sec_course thành relation riêng (hoặc khai báo course_id của section là một edge). Bài CH10.18.

</details>

## 4. Bài tập SQL (21 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH10.01 | MapReduce word count | ★☆☆ | Bảng `bd_doc(doc_id, body)` chứa văn bản chữ thường, các từ cách nhau đúng một dấu cách. Viết word count kiểu MapReduce bằng SQL: map = tách mỗi body thành các từ (`regexp_split_to_table(body, ' ')`), reduce = đếm. Trả về `word` và `n` (số lần xuất hiện trong toàn bộ tập văn bản). |
| CH10.02 | top-k words | ★☆☆ | Tiếp CH10.01: chỉ trả về các từ xuất hiện ít nhất 2 lần, sắp theo `n` giảm dần, cùng `n` thì theo `word` tăng dần. |
| CH10.03 | inverted index | ★★☆ | Inverted index (chỉ mục ngược, dùng trong search engine) ánh xạ mỗi từ tới danh sách document chứa nó. Trả về `word` và `docs` — mảng các doc_id không trùng, tăng dần — chỉ cho các từ có mặt trong ít nhất 2 document. |
| CH10.04 | PE 10.7 N | ★☆☆ | Exercise 10.7. For a collection of documents, let n[i] be the number of occurrences of word w[i] in the whole collection and N the total number of word occurrences over all documents. For every pair of consecutive words (w[i], w[j]) in a document, let n[i,j] be the number of occurrences of that pair over all documents.  Write an Apache Spark program that, for a collection of documents in a directory, computes N, all pairs (w[i], n[i]), and all pairs ((w[i], w[j]), n[i,j]). Then output every word pair with n[i,j]/N ≥ 10 × (n[i]/N) × (n[j]/N) — pairs that occur at least 10 times as often as expected if the two words occurred independently.  The join operation on RDDs is useful in the last step to bring the related counts together. To keep it simple, ignore word pairs that span lines, and assume words are lowercase only and there is no punctuation.<br>Phần đầu của PE 10.7 trên `bd_doc`: trả về một dòng hai cột `total_words` = N (tổng số lần xuất hiện của mọi từ) và `distinct_words` (số từ khác nhau). |
| CH10.05 | PE 10.7 word pairs | ★★★ | Exercise 10.7. For a collection of documents, let n[i] be the number of occurrences of word w[i] in the whole collection and N the total number of word occurrences over all documents. For every pair of consecutive words (w[i], w[j]) in a document, let n[i,j] be the number of occurrences of that pair over all documents.  Write an Apache Spark program that, for a collection of documents in a directory, computes N, all pairs (w[i], n[i]), and all pairs ((w[i], w[j]), n[i,j]). Then output every word pair with n[i,j]/N ≥ 10 × (n[i]/N) × (n[j]/N) — pairs that occur at least 10 times as often as expected if the two words occurred independently.  The join operation on RDDs is useful in the last step to bring the related counts together. To keep it simple, ignore word pairs that span lines, and assume words are lowercase only and there is no punctuation.<br>PE 10.7 bằng SQL trên `bd_doc` (mỗi body là một dòng; không có cặp vắt qua hai document). Gọi n[i] là số lần xuất hiện của từ w[i], N là tổng số lần xuất hiện, n[i,j] là số lần cặp liên tiếp (w[i], w[j]) xuất hiện. Trả về `w1`, `w2`, `n` (= n[i,j]) của mọi cặp thoả n[i,j]/N ≥ 10 · (n[i]/N) · (n[j]/N). |
| CH10.06 | PE 10.5 parallel sum | ★☆☆ | Exercise 10.5. The following Apache Spark snippet is meant to process very large data. What is the conceptual problem with it? (collect() returns a Java collection, and Java collections — from Java 8 on — support map and reduce.)  ```java JavaRDD lines = sc.textFile("logDirectory"); int totalLength = lines.collect().map(s -> s.length())                        .reduce(0, (a, b) -> a + b); ```<br>Phiên bản đúng của đoạn Spark trong PE 10.5: tính tổng độ dài (số ký tự) của mọi dòng trong `bd_log(line_no, line)` bằng một phép aggregate (mỗi dòng map thành độ dài, reduce bằng cộng). Trả về một cột `total_length`. |
| CH10.07 | PE 10.2 jsonb access | ★☆☆ | Exercise 10.2. Data about a very large number of students is to be kept in a distributed document store such as MongoDB, where each student’s data corresponds to the data in the *student* and *takes* relations. How would you represent this data so that all the data of one particular student can be accessed efficiently? Show an example of the representation for one student.<br>`bd_student_doc(id, doc jsonb)` lưu mỗi sinh viên thành một document như PE 10.2: `{"ID", "name", "dept_name", "tot_cred", "takes": [{course_id, sec_id, semester, year, grade}, …]}`. Lấy `name` (text) và `num_takes` (số phần tử của mảng takes) của sinh viên `12345` — chỉ dùng bd_student_doc. |
| CH10.08 | jsonb unnest | ★★☆ | Từ `bd_student_doc`, "bung" mảng takes thành dòng: trả về `id`, `course_id`, `year` (integer) của mọi môn mà sinh viên đạt điểm `A`. |
| CH10.09 | build a document | ★★☆ | Exercise 10.2. Data about a very large number of students is to be kept in a distributed document store such as MongoDB, where each student’s data corresponds to the data in the *student* and *takes* relations. How would you represent this data so that all the data of one particular student can be accessed efficiently? Show an example of the representation for one student.<br>Tạo view `bd_student_summary(id, doc)` từ bảng student và takes (không dùng bd_student_doc): với mỗi sinh viên, `doc` là jsonb `{"name": …, "courses": [...]}` trong đó courses là mảng các course_id không trùng, tăng dần sinh viên đã học (mảng rỗng `[]` nếu chưa học môn nào). Hệ thống đọc document của 45678 và 70557. |
| CH10.10 | jsonb containment | ★★☆ | Dùng toán tử chứa `@>` của jsonb để tìm `id` của mọi sinh viên trong `bd_student_doc` có học course `CS-101` (ở bất kỳ học kỳ nào). |
| CH10.11 | PE 10.3 composite key | ★★☆ | Exercise 10.3. Utility bills of a large number of users are to be stored; each bill is identified by a customer ID and a date. Queries ask for the bills of a given customer within a given date range. How would you store the bills in a key-value store that supports range queries?<br>Mô phỏng key-value store của PE 10.3. Tạo view `bd_bill_kv(key, amount)` từ `bd_bill(customer_id, bill_date, amount)`, với `key` = customer_id + `'/'` + ngày dạng `YYYY/MM/DD` (ví dụ `C1/2018/02/28`). Hệ thống chạy range query trên key: hoá đơn của C1 từ 2018/02/01 đến 2018/03/31 — kết quả không được lẫn hoá đơn của C10. |
| CH10.12 | PE 10.4 MapReduce join | ★★★ | Exercise 10.4. Give pseudocode that computes the join r ⋈[r.A=s.A] s in a single MapReduce step. Assume map() is called on every tuple of both r and s, and that map() can obtain the name of the relation of its input via context.relname().<br>Tính `bd_r ⋈ bd_s` theo r.a = s.a theo đúng hai bước MapReduce của PE 10.4 (không join thẳng hai bảng): 1. *map*: một CTE `map_out(key, rel, val)` = các tuple của bd_r thành (a, 'r', b) union all các tuple của bd_s thành (a, 's', c); 2. *reduce*: với mỗi key, ghép mọi val của 'r' với mọi val của 's'.  Trả về `a`, `b`, `c`. |
| CH10.13 | range partitioning | ★★☆ | Mô phỏng sharding theo range bằng declarative partitioning. Tạo bảng `bd_bill_month(customer_id varchar(5), bill_date date, amount numeric(8,2))` partition by range (bill_date) với 4 partition theo tháng của năm 2018: `bd_bill_m1` (tháng 1), `bd_bill_m2`, `bd_bill_m3`, `bd_bill_m4`; rồi chép toàn bộ bd_bill vào. Hệ thống đếm số dòng trong từng partition. |
| CH10.14 | hash partitioning | ★★☆ | Mô phỏng sharding theo hash của customer_id: tạo `bd_bill_hash(customer_id varchar(5), bill_date date, amount numeric(8,2))` partition by hash (customer_id) với 3 partition `bd_bill_h0`, `bd_bill_h1`, `bd_bill_h2` (modulus 3, remainder 0/1/2), rồi chép bd_bill vào. Hệ thống kiểm tra: tổng số dòng, và mọi hoá đơn của một khách nằm trong cùng một partition. |
| CH10.15 | PE 10.8 tumbling window | ★★☆ | Exercise 10.8. Consider this query that uses the tumbling-window operator:  ```sql select item, System.Timestamp as window_end, sum(amount) from order timestamp by datetime group by itemid, tumblingwindow(hour, 1) ```  Write an equivalent query with ordinary SQL constructs, without the tumbling-window operator. You may assume a function to_seconds(timestamp) that converts a timestamp to the integer number of seconds since midnight, January 1, 1970, the usual arithmetic functions, and floor(a), which returns the largest integer ≤ a.<br>PE 10.8 trên `bd_order(order_id, itemid, datetime, amount)`: tổng `amount` của mỗi item trong mỗi tumbling window 1 giờ. Trả về `itemid`, `window_end` (timestamp — thời điểm kết thúc cửa sổ, ví dụ đơn lúc 09:20 thuộc cửa sổ kết thúc 10:00, đơn lúc đúng 10:00:00 thuộc cửa sổ kết thúc 11:00) và `total`. Không dùng date_trunc/date_bin: dùng số giây `extract(epoch from datetime)` và `floor` như đề. |
| CH10.16 | stream: 30-min windows | ★★☆ | Đếm số đơn hàng (mọi item) trong mỗi tumbling window 30 phút tính từ `2019-05-01 00:00`. Trả về `window_start` (timestamp) và `num_orders`, chỉ các cửa sổ có đơn. |
| CH10.17 | sliding window | ★★★ | Sliding window quanh mỗi sự kiện: với mỗi đơn trong bd_order, trả về `order_id`, `itemid` và `last_hour` = tổng amount của cùng item trong khoảng 1 giờ tính tới thời điểm đơn đó (gồm cả đơn đó, tức các đơn có datetime trong (datetime − 1 giờ, datetime]). |
| CH10.18 | PE 10.9 graph edges | ★★☆ | Exercise 10.9. The university schema is to be modeled as a graph. For each relation below, explain whether it would become a node or an edge: (i) *student*, (ii) *instructor*, (iii) *course*, (iv) *section*, (v) *takes*, (vi) *teaches*. Does the model capture the connections between sections and courses?<br>Mô hình University thành đồ thị như PE 10.9. Tạo view `bd_univ_edge(src, label, dst)`: mỗi tuple takes thành cạnh (student ID, `'takes'`, section_key) và mỗi tuple teaches thành cạnh (instructor ID, `'teaches'`, section_key), với section_key = course_id-sec_id-semester-year nối bằng dấu `-` (ví dụ `CS-101-1-Fall-2017`). Hệ thống đếm số cạnh theo label và liệt kê các cạnh tới section `CS-190-2-Spring-2017`. |
| CH10.19 | degree | ★☆☆ | Đồ thị trang web `bd_node(node, label)`, `bd_edge(src, dst)`. Với mọi node, trả về `node`, `out_degree` (số cạnh đi ra) và `in_degree` (số cạnh đi vào), 0 nếu không có. |
| CH10.20 | reachability | ★★★ | Từ node `A`, tìm mọi node khác A đến được theo các cạnh của bd_edge cùng số bước ngắn nhất `hops`. Đồ thị có chu trình (A → B → C → A) nên phải giới hạn độ sâu (ví dụ tối đa 5 bước) hoặc chặn lặp. |
| CH10.21 | PageRank iteration | ★★★ | Một vòng lặp PageRank trên bd_node/bd_edge, bắt đầu từ rank đều 1/N (N = số node, kể cả node không có cạnh). Với d = 0.85:  rank(v) = (1 − d)/N + d · Σ[u→v] rank(u)/outdeg(u)  Trả về `node` và `rank` làm tròn 4 chữ số cho mọi node. |
