export default {
  number: 21,
  slug: 'ch21_parallel_storage',
  title: 'Parallel and Distributed Storage',
  titleVi: 'Lưu trữ song song và phân tán',

  summary: `
### 0. Phạm vi
Chương 21 ngoài lịch học CS4420. Bài SQL mô phỏng: gán tuple vào node theo round-robin / hash / range, đo skew, tính vector phân hoạch từ histogram (PE 21.2), dùng **declarative partitioning** thật của PostgreSQL, và xử lý replica / master.

### 1. Data partitioning (slide 21.3–21.12)
Chia tuple của một relation lên n node (n đĩa) để đọc/ghi song song. Ba kỹ thuật cơ bản:
- **Round-robin**: tuple thứ i (theo thứ tự chèn) về node i mod n. Chia đều tuyệt đối; nhưng truy vấn điểm hay truy vấn khoảng đều phải đọc **mọi** node.
- **Hash partitioning**: chọn *partitioning attribute*, node = h(giá trị) mod n. Truy vấn điểm (\`where key = v\`) chỉ đọc **một** node; truy vấn khoảng vẫn phải đọc mọi node. Đều nếu h tốt và giá trị khoá ít trùng.
- **Range partitioning**: dùng *partitioning vector* [v<sub>0</sub>, v<sub>1</sub>, …, v<sub>n−2</sub>]: giá trị < v<sub>0</sub> về node 0, v<sub>i</sub> ≤ x < v<sub>i+1</sub> về node i + 1, ≥ v<sub>n−2</sub> về node n − 1. Truy vấn điểm và truy vấn khoảng chỉ đọc các node có khoảng giao với điều kiện.
- Range query chỉ chạm một node (PE 21.1): tốt khi khoảng hẹp (ít overhead, nhiều truy vấn chạy song song); xấu khi khoảng rộng (một node làm hết, mất song song) và tạo **hot spot**.

### 2. Skew (slide 21.13–21.20)
- **Data-distribution skew**: số tuple mỗi node lệch nhau — do *attribute-value skew* (nhiều tuple cùng giá trị, mọi tuple cùng giá trị buộc phải về cùng node) hoặc *partition skew* (vector range chọn kém, hàm hash tồi).
- **Execution skew**: dữ liệu chia đều nhưng **tải truy vấn** dồn vào vài partition (dữ liệu "nóng"). Histogram trên giá trị thuộc tính không thấy được điều này; phải dùng **tần suất truy cập** của workload để chọn vector (PE 21.3).
- **Load-balanced range partitioning** từ **histogram** (equi-depth): mỗi partition nhận N/p tuple; trong một bucket giả sử giá trị phân bố đều (PE 21.2).
- **Virtual nodes**: chia thành nhiều partition nhỏ hơn số node thật, ánh xạ partition → node bằng bảng (*partition table*) để cân bằng lại dễ dàng; partition quá lớn thì **tách** (giống tách node B+-tree), partition nóng thì chuyển sang node khác.

### 3. Replication (slide 21.21–21.28)
- Lưu nhiều bản sao (replica) của mỗi partition trên các node khác nhau → chịu lỗi node, đọc song song.
- Bản sao của dữ liệu thuộc một node nên **rải lên nhiều node khác** (thay vì một node dự phòng): khi node hỏng, tải được chia cho nhiều node (PE 21.6a).
- Replica qua các **data center** xa nhau: chịu được thảm hoạ/mất điện cả data center; đọc gần người dùng (PE 21.4a).
- **Primary (master) replica**: mọi cập nhật đi qua master, sau đó truyền tới các replica khác. Master có thể chọn theo partition hoặc **theo record** (PE 21.8).
- Cập nhật replica: **synchronous** (cùng giao dịch, chậm nhưng nhất quán) hay **asynchronous** (nhanh, có thể đọc dữ liệu cũ). Chi tiết ở Chương 23.

### 4. Parallel indexing (slide 21.29–21.33)
- **Local index**: mỗi node đánh chỉ mục phần dữ liệu của nó.
- **Global primary index**: index trên partitioning attribute.
- **Global secondary index**: index trên thuộc tính khác, được chia theo giá trị index key; mỗi entry trỏ tới **partitioning key** (không trỏ thẳng tới vị trí vật lý) — để tuple chuyển node/tách partition không phải sửa index (PE 21.5).

### 5. Distributed file systems & key-value stores (slide 21.34–21.50)
- **Distributed file system** (Google FS, HDFS): file chia thành block lớn (64–128 MB) nhân bản trên nhiều máy; **NameNode** giữ metadata, **DataNode** giữ block. Tối ưu cho đọc tuần tự file lớn.
- **Sharding**: chia dữ liệu theo khoá ở tầng ứng dụng lên nhiều database. Đơn giản nhưng ứng dụng phải tự định tuyến, join/giao dịch xuyên shard khó.
- **Key-value store / NoSQL** (Bigtable, HBase, Cassandra, MongoDB, DynamoDB): API \`get(key)\`, \`put(key, value)\`, \`delete(key)\`, có thể quét theo khoảng khoá. Dữ liệu chia thành **tablet** theo khoảng khoá; **tablet server**; **master** quản lý ánh xạ tablet → server.
- Range partitioning cho phép **tách tablet** khi quá lớn (như tách lá B+-tree); hash partitioning khó tách (như bucket của hash index) (PE 21.7a). Hash rồi range trên giá trị hash: đơn giản hoá kiểu khoá, nhưng mất truy vấn khoảng (PE 21.7b).

### 6. PostgreSQL declarative partitioning (thực hành)
\`\`\`sql
create table t (id int, amount int) partition by range (amount);
create table t_p0 partition of t for values from (minvalue) to (200);
create table t_p1 partition of t for values from (200) to (500);  -- [200, 500)
create table t_h0 partition of h for values with (modulus 4, remainder 0);  -- hash
select tableoid::regclass, count(*) from t group by 1;  -- tuple nằm ở partition nào
\`\`\`
Đây là partitioning **trên một máy** (để pruning, bảo trì), nhưng cùng ý tưởng range/list/hash.

### Tóm tắt so sánh
| | Round-robin | Hash | Range |
|---|---|---|---|
| Quét toàn bộ | tốt | tốt | tốt |
| Truy vấn điểm theo khoá | đọc mọi node | **1 node** | **1 node** |
| Truy vấn khoảng | đọc mọi node | đọc mọi node | **chỉ các node liên quan** |
| Chia đều | tuyệt đối | tốt nếu khoá đa dạng | phụ thuộc vector (dùng histogram) |
`,

  quiz: [
    {
      q: 'Kỹ thuật partitioning nào trả lời truy vấn khoảng `where amount between 200 and 300` mà chỉ cần đọc một phần các node?',
      options: ['Round-robin', 'Hash', 'Range', 'Không kỹ thuật nào'],
      answer: 2,
      explain: 'Chỉ range partitioning giữ thứ tự giá trị.',
    },
    {
      q: 'Kỹ thuật nào chia đều tuple tuyệt đối nhưng không hỗ trợ truy vấn điểm?',
      options: ['Round-robin', 'Hash', 'Range', 'List'],
      answer: 0,
      explain: 'Tuple i về node i mod n, không liên quan tới giá trị.',
    },
    {
      q: 'Hash partitioning trên `customer`, một khách có 40% số đơn hàng. Hậu quả?',
      options: ['Không ảnh hưởng', 'Attribute-value skew: node chứa khách đó quá tải', 'Execution skew không thể xảy ra', 'Hash sẽ tự tách'],
      answer: 1,
      explain: 'Mọi tuple cùng giá trị khoá phải về cùng một node.',
    },
    {
      q: 'Histogram trên giá trị thuộc tính giúp tránh loại skew nào?',
      options: ['Execution skew', 'Data-distribution skew', 'Cả hai', 'Không loại nào'],
      answer: 1,
      explain: 'PE 21.3: execution skew cần tần suất truy cập của workload.',
    },
    {
      q: 'PE 21.2a: tổng tần suất 100, chia 5 partition. Mỗi partition nên có bao nhiêu tuple?',
      options: ['10', '20', '25', '5'],
      answer: 1,
      explain: 'N/p = 100/5.',
    },
    {
      q: 'Vì sao global secondary index nên trỏ tới partitioning key thay vì (số partition, record id)?',
      options: ['Tiết kiệm chỗ', 'Khi partition bị tách hoặc chuyển node, không phải cập nhật hàng loạt entry của index', 'Nhanh hơn khi đọc', 'Bắt buộc theo SQL'],
      answer: 1,
      explain: 'PE 21.5a.',
    },
    {
      q: 'Vì sao rải bản sao dữ liệu của node N lên nhiều node thay vì một node dự phòng?',
      options: ['Ít tốn chỗ hơn', 'Khi N hỏng, tải của N được chia cho nhiều node', 'Dễ backup', 'Để dùng RAID'],
      answer: 1,
      explain: 'PE 21.6a.',
    },
    {
      q: 'Vì sao range partitioning kiểm soát kích thước tablet tốt hơn hash?',
      options: ['Range nhanh hơn', 'Tablet quá đầy có thể tách tại một giá trị giữa khoảng (như tách lá B+-tree)', 'Hash không chia được', 'Range dùng ít bộ nhớ'],
      answer: 1,
      explain: 'PE 21.7a.',
    },
  ],

  questions: [
    {
      pe: '21.1',
      q: '**PE 21.1** — Truy vấn khoảng trên thuộc tính range-partitioned có thể chỉ cần đọc một đĩa. Ưu và nhược điểm?',
      answer: `**Ưu**: nếu khoảng chứa ít tuple, truy vấn chạy nhanh trên một đĩa; không tốn chi phí khởi động truy vấn trên nhiều đĩa; nhiều truy vấn như vậy chạy **song song** trên các đĩa khác nhau → throughput cao.

**Nhược**: nếu khoảng chứa nhiều tuple, một đĩa làm hết việc, **không có song song bên trong truy vấn** → response time lớn. Một số đĩa có thể thành **hot spot**.

Giải pháp kết hợp: *hybrid range partitioning* — chia thành nhiều khoảng nhỏ (vài block) rồi gán các khoảng nhỏ đó vào đĩa theo kiểu round-robin. Bài CH21.06 đếm số node phải đọc với range và round-robin.`,
    },
    {
      pe: '21.2',
      q: '**PE 21.2** — (a) Tìm hàm range partitioning cân bằng 5 partition từ histogram cho trước; (b) viết thuật toán tổng quát.',
      answer: `a. Tổng tần suất N = 100 → mỗi partition 20 tuple. Giả sử trong mỗi bucket mọi giá trị đều có khả năng như nhau. Cộng dồn: 15, 20, 40, 50, 60, 65, 70, 90, 95, 100.
- tuple thứ 20 kết thúc ở cuối bucket 11–20 → partition 2 bắt đầu ở **21**;
- tuple thứ 40 kết thúc ở cuối bucket 21–30 → bắt đầu ở **31**;
- tuple thứ 60 kết thúc ở cuối bucket 41–50 → **51**;
- tuple thứ 80: bucket 71–80 (20 tuple, đã có 70 trước đó) cần 10 tuple = nửa bucket → **76**.

Vector [21, 31, 51, 76]: các partition 1–20, 21–30, 31–50, 51–75, 76–100.

b. Thuật toán: N = Σ n<sub>j</sub>. Với i = 1 … p − 1, mục tiêu k<sub>i</sub> = i·N/p. Tìm bucket h<sub>j</sub> (từ s<sub>j</sub> đến e<sub>j</sub>, tần suất n<sub>j</sub>) mà tổng cộng dồn C<sub>j−1</sub> < k<sub>i</sub> ≤ C<sub>j</sub>. Điểm cắt v<sub>i</sub> = s<sub>j</sub> + (k<sub>i</sub> − C<sub>j−1</sub>) / n<sub>j</sub> · (e<sub>j</sub> − s<sub>j</sub> + 1). Vector là [v<sub>1</sub>, …, v<sub>p−1</sub>]. Quét histogram một lần nên O(n + p). Bài CH21.07 cài thuật toán này bằng SQL.`,
    },
    {
      pe: '21.3',
      q: '**PE 21.3** — Vì sao histogram trên giá trị thuộc tính tránh được data-distribution skew nhưng không tránh được execution skew? Dùng workload truy vấn điểm để thiết kế partitioning ra sao?',
      answer: `Histogram cho biết **có bao nhiêu tuple** ở mỗi khoảng giá trị → chia sao cho số tuple mỗi partition bằng nhau. Nhưng execution skew do **tần suất truy cập**: vài giá trị (hay vài khoảng) được truy vấn nhiều hơn hẳn; partition chứa chúng bị quá tải dù số tuple bằng các partition khác.

Với workload truy vấn điểm: đếm số lần truy vấn rơi vào mỗi giá trị/khoảng (từ log truy vấn), xây **histogram của tải** (số truy cập theo khoảng giá trị) thay vì số tuple, rồi chọn vector sao cho **tổng số truy cập** mỗi partition bằng nhau (cùng thuật toán như PE 21.2b). Có thể cân bằng theo tổ hợp cả số tuple lẫn tải, và giá trị cực nóng có thể nhân bản để chia tải đọc.`,
    },
    {
      pe: '21.4',
      q: '**PE 21.4** — (a) Hai lý do nhân bản dữ liệu qua nhiều data center; (b) replication trong CSDL tập trung khác gì trong CSDL song song/phân tán?',
      answer: `a. (1) **Sẵn sàng khi cả data center hỏng** (mất điện, thiên tai): dữ liệu vẫn còn ở data center khác; đặt xa nhau để một thảm hoạ không ảnh hưởng cả hai. (2) **Độ trễ thấp**: người dùng đọc từ data center gần mình.

b. CSDL tập trung thường chỉ hỗ trợ **nhân bản toàn bộ database** bằng cách gửi log record sang một bản sao (một số hệ có logical replication cho vài relation). Không có partitioning và không thể nhân bản **các phần khác nhau** của database lên **các node khác nhau**. Hệ song song/phân tán nhân bản theo partition, rải bản sao lên nhiều node, nên khi một node hỏng tải được chia cho nhiều node.`,
    },
    {
      pe: '21.5',
      q: '**PE 21.5** — (a) Vì sao global secondary index lưu (số partition, record id) là ý tồi? (b) Vì sao cài đặt global secondary index giống local secondary index trên file tổ chức B+-tree?',
      answer: `a. Partition thường bị **tách** hoặc **chuyển node** để cân bằng tải; khi đó vị trí của rất nhiều record đổi, kéo theo phải sửa hàng loạt entry trong secondary index.

b. Trong cả hai trường hợp record có thể **di chuyển** (sang node khác; hoặc sang vị trí khác trong file khi lá B+-tree tách). Nếu index lưu con trỏ vật lý thì phải sửa nhiều. Cách giải chung: secondary index lưu **khoá** (partitioning key / clustering key) của record; tra secondary index ra khoá, rồi tra theo khoá để tìm record. Record di chuyển mà khoá không đổi thì không phải sửa secondary index.`,
    },
    {
      pe: '21.6',
      q: '**PE 21.6** — (a) Vì sao rải bản sao dữ liệu của một node lên nhiều node khác? (b) Ưu, nhược của RAID so với lưu thêm một bản sao mỗi data item?',
      answer: `a. - Khi node hỏng, việc của nó được **chia đều cho nhiều node** còn lại thay vì dồn vào một node (node đó sẽ chịu gấp đôi tải).
- Ngay cả khi không hỏng, có thể đọc từ nhiều bản sao để giảm hot spot cho các giao dịch chỉ đọc.
Bài CH21.10 đếm số item mỗi node nhận khi N2 hỏng.

b. RAID 1 (mirroring) cũng lưu thêm một bản sao, nhưng do phần cứng/bộ điều khiển đĩa làm, DBMS chỉ cần ghi một lần. Nhưng RAID chỉ chống **hỏng đĩa** trong một máy; máy hỏng thì dữ liệu không truy cập được, trong khi bản sao do DBMS đặt ở **node khác** chống được cả hỏng node. RAID 5 tốn ít chỗ hơn mirroring nhưng ghi chậm hơn và dựng lại đĩa hỏng tốn kém.`,
    },
    {
      pe: '21.7',
      q: '**PE 21.7** — (a) Vì sao range partitioning kiểm soát kích thước tablet tốt hơn hash (so sánh B+-tree với hash index)? (b) Hash khoá rồi range trên giá trị hash: động lực và nhược điểm? (c) Horizontal rồi vertical tại mỗi node so với vertical rồi horizontal?',
      answer: `a. Với range partitioning, tablet quá lớn được **tách** tại một giá trị ở giữa khoảng thành hai tablet, không ảnh hưởng tablet khác — giống **tách lá B+-tree** khi đầy. Hash partitioning cố định số bucket; muốn tách một bucket quá đầy phải đổi hàm hash (giống hash index: bucket tràn khó tách; chỉ các kỹ thuật dynamic hashing như linear/extendable hashing mới làm được).

b. Động lực: hash ánh xạ mọi kiểu khoá về một kiểu số, phân bố đều, đơn giản hoá phân hoạch và tránh skew do khoá tuần tự (ví dụ timestamp tăng dần dồn vào một tablet). Vẫn tách tablet được vì range trên giá trị hash. Nhược: **mất truy vấn khoảng** theo khoá — phải quét mọi tablet.

c. Horizontal trước rồi vertical tại chỗ: mọi phần của một record nằm trên **cùng một node**, ghép lại record không cần truyền mạng. Vertical trước rồi horizontal độc lập: các mảnh của cùng một record có thể nằm ở các node khác nhau, phải truyền dữ liệu để ghép.`,
    },
    {
      pe: '21.8',
      q: '**PE 21.8** — (a) Master đổi trong lúc request đang tới; (b) hai lợi ích của master theo record; (c) theo dõi master của rất nhiều record thế nào?',
      answer: `a. Node nhận request mà không còn là master trả về **lỗi kèm lý do** ("không phải master"); node gửi tra lại master hiện tại và gửi lại. Hoặc master cũ **chuyển tiếp** request tới master mới, master mới trả lời trực tiếp cho node gửi. Bài CH21.11 xác định request nào phải chuyển hướng.

b. (1) Đặt master của mỗi record ở **vùng địa lý** có nhiều truy cập record đó nhất (ví dụ nơi người dùng sống) → đọc không cần liên lạc vùng khác (độ trễ do tốc độ ánh sáng). (2) **Ghi cũng làm cục bộ** rồi truyền bất đồng bộ tới replica khác; tải master được rải trên nhiều node thay vì một node cho cả partition.

c. Mỗi record có thêm **trường ẩn** ghi master của nó (lưu cùng record, được nhân bản). Nếu thông tin cũ, đọc mọi replica của record để xem các node được ghi là master, rồi hỏi các node đó để tìm master hiện tại (dùng số epoch lớn nhất).`,
    },
  ],

  exercises: [
    {
      id: 'CH21.01', topic: 'round-robin', level: 1,
      prompt: 'Bảng `pd_order(order_id, customer, amount, order_date)`. Chia các đơn hàng lên **4 node** theo **round-robin** theo thứ tự order_id: đơn thứ nhất về node 0, thứ hai node 1, …, thứ năm lại về node 0. Trả về `node` và số đơn hàng `num_orders` của mỗi node, sắp theo node.',
      hint: '(row_number() over (order by order_id) − 1) % 4.',
      solution: `select node, count(*) as num_orders
from (select (row_number() over (order by order_id) - 1) % 4 as node from pd_order) t
group by node
order by node;`,
      ordered: true,
    },
    {
      id: 'CH21.02', topic: 'hash partitioning', level: 1,
      prompt: 'Chia `pd_order` lên 4 node bằng **hash partitioning** trên `order_id`, với hàm hash `abs(hashtext(order_id::text)) % 4`. Trả về `node`, `num_orders`, sắp theo node.',
      solution: `select abs(hashtext(order_id::text)) % 4 as node, count(*) as num_orders
from pd_order
group by 1
order by 1;`,
      ordered: true,
    },
    {
      id: 'CH21.03', topic: 'attribute-value skew', level: 2,
      prompt: 'Giờ hash partitioning trên `customer` (hàm `abs(hashtext(customer)) % 4`). Trả về `node`, `num_orders` và `customers` (danh sách khách ở node đó, nối bằng `, ` theo thứ tự tên), chỉ gồm các node có dữ liệu, sắp theo node. Vì sao lệch nhiều hơn CH21.02?',
      hint: 'string_agg(distinct customer, \', \' order by customer).',
      solution: `select abs(hashtext(customer)) % 4 as node, count(*) as num_orders,
       string_agg(distinct customer, ', ' order by customer) as customers
from pd_order
group by 1
order by 1;`,
      ordered: true,
    },
    {
      id: 'CH21.04', topic: 'range partitioning', level: 1,
      prompt: 'Chia `pd_order` theo **range partitioning** trên `amount` với partitioning vector **[200, 500, 1000]**: amount < 200 → node 0; 200 ≤ amount < 500 → node 1; 500 ≤ amount < 1000 → node 2; ≥ 1000 → node 3. Trả về node, num_orders, sắp theo node.',
      hint: 'width_bucket(amount, array[200, 500, 1000]) trả về đúng số node.',
      solution: `select width_bucket(amount, array[200, 500, 1000]) as node, count(*) as num_orders
from pd_order
group by 1
order by 1;`,
      ordered: true,
    },
    {
      id: 'CH21.05', topic: 'skew của range partitioning', level: 2,
      prompt: 'Với cách chia của CH21.04, trả về một dòng: `max_node` (số tuple của node đông nhất), `avg_node` (số tuple trung bình mỗi node, tính trên 4 node) và `skew` = max_node / avg_node làm tròn 2.',
      solution: `select max(cnt) as max_node, avg(cnt) as avg_node, round(max(cnt) / avg(cnt), 2) as skew
from (select width_bucket(amount, array[200, 500, 1000]) as node, count(*) as cnt
      from pd_order group by 1) t;`,
    },
    {
      id: 'CH21.06', topic: 'truy vấn khoảng', level: 2, pe: '21.1',
      prompt: 'Truy vấn `select * from pd_order where amount between 250 and 450`. Trả về một dòng hai cột: `range_nodes` — số node phải đọc với range partitioning của CH21.04 (các node có **khoảng giá trị** giao với [250, 450]), và `rr_nodes` — số node chứa ít nhất một tuple thoả điều kiện với round-robin của CH21.01 (với round-robin hệ thống không biết trước nên phải đọc cả 4 node; ở đây chỉ đếm node thực sự có kết quả).',
      solution: `select (select count(distinct width_bucket(v, array[200, 500, 1000])) from generate_series(250, 450) v) as range_nodes,
       (select count(distinct node)
        from (select (row_number() over (order by order_id) - 1) % 4 as node, amount from pd_order) t
        where amount between 250 and 450) as rr_nodes;`,
    },
    {
      id: 'CH21.07', topic: 'vector từ histogram', level: 3, pe: '21.2a',
      prompt: 'Bảng `pd_hist(lo, hi, freq)` là histogram của PE 21.2a. Tính vector range partitioning **cân bằng** cho **5 partition**: với k = 1..4, mục tiêu là tuple thứ k·N/5 (N = tổng freq); tìm bucket chứa nó (tổng cộng dồn trước bucket < mục tiêu ≤ tổng cộng dồn tới hết bucket), và điểm cắt = `lo + (mục tiêu − cộng dồn trước bucket) / freq · (hi − lo + 1)`. Trả về `k` và `cut` (kiểu **integer**), sắp theo k.',
      hint: 'sum(freq) over (order by lo) cho cộng dồn; generate_series(1, 4) cho k.',
      solution: `with h as (
  select lo, hi, freq, sum(freq) over (order by lo) as cum from pd_hist
), t as (
  select k, k * (select sum(freq) from pd_hist) / 5 as target from generate_series(1, 4) k
)
select t.k, (h.lo + (t.target - (h.cum - h.freq)) * (h.hi - h.lo + 1) / h.freq)::integer as cut
from t join h on h.cum - h.freq < t.target and t.target <= h.cum
order by t.k;`,
      ordered: true,
    },
    {
      id: 'CH21.08', topic: 'partition by range (PostgreSQL)', level: 2,
      prompt: `Dùng **declarative partitioning** của PostgreSQL. Tạo bảng \`pd_order_r(order_id integer, customer varchar(10), amount integer, order_date date)\` **partition by range (amount)** với bốn partition đúng vector của CH21.04:
- \`pd_order_r0\`: từ minvalue đến 200
- \`pd_order_r1\`: [200, 500)
- \`pd_order_r2\`: [500, 1000)
- \`pd_order_r3\`: từ 1000 đến maxvalue

Rồi chép toàn bộ \`pd_order\` vào \`pd_order_r\`. Hệ thống đếm số tuple trong từng partition (\`tableoid::regclass\`).`,
      solution: `create table pd_order_r (order_id integer, customer varchar(10), amount integer, order_date date)
  partition by range (amount);
create table pd_order_r0 partition of pd_order_r for values from (minvalue) to (200);
create table pd_order_r1 partition of pd_order_r for values from (200) to (500);
create table pd_order_r2 partition of pd_order_r for values from (500) to (1000);
create table pd_order_r3 partition of pd_order_r for values from (1000) to (maxvalue);
insert into pd_order_r select * from pd_order;`,
      check: `select tableoid::regclass::text as partition, count(*) as num_orders
from pd_order_r group by 1 order by 1;`,
    },
    {
      id: 'CH21.09', topic: 'partition by hash (PostgreSQL)', level: 2,
      prompt: 'Tạo `pd_order_h` (cùng cột như `pd_order`) **partition by hash (order_id)** với 4 partition `pd_order_h0` … `pd_order_h3` (modulus 4, remainder 0 … 3), rồi chép toàn bộ `pd_order` vào. Hệ thống đếm số tuple mỗi partition và thử chèn `(25, \'An\', 10, \'2024-07-01\')` vào bảng cha.',
      solution: `create table pd_order_h (order_id integer, customer varchar(10), amount integer, order_date date)
  partition by hash (order_id);
create table pd_order_h0 partition of pd_order_h for values with (modulus 4, remainder 0);
create table pd_order_h1 partition of pd_order_h for values with (modulus 4, remainder 1);
create table pd_order_h2 partition of pd_order_h for values with (modulus 4, remainder 2);
create table pd_order_h3 partition of pd_order_h for values with (modulus 4, remainder 3);
insert into pd_order_h select * from pd_order;`,
      check: `select try_sql($$insert into pd_order_h values (25, 'An', 10, '2024-07-01')$$) as insert_new;
select tableoid::regclass::text as partition, count(*) as num_orders
from pd_order_h group by 1 order by 1;`,
    },
    {
      id: 'CH21.10', topic: 'replica khi node hỏng', level: 2, pe: '21.6a',
      prompt: 'Bảng `pd_replica(item, node, role, backup_rank)`: mỗi item có một `primary` và hai `backup` (backup_rank 1, 2). Node **N2 hỏng**. Với mỗi item có primary ở N2, backup có thứ hạng nhỏ nhất **còn sống** lên làm primary. Trả về mỗi node còn sống (`node`) và số item nó **nhận thêm** làm primary (`taken_over`), chỉ các node nhận ít nhất một, sắp theo node.',
      solution: `select r.node, count(*) as taken_over
from pd_replica r
where r.role = 'backup' and r.node <> 'N2'
  and r.item in (select item from pd_replica where role = 'primary' and node = 'N2')
  and r.backup_rank = (select min(b.backup_rank) from pd_replica b
                       where b.item = r.item and b.role = 'backup' and b.node <> 'N2')
group by r.node
order by r.node;`,
      ordered: true,
    },
    {
      id: 'CH21.11', topic: 'master đã đổi', level: 2, pe: '21.8',
      prompt: 'Bảng `pd_master_epoch(item, epoch, node)`: mỗi lần master của một record đổi thì epoch tăng; master hiện tại là node có epoch lớn nhất. `pd_route(req, item, sent_to)` là các request đã gửi. Trả về req, item, sent_to, `current_master` và `redirect` (boolean: request gửi nhầm node, phải chuyển hướng). Sắp theo req.',
      solution: `select r.req, r.item, r.sent_to, m.node as current_master, r.sent_to <> m.node as redirect
from pd_route r
join pd_master_epoch m on m.item = r.item
 and m.epoch = (select max(epoch) from pd_master_epoch where item = r.item)
order by r.req;`,
      ordered: true,
    },
  ],
};
