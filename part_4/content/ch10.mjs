export default {
  number: 10,
  slug: 'ch10_big_data',
  title: 'Big Data',
  titleVi: 'Dữ liệu lớn (Big Data)',

  summary: `
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
- Thiết kế khoá rất quan trọng: muốn range query theo (customer, date) thì ghép khoá \`customer_id/yyyy/mm/dd\` (PE 10.3).

Distributed file system hợp với **ít file nhưng rất lớn**; với rất nhiều file nhỏ thì key-value store tốt hơn vì mỗi block DFS lớn hàng MB, và NameNode phải giữ metadata của từng file (PE 10.1).

Trong PostgreSQL, \`jsonb\` cho phép mô phỏng document store: \`doc->'takes'\`, \`doc->>'name'\`, \`jsonb_array_elements\`, toán tử chứa \`@>\`. **Declarative partitioning** (\`partition by range / hash / list\`) mô phỏng sharding trong một máy.

### 3. MapReduce (slide 10.21–10.35)
Mô hình lập trình song song cho tác vụ xử lý hàng loạt (batch):
- **map(k, v)** → danh sách cặp (k', v'): chạy song song trên từng phần của input.
- Hệ thống **shuffle/sort**: gom mọi giá trị có cùng k' về cùng một máy.
- **reduce(k', danh sách v')** → kết quả: chạy song song theo từng khoá.

Ví dụ word count:
\`\`\`
map(doc_id, text):     for each word w in text: emit(w, 1)
reduce(w, values):     emit(w, sum(values))
\`\`\`
Tương đương SQL: \`select word, count(*) from words group by word\` — map ≈ tách và chiếu, shuffle ≈ group by, reduce ≈ hàm aggregate.

Join bằng MapReduce (PE 10.4): map phát ra (giá trị A, (tên relation, tuple)) cho cả r và s; reduce nhận mọi tuple cùng A, chia thành nhóm r và nhóm s rồi phát ra mọi cặp (r-tuple, s-tuple).

Hadoop là hiện thực mã nguồn mở của MapReduce (đọc/ghi HDFS). Viết MapReduce trực tiếp tốn công nên có các ngôn ngữ cấp cao dịch sang nó: **Hive** (HiveQL giống SQL), **Pig**.

Hạn chế: mỗi bước MapReduce ghi kết quả ra đĩa; chuỗi nhiều bước (join, lặp như PageRank) chậm.

### 4. Algebraic operations — Apache Spark (slide 10.36–10.45)
- **RDD** (Resilient Distributed Dataset): tập dữ liệu chia partition trên nhiều máy; mỗi **transformation** (map, filter, join, reduceByKey, groupByKey…) chạy song song trên các partition.
- **Lazy evaluation**: transformation chỉ xây dựng **cây biểu thức** (lineage); chỉ khi gọi **action** (\`collect()\`, \`count()\`, \`saveAsTextFile()\`) Spark mới thực thi. Lợi ích: tối ưu hoá cả cây (giống query optimizer), **pipeline** dữ liệu giữa các phép mà không ghi đĩa, tính lại partition hỏng nhờ lineage.
- Giữ dữ liệu trong **bộ nhớ** giữa các bước → nhanh hơn MapReduce nhiều cho tác vụ lặp.
- **DataFrame / Dataset** và **Spark SQL**: dữ liệu có schema, truy vấn bằng SQL, có optimizer.
- Cạm bẫy (PE 10.5): \`collect()\` kéo **toàn bộ** RDD về một máy driver — mọi tính toán sau đó (map, reduce trên Java collection) chạy tuần tự trên một máy, và có thể tràn bộ nhớ. Phải gọi \`lines.map(...).reduce(...)\` trên RDD.

### 5. Streaming data (slide 10.46–10.55)
Dữ liệu đến liên tục, không có "điểm kết thúc": giao dịch thẻ, cảm biến, log, giá chứng khoán.
- **Continuous query**: truy vấn chạy mãi, cho kết quả mỗi khi có dữ liệu mới.
- **Window**: chỉ tính trên một cửa sổ thời gian.
  - **Tumbling window**: cửa sổ cố định không chồng nhau (mỗi giờ một cửa sổ).
  - **Hopping window**: kích thước cố định, trượt theo bước nhỏ hơn kích thước (chồng nhau).
  - **Sliding window**: cửa sổ quanh mỗi sự kiện (ví dụ 10 phút trước sự kiện).
  - **Session window**: nhóm các sự kiện cách nhau không quá một khoảng.
- Tumbling window bằng SQL thường (PE 10.8): \`group by itemid, floor(to_seconds(datetime) / 3600)\`; điểm cuối cửa sổ = \`(floor(...) + 1) * 3600\`. Trong PostgreSQL dùng \`extract(epoch from ...)\` hoặc \`date_bin\`/\`date_trunc\`.
- Hệ thống: **publish-subscribe** (Apache **Kafka**) chuyển dòng sự kiện; xử lý dòng bằng Apache Storm, Flink, Spark Streaming. **Lambda architecture**: một nhánh xử lý batch chính xác + một nhánh stream nhanh, gộp kết quả.

### 6. Graph databases (slide 10.56–10.62)
- Dữ liệu là **node** (thực thể) và **edge** (quan hệ), cả hai có thể có thuộc tính. Ví dụ Neo4j với ngôn ngữ **Cypher**: \`match (i:instructor)<-[:advisor]-(s:student) return i.name, s.name\`.
- Trong mô hình quan hệ: entity → node, relationship (takes, teaches, advisor) → edge (PE 10.9). Liên kết section–course bị gộp vào bảng section (cột course_id), nên muốn có cạnh section → course phải tách thành relation riêng.
- Truy vấn đường đi/reachability trong SQL dùng **recursive query** (\`with recursive\`, Chương 5).
- Xử lý đồ thị lớn song song: **Pregel** / Apache Giraph, GraphX — mô hình **bulk synchronous**: mỗi vòng (superstep) mỗi node nhận message, cập nhật trạng thái, gửi message cho hàng xóm. Ví dụ **PageRank**: rank(v) = (1 − d)/N + d · Σ<sub>u→v</sub> rank(u)/outdeg(u), lặp tới khi hội tụ (d thường = 0.85).

### 7. Ghi nhớ nhanh
| Câu hỏi | Trả lời ngắn |
|---|---|
| Nhiều file nhỏ? | Key-value store, không phải DFS |
| Truy cập mọi dữ liệu của một sinh viên nhanh? | Một document: thông tin student + mảng takes lồng bên trong |
| Range query theo (khách, ngày)? | Khoá ghép \`customer_id/yyyy/mm/dd\` |
| Join trong MapReduce? | Khoá reduce = thuộc tính join, kèm tên relation |
| Vì sao \`collect().map\` sai? | Gom về một máy, mất song song |
| Lazy evaluation? | Chỉ chạy khi có action; cho phép tối ưu và pipeline |
| Tumbling window bằng SQL? | group by floor(seconds / kích thước cửa sổ) |
| takes trong graph? | Edge giữa student và section |
`,

  quiz: [
    {
      q: 'Chữ V nào của Big Data nói về việc dữ liệu đến liên tục với tốc độ cao?',
      options: ['Volume', 'Velocity', 'Variety', 'Veracity'],
      answer: 1,
      explain: 'Velocity = tốc độ đến của dữ liệu (stream).',
    },
    {
      q: 'Vì sao HDFS không phù hợp để lưu hàng tỉ file 2 KB?',
      options: [
        'HDFS không hỗ trợ file nhỏ hơn 1 MB',
        'Mỗi file chiếm ít nhất một block lớn và NameNode phải giữ metadata cho từng file',
        'HDFS không nhân bản dữ liệu',
        'HDFS chỉ lưu được JSON',
      ],
      answer: 1,
      explain: 'DFS thiết kế cho số lượng vừa phải các file rất lớn (PE 10.1).',
    },
    {
      q: 'Key-value store hỗ trợ range query theo khoá. Khoá nào giúp lấy hoá đơn của khách C1 trong một khoảng ngày?',
      options: ['yyyy/mm/dd/customer_id', 'customer_id/yyyy/mm/dd', 'amount/customer_id', 'Một số ngẫu nhiên'],
      answer: 1,
      explain: 'Khoá bắt đầu bằng customer_id rồi tới ngày dạng năm/tháng/ngày → các hoá đơn của một khách nằm liền nhau và theo thứ tự ngày (PE 10.3).',
    },
    {
      q: 'Trong word count bằng MapReduce, hàm reduce nhận gì?',
      options: ['Một document', 'Một từ và danh sách các số 1 được phát cho từ đó', 'Toàn bộ tập dữ liệu', 'Một cặp (doc_id, từ)'],
      answer: 1,
      explain: 'Shuffle gom mọi cặp (w, 1) cùng w về một reduce; reduce cộng lại.',
    },
    {
      q: 'Phép SQL nào tương ứng với bước shuffle của MapReduce?',
      options: ['where', 'group by', 'order by', 'union'],
      answer: 1,
      explain: 'Shuffle gom các giá trị theo khoá, giống group by; reduce giống hàm aggregate.',
    },
    {
      q: 'Spark "lazy evaluation" nghĩa là gì?',
      options: [
        'Spark chạy chậm để tiết kiệm điện',
        'Transformation chỉ được ghi lại; chỉ thực thi khi gọi một action như collect() hay count()',
        'Spark không bao giờ ghi ra đĩa',
        'Mỗi transformation chạy trên một máy',
      ],
      answer: 1,
      explain: 'Nhờ vậy Spark tối ưu được cả cây phép toán và pipeline dữ liệu (PE 10.6).',
    },
    {
      q: '`lines.collect().map(s -> s.length()).reduce(0, (a, b) -> a + b)` có vấn đề gì?',
      options: ['Sai cú pháp Java', 'collect() đưa mọi dòng về driver nên map/reduce chạy trên một máy', 'reduce không có giá trị khởi tạo', 'Không có vấn đề'],
      answer: 1,
      explain: 'Phải gọi map/reduce trên RDD để chạy song song (PE 10.5).',
    },
    {
      q: 'Tumbling window 1 giờ khác hopping window 1 giờ bước 15 phút thế nào?',
      options: [
        'Tumbling không chồng nhau; hopping chồng nhau (một sự kiện thuộc nhiều cửa sổ)',
        'Tumbling chồng nhau; hopping không chồng nhau',
        'Cả hai giống nhau',
        'Hopping chỉ dùng cho graph',
      ],
      answer: 0,
      explain: 'Hopping trượt bước nhỏ hơn kích thước nên các cửa sổ chồng lên nhau.',
    },
    {
      q: 'Khi mô hình University thành đồ thị, takes là gì?',
      options: ['Node', 'Edge giữa student và section', 'Thuộc tính của course', 'Không biểu diễn được'],
      answer: 1,
      explain: 'Relationship → edge; entity (student, section) → node (PE 10.9).',
    },
    {
      q: 'CAP theorem nói gì?',
      options: [
        'Hệ phân tán luôn có cả Consistency, Availability, Partition tolerance',
        'Khi xảy ra phân mảnh mạng, hệ phân tán phải chọn giữa nhất quán và sẵn sàng',
        'Mọi key-value store đều nhất quán mạnh',
        'Chỉ áp dụng cho database một máy',
      ],
      answer: 1,
      explain: 'Nhiều key-value store chọn Availability và chấp nhận eventual consistency.',
    },
    {
      q: 'Trong PageRank, node không có cạnh nào trỏ tới (E trong bd_edge) có rank bao nhiêu sau một vòng (d = 0.85, N = 5)?',
      options: ['0', '(1 − 0.85)/5 = 0.03', '0.2', '1'],
      answer: 1,
      explain: 'Không có hàng xóm trỏ tới nên chỉ còn phần (1 − d)/N.',
    },
  ],

  questions: [
    {
      pe: '10.1',
      q: '**PE 10.1.** Lưu rất nhiều file nhỏ (~2 KB): chọn distributed file system hay distributed key-value store? Vì sao?',
      answer: `Chọn **key-value store**. Distributed file system (HDFS, GFS) được thiết kế cho **số lượng vừa phải các file rất lớn**: dữ liệu chia thành block hàng chục–hàng trăm MB, và NameNode giữ metadata của **mọi** file trong bộ nhớ. Với hàng tỉ file 2 KB, mỗi file vẫn tốn một mục metadata (và một block), NameNode quá tải, đọc/ghi từng file nhỏ có overhead lớn → lãng phí và chậm. Key-value store lưu mỗi file là một value nhỏ theo khoá, phân tán và nhân bản theo khoá, get/put một value nhỏ rất hiệu quả.`,
    },
    {
      pe: '10.2',
      q: '**PE 10.2.** Lưu dữ liệu student và takes của rất nhiều sinh viên trong document store (MongoDB) sao cho lấy toàn bộ dữ liệu của một sinh viên hiệu quả. Biểu diễn thế nào? Cho ví dụ.',
      answer: `Mỗi sinh viên là **một document JSON**, khoá là ID; các tuple takes của sinh viên đó **lồng** bên trong thành một mảng object. Một lần get theo ID trả về mọi thứ, không cần join, và toàn bộ document nằm trên cùng một máy.

\`\`\`json
{
  "ID": "12345", "name": "Shankar", "dept_name": "Comp. Sci.", "tot_cred": 32,
  "takes": [
    { "course_id": "CS-101", "sec_id": "1", "semester": "Fall",   "year": 2017, "grade": "C" },
    { "course_id": "CS-347", "sec_id": "1", "semester": "Fall",   "year": 2017, "grade": "A" },
    { "course_id": "CS-190", "sec_id": "2", "semester": "Spring", "year": 2017, "grade": "A" },
    { "course_id": "CS-315", "sec_id": "1", "semester": "Spring", "year": 2018, "grade": "A" }
  ]
}
\`\`\`
Bảng \`bd_student_doc\` trong lab chứa đúng các document như vậy (bài CH10.07–CH10.10). Đổi lại, truy vấn "mọi sinh viên học CS-101" phải quét mọi document (hoặc cần index trên \`takes.course_id\`).`,
    },
    {
      pe: '10.3',
      q: '**PE 10.3.** Lưu hoá đơn (định danh bằng customer ID và ngày) trong key-value store hỗ trợ range query, khi truy vấn hỏi hoá đơn của một khách trong một khoảng ngày.',
      answer: `Dùng khoá **ghép**: customer ID nối với ngày ở dạng **năm/tháng/ngày** (để thứ tự chuỗi trùng thứ tự thời gian), ví dụ \`C1/2018/02/28\`. Các hoá đơn của một khách nằm liền nhau và theo thứ tự ngày, nên "C1 từ 2018-02-01 tới 2018-03-31" là range query \`key between 'C1/2018/02/01' and 'C1/2018/03/31'\`.

Lưu ý: cần dấu phân cách (hoặc độ dài ID cố định) để khoá của C10 không xen vào giữa các khoá của C1; với \`/\` thì \`'C1/…' < 'C10…'\` vì \`/\` đứng trước chữ số. Bài CH10.11.`,
    },
    {
      pe: '10.4',
      q: '**PE 10.4.** Viết pseudocode tính r ⋈<sub>r.A=s.A</sub> s bằng một bước MapReduce, map() được gọi trên mọi tuple của r và s, lấy tên relation bằng context.relname().',
      answer: `\`\`\`
map(key, t):
    rel = context.relname()          // "r" hoặc "s"
    emit(t.A, (rel, t))              // khoá reduce = giá trị thuộc tính join

reduce(a, values):                   // mọi tuple của r và s có A = a
    rs = [t for (rel, t) in values if rel == "r"]
    ss = [t for (rel, t) in values if rel == "s"]
    for tr in rs:
        for ts in ss:
            emit(null, concat(tr, ts))
\`\`\`
Shuffle đưa mọi tuple cùng giá trị A về cùng một reduce, nên reduce chỉ cần ghép chéo hai nhóm. Đây là **repartition (hash) join**. Bài CH10.12 mô phỏng đúng hai bước này bằng SQL.`,
    },
    {
      pe: '10.5',
      q: '**PE 10.5.** Đoạn Spark `lines.collect().map(s -> s.length()).reduce(0, (a,b) -> a+b)` có vấn đề khái niệm gì?',
      answer: `\`collect()\` là một **action** gom **toàn bộ** RDD về **một** máy (driver) thành Java collection. Sau đó map và reduce chạy trên collection đó, tức là **tuần tự trên một máy** chứ không song song trên cluster như mong muốn — và với dữ liệu rất lớn sẽ tràn bộ nhớ. Đúng: \`lines.map(s -> s.length()).reduce((a, b) -> a + b)\` trên RDD; chỉ kết quả cuối (một số) về driver. Tương đương SQL: \`select sum(length(line)) from bd_log\` (bài CH10.06).`,
    },
    {
      pe: '10.6',
      q: '**PE 10.6.** (a) Spark tính song song thế nào? (b) "Spark áp dụng transformation trên RDD một cách lazy" nghĩa là gì? (c) Lợi ích của lazy evaluation?',
      answer: `a. RDD được **chia partition** trên nhiều máy; mỗi transformation (map, filter, join, reduceByKey…) chạy song song trên các partition, dữ liệu được chia lại (shuffle) khi cần.

b. Gọi transformation **không thực thi ngay**: Spark chỉ ghi lại phép toán vào một cây (lineage/DAG). Việc tính chỉ xảy ra khi cần kết quả bởi một **action** như \`collect()\`, \`count()\`, \`saveAsTextFile()\`.

c. Lợi ích:
- Có cả cây phép toán nên **tối ưu hoá** được (gộp phép, đổi thứ tự, đẩy filter xuống) giống query optimizer.
- **Pipeline**: kết quả của phép này chuyển thẳng sang phép sau trong bộ nhớ, không ghi đĩa giữa các bước (khác MapReduce).
- Không tính những gì không bao giờ được dùng; khi mất partition có thể tính lại từ lineage (fault tolerance).`,
    },
    {
      pe: '10.7',
      q: '**PE 10.7.** Viết chương trình Spark tính N, mọi (w<sub>i</sub>, n<sub>i</sub>), mọi ((w<sub>i</sub>, w<sub>j</sub>), n<sub>i,j</sub>) rồi xuất các cặp từ có n<sub>i,j</sub>/N ≥ 10 · (n<sub>i</sub>/N) · (n<sub>j</sub>/N).',
      answer: `Ý tưởng (Java, Spark):
\`\`\`java
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
\`\`\`
Tách theo dòng nên tự động không có cặp vắt qua hai dòng. Điều kiện tương đương n<sub>i,j</sub> · N ≥ 10 · n<sub>i</sub> · n<sub>j</sub> (tránh chia). Bài CH10.05 làm đúng phép tính này bằng SQL.`,
    },
    {
      pe: '10.8',
      q: '**PE 10.8.** Viết lại truy vấn dùng `tumblingwindow(hour, 1)` bằng SQL thông thường, với to_seconds(timestamp) và floor(a).',
      answer: `Mỗi giờ là một cửa sổ: số thứ tự cửa sổ = \`floor(to_seconds(datetime) / 3600)\`; điểm cuối cửa sổ = \`(số thứ tự + 1) * 3600\`.
\`\`\`sql
select itemid, (floor(to_seconds(datetime) / 3600) + 1) * 3600 as window_end, sum(amount)
from order
group by itemid, floor(to_seconds(datetime) / 3600)
\`\`\`
(window_end ở đây là số giây; đổi lại thành timestamp nếu cần.) Trong PostgreSQL: \`to_seconds\` ≈ \`extract(epoch from datetime)\`, đổi ngược bằng \`to_timestamp(...)\` — bài CH10.15. Lưu ý sự kiện lúc đúng 10:00:00 thuộc cửa sổ 10:00–11:00, không thuộc cửa sổ kết thúc lúc 10:00.`,
    },
    {
      pe: '10.9',
      q: '**PE 10.9.** Mô hình University thành đồ thị: student, instructor, course, section, takes, teaches là node hay edge? Có biểu diễn được liên kết section–course không?',
      answer: `- **Node**: (i) student, (ii) instructor, (iii) course, (iv) section — đều là entity.
- **Edge**: (v) takes (student → section, thuộc tính grade), (vi) teaches (instructor → section).
- Liên kết section–course: trong lược đồ quan hệ, relationship sec_course đã được **gộp vào bảng section** (cột course_id là một phần khoá), nên với cách chuyển trên nó **không** trở thành edge. Muốn có cạnh section → course phải tách sec_course thành relation riêng (hoặc khai báo course_id của section là một edge). Bài CH10.18.`,
    },
  ],

  exercises: [
    // ---------------- MapReduce ----------------
    {
      id: 'CH10.01', topic: 'MapReduce word count', level: 1,
      prompt: 'Bảng `bd_doc(doc_id, body)` chứa văn bản chữ thường, các từ cách nhau đúng một dấu cách. Viết **word count** kiểu MapReduce bằng SQL: map = tách mỗi body thành các từ (`regexp_split_to_table(body, \' \')`), reduce = đếm. Trả về `word` và `n` (số lần xuất hiện trong toàn bộ tập văn bản).',
      hint: '`from bd_doc, regexp_split_to_table(body, \' \') as word group by word`',
      solution: `select word, count(*) as n
from bd_doc, regexp_split_to_table(body, ' ') as word
group by word;`,
    },
    {
      id: 'CH10.02', topic: 'top-k words', level: 1,
      prompt: 'Tiếp CH10.01: chỉ trả về các từ xuất hiện **ít nhất 2 lần**, sắp theo `n` giảm dần, cùng `n` thì theo `word` tăng dần.',
      solution: `select word, count(*) as n
from bd_doc, regexp_split_to_table(body, ' ') as word
group by word
having count(*) >= 2
order by n desc, word;`,
      ordered: true,
    },
    {
      id: 'CH10.03', topic: 'inverted index', level: 2,
      prompt: '**Inverted index** (chỉ mục ngược, dùng trong search engine) ánh xạ mỗi từ tới danh sách document chứa nó. Trả về `word` và `docs` — mảng các doc_id **không trùng, tăng dần** — chỉ cho các từ có mặt trong **ít nhất 2 document**.',
      hint: '`array_agg(distinct doc_id order by doc_id)`; điều kiện đặt ở having với `count(distinct doc_id)`.',
      solution: `select word, array_agg(distinct doc_id order by doc_id) as docs
from bd_doc, regexp_split_to_table(body, ' ') as word
group by word
having count(distinct doc_id) >= 2;`,
    },
    {
      id: 'CH10.04', topic: 'PE 10.7 N', level: 1, pe: '10.7',
      prompt: 'Phần đầu của PE 10.7 trên `bd_doc`: trả về **một dòng hai cột** `total_words` = N (tổng số lần xuất hiện của mọi từ) và `distinct_words` (số từ khác nhau).',
      solution: `select count(*) as total_words, count(distinct word) as distinct_words
from bd_doc, regexp_split_to_table(body, ' ') as word;`,
    },
    {
      id: 'CH10.05', topic: 'PE 10.7 word pairs', level: 3, pe: '10.7',
      prompt: `PE 10.7 bằng SQL trên \`bd_doc\` (mỗi body là một dòng; không có cặp vắt qua hai document). Gọi n<sub>i</sub> là số lần xuất hiện của từ w<sub>i</sub>, N là tổng số lần xuất hiện, n<sub>i,j</sub> là số lần cặp **liên tiếp** (w<sub>i</sub>, w<sub>j</sub>) xuất hiện. Trả về \`w1\`, \`w2\`, \`n\` (= n<sub>i,j</sub>) của mọi cặp thoả n<sub>i,j</sub>/N ≥ 10 · (n<sub>i</sub>/N) · (n<sub>j</sub>/N).`,
      hint: '`regexp_split_to_table(body, \' \') with ordinality as t(word, pos)` cho vị trí từ; cặp liên tiếp: self-join cùng doc_id và `b.pos = a.pos + 1`. Ép numeric để không chia nguyên.',
      solution: `with w as (
  select doc_id, pos, word
  from bd_doc, regexp_split_to_table(body, ' ') with ordinality as t(word, pos)),
tot as (select count(*)::numeric as n from w),
uni as (select word, count(*) as n from w group by word),
bi  as (select a.word as w1, b.word as w2, count(*) as n
        from w a join w b on a.doc_id = b.doc_id and b.pos = a.pos + 1
        group by a.word, b.word)
select bi.w1, bi.w2, bi.n
from bi
join uni u1 on u1.word = bi.w1
join uni u2 on u2.word = bi.w2,
tot
where bi.n / tot.n >= 10 * (u1.n / tot.n) * (u2.n / tot.n);`,
    },
    {
      id: 'CH10.06', topic: 'PE 10.5 parallel sum', level: 1, pe: '10.5',
      prompt: 'Phiên bản **đúng** của đoạn Spark trong PE 10.5: tính tổng độ dài (số ký tự) của mọi dòng trong `bd_log(line_no, line)` bằng một phép aggregate (mỗi dòng map thành độ dài, reduce bằng cộng). Trả về một cột `total_length`.',
      solution: `select sum(length(line)) as total_length from bd_log;`,
    },
    // ---------------- Document store ----------------
    {
      id: 'CH10.07', topic: 'PE 10.2 jsonb access', level: 1, pe: '10.2',
      prompt: '`bd_student_doc(id, doc jsonb)` lưu mỗi sinh viên thành một document như PE 10.2: `{"ID", "name", "dept_name", "tot_cred", "takes": [{course_id, sec_id, semester, year, grade}, …]}`. Lấy `name` (text) và `num_takes` (số phần tử của mảng takes) của sinh viên `12345` — **chỉ dùng bd_student_doc**.',
      hint: '`doc->>\'name\'`, `jsonb_array_length(doc->\'takes\')`.',
      solution: `select doc->>'name' as name, jsonb_array_length(doc->'takes') as num_takes
from bd_student_doc
where id = '12345';`,
    },
    {
      id: 'CH10.08', topic: 'jsonb unnest', level: 2,
      prompt: 'Từ `bd_student_doc`, "bung" mảng takes thành dòng: trả về `id`, `course_id`, `year` (integer) của mọi môn mà sinh viên đạt điểm `A`.',
      hint: '`cross join lateral jsonb_array_elements(doc->\'takes\') as t(e)`; `(e->>\'year\')::int`.',
      solution: `select d.id, t.e->>'course_id' as course_id, (t.e->>'year')::int as year
from bd_student_doc d
cross join lateral jsonb_array_elements(d.doc->'takes') as t(e)
where t.e->>'grade' = 'A';`,
    },
    {
      id: 'CH10.09', topic: 'build a document', level: 2, pe: '10.2',
      prompt: 'Tạo view `bd_student_summary(id, doc)` từ bảng **student** và **takes** (không dùng bd_student_doc): với mỗi sinh viên, `doc` là jsonb `{"name": …, "courses": [...]}` trong đó courses là mảng các course_id **không trùng, tăng dần** sinh viên đã học (mảng rỗng `[]` nếu chưa học môn nào). Hệ thống đọc document của 45678 và 70557.',
      hint: '`jsonb_build_object`, `coalesce((select jsonb_agg(distinct course_id order by course_id) from takes where ...), \'[]\'::jsonb)`.',
      solution: `create view bd_student_summary (id, doc) as
select s.ID,
       jsonb_build_object(
         'name', s.name,
         'courses', coalesce((select jsonb_agg(distinct t.course_id order by t.course_id)
                              from takes t where t.ID = s.ID), '[]'::jsonb))
from student s;`,
      check: `select id, doc::text as doc from bd_student_summary where id in ('45678', '70557') order by id;`,
    },
    {
      id: 'CH10.10', topic: 'jsonb containment', level: 2,
      prompt: 'Dùng toán tử chứa `@>` của jsonb để tìm `id` của mọi sinh viên trong `bd_student_doc` có học course `CS-101` (ở bất kỳ học kỳ nào).',
      hint: '`doc->\'takes\' @> \'[{"course_id": "CS-101"}]\'`',
      solution: `select id from bd_student_doc
where doc->'takes' @> '[{"course_id": "CS-101"}]';`,
    },
    // ---------------- Key-value store, sharding ----------------
    {
      id: 'CH10.11', topic: 'PE 10.3 composite key', level: 2, pe: '10.3',
      prompt: 'Mô phỏng key-value store của PE 10.3. Tạo view `bd_bill_kv(key, amount)` từ `bd_bill(customer_id, bill_date, amount)`, với `key` = customer_id + `\'/\'` + ngày dạng `YYYY/MM/DD` (ví dụ `C1/2018/02/28`). Hệ thống chạy **range query trên key**: hoá đơn của C1 từ 2018/02/01 đến 2018/03/31 — kết quả không được lẫn hoá đơn của C10.',
      hint: '`customer_id || \'/\' || to_char(bill_date, \'YYYY/MM/DD\')`',
      solution: `create view bd_bill_kv (key, amount) as
select customer_id || '/' || to_char(bill_date, 'YYYY/MM/DD'), amount
from bd_bill;`,
      check: `select key, amount from bd_bill_kv
where key between 'C1/2018/02/01' and 'C1/2018/03/31' order by key;`,
    },
    {
      id: 'CH10.12', topic: 'PE 10.4 MapReduce join', level: 3, pe: '10.4',
      prompt: `Tính \`bd_r ⋈ bd_s\` theo r.a = s.a **theo đúng hai bước MapReduce** của PE 10.4 (không join thẳng hai bảng):
1. *map*: một CTE \`map_out(key, rel, val)\` = các tuple của bd_r thành (a, 'r', b) **union all** các tuple của bd_s thành (a, 's', c);
2. *reduce*: với mỗi key, ghép mọi val của 'r' với mọi val của 's'.

Trả về \`a\`, \`b\`, \`c\`.`,
      hint: 'Self-join map_out m1, m2 trên key với m1.rel = \'r\' và m2.rel = \'s\'.',
      solution: `with map_out (key, rel, val) as (
  select a, 'r', b from bd_r
  union all
  select a, 's', c from bd_s)
select m1.key as a, m1.val as b, m2.val as c
from map_out m1 join map_out m2
  on m1.key = m2.key and m1.rel = 'r' and m2.rel = 's';`,
    },
    {
      id: 'CH10.13', topic: 'range partitioning', level: 2,
      prompt: 'Mô phỏng **sharding theo range** bằng declarative partitioning. Tạo bảng `bd_bill_month(customer_id varchar(5), bill_date date, amount numeric(8,2))` **partition by range (bill_date)** với 4 partition theo tháng của năm 2018: `bd_bill_m1` (tháng 1), `bd_bill_m2`, `bd_bill_m3`, `bd_bill_m4`; rồi chép toàn bộ bd_bill vào. Hệ thống đếm số dòng trong từng partition.',
      hint: '`create table bd_bill_m1 partition of bd_bill_month for values from (\'2018-01-01\') to (\'2018-02-01\');`',
      solution: `create table bd_bill_month (
  customer_id varchar(5), bill_date date, amount numeric(8,2)
) partition by range (bill_date);
create table bd_bill_m1 partition of bd_bill_month for values from ('2018-01-01') to ('2018-02-01');
create table bd_bill_m2 partition of bd_bill_month for values from ('2018-02-01') to ('2018-03-01');
create table bd_bill_m3 partition of bd_bill_month for values from ('2018-03-01') to ('2018-04-01');
create table bd_bill_m4 partition of bd_bill_month for values from ('2018-04-01') to ('2018-05-01');
insert into bd_bill_month select customer_id, bill_date, amount from bd_bill;`,
      check: `select tableoid::regclass::text as partition, count(*) as num_rows
from bd_bill_month group by 1 order by 1;`,
    },
    {
      id: 'CH10.14', topic: 'hash partitioning', level: 2,
      prompt: 'Mô phỏng **sharding theo hash** của customer_id: tạo `bd_bill_hash(customer_id varchar(5), bill_date date, amount numeric(8,2))` **partition by hash (customer_id)** với 3 partition `bd_bill_h0`, `bd_bill_h1`, `bd_bill_h2` (modulus 3, remainder 0/1/2), rồi chép bd_bill vào. Hệ thống kiểm tra: tổng số dòng, và mọi hoá đơn của một khách nằm trong **cùng một** partition.',
      solution: `create table bd_bill_hash (
  customer_id varchar(5), bill_date date, amount numeric(8,2)
) partition by hash (customer_id);
create table bd_bill_h0 partition of bd_bill_hash for values with (modulus 3, remainder 0);
create table bd_bill_h1 partition of bd_bill_hash for values with (modulus 3, remainder 1);
create table bd_bill_h2 partition of bd_bill_hash for values with (modulus 3, remainder 2);
insert into bd_bill_hash select customer_id, bill_date, amount from bd_bill;`,
      check: `select count(*) as total_rows,
       (select count(*) from (select customer_id from bd_bill_hash
                              group by customer_id having count(distinct tableoid) > 1) x) as split_customers,
       count(distinct tableoid) <= 3 as at_most_3_partitions
from bd_bill_hash;`,
    },
    // ---------------- Streaming ----------------
    {
      id: 'CH10.15', topic: 'PE 10.8 tumbling window', level: 2, pe: '10.8',
      prompt: 'PE 10.8 trên `bd_order(order_id, itemid, datetime, amount)`: tổng `amount` của mỗi item trong mỗi **tumbling window 1 giờ**. Trả về `itemid`, `window_end` (timestamp — thời điểm **kết thúc** cửa sổ, ví dụ đơn lúc 09:20 thuộc cửa sổ kết thúc 10:00, đơn lúc đúng 10:00:00 thuộc cửa sổ kết thúc 11:00) và `total`. Không dùng date_trunc/date_bin: dùng số giây `extract(epoch from datetime)` và `floor` như đề.',
      hint: 'Group by `itemid, floor(extract(epoch from datetime) / 3600)`; `to_timestamp((floor(...) + 1) * 3600) at time zone \'UTC\'` đổi về timestamp.',
      solution: `select itemid,
       to_timestamp((floor(extract(epoch from datetime) / 3600) + 1) * 3600) at time zone 'UTC' as window_end,
       sum(amount) as total
from bd_order
group by itemid, floor(extract(epoch from datetime) / 3600);`,
    },
    {
      id: 'CH10.16', topic: 'stream: 30-min windows', level: 2,
      prompt: 'Đếm số đơn hàng (mọi item) trong mỗi tumbling window **30 phút** tính từ `2019-05-01 00:00`. Trả về `window_start` (timestamp) và `num_orders`, chỉ các cửa sổ có đơn.',
      hint: '`date_bin(\'30 minutes\', datetime, timestamp \'2019-05-01\')`',
      solution: `select date_bin('30 minutes', datetime, timestamp '2019-05-01') as window_start,
       count(*) as num_orders
from bd_order
group by 1;`,
    },
    {
      id: 'CH10.17', topic: 'sliding window', level: 3,
      prompt: '**Sliding window** quanh mỗi sự kiện: với mỗi đơn trong bd_order, trả về `order_id`, `itemid` và `last_hour` = tổng amount của **cùng item** trong khoảng 1 giờ **tính tới thời điểm đơn đó** (gồm cả đơn đó, tức các đơn có datetime trong (datetime − 1 giờ, datetime]).',
      hint: 'Window function với frame theo thời gian: `sum(amount) over (partition by itemid order by datetime range between interval \'1 hour\' preceding and current row)` — lưu ý frame range lấy cả mốc đúng 1 giờ trước; dùng `interval \'59 minutes 59 seconds\'` hoặc subquery.',
      solution: `select o.order_id, o.itemid,
       (select sum(p.amount) from bd_order p
        where p.itemid = o.itemid
          and p.datetime >  o.datetime - interval '1 hour'
          and p.datetime <= o.datetime) as last_hour
from bd_order o;`,
    },
    // ---------------- Graph ----------------
    {
      id: 'CH10.18', topic: 'PE 10.9 graph edges', level: 2, pe: '10.9',
      prompt: 'Mô hình University thành đồ thị như PE 10.9. Tạo view `bd_univ_edge(src, label, dst)`: mỗi tuple **takes** thành cạnh (student ID, `\'takes\'`, section_key) và mỗi tuple **teaches** thành cạnh (instructor ID, `\'teaches\'`, section_key), với section_key = course_id-sec_id-semester-year nối bằng dấu `-` (ví dụ `CS-101-1-Fall-2017`). Hệ thống đếm số cạnh theo label và liệt kê các cạnh tới section `CS-190-2-Spring-2017`.',
      solution: `create view bd_univ_edge (src, label, dst) as
select ID, 'takes', course_id || '-' || sec_id || '-' || semester || '-' || year from takes
union all
select ID, 'teaches', course_id || '-' || sec_id || '-' || semester || '-' || year from teaches;`,
      check: `select label, count(*)::text as info from bd_univ_edge group by label
union all
select label, src from bd_univ_edge where dst = 'CS-190-2-Spring-2017'
order by 1, 2;`,
    },
    {
      id: 'CH10.19', topic: 'degree', level: 1,
      prompt: 'Đồ thị trang web `bd_node(node, label)`, `bd_edge(src, dst)`. Với **mọi** node, trả về `node`, `out_degree` (số cạnh đi ra) và `in_degree` (số cạnh đi vào), 0 nếu không có.',
      solution: `select n.node,
       (select count(*) from bd_edge e where e.src = n.node) as out_degree,
       (select count(*) from bd_edge e where e.dst = n.node) as in_degree
from bd_node n;`,
    },
    {
      id: 'CH10.20', topic: 'reachability', level: 3,
      prompt: 'Từ node `A`, tìm mọi node **khác A** đến được theo các cạnh của bd_edge cùng số bước ngắn nhất `hops`. Đồ thị có **chu trình** (A → B → C → A) nên phải giới hạn độ sâu (ví dụ tối đa 5 bước) hoặc chặn lặp.',
      hint: '`with recursive r(node, hops)` bắt đầu từ các cạnh đi ra của A; điều kiện dừng `r.hops < 5`; cuối cùng `min(hops)` theo node.',
      solution: `with recursive r (node, hops) as (
  select dst, 1 from bd_edge where src = 'A'
  union all
  select e.dst, r.hops + 1
  from r join bd_edge e on e.src = r.node
  where r.hops < 5)
select node, min(hops) as hops
from r
where node <> 'A'
group by node;`,
    },
    {
      id: 'CH10.21', topic: 'PageRank iteration', level: 3,
      prompt: `Một vòng lặp **PageRank** trên bd_node/bd_edge, bắt đầu từ rank đều 1/N (N = số node, kể cả node không có cạnh). Với d = 0.85:

rank(v) = (1 − d)/N + d · Σ<sub>u→v</sub> rank(u)/outdeg(u)

Trả về \`node\` và \`rank\` làm tròn 4 chữ số cho **mọi** node.`,
      hint: 'outdeg bằng một CTE `group by src`; node không có cạnh vào có tổng = 0 (coalesce).',
      solution: `with n as (select count(*)::numeric as n from bd_node),
od as (select src, count(*) as k from bd_edge group by src)
select v.node,
       round((1 - 0.85) / n.n + 0.85 * coalesce(sum((1 / n.n) / od.k), 0), 4) as rank
from bd_node v
cross join n
left join bd_edge e on e.dst = v.node
left join od on od.src = e.src
group by v.node, n.n;`,
    },
  ],
};
