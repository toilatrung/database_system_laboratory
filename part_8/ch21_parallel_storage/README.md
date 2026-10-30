# Chương 21 — Lưu trữ song song và phân tán

*Parallel and Distributed Storage · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch21`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 0. Phạm vi
Chương 21 ngoài lịch học CS4420. Bài SQL mô phỏng: gán tuple vào node theo round-robin / hash / range, đo skew, tính vector phân hoạch từ histogram (PE 21.2), dùng **declarative partitioning** thật của PostgreSQL, và xử lý replica / master.

### 1. Data partitioning (slide 21.3–21.12)
Chia tuple của một relation lên n node (n đĩa) để đọc/ghi song song. Ba kỹ thuật cơ bản:
- **Round-robin**: tuple thứ i (theo thứ tự chèn) về node i mod n. Chia đều tuyệt đối; nhưng truy vấn điểm hay truy vấn khoảng đều phải đọc **mọi** node.
- **Hash partitioning**: chọn *partitioning attribute*, node = h(giá trị) mod n. Truy vấn điểm (`where key = v`) chỉ đọc **một** node; truy vấn khoảng vẫn phải đọc mọi node. Đều nếu h tốt và giá trị khoá ít trùng.
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
- **Key-value store / NoSQL** (Bigtable, HBase, Cassandra, MongoDB, DynamoDB): API `get(key)`, `put(key, value)`, `delete(key)`, có thể quét theo khoảng khoá. Dữ liệu chia thành **tablet** theo khoảng khoá; **tablet server**; **master** quản lý ánh xạ tablet → server.
- Range partitioning cho phép **tách tablet** khi quá lớn (như tách lá B+-tree); hash partitioning khó tách (như bucket của hash index) (PE 21.7a). Hash rồi range trên giá trị hash: đơn giản hoá kiểu khoá, nhưng mất truy vấn khoảng (PE 21.7b).

### 6. PostgreSQL declarative partitioning (thực hành)
```sql
create table t (id int, amount int) partition by range (amount);
create table t_p0 partition of t for values from (minvalue) to (200);
create table t_p1 partition of t for values from (200) to (500);  -- [200, 500)
create table t_h0 partition of h for values with (modulus 4, remainder 0);  -- hash
select tableoid::regclass, count(*) from t group by 1;  -- tuple nằm ở partition nào
```
Đây là partitioning **trên một máy** (để pruning, bảo trì), nhưng cùng ý tưởng range/list/hash.

### Tóm tắt so sánh
| | Round-robin | Hash | Range |
|---|---|---|---|
| Quét toàn bộ | tốt | tốt | tốt |
| Truy vấn điểm theo khoá | đọc mọi node | **1 node** | **1 node** |
| Truy vấn khoảng | đọc mọi node | đọc mọi node | **chỉ các node liên quan** |
| Chia đều | tuyệt đối | tốt nếu khoá đa dạng | phụ thuộc vector (dùng histogram) |

## 2. Trắc nghiệm (8 câu)

**Câu 1.** Kỹ thuật partitioning nào trả lời truy vấn khoảng `where amount between 200 and 300` mà chỉ cần đọc một phần các node?

- A. Round-robin
- B. Hash
- C. Range
- D. Không kỹ thuật nào

<details><summary>Đáp án</summary>

**C** — Chỉ range partitioning giữ thứ tự giá trị.

</details>

**Câu 2.** Kỹ thuật nào chia đều tuple tuyệt đối nhưng không hỗ trợ truy vấn điểm?

- A. Round-robin
- B. Hash
- C. Range
- D. List

<details><summary>Đáp án</summary>

**A** — Tuple i về node i mod n, không liên quan tới giá trị.

</details>

**Câu 3.** Hash partitioning trên `customer`, một khách có 40% số đơn hàng. Hậu quả?

- A. Không ảnh hưởng
- B. Attribute-value skew: node chứa khách đó quá tải
- C. Execution skew không thể xảy ra
- D. Hash sẽ tự tách

<details><summary>Đáp án</summary>

**B** — Mọi tuple cùng giá trị khoá phải về cùng một node.

</details>

**Câu 4.** Histogram trên giá trị thuộc tính giúp tránh loại skew nào?

- A. Execution skew
- B. Data-distribution skew
- C. Cả hai
- D. Không loại nào

<details><summary>Đáp án</summary>

**B** — PE 21.3: execution skew cần tần suất truy cập của workload.

</details>

**Câu 5.** PE 21.2a: tổng tần suất 100, chia 5 partition. Mỗi partition nên có bao nhiêu tuple?

- A. 10
- B. 20
- C. 25
- D. 5

<details><summary>Đáp án</summary>

**B** — N/p = 100/5.

</details>

**Câu 6.** Vì sao global secondary index nên trỏ tới partitioning key thay vì (số partition, record id)?

- A. Tiết kiệm chỗ
- B. Khi partition bị tách hoặc chuyển node, không phải cập nhật hàng loạt entry của index
- C. Nhanh hơn khi đọc
- D. Bắt buộc theo SQL

<details><summary>Đáp án</summary>

**B** — PE 21.5a.

</details>

**Câu 7.** Vì sao rải bản sao dữ liệu của node N lên nhiều node thay vì một node dự phòng?

- A. Ít tốn chỗ hơn
- B. Khi N hỏng, tải của N được chia cho nhiều node
- C. Dễ backup
- D. Để dùng RAID

<details><summary>Đáp án</summary>

**B** — PE 21.6a.

</details>

**Câu 8.** Vì sao range partitioning kiểm soát kích thước tablet tốt hơn hash?

- A. Range nhanh hơn
- B. Tablet quá đầy có thể tách tại một giá trị giữa khoảng (như tách lá B+-tree)
- C. Hash không chia được
- D. Range dùng ít bộ nhớ

<details><summary>Đáp án</summary>

**B** — PE 21.7a.

</details>

## 3. Câu hỏi tự luận (8 câu)

**Câu 1.** 

> **Exercise 21.1.** For a range selection on a range-partitioned attribute, it may happen that only one disk has to be accessed. Describe the advantages and disadvantages of this property.

**PE 21.1** — Truy vấn khoảng trên thuộc tính range-partitioned có thể chỉ cần đọc một đĩa. Ưu và nhược điểm?

<details><summary>Gợi ý đáp án</summary>

**Ưu**: nếu khoảng chứa ít tuple, truy vấn chạy nhanh trên một đĩa; không tốn chi phí khởi động truy vấn trên nhiều đĩa; nhiều truy vấn như vậy chạy **song song** trên các đĩa khác nhau → throughput cao.

**Nhược**: nếu khoảng chứa nhiều tuple, một đĩa làm hết việc, **không có song song bên trong truy vấn** → response time lớn. Một số đĩa có thể thành **hot spot**.

Giải pháp kết hợp: *hybrid range partitioning* — chia thành nhiều khoảng nhỏ (vài block) rồi gán các khoảng nhỏ đó vào đĩa theo kiểu round-robin. Bài CH21.06 đếm số node phải đọc với range và round-robin.

</details>

**Câu 2.** 

> **Exercise 21.2.** Recall that histograms are used to build load-balanced range partitions.
> 
> a. A histogram covers values 1 to 100, split into the 10 ranges 1–10, 11–20, …, 91–100, whose frequencies are, in order, 15, 5, 20, 10, 10, 5, 5, 20, 5, and 5. Give a load-balanced range-partitioning function that splits the values into five partitions.
> 
> b. Write an algorithm that computes a balanced range partitioning with p partitions, given a histogram of frequency distributions with n ranges.

**PE 21.2** — (a) Tìm hàm range partitioning cân bằng 5 partition từ histogram cho trước; (b) viết thuật toán tổng quát.

<details><summary>Gợi ý đáp án</summary>

a. Tổng tần suất N = 100 → mỗi partition 20 tuple. Giả sử trong mỗi bucket mọi giá trị đều có khả năng như nhau. Cộng dồn: 15, 20, 40, 50, 60, 65, 70, 90, 95, 100.
- tuple thứ 20 kết thúc ở cuối bucket 11–20 → partition 2 bắt đầu ở **21**;
- tuple thứ 40 kết thúc ở cuối bucket 21–30 → bắt đầu ở **31**;
- tuple thứ 60 kết thúc ở cuối bucket 41–50 → **51**;
- tuple thứ 80: bucket 71–80 (20 tuple, đã có 70 trước đó) cần 10 tuple = nửa bucket → **76**.

Vector [21, 31, 51, 76]: các partition 1–20, 21–30, 31–50, 51–75, 76–100.

b. Thuật toán: N = Σ n<sub>j</sub>. Với i = 1 … p − 1, mục tiêu k<sub>i</sub> = i·N/p. Tìm bucket h<sub>j</sub> (từ s<sub>j</sub> đến e<sub>j</sub>, tần suất n<sub>j</sub>) mà tổng cộng dồn C<sub>j−1</sub> < k<sub>i</sub> ≤ C<sub>j</sub>. Điểm cắt v<sub>i</sub> = s<sub>j</sub> + (k<sub>i</sub> − C<sub>j−1</sub>) / n<sub>j</sub> · (e<sub>j</sub> − s<sub>j</sub> + 1). Vector là [v<sub>1</sub>, …, v<sub>p−1</sub>]. Quét histogram một lần nên O(n + p). Bài CH21.07 cài thuật toán này bằng SQL.

</details>

**Câu 3.** 

> **Exercise 21.3.** Histograms are usually built on the values of a particular attribute (or set of attributes) of a relation. Such histograms help avoid data-distribution skew but are of little use for avoiding execution skew. Explain why.
> 
> Now suppose you have a workload of queries that do point lookups. Explain how the queries of the workload can be used to design a partitioning scheme that avoids execution skew.

**PE 21.3** — Vì sao histogram trên giá trị thuộc tính tránh được data-distribution skew nhưng không tránh được execution skew? Dùng workload truy vấn điểm để thiết kế partitioning ra sao?

<details><summary>Gợi ý đáp án</summary>

Histogram cho biết **có bao nhiêu tuple** ở mỗi khoảng giá trị → chia sao cho số tuple mỗi partition bằng nhau. Nhưng execution skew do **tần suất truy cập**: vài giá trị (hay vài khoảng) được truy vấn nhiều hơn hẳn; partition chứa chúng bị quá tải dù số tuple bằng các partition khác.

Với workload truy vấn điểm: đếm số lần truy vấn rơi vào mỗi giá trị/khoảng (từ log truy vấn), xây **histogram của tải** (số truy cập theo khoảng giá trị) thay vì số tuple, rồi chọn vector sao cho **tổng số truy cập** mỗi partition bằng nhau (cùng thuật toán như PE 21.2b). Có thể cân bằng theo tổ hợp cả số tuple lẫn tải, và giá trị cực nóng có thể nhân bản để chia tải đọc.

</details>

**Câu 4.** 

> **Exercise 21.4.** Replication:
> 
> a. Give two reasons for replicating data across geographically distributed data centers.
> 
> b. Centralized databases support replication by means of log records. How does replication in centralized databases differ from replication in parallel/distributed databases?

**PE 21.4** — (a) Hai lý do nhân bản dữ liệu qua nhiều data center; (b) replication trong CSDL tập trung khác gì trong CSDL song song/phân tán?

<details><summary>Gợi ý đáp án</summary>

a. (1) **Sẵn sàng khi cả data center hỏng** (mất điện, thiên tai): dữ liệu vẫn còn ở data center khác; đặt xa nhau để một thảm hoạ không ảnh hưởng cả hai. (2) **Độ trễ thấp**: người dùng đọc từ data center gần mình.

b. CSDL tập trung thường chỉ hỗ trợ **nhân bản toàn bộ database** bằng cách gửi log record sang một bản sao (một số hệ có logical replication cho vài relation). Không có partitioning và không thể nhân bản **các phần khác nhau** của database lên **các node khác nhau**. Hệ song song/phân tán nhân bản theo partition, rải bản sao lên nhiều node, nên khi một node hỏng tải được chia cho nhiều node.

</details>

**Câu 5.** 

> **Exercise 21.5.** Parallel indices:
> 
> a. In a centralized database, secondary indices store the record identifier. A global secondary index could likewise store the number of the partition that holds the record together with a record identifier inside that partition. Why would this be a bad idea?
> 
> b. Global secondary indices are implemented much like the local secondary indices used when records are stored in a B<sup>+</sup>-tree file organization. Explain what the two situations have in common that leads to a similar implementation of the secondary indices.

**PE 21.5** — (a) Vì sao global secondary index lưu (số partition, record id) là ý tồi? (b) Vì sao cài đặt global secondary index giống local secondary index trên file tổ chức B+-tree?

<details><summary>Gợi ý đáp án</summary>

a. Partition thường bị **tách** hoặc **chuyển node** để cân bằng tải; khi đó vị trí của rất nhiều record đổi, kéo theo phải sửa hàng loạt entry trong secondary index.

b. Trong cả hai trường hợp record có thể **di chuyển** (sang node khác; hoặc sang vị trí khác trong file khi lá B+-tree tách). Nếu index lưu con trỏ vật lý thì phải sửa nhiều. Cách giải chung: secondary index lưu **khoá** (partitioning key / clustering key) của record; tra secondary index ra khoá, rồi tra theo khoá để tìm record. Record di chuyển mà khoá không đổi thì không phải sửa secondary index.

</details>

**Câu 6.** 

> **Exercise 21.6.** Parallel database systems keep replicas of every data item (or partition) on more than one node.
> 
> a. Why is it better to spread the copies of the data items assigned to a node over several other nodes, rather than keeping all of those copies on the same node (or set of nodes)?
> 
> b. What are the advantages and disadvantages of using RAID storage instead of storing an extra copy of every data item?

**PE 21.6** — (a) Vì sao rải bản sao dữ liệu của một node lên nhiều node khác? (b) Ưu, nhược của RAID so với lưu thêm một bản sao mỗi data item?

<details><summary>Gợi ý đáp án</summary>

a. - Khi node hỏng, việc của nó được **chia đều cho nhiều node** còn lại thay vì dồn vào một node (node đó sẽ chịu gấp đôi tải).
- Ngay cả khi không hỏng, có thể đọc từ nhiều bản sao để giảm hot spot cho các giao dịch chỉ đọc.
Bài CH21.10 đếm số item mỗi node nhận khi N2 hỏng.

b. RAID 1 (mirroring) cũng lưu thêm một bản sao, nhưng do phần cứng/bộ điều khiển đĩa làm, DBMS chỉ cần ghi một lần. Nhưng RAID chỉ chống **hỏng đĩa** trong một máy; máy hỏng thì dữ liệu không truy cập được, trong khi bản sao do DBMS đặt ở **node khác** chống được cả hỏng node. RAID 5 tốn ít chỗ hơn mirroring nhưng ghi chậm hơn và dựng lại đĩa hỏng tốn kém.

</details>

**Câu 7.** 

> **Exercise 21.7.** Partitioning and replication.
> 
> a. Explain why range partitioning gives better control over tablet sizes than hash partitioning. Draw an analogy between this situation and B<sup>+</sup>-tree indices versus hash indices.
> 
> b. Some systems first hash the key and then apply range partitioning to the hash values. What could motivate this choice, and what are its disadvantages compared with range partitioning directly on the key?
> 
> c. Data can be partitioned horizontally and then partitioned vertically locally at each node. The opposite is also possible: partition vertically first, then partition each vertical fragment horizontally on its own. What are the benefits of the first option over the second?

**PE 21.7** — (a) Vì sao range partitioning kiểm soát kích thước tablet tốt hơn hash (so sánh B+-tree với hash index)? (b) Hash khoá rồi range trên giá trị hash: động lực và nhược điểm? (c) Horizontal rồi vertical tại mỗi node so với vertical rồi horizontal?

<details><summary>Gợi ý đáp án</summary>

a. Với range partitioning, tablet quá lớn được **tách** tại một giá trị ở giữa khoảng thành hai tablet, không ảnh hưởng tablet khác — giống **tách lá B+-tree** khi đầy. Hash partitioning cố định số bucket; muốn tách một bucket quá đầy phải đổi hàm hash (giống hash index: bucket tràn khó tách; chỉ các kỹ thuật dynamic hashing như linear/extendable hashing mới làm được).

b. Động lực: hash ánh xạ mọi kiểu khoá về một kiểu số, phân bố đều, đơn giản hoá phân hoạch và tránh skew do khoá tuần tự (ví dụ timestamp tăng dần dồn vào một tablet). Vẫn tách tablet được vì range trên giá trị hash. Nhược: **mất truy vấn khoảng** theo khoá — phải quét mọi tablet.

c. Horizontal trước rồi vertical tại chỗ: mọi phần của một record nằm trên **cùng một node**, ghép lại record không cần truyền mạng. Vertical trước rồi horizontal độc lập: các mảnh của cùng một record có thể nằm ở các node khác nhau, phải truyền dữ liệu để ghép.

</details>

**Câu 8.** 

> **Exercise 21.8.** To send a request to the master replica of a data item, a node must know which replica is currently the master for that item.
> 
> a. Suppose that after a node determines which node is the master replica of a data item, but before its request arrives there, mastership changes and another node becomes the master. How can this situation be handled?
> 
> b. The master replica can be chosen per partition, but some systems support a per-record master: the records of a partition (or tablet) are replicated on a set of nodes, and each record’s master may be any node of that set, independently of the masters of other records. Give two benefits of tracking the master per record.
> 
> c. Suggest how the master replica of every record can be tracked when there is a very large number of records.

**PE 21.8** — (a) Master đổi trong lúc request đang tới; (b) hai lợi ích của master theo record; (c) theo dõi master của rất nhiều record thế nào?

<details><summary>Gợi ý đáp án</summary>

a. Node nhận request mà không còn là master trả về **lỗi kèm lý do** ("không phải master"); node gửi tra lại master hiện tại và gửi lại. Hoặc master cũ **chuyển tiếp** request tới master mới, master mới trả lời trực tiếp cho node gửi. Bài CH21.11 xác định request nào phải chuyển hướng.

b. (1) Đặt master của mỗi record ở **vùng địa lý** có nhiều truy cập record đó nhất (ví dụ nơi người dùng sống) → đọc không cần liên lạc vùng khác (độ trễ do tốc độ ánh sáng). (2) **Ghi cũng làm cục bộ** rồi truyền bất đồng bộ tới replica khác; tải master được rải trên nhiều node thay vì một node cho cả partition.

c. Mỗi record có thêm **trường ẩn** ghi master của nó (lưu cùng record, được nhân bản). Nếu thông tin cũ, đọc mọi replica của record để xem các node được ghi là master, rồi hỏi các node đó để tìm master hiện tại (dùng số epoch lớn nhất).

</details>

## 4. Bài tập SQL (11 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH21.01 | round-robin | ★☆☆ | Bảng `pd_order(order_id, customer, amount, order_date)`. Chia các đơn hàng lên 4 node theo round-robin theo thứ tự order_id: đơn thứ nhất về node 0, thứ hai node 1, …, thứ năm lại về node 0. Trả về `node` và số đơn hàng `num_orders` của mỗi node, sắp theo node. |
| CH21.02 | hash partitioning | ★☆☆ | Chia `pd_order` lên 4 node bằng hash partitioning trên `order_id`, với hàm hash `abs(hashtext(order_id::text)) % 4`. Trả về `node`, `num_orders`, sắp theo node. |
| CH21.03 | attribute-value skew | ★★☆ | Giờ hash partitioning trên `customer` (hàm `abs(hashtext(customer)) % 4`). Trả về `node`, `num_orders` và `customers` (danh sách khách ở node đó, nối bằng `, ` theo thứ tự tên), chỉ gồm các node có dữ liệu, sắp theo node. Vì sao lệch nhiều hơn CH21.02? |
| CH21.04 | range partitioning | ★☆☆ | Chia `pd_order` theo range partitioning trên `amount` với partitioning vector [200, 500, 1000]: amount < 200 → node 0; 200 ≤ amount < 500 → node 1; 500 ≤ amount < 1000 → node 2; ≥ 1000 → node 3. Trả về node, num_orders, sắp theo node. |
| CH21.05 | skew của range partitioning | ★★☆ | Với cách chia của CH21.04, trả về một dòng: `max_node` (số tuple của node đông nhất), `avg_node` (số tuple trung bình mỗi node, tính trên 4 node) và `skew` = max_node / avg_node làm tròn 2. |
| CH21.06 | truy vấn khoảng | ★★☆ | Exercise 21.1. For a range selection on a range-partitioned attribute, it may happen that only one disk has to be accessed. Describe the advantages and disadvantages of this property.<br>Truy vấn `select * from pd_order where amount between 250 and 450`. Trả về một dòng hai cột: `range_nodes` — số node phải đọc với range partitioning của CH21.04 (các node có khoảng giá trị giao với [250, 450]), và `rr_nodes` — số node chứa ít nhất một tuple thoả điều kiện với round-robin của CH21.01 (với round-robin hệ thống không biết trước nên phải đọc cả 4 node; ở đây chỉ đếm node thực sự có kết quả). |
| CH21.07 | vector từ histogram | ★★★ | Exercise 21.2 (a). Recall that histograms are used to build load-balanced range partitions.  a. A histogram covers values 1 to 100, split into the 10 ranges 1–10, 11–20, …, 91–100, whose frequencies are, in order, 15, 5, 20, 10, 10, 5, 5, 20, 5, and 5. Give a load-balanced range-partitioning function that splits the values into five partitions.<br>Bảng `pd_hist(lo, hi, freq)` là histogram của PE 21.2a. Tính vector range partitioning cân bằng cho 5 partition: với k = 1..4, mục tiêu là tuple thứ k·N/5 (N = tổng freq); tìm bucket chứa nó (tổng cộng dồn trước bucket < mục tiêu ≤ tổng cộng dồn tới hết bucket), và điểm cắt = `lo + (mục tiêu − cộng dồn trước bucket) / freq · (hi − lo + 1)`. Trả về `k` và `cut` (kiểu integer), sắp theo k. |
| CH21.08 | partition by range (PostgreSQL) | ★★☆ | Dùng declarative partitioning của PostgreSQL. Tạo bảng `pd_order_r(order_id integer, customer varchar(10), amount integer, order_date date)` partition by range (amount) với bốn partition đúng vector của CH21.04: - `pd_order_r0`: từ minvalue đến 200 - `pd_order_r1`: [200, 500) - `pd_order_r2`: [500, 1000) - `pd_order_r3`: từ 1000 đến maxvalue  Rồi chép toàn bộ `pd_order` vào `pd_order_r`. Hệ thống đếm số tuple trong từng partition (`tableoid::regclass`). |
| CH21.09 | partition by hash (PostgreSQL) | ★★☆ | Tạo `pd_order_h` (cùng cột như `pd_order`) partition by hash (order_id) với 4 partition `pd_order_h0` … `pd_order_h3` (modulus 4, remainder 0 … 3), rồi chép toàn bộ `pd_order` vào. Hệ thống đếm số tuple mỗi partition và thử chèn `(25, 'An', 10, '2024-07-01')` vào bảng cha. |
| CH21.10 | replica khi node hỏng | ★★☆ | Exercise 21.6 (a). Parallel database systems keep replicas of every data item (or partition) on more than one node.  a. Why is it better to spread the copies of the data items assigned to a node over several other nodes, rather than keeping all of those copies on the same node (or set of nodes)?<br>Bảng `pd_replica(item, node, role, backup_rank)`: mỗi item có một `primary` và hai `backup` (backup_rank 1, 2). Node N2 hỏng. Với mỗi item có primary ở N2, backup có thứ hạng nhỏ nhất còn sống lên làm primary. Trả về mỗi node còn sống (`node`) và số item nó nhận thêm làm primary (`taken_over`), chỉ các node nhận ít nhất một, sắp theo node. |
| CH21.11 | master đã đổi | ★★☆ | Exercise 21.8. To send a request to the master replica of a data item, a node must know which replica is currently the master for that item.  a. Suppose that after a node determines which node is the master replica of a data item, but before its request arrives there, mastership changes and another node becomes the master. How can this situation be handled?  b. The master replica can be chosen per partition, but some systems support a per-record master: the records of a partition (or tablet) are replicated on a set of nodes, and each record’s master may be any node of that set, independently of the masters of other records. Give two benefits of tracking the master per record.  c. Suggest how the master replica of every record can be tracked when there is a very large number of records.<br>Bảng `pd_master_epoch(item, epoch, node)`: mỗi lần master của một record đổi thì epoch tăng; master hiện tại là node có epoch lớn nhất. `pd_route(req, item, sent_to)` là các request đã gửi. Trả về req, item, sent_to, `current_master` và `redirect` (boolean: request gửi nhầm node, phải chuyển hướng). Sắp theo req. |
