# Chương 22 — Xử lý truy vấn song song và phân tán

*Parallel and Distributed Query Processing · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch22`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 0. Phạm vi
Chương 22 ngoài lịch học CS4420. Trong bài SQL, `pd_emp` và `pd_dept` có cột `node` (0–2) cho biết tuple đang ở đâu; bạn tính số tuple phải chuyển của từng chiến lược, làm join/aggregate theo từng node rồi gộp, và kiểm tra kết quả bằng join thường.

### 1. Các dạng song song (slide 22.3–22.6)
- **Interquery parallelism**: nhiều truy vấn chạy song song trên các bộ xử lý khác nhau → tăng **throughput**; hợp với nhiều truy vấn nhỏ (PE 22.1a). Không giảm response time của từng truy vấn.
- **Intraquery parallelism**: một truy vấn chạy song song → giảm **response time**:
  - **Intraoperation**: một phép toán (sort, join, aggregate) chạy song song trên các partition dữ liệu — mở rộng tốt nhất vì số tuple lớn (PE 22.1b).
  - **Interoperation**: các phép toán khác nhau của cây truy vấn chạy song song — *pipelined* (đầu ra phép này là đầu vào phép kia) hoặc *independent* (hai nhánh không phụ thuộc).

### 2. Sort song song (slide 22.7–22.10)
- **Range-partitioning sort**: phân phối tuple lại theo range trên khoá sắp xếp (dùng histogram để cân bằng), mỗi node sort phần của mình, nối kết quả theo thứ tự node.
- **Parallel external sort-merge**: mỗi node sort dữ liệu cục bộ, rồi trộn song song các run đã sort (range-partition các run rồi merge).

### 3. Join song song (slide 22.11–22.25)
- **Partitioned join** (cho equi-join, natural join): **repartition** cả r và s trên thuộc tính join bằng cùng một hàm (hash hoặc range) → tuple khớp nhau nằm cùng node; mỗi node join cục bộ (hash join, merge join…). Nếu một relation đã được chia theo thuộc tính join thì chỉ repartition relation kia.
- **Fragment-and-replicate** (cho điều kiện bất kỳ, ví dụ r.A < s.B):
  - **Asymmetric** (= **broadcast join**): chia r (giữ nguyên partition hiện có), **gửi toàn bộ s tới mọi node**. Tốt khi s nhỏ.
  - **Symmetric**: chia r thành m mảnh, s thành n mảnh, mỗi cặp (r<sub>i</sub>, s<sub>j</sub>) xử lý ở một trong m·n bộ xử lý.
  - **Band join** |r.A − s.B| ≤ k với range partitioning: chỉ cần ghép r<sub>i</sub> với s<sub>i−1</sub>, s<sub>i</sub>, s<sub>i+1</sub> → khoảng 3n bộ xử lý thay vì n² (PE 22.4).
- **Chi phí truyền**: repartition gửi các tuple không nằm sẵn ở node đích; broadcast gửi |s| × (n − 1) tuple. Chọn chiến lược ít truyền hơn.
- **Semijoin filter / Bloom filter**: gửi một bit vector tóm tắt s.B tới các node của r; chỉ gửi đi các tuple r có thể khớp. Bloom filter có thể **dương tính giả** nhưng không bao giờ âm tính giả (PE 22.6).
- **Skew trong join**: partition lệch → một node chậm. Xử lý: virtual partitions, tách giá trị nặng, broadcast phần nóng.

### 4. Các phép khác (slide 22.26–22.32)
- **Selection**: theo điều kiện partitioning thì chỉ đọc vài node; ngược lại đọc mọi node song song.
- **Duplicate elimination**: sort/hash song song.
- **Aggregation** (`group by`): repartition theo khoá group rồi tính cục bộ. **Partial (pre-) aggregation**: mỗi node tính trước aggregate cục bộ trên dữ liệu đang có, chỉ gửi **một tuple mỗi nhóm** → giảm mạnh dữ liệu truyền và ảnh hưởng của skew (PE 22.2, 22.5c):
  - count: gửi count cục bộ, toàn cục = **sum** các count;
  - sum: sum các sum; min/max: min/max các giá trị cục bộ;
  - **avg**: gửi (sum, count) cục bộ, toàn cục = Σsum / Σcount (không lấy trung bình các trung bình).
- Nếu dữ liệu đã được chia theo một tập con của khoá group (ví dụ chia theo B, group by A, B) thì aggregate cục bộ luôn, **không cần repartition** (PE 22.8).
- **Outer join song song**: s nhỏ → replicate s, mỗi node tính r<sub>i</sub> ⟕ s. r nhỏ, s lớn → replicate r, mỗi node tính r ⋈ s<sub>i</sub> và báo về các r đã khớp; r không khớp ở node nào được bù null (PE 22.7).

### 5. Exchange operator và kế hoạch song song (slide 22.33–22.40)
- **Exchange operator** chuyển tuple giữa các node: *repartition* (hash/range), *broadcast*, *gather* (gom về một node), kèm *merge* nếu cần giữ thứ tự.
- Kế hoạch song song = kế hoạch tuần tự chèn thêm exchange. Ví dụ PE 22.5: chọn σ<sub>A>5</sub>(r) cục bộ (r chia theo A) → repartition theo B → join cục bộ với s (s đã chia theo B) → pre-aggregate theo r.C → repartition theo r.C → aggregate cuối.
- Pipeline nhiều phép trên **cùng** bộ xử lý thường tốt hơn chia ra, vì tránh chi phí chuyển tuple (trừ khi shared memory) (PE 22.3).

### 6. MapReduce và xử lý phân tán (slide 22.41–22.55)
- **MapReduce**: map(k, v) → danh sách (k', v'); hệ thống **shuffle** (repartition theo k'), reduce(k', danh sách v') → kết quả. Mapper/reducer hỏng thì chỉ chạy lại phần đó vì dữ liệu trung gian được ghi đĩa (PE 22.9).
- Join bằng MapReduce: partitioned join = map phát (khoá join, tuple có đánh dấu nguồn), reduce ghép; broadcast join = mọi mapper nạp relation nhỏ vào bộ nhớ, join ngay trong map; indexed nested-loop = mapper tra index của data store cho mỗi tuple (PE 22.11).
- **Distributed query processing** (giữa các site): chi phí truyền mạng chiếm ưu thế; **semijoin** r ⋉ s để giảm dữ liệu gửi; **query shipping** vs **data shipping**.
- Hệ **federated**: wrapper/mediator dịch truy vấn sang các nguồn khác nhau.

### Công thức chi phí truyền (trong bài tập)
| Chiến lược | Số tuple phải gửi |
|---|---|
| Repartition r theo thuộc tính join | số tuple r có node hiện tại ≠ node đích |
| Broadcast s tới n node | |s| × (n − 1) |
| Group by không pre-aggregate | số tuple có node ≠ node của nhóm |
| Group by có pre-aggregate | số **nhóm cục bộ** (node, nhóm) có node ≠ node của nhóm |

## 2. Trắc nghiệm (8 câu)

**Câu 1.** Hệ OLTP với rất nhiều truy vấn nhỏ. Dạng song song nào quan trọng nhất?

- A. Intraoperation
- B. Interoperation
- C. Interquery
- D. Pipelined

<details><summary>Đáp án</summary>

**C** — PE 22.1a.

</details>

**Câu 2.** Partitioned join áp dụng được cho điều kiện nào?

- A. r.A < s.B
- B. r.A = s.B (equi-join)
- C. Mọi điều kiện
- D. Chỉ cross product

<details><summary>Đáp án</summary>

**B** — Chỉ khi tuple khớp nhau có thể đưa về cùng node bằng một hàm partition.

</details>

**Câu 3.** Broadcast join (asymmetric fragment-and-replicate) phù hợp khi nào?

- A. Cả hai relation đều lớn
- B. Một relation nhỏ
- C. Không có index
- D. Join điều kiện bằng

<details><summary>Đáp án</summary>

**B** — Gửi relation nhỏ tới mọi node rẻ hơn repartition relation lớn.

</details>

**Câu 4.** Pre-aggregation của avg: mỗi node nên gửi gì?

- A. avg cục bộ
- B. (sum, count) cục bộ
- C. Mọi tuple
- D. max cục bộ

<details><summary>Đáp án</summary>

**B** — Toàn cục = Σsum / Σcount; trung bình các trung bình sai khi số tuple mỗi node khác nhau.

</details>

**Câu 5.** Bloom filter dùng làm semijoin filter có thể sai theo kiểu nào?

- A. Bỏ sót tuple khớp
- B. Cho qua tuple không khớp (false positive)
- C. Cả hai
- D. Không bao giờ sai

<details><summary>Đáp án</summary>

**B** — Bit được bật bởi giá trị khác có thể trùng; tuple khớp thật luôn qua.

</details>

**Câu 6.** s đã chia theo B. Tính group by A, B sum(C) có cần repartition không?

- A. Có, theo (A, B)
- B. Không: mọi tuple cùng (A, B) đã cùng B nên cùng node
- C. Có, theo A
- D. Chỉ khi có index

<details><summary>Đáp án</summary>

**B** — PE 22.8.

</details>

**Câu 7.** Band join |r.A − s.B| ≤ k với range partitioning cùng vector: r_i cần ghép với những mảnh nào của s?

- A. Mọi s_j
- B. s_{i−1}, s_i, s_{i+1}
- C. Chỉ s_i
- D. s_0

<details><summary>Đáp án</summary>

**B** — Với k nhỏ hơn độ rộng mỗi khoảng, chỉ các khoảng kề nhau có thể chứa cặp khớp (PE 22.4).

</details>

**Câu 8.** Exchange operator dùng để làm gì?

- A. Đổi thứ tự join
- B. Chuyển (repartition/broadcast/gather) tuple giữa các node trong kế hoạch song song
- C. Thay thế index
- D. Ghi log

<details><summary>Đáp án</summary>

**B** — Kế hoạch song song = kế hoạch tuần tự + các exchange.

</details>

## 3. Câu hỏi tự luận (11 câu)

**Câu 1.** 

> **Exercise 22.1.** Which kind of parallelism (interquery, interoperation, or intraoperation) is likely to matter most for each of the following tasks?
> 
> a. Increasing the throughput of a system that runs many small queries.
> 
> b. Increasing the throughput of a system that runs a few large queries, when there are many disks and processors.

**PE 22.1** — Dạng song song nào quan trọng nhất cho (a) nhiều truy vấn nhỏ; (b) ít truy vấn lớn, nhiều đĩa và bộ xử lý?

<details><summary>Gợi ý đáp án</summary>

a. **Interquery parallelism**: chạy các truy vấn nhỏ trên các bộ xử lý khác nhau cho throughput tốt. Song song hoá từng truy vấn nhỏ chỉ tăng chi phí khởi động mà không giảm đáng kể response time.

b. **Intraoperation parallelism**: truy vấn thường có ít phép toán nhưng mỗi phép xử lý rất nhiều tuple; chỉ chia dữ liệu của từng phép lên nhiều đĩa/bộ xử lý mới tận dụng được phần cứng lớn (interoperation bị giới hạn bởi số phép toán).

</details>

**Câu 2.** 

> **Exercise 22.2.** Describe how partial aggregation can be implemented for the **count** and **avg** aggregate functions so as to reduce data transfer.

**PE 22.2** — Cài partial aggregation cho count và avg để giảm dữ liệu truyền.

<details><summary>Gợi ý đáp án</summary>

Mỗi node tính trước trên dữ liệu cục bộ của nó, theo khoá group:
- **count**: node gửi (nhóm, count cục bộ) → node tổng hợp tính **sum** các count.
- **avg**: node gửi (nhóm, sum cục bộ, count cục bộ) → node tổng hợp tính Σsum / Σcount. (Không gửi avg cục bộ, vì trung bình các trung bình sai khi số tuple khác nhau.)

Mỗi node chỉ gửi **một tuple cho mỗi nhóm** nó có, thay vì mọi tuple. Bài CH22.04 tính avg theo cách này và CH22.05 đếm số tuple tiết kiệm được.

</details>

**Câu 3.** 

> **Exercise 22.3.** With pipelined parallelism, it is often worthwhile to run several operations of a pipeline on one processor, even when many processors are available.
> 
> a. Explain why.
> 
> b. Do the arguments of part a still hold if the machine has a shared-memory architecture? Explain why or why not.
> 
> c. Do the arguments of part a hold for independent parallelism? (That is, are there cases where, even though the operations are not pipelined and many processors are available, it is still better to run several operations on the same processor?)

**PE 22.3** — Vì sao với pipelined parallelism, chạy nhiều phép trên một bộ xử lý thường tốt hơn? Còn đúng với shared memory? Với independent parallelism?

<details><summary>Gợi ý đáp án</summary>

a. Nếu đặt mỗi phép ở một bộ xử lý, **mọi tuple** do một phép sinh ra phải được chuyển tới bộ xử lý của phép tiêu thụ nó; chi phí truyền thường lớn hơn lợi ích tăng tốc (pipeline thường ngắn và các phép không đều nhau).

b. Với **shared memory**, chuyển tuple giữa bộ xử lý rất rẻ (chỉ qua bộ nhớ chung), nên lập luận trên **gần như không còn đúng**.

c. **Có**: hai phép độc lập có thể cùng đưa kết quả vào một phép thứ ba; chạy cả ba trên cùng bộ xử lý có thể tốt hơn chuyển tuple giữa các bộ xử lý.

</details>

**Câu 4.** 

> **Exercise 22.4.** Consider join processing with symmetric fragment-and-replicate using range partitioning. How can the evaluation be optimized when the join condition has the form |r.A − s.B| ≤ k, with k a small constant? (|x| is the absolute value of x.) A join with such a condition is called a *band join*.

**PE 22.4** — Tối ưu symmetric fragment-and-replicate với range partitioning cho band join |r.A − s.B| ≤ k.

<details><summary>Gợi ý đáp án</summary>

Range-partition r trên A và s trên B bằng **cùng một vector** thành n mảnh r<sub>0</sub> … r<sub>n−1</sub>, s<sub>0</sub> … s<sub>n−1</sub> (độ rộng mỗi khoảng ≥ k). Một tuple của r<sub>i</sub> chỉ có thể khớp với tuple của s<sub>i−1</sub>, s<sub>i</sub>, s<sub>i+1</sub>. Vậy chỉ cần các bộ xử lý P<sub>i,i−1</sub>, P<sub>i,i</sub>, P<sub>i,i+1</sub>: mỗi mảnh được nhân bản lên **3** bộ xử lý thay vì n, tổng khoảng **3n** bộ xử lý thay vì n². Với cùng số bộ xử lý, có thể chia nhiều mảnh hơn nên mỗi join cục bộ nhanh hơn. Bài CH22.07 kiểm tra rằng mọi cặp khớp đều nằm ở các mảnh kề nhau.

</details>

**Câu 5.** 

> **Exercise 22.5.** Relation r is stored partitioned and indexed on A, and s is stored partitioned and indexed on B. Consider the query
> 
> <sub>r.C</sub>γ<sub>count(s.D)</sub>((σ<sub>A>5</sub>(r)) ⋈<sub>r.B=s.B</sub> s)
> 
> a. Using the exchange operator, give a parallel query plan for the part of the query that contains only the select and join operators.
> 
> b. Extend this plan to compute the aggregate as well, using pre-aggregation to keep data transfer as small as possible.
> 
> c. Skew during aggregation is a serious problem. Explain how the pre-aggregation above can also greatly reduce the effect of skew during aggregation.

**PE 22.5** — r chia và đánh chỉ mục trên A, s trên B. Cho <sub>r.C</sub>γ<sub>count(s.D)</sub>(σ<sub>A>5</sub>(r) ⋈<sub>r.B=s.B</sub> s): (a) kế hoạch song song cho select + join dùng exchange; (b) thêm aggregate với pre-aggregation; (c) pre-aggregation giảm ảnh hưởng skew thế nào?

<details><summary>Gợi ý đáp án</summary>

a. Ở mỗi node của r: σ<sub>A>5</sub>(r<sub>i</sub>) — chỉ các node có khoảng A > 5 (nếu range-partition, dùng index trên A). → **exchange: repartition theo B** (hash trên B, cùng hàm chia s). → ở mỗi node j: join cục bộ với s<sub>j</sub> (s đã chia theo B nên không phải chuyển s; có thể dùng index trên s.B).

b. Sau join ở mỗi node j: **pre-aggregate** theo r.C — tính count(s.D) cục bộ cho mỗi giá trị r.C. → **exchange: repartition theo r.C** (chỉ một tuple mỗi (node, r.C)). → mỗi node nhận tính **sum** các count cục bộ cho các r.C nó phụ trách. → (gather nếu cần trả về một chỗ).

c. Không có pre-aggregation, một giá trị r.C xuất hiện rất nhiều làm node phụ trách nó nhận lượng tuple khổng lồ. Với pre-aggregation, mỗi node chỉ gửi **một** tuple cho mỗi giá trị r.C, nên lượng dữ liệu dồn về node nặng nhất tối đa là số node, bất kể skew → ảnh hưởng của skew giảm mạnh.

</details>

**Câu 6.** 

> **Exercise 22.6.** Relation r is stored partitioned and indexed on A, and s is stored partitioned and indexed on B. Consider the join r ⋈<sub>r.B=s.B</sub> s. Relation s is fairly small, but not small enough for asymmetric fragment-and-replicate to be the best choice; r is large, and most r tuples match no s tuple. A hash join can be used, with a semijoin filter to cut down data transfer. Explain how semijoin filtering with Bloom filters would work in this parallel join.

**PE 22.6** — Join r ⋈<sub>r.B=s.B</sub> s, s đã chia theo B, nhỏ vừa phải; r lớn, chia theo A, đa số tuple không khớp. Dùng Bloom filter làm semijoin filter thế nào?

<details><summary>Gợi ý đáp án</summary>

1. Mỗi node của s (hoặc một node gom lại) xây **Bloom filter** trên s.B: một bit vector m bit, mỗi giá trị b bật các bit h<sub>1</sub>(b), …, h<sub>k</sub>(b). Gộp (OR) lại và **gửi bit vector tới mọi node của r** — rẻ vì chỉ m bit.
2. Mỗi node của r kiểm tra từng tuple: chỉ khi **mọi** bit h<sub>i</sub>(r.B) đều bật thì tuple *có thể* khớp.
3. Chỉ các tuple qua bộ lọc được **repartition theo r.B** và gửi tới node chứa s tương ứng (s đã chia theo B, không cần chia lại).
4. Mỗi node join cục bộ (loại các dương tính giả).

Vì đa số r không khớp, phần lớn bị loại tại chỗ → giảm mạnh dữ liệu truyền. Bloom filter có thể cho qua tuple không khớp (false positive) nhưng không bao giờ loại tuple khớp. Bài CH22.08 mô phỏng bộ lọc 16 bit với hai hàm hash.

</details>

**Câu 7.** 

> **Exercise 22.7.** We want to compute the left outer join r ⟕<sub>r.A=s.A</sub> s.
> 
> a. Relation s is small, while r is stored partitioned on r.B. Give an efficient parallel algorithm for the left outer join.
> 
> b. Now r is small and s is a large relation stored partitioned on s.B. Give an efficient parallel algorithm for the same left outer join.

**PE 22.7** — Thuật toán song song cho r ⟕<sub>r.A=s.A</sub> s: (a) s nhỏ, r chia theo r.B; (b) r nhỏ, s lớn chia theo s.B.

<details><summary>Gợi ý đáp án</summary>

a. **Replicate s** tới mọi node; mỗi node tính r<sub>i</sub> ⟕ s độc lập. Kết quả là hợp các kết quả cục bộ — đúng vì mỗi tuple r ở đúng một node và thấy toàn bộ s.

b. **Replicate r** tới mọi node; node i tính r ⋈ s<sub>i</sub> (inner join) và xuất kết quả. Mỗi node gửi về một node điều phối **danh sách các tuple r đã khớp** ở node đó. Node điều phối lấy hợp các danh sách; tuple r **không có trong hợp** được bù null cho các thuộc tính của s và thêm vào kết quả. (Không thể tính r ⟕ s<sub>i</sub> ở từng node vì sẽ sinh bản bù null sai cho tuple r khớp ở node khác.) Bài CH22.09 tìm các tuple cần bù null theo cách này.

</details>

**Câu 8.** 

> **Exercise 22.8.** We want to compute <sub>A,B</sub>γ<sub>sum(C)</sub> on a relation s that is stored partitioned on s.B. The number of distinct s.B values is large and the number of tuples per s.B value is fairly uniform. Explain how to compute it efficiently while minimizing or avoiding repartitioning.

**PE 22.8** — Tính <sub>A,B</sub>γ<sub>sum(C)</sub> trên s đã chia theo s.B (nhiều giá trị B, phân bố đều) hiệu quả nhất?

<details><summary>Gợi ý đáp án</summary>

Tính aggregate **cục bộ ở từng node, không repartition**. Lý do: để group theo (A, B) cần mọi tuple cùng (A, B) nằm cùng node; chia theo B đã thoả điều này vì tuple cùng (A, B) thì cùng B. Vì số giá trị B lớn và phân bố đều, partition hiện có cũng cân bằng, nên song song tốt. (Không chia gì cũng thoả điều kiện nhưng mất song song.) Bài CH22.10 kiểm tra rằng không nhóm (A, B) nào trải trên hai node, trong khi nhóm theo A thì có.

</details>

**Câu 9.** 

> **Exercise 22.9.** MapReduce implementations are fault tolerant: only the mappers or reducers that failed are re-executed. By default, a partitioned parallel join must be rerun entirely if even one node fails. A partitioned parallel join can be made fault tolerant in a MapReduce-like way, so that a node failure requires redoing only the work related to that node rather than the whole query. Explain what must be done, at partitioning time, at the sending node and at the receiving node to achieve this.

**PE 22.9** — Thêm khả năng chịu lỗi kiểu MapReduce cho partitioned parallel join: cần làm gì ở node gửi và node nhận khi repartition?

<details><summary>Gợi ý đáp án</summary>

Coi bước repartition như *map* và bước join như *reduce*.
- **Node nhận**: lưu mọi tuple nhận được xuống **đĩa cục bộ** và chỉ bắt đầu join khi đã nhận **đủ** từ mọi node gửi. Mỗi lô tuple ghi kèm node gửi; nếu node gửi hỏng và node khác thay nó chạy lại, node nhận **bỏ** mọi tuple từ node gửi cũ rồi nhận lại → không xử lý trùng.
- **Node gửi**: để node nhận hỏng có thể khôi phục mà không bắt mọi node gửi đọc lại toàn bộ input, node gửi **ghi xuống đĩa** các tuple đã chia cho từng node đích (như mapper lưu output trung gian), và gửi lại khi node join thay thế yêu cầu. Cái giá là chi phí ghi đĩa thêm.

Cách khác — quét lại input để tìm tuple cho node hỏng — buộc mọi node gửi đọc lại toàn bộ dữ liệu, gần như chạy lại cả join, nên không hữu ích.

</details>

**Câu 10.** 

> **Exercise 22.10.** When a parallel data store holds two relations r and s that must be joined, it may help to maintain the join as a materialized view. What are the benefits and overheads with respect to overall throughput, space use, and response time of user queries?

**PE 22.10** — Duy trì r ⋈ s như materialized view trên parallel data store: lợi ích và chi phí về throughput, chỗ lưu trữ, response time?

<details><summary>Gợi ý đáp án</summary>

- **Response time** của truy vấn join giảm mạnh: đọc view thay vì join, đặc biệt khi r hoặc s chia theo thuộc tính khác thuộc tính join (phải truyền rất nhiều dữ liệu).
- **Throughput**: mỗi cập nhật r hoặc s phải cập nhật thêm view (chi phí nhỏ cho mỗi cập nhật). Nếu join được truy vấn thường xuyên so với cập nhật → throughput tổng **tốt hơn nhiều**; nếu cập nhật dày mà ít khi truy vấn join → có thể **tệ hơn**.
- **Chỗ lưu trữ**: tốn thêm chỗ cho view, nhưng dung lượng đĩa rẻ so với I/O và truyền mạng, nên thường không phải chi phí lớn.

</details>

**Câu 11.** 

> **Exercise 22.11.** Explain how each of the following join algorithms can be implemented in the MapReduce framework:
> 
> a. Broadcast join (also called asymmetric fragment-and-replicate join).
> 
> b. Indexed nested-loops join, where the inner relation is stored in a parallel data store.
> 
> c. Partitioned join.

**PE 22.11** — Cài bằng MapReduce: (a) broadcast join; (b) indexed nested-loop join với relation trong lưu ở parallel data store; (c) partitioned join.

<details><summary>Gợi ý đáp án</summary>

a. **Broadcast join**: relation nhỏ s được phân phối tới mọi mapper (ví dụ qua distributed cache) và nạp vào bảng hash trong bộ nhớ khi mapper khởi động. Mapper đọc các tuple của relation lớn r (theo các split có sẵn), tra bảng hash, **phát ra kết quả join ngay trong map**. Không cần reduce (map-only job).

b. **Indexed nested-loop**: mapper đọc các tuple của relation ngoài r; với mỗi tuple, **tra** parallel data store (get/scan theo khoá join, dùng index) để lấy các tuple khớp của s, phát ra kết quả. Cũng là map-only; có thể gom nhiều khoá để tra theo lô.

c. **Partitioned join**: map đọc cả r và s, phát (**khoá join**, tuple kèm nhãn nguồn r/s). Shuffle repartition theo khoá join nên mọi tuple cùng khoá về cùng reducer. Reduce nhận (khoá, danh sách tuple), tách thành phần r và phần s, phát mọi cặp r × s (hash join cục bộ).

</details>

## 4. Bài tập SQL (11 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH22.01 | repartition: số tuple phải chuyển | ★☆☆ | `pd_emp(emp_id, dept_id, salary, node)` đang được chia round-robin trên 3 node (0–2); `pd_dept(dept_id, dname, node)` được chia theo `dept_id % 3`. Để làm partitioned join theo dept_id, ta repartition pd_emp bằng cùng hàm `dept_id % 3`. Trả về một số `moved`: số tuple của pd_emp phải chuyển sang node khác. |
| CH22.02 | partitioned join: join cục bộ | ★★☆ | Sau khi repartition pd_emp theo `dept_id % 3`, mỗi node join phần pd_emp của nó với phần pd_dept của nó (pd_dept.node). Trả về `node` và `local_results` (số dòng kết quả join ở node đó), cho cả 3 node 0–2 (kể cả node không có kết quả), sắp theo node. Tổng các local_results phải bằng số dòng của `pd_emp natural join pd_dept`. |
| CH22.03 | repartition vs broadcast | ★★☆ | So sánh hai chiến lược cho join pd_emp với pd_dept trên 3 node: (1) repartition pd_emp theo dept_id % 3 (pd_dept đã đúng chỗ) — chi phí là số tuple pd_emp phải chuyển; (2) broadcast pd_dept tới mọi node (giữ nguyên pd_emp) — mỗi tuple pd_dept phải gửi tới 2 node còn lại. Trả về một dòng: `repartition_cost`, `broadcast_cost`, `cheaper` (`repartition` hoặc `broadcast`; nếu bằng nhau ghi `tie`). |
| CH22.04 | partial aggregation: avg | ★★☆ | Exercise 22.2. Describe how partial aggregation can be implemented for the count and avg aggregate functions so as to reduce data transfer.<br>Tính lương trung bình mỗi dept_id theo partial aggregation: bước 1, mỗi node (cột `node` hiện tại của pd_emp) tính (dept_id, sum, count) cục bộ; bước 2, gộp các kết quả cục bộ thành avg toàn cục = tổng các sum / tổng các count. Trả về dept_id, `avg_salary` làm tròn 2, sắp theo dept_id. (Kết quả phải giống `avg(salary)` trực tiếp.) |
| CH22.05 | pre-aggregation giảm truyền | ★★☆ | Exercise 22.5. Relation r is stored partitioned and indexed on A, and s is stored partitioned and indexed on B. Consider the query  [r.C]γ[count(s.D)]((σ[A>5](r)) ⋈[r.B=s.B] s)  a. Using the exchange operator, give a parallel query plan for the part of the query that contains only the select and join operators.  b. Extend this plan to compute the aggregate as well, using pre-aggregation to keep data transfer as small as possible.  c. Skew during aggregation is a serious problem. Explain how the pre-aggregation above can also greatly reduce the effect of skew during aggregation.<br>Tính `count(*)` mỗi dept_id, trong đó nhóm của dept_id được tính ở node `dept_id % 3`. Trả về một dòng: `without_preagg` — số tuple phải gửi nếu mỗi node gửi nguyên tuple (các tuple có node ≠ dept_id % 3); `with_preagg` — số tuple phải gửi nếu mỗi node gửi một tuple (dept_id, count cục bộ) cho mỗi dept_id nó có (chỉ tính các cặp (node, dept_id) có node ≠ dept_id % 3). |
| CH22.06 | skew sau repartition | ★★☆ | Sau khi repartition pd_emp theo `dept_id % 3`, mỗi node nhận bao nhiêu tuple? Trả về một dòng: `max_load` (node nhiều nhất), `min_load` (node ít nhất, tính cả node 0 tuple trong 3 node) và `skew` = max_load / (số tuple / 3), làm tròn 2. Phòng nào gây skew? |
| CH22.07 | band join | ★★★ | Exercise 22.4. Consider join processing with symmetric fragment-and-replicate using range partitioning. How can the evaluation be optimized when the join condition has the form \|r.A − s.B\| ≤ k, with k a small constant? (\|x\| is the absolute value of x.) A join with such a condition is called a *band join*.<br>`pd_band_r(a)` và `pd_band_s(b)` được range-partition cùng một vector: giá trị 1–10 → mảnh 0, 11–20 → mảnh 1, 21–30 → mảnh 2 (mảnh = `(x − 1) / 10`). Tính band join `\|a − b\| <= 2`. Trả về các cặp mảnh `(r_part, s_part)` có ít nhất một cặp khớp, cùng số cặp khớp `matches`, sắp theo r_part, s_part. Kiểm tra: \|r_part − s_part\| luôn ≤ 1. |
| CH22.08 | Bloom filter | ★★★ | Exercise 22.6. Relation r is stored partitioned and indexed on A, and s is stored partitioned and indexed on B. Consider the join r ⋈[r.B=s.B] s. Relation s is fairly small, but not small enough for asymmetric fragment-and-replicate to be the best choice; r is large, and most r tuples match no s tuple. A hash join can be used, with a semijoin filter to cut down data transfer. Explain how semijoin filtering with Bloom filters would work in this parallel join.<br>Mô phỏng semijoin filter bằng Bloom filter 16 bit với hai hàm hash h1(x) = x % 16 và h2(x) = (x * 7) % 16. Bit được bật là mọi h1(b), h2(b) với b trong `pd_bloom_s(b)`. Một tuple của `pd_bloom_r(id, b)` qua bộ lọc nếu cả h1(r.b) và h2(r.b) đều là bit đã bật. Trả về một dòng: `passed` (số tuple r qua bộ lọc — phải gửi đi), `true_matches` (số tuple r thực sự khớp một s.b), `false_positives` (= passed − true_matches) và `total_r`. |
| CH22.09 | outer join song song | ★★☆ | Exercise 22.7 (b). We want to compute the left outer join r ⟕[r.A=s.A] s.  b. Now r is small and s is a large relation stored partitioned on s.B. Give an efficient parallel algorithm for the same left outer join.<br>`pd_lo_r(a, label)` nhỏ được replicate tới mọi node; `pd_lo_s(id, a, val, node)` lớn, đã chia trên 3 node. Theo PE 22.7b: mỗi node tính r ⋈ s[node] và báo về các r.a đã khớp; tuple r không khớp ở node nào thì bù null. Viết truy vấn trả về đúng các tuple được bù null: a, label, và `val` = null. Không dùng outer join: lấy hợp các r.a đã khớp ở từng node rồi loại. |
| CH22.10 | group by không cần repartition | ★★☆ | Exercise 22.8. We want to compute [A,B]γ[sum(C)] on a relation s that is stored partitioned on s.B. The number of distinct s.B values is large and the number of tuples per s.B value is fairly uniform. Explain how to compute it efficiently while minimizing or avoiding repartitioning.<br>`pd_sab(id, a, b, c, node)` đang được chia theo b (node = b % 3). Trả về một dòng: `ab_groups_split` — số nhóm (a, b) có tuple nằm trên hơn một node; `a_groups_split` — số nhóm chỉ theo a có tuple nằm trên hơn một node. Từ đó, group by a, b có cần repartition không? group by a thì sao? |
| CH22.11 | MapReduce word count | ★★☆ | Mô phỏng MapReduce đếm từ trên `pd_doc(doc_id, body)`. Map: tách body thành các từ (chuyển chữ thường, tách theo mọi ký tự không phải chữ cái a–z), bỏ chuỗi rỗng, phát (word, 1). Reduce: cộng theo word. Trả về word và `cnt`, chỉ các từ xuất hiện ít nhất 2 lần, sắp theo cnt giảm dần rồi word. |
