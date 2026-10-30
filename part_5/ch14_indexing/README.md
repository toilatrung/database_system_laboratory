# Chương 14 — Index

*Indexing · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch14`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 1. Khái niệm cơ bản (slide 14.3–14.5)
- **Search key**: thuộc tính (hoặc tập thuộc tính) dùng để tìm record. Index file gồm các **index entry** (search-key, pointer).
- Hai loại chính: **ordered index** (khoá được sắp) và **hash index** (khoá phân phối vào bucket bằng hàm băm).
- Tiêu chí đánh giá: kiểu truy cập hỗ trợ (tìm theo giá trị / theo **khoảng**), thời gian truy cập, thời gian insert, thời gian delete, chi phí chỗ.

### 2. Ordered index (slide 14.6–14.17)
| Loại | Định nghĩa |
|---|---|
| **Clustering index** (primary index) | thứ tự search key của index **trùng** thứ tự lưu record trong file (file tuần tự); search key thường (không bắt buộc) là primary key |
| **Secondary index** (nonclustering) | thứ tự khác thứ tự file; **phải dense**; mỗi entry trỏ tới một **bucket** chứa con trỏ tới mọi record có giá trị đó |
| **Dense index** | mỗi giá trị search key trong file có một entry |
| **Sparse index** | chỉ một số giá trị có entry (thường là record **đầu mỗi block**); chỉ dùng được khi file được sắp theo search key. Tìm k: lấy entry có khoá **lớn nhất ≤ k**, rồi quét tuần tự từ đó |

- Một relation chỉ có **một clustering index** (record chỉ sắp theo một thứ tự được — PE 14.2), nhưng nhiều secondary index.
- Quét tuần tự theo secondary index rất tốn: mỗi record có thể nằm ở một block khác → một I/O cho mỗi record.
- **Multilevel index**: index quá lớn thì coi nó như file tuần tự và lập **sparse index** trên nó (outer index trên inner index), lặp lại tới khi vừa bộ nhớ.
- Cập nhật index: insert/delete phải sửa mọi index của relation → **không nên tạo index trên mọi thuộc tính** (PE 14.1).
- **Composite search key** (a₁, a₂): sắp theo **thứ tự từ điển** — index (dept_name, salary) dùng được cho điều kiện trên dept_name, hoặc dept_name = … and salary < …, nhưng **không** hiệu quả cho chỉ điều kiện trên salary.

### 3. B+-tree (slide 14.18–14.45)
Cây cân bằng, mọi đường từ gốc tới lá dài bằng nhau. Với **n** = số con trỏ tối đa trong một nút:
| Nút | Số con trỏ / khoá |
|---|---|
| Nút trong (không phải gốc) | từ ⌈n/2⌉ tới n **con trỏ** con |
| Lá | từ ⌈(n−1)/2⌉ tới n − 1 **khoá** (mỗi khoá kèm con trỏ tới record), con trỏ thứ n nối sang lá kế tiếp |
| Gốc | nếu không là lá: ít nhất 2 con; nếu là lá: 0 tới n − 1 khoá |

- Nút trong: P₁, K₁, P₂, …, K<sub>n−1</sub>, P<sub>n</sub>; cây con P<sub>i</sub> chứa khoá ≥ K<sub>i−1</sub> và < K<sub>i</sub>.
- **Chiều cao**: với K khoá, đường từ gốc tới lá dài không quá **⌈log<sub>⌈n/2⌉</sub>(K)⌉**. Ví dụ: nút 4 KB, n ≈ 100, 1 triệu khoá → tối đa log₅₀(10⁶) ≈ 4 nút được truy cập; cây nhị phân cân bằng cần khoảng 20.
- **Fan-out**: với block B byte, khoá k byte, con trỏ p byte: n·p + (n − 1)·k ≤ B → n = ⌊(B + k)/(k + p)⌋.
- **Tìm kiếm** (find): từ gốc, ở mỗi nút chọn con trỏ theo khoá, tới lá. **Range query** (findRange / iterator): tới lá đầu tiên rồi đi theo con trỏ nối các lá (PE 14.6).
- **Insert**: chèn vào lá; nếu lá đầy (n khoá) → **split**: ⌈n/2⌉ khoá đầu ở lại, phần còn lại sang lá mới; chèn (khoá nhỏ nhất của lá mới, con trỏ) vào nút cha; cha đầy thì split tiếp, có thể lan tới gốc (cây cao thêm một mức).
- **Delete**: xoá khỏi lá; nếu lá quá vơi → **merge** với anh em (nếu vừa một nút) hoặc **redistribute** (mượn khoá); xoá entry ở cha, có thể lan lên; gốc chỉ còn một con thì bỏ gốc.
- **Chèn theo thứ tự sắp xếp**: mỗi lá bị tách chỉ còn **khoảng 50%** và không được chèn thêm (PE 14.7) → dùng **bulk loading**: sắp các entry rồi xây cây **từ dưới lên** (bottom-up), lấp đầy từng lá (PE 14.8).
- **Search key không unique**: thêm thuộc tính duy nhất (ví dụ primary key) vào search key để thành unique (record ID).
- **B+-tree file organization**: lá chứa chính record. **Secondary index trỏ tới search key của clustering index** thay vì địa chỉ record để không phải sửa khi record bị dời (split lá).
- **Khoá chuỗi độ dài thay đổi**: **prefix compression** — nút trong chỉ lưu tiền tố đủ phân biệt.
- **B-tree** (không có dấu +): khoá chỉ xuất hiện một lần, nút trong cũng chứa con trỏ record — ít lợi hơn trong thực tế.

### 4. Hash index (slide 14.46–14.57)
- **Bucket**: đơn vị lưu (một hoặc vài block). Hàm băm h: khoá → bucket. Hàm băm tốt: **uniform** và **random**.
- **Bucket overflow** do skew hoặc quá ít bucket → **overflow chaining** (closed addressing).
- **Static hashing**: số bucket cố định → khi dữ liệu tăng sẽ nhiều overflow; **dynamic hashing** (linear hashing, extendable hashing) tăng số bucket dần.
- Hash index chỉ tốt cho **so sánh bằng**, không hỗ trợ **range query**. PostgreSQL có `using hash`.

### 5. Index nhiều khoá (slide 14.58–14.64)
- Điều kiện dept_name = 'Finance' and salary = 80000: dùng index dept_name rồi lọc; dùng index salary rồi lọc; hoặc **giao hai tập con trỏ** từ hai index.
- **Composite index** (dept_name, salary) hiệu quả cho dept_name = … and salary < … nhưng không cho dept_name < … and salary < ….
- **Covering index**: lưu thêm thuộc tính (không thuộc search key) trong index để trả lời truy vấn **không cần đọc relation** (PostgreSQL: `include (...)`).

### 6. Tạo index trong SQL (slide 14.65)
```sql
create index dept_index on instructor (dept_name);
create unique index ... ;          -- đồng thời ép ràng buộc unique
create index ... on instructor (dept_name, salary);        -- composite
create index ... on instructor (salary) where salary > 80000; -- partial (PostgreSQL)
create index ... on student (lower(name));                 -- expression index
create index ... on takes (course_id) include (grade);     -- covering
create index ... using hash (name);
drop index dept_index;
```
Hầu hết hệ thống tự tạo index cho **primary key** (và unique). Foreign key thường **nên** có index (PE 14.10). PostgreSQL: `cluster table using index` sắp lại file theo index — chỉ một index được đánh dấu clustered.

### 7. Write-optimized index (slide 14.66–14.74)
B+-tree insert ngẫu nhiên tốn ≈ một I/O cho mỗi insert khi index không vừa bộ nhớ.
- **LSM tree** (log-structured merge): cây L₀ trong bộ nhớ; đầy thì gộp (merge) với L₁ trên đĩa bằng ghi tuần tự, L₁ đầy gộp vào L₂… (mỗi mức lớn hơn k lần). Tìm kiếm phải xem mọi mức. Biến thể **stepped-merge**: mỗi mức có nhiều cây, gộp khi đủ k cây → insert rẻ hơn, tìm đắt hơn (dùng **Bloom filter** để bỏ qua cây không chứa khoá). Dùng trong BigTable, Cassandra, RocksDB… Khi đọc nhiều mà không ghi, có thể gộp sớm để giảm số mức phải tìm (PE 14.11).
- **Buffer tree**: mỗi nút trong có buffer chứa các insert chưa đẩy xuống; buffer đầy thì đẩy xuống con. Dùng được với mọi cây (cả spatial index), nhưng nhiều I/O ngẫu nhiên hơn LSM (PE 14.12).

### 8. Bitmap index (slide 14.75–14.80)
Cho thuộc tính có **ít giá trị khác nhau** (gender, rating, khoảng lương). Mỗi giá trị v có một **bitmap**: bit i = 1 nếu record i có giá trị v (record được đánh số liên tiếp).
- Điều kiện kết hợp → **AND / OR / NOT** trên bitmap, cực nhanh (một lệnh CPU xử lý 32–64 bit). Đếm số record = đếm số bit 1.
- Phải xử lý record đã xoá bằng **existence bitmap** khi lấy NOT.
- Rất gọn: 1 bit mỗi record mỗi giá trị. PE 14.13 lập bitmap cho salary theo 4 khoảng và AND với bitmap Finance (bài CH14.09–11).

### 9. Index cho dữ liệu không gian và thời gian (slide 14.81–14.95)
- **k-d tree**: chia không gian luân phiên theo từng chiều. **Quadtree**: mỗi nút chia vùng thành 4 phần bằng nhau.
- **R-tree**: mỗi nút ứng với **hình chữ nhật bao (bounding box)** của các con; các hình chữ nhật có thể chồng nhau → tìm kiếm có thể đi nhiều nhánh. Hỗ trợ truy vấn vùng, nearest neighbor.
- Truy vấn tìm **đúng một điểm** thì B+-tree trên (x, y) đủ tốt và rẻ hơn (PE 14.14). Nearest neighbor bằng các truy vấn vùng tròn bán kính tăng dần (PE 14.15).
- **Temporal data**: khoảng thời gian [start, end) → index khoảng (R-tree một chiều, hoặc index trên (start, end)).

### Mẹo làm bài
- Vẽ B+-tree: ghi rõ n, quy tắc split (bên nào nhận ⌈n/2⌉), luôn kiểm tra số khoá tối thiểu của lá ⌈(n−1)/2⌉ và con trỏ tối thiểu của nút trong ⌈n/2⌉.
- Khi được hỏi "tạo index nào": index cho thuộc tính trong **điều kiện chọn**, **điều kiện join**, primary key/foreign key; bitmap cho thuộc tính ít giá trị; cân nhắc chi phí cập nhật.

## 2. Trắc nghiệm (11 câu)

**Câu 1.** Một relation có thể có bao nhiêu **clustering index** (theo các search key khác nhau)?

- A. Không giới hạn
- B. Một
- C. Hai
- D. Bằng số thuộc tính

<details><summary>Đáp án</summary>

**B** — Record chỉ được lưu theo một thứ tự (PE 14.2). Muốn hai thứ tự phải lưu relation hai lần.

</details>

**Câu 2.** Sparse index dùng được khi nào?

- A. Luôn luôn
- B. Khi file được sắp theo search key của index
- C. Chỉ với hash index
- D. Chỉ khi search key là unique

<details><summary>Đáp án</summary>

**B** — Tìm entry có khoá lớn nhất ≤ k rồi quét tuần tự — chỉ đúng khi file được sắp theo khoá đó.

</details>

**Câu 3.** B+-tree với n = 4 con trỏ mỗi nút. Một lá (không phải gốc) chứa tối thiểu bao nhiêu khoá?

- A. 1
- B. 2
- C. 3
- D. 4

<details><summary>Đáp án</summary>

**B** — Lá chứa từ ⌈(n−1)/2⌉ = ⌈1.5⌉ = 2 tới n − 1 = 3 khoá.

</details>

**Câu 4.** Nút trong (không phải gốc) của B+-tree với n = 6 có tối thiểu bao nhiêu con trỏ con?

- A. 2
- B. 3
- C. 4
- D. 6

<details><summary>Đáp án</summary>

**B** — ⌈n/2⌉ = 3.

</details>

**Câu 5.** Chèn khoá theo thứ tự tăng dần vào B+-tree (split thông thường) thì các lá đầy khoảng bao nhiêu?

- A. 100%
- B. khoảng 50%
- C. khoảng 67%
- D. 25%

<details><summary>Đáp án</summary>

**B** — PE 14.7: nửa trái sau mỗi lần split không bao giờ được chèn thêm. Vì vậy nên bulk-load bottom-up.

</details>

**Câu 6.** Hash index **không** hỗ trợ tốt loại truy vấn nào?

- A. name = 'Wu'
- B. salary between 60000 and 80000
- C. ID = '12121'
- D. Tìm một khoá cụ thể

<details><summary>Đáp án</summary>

**B** — Hàm băm phá vỡ thứ tự khoá, nên không dùng được cho range query.

</details>

**Câu 7.** Composite index trên (dept_name, salary) **không** hiệu quả cho điều kiện nào?

- A. dept_name = 'Finance'
- B. dept_name = 'Finance' and salary > 80000
- C. salary > 80000 (không có điều kiện trên dept_name)
- D. dept_name = 'Finance' and salary = 90000

<details><summary>Đáp án</summary>

**C** — Khoá được sắp theo dept_name trước; các salary > 80000 nằm rải rác khắp index.

</details>

**Câu 8.** Bitmap index phù hợp nhất với thuộc tính nào?

- A. ID (unique)
- B. email
- C. gender hoặc khoảng lương (ít giá trị khác nhau)
- D. địa chỉ

<details><summary>Đáp án</summary>

**C** — Mỗi giá trị một bitmap; ít giá trị → ít bitmap, AND/OR rất nhanh.

</details>

**Câu 9.** LSM tree tối ưu cho thao tác nào và đánh đổi gì?

- A. Tối ưu đọc, ghi chậm hơn
- B. Tối ưu insert (ghi tuần tự theo mức), nhưng tìm kiếm phải xem nhiều mức
- C. Tối ưu range query, tốn chỗ
- D. Không đánh đổi gì

<details><summary>Đáp án</summary>

**B** — Dùng Bloom filter để giảm chi phí tìm trên các mức.

</details>

**Câu 10.** Covering index là gì?

- A. Index trên mọi cột
- B. Index lưu thêm thuộc tính để trả lời truy vấn mà không cần đọc relation
- C. Index trên khoá ngoại
- D. Index dạng bitmap

<details><summary>Đáp án</summary>

**B** — PostgreSQL: create index ... (course_id) include (grade).

</details>

**Câu 11.** Truy vấn duy nhất là "có nhà hàng nào ở đúng điểm (x, y) không?". Index nào phù hợp hơn?

- A. R-tree
- B. B+-tree trên (x, y)
- C. Bitmap index
- D. Không cần index

<details><summary>Đáp án</summary>

**B** — PE 14.14: truy vấn so sánh bằng trên một điểm; B+-tree đơn giản và rẻ hơn. R-tree cần cho truy vấn vùng/nearest neighbor.

</details>

## 3. Câu hỏi tự luận (15 câu)

**Câu 1.** 

> **Exercise 14.1.** Indices make queries faster, yet creating an index on every attribute and every combination of attributes that might be a search key is usually a bad idea. Explain why.

**PE 14.1** — Vì sao không nên tạo index trên mọi thuộc tính và mọi tổ hợp thuộc tính có thể là search key?

<details><summary>Gợi ý đáp án</summary>

- Mỗi index tốn thêm **CPU và I/O khi insert, delete** (phải sửa mọi index).
- Index trên thuộc tính không phải khoá chính còn phải sửa khi **update** (update thường không đổi primary key, nên index primary key thường không bị ảnh hưởng).
- Mỗi index tốn thêm **chỗ lưu trữ**.
- Với truy vấn có điều kiện trên nhiều khoá, chỉ cần index trên một vài khoá là đã đủ hiệu quả — thêm index khi đã có nhiều index thì lợi ích giảm dần.

</details>

**Câu 2.** 

> **Exercise 14.2.** Can a relation in general have two clustering indices on different search keys? Explain your answer.

**PE 14.2** — Một relation có thể có hai clustering index trên hai search key khác nhau không?

<details><summary>Gợi ý đáp án</summary>

Nói chung **không**: clustering index đòi hỏi record được lưu **theo thứ tự** của search key; record chỉ có thể sắp theo một thứ tự. Muốn hai clustering index phải **lưu relation hai lần** (nhân đôi dữ liệu) — không hiệu quả trong hệ thống tập trung. PostgreSQL thể hiện điều này: `cluster ... using` chỉ đánh dấu được một index là clustered (bài CH14.08).

</details>

**Câu 3.** 

> **Exercise 14.3.** Build a B<sup>+</sup>-tree for the key values (2, 3, 5, 7, 11, 17, 19, 23, 29, 31). The tree starts empty and the values are inserted in ascending order. Build the trees for each of the following numbers of pointers that fit in one node:
> 
> a. Four
> 
> b. Six
> 
> c. Eight

**PE 14.3** — Xây B+-tree cho (2, 3, 5, 7, 11, 17, 19, 23, 29, 31), chèn theo thứ tự tăng, với n = 4, 6, 8 con trỏ mỗi nút.

<details><summary>Gợi ý đáp án</summary>

Quy ước: lá chứa tối đa n − 1 khoá; khi split, nút không phải gốc không bao giờ có ít hơn ⌈n/2⌉ con trỏ.

**a. n = 4** (lá tối đa 3 khoá, tối thiểu 2):
```
                [19]
        [5 | 11]        [29]
[2 3] [5 7] [11 17]  [19 23] [29 31]
```

**b. n = 6** (lá tối đa 5 khoá, tối thiểu 3):
```
              [7 | 19]
[2 3 5]  [7 11 17]  [19 23 29 31]
```

**c. n = 8** (lá tối đa 7 khoá, tối thiểu 4):
```
                 [11]
[2 3 5 7]   [11 17 19 23 29 31]
```
Bài CH14.15 tính các giới hạn số khoá/con trỏ của từng trường hợp.

</details>

**Câu 4.** 

> **Exercise 14.4.** For each B<sup>+</sup>-tree of Exercise 14.3, show the tree after each step of the following series of operations:
> 
> a. Insert 9.
> 
> b. Insert 10.
> 
> c. Insert 8.
> 
> d. Delete 23.
> 
> e. Delete 19.

**PE 14.4** — Với mỗi cây của PE 14.3, vẽ cây sau mỗi bước: insert 9, insert 10, insert 8, delete 23, delete 19.

<details><summary>Gợi ý đáp án</summary>

**Cây n = 4:**
- Insert 9: lá [5 7] → [5 7 9]. Cây: gốc [19]; nút trong [5 | 11], [29]; lá [2 3] [5 7 9] [11 17] [19 23] [29 31].
- Insert 10: lá [5 7 9] đầy → split [5 7] [9 10]; cha thành [5 | 9 | 11]. Lá: [2 3] [5 7] [9 10] [11 17] [19 23] [29 31].
- Insert 8: [5 7] → [5 7 8].
- Delete 23: lá [19] quá vơi, gộp với [29 31] → [19 29 31]; nút trong [29] mất con → mượn/gộp với [5 | 9 | 11]: cây thành gốc [11]; nút trong [5 | 9] và [19]; lá [2 3] [5 7 8] [9 10] [11 17] [19 29 31].
- Delete 19: lá [29 31], khoá ở cha đổi thành 29: gốc [11]; nút trong [5 | 9], [29]; lá [2 3] [5 7 8] [9 10] [11 17] [29 31].

**Cây n = 6:**
- Insert 9: [7 11 17] → [7 9 11 17]. Gốc [7 | 19].
- Insert 10: [7 9 10 11 17] (vẫn ≤ 5 khoá).
- Insert 8: lá đầy (6 khoá) → split [7 8 9] [10 11 17]; gốc [7 | 10 | 19]; lá [2 3 5] [7 8 9] [10 11 17] [19 23 29 31].
- Delete 23: [19 29 31] (vẫn ≥ 3 khoá).
- Delete 19: lá [29 31] quá vơi → gộp với [10 11 17] → [10 11 17 29 31]; gốc [7 | 10]; lá [2 3 5] [7 8 9] [10 11 17 29 31].

**Cây n = 8:**
- Insert 9: [2 3 5 7 9] | gốc [11] | [11 17 19 23 29 31].
- Insert 10: [2 3 5 7 9 10].
- Insert 8: [2 3 5 7 8 9 10] (7 khoá, vẫn vừa).
- Delete 23: [11 17 19 29 31].
- Delete 19: [11 17 29 31] (4 khoá = tối thiểu, vẫn hợp lệ). Gốc vẫn [11].

</details>

**Câu 5.** 

> **Exercise 14.5.** Consider the modified redistribution scheme for B<sup>+</sup>-trees described in the chapter (when a node is full, its entries are redistributed with m − 1 sibling nodes so that m nodes share them, instead of always splitting one node into two). What is the expected height of the tree as a function of n?

**PE 14.5** — Với cơ chế redistribution cải tiến (m − 1 anh em chia cho m nút), chiều cao kỳ vọng của B+-tree theo n là bao nhiêu?

<details><summary>Gợi ý đáp án</summary>

Mỗi nút được bảo đảm đầy ít nhất khoảng (m − 1)/m thay vì 1/2, tức có ít nhất ⌊(m − 1)n/m⌋ con trỏ. Với K giá trị search key, chiều cao kỳ vọng là
```
log_⌊(m−1)n/m⌋ (K)
```
(so với log<sub>⌈n/2⌉</sub>(K) của B+-tree thường). Ví dụ m = 3 (2 nút chia cho 3) → mỗi nút đầy ít nhất 2/3.

</details>

**Câu 6.** 

> **Exercise 14.6.** Write pseudocode for a B<sup>+</sup>-tree function findRangeIterator(). It behaves like findRange() but returns an iterator object, as described in Section 14.3.2. Also give pseudocode for the iterator class, including the variables kept in an iterator object and the next() method.

**PE 14.6** — Viết pseudocode findRangeIterator() trả về iterator, và lớp iterator (biến, phương thức next()).

<details><summary>Gợi ý đáp án</summary>

```
function findRangeIterator(lb, ub)
    /* trả về iterator duyệt các record có lb ≤ khoá ≤ ub */
    C = root
    while C không phải lá
        i = số nhỏ nhất sao cho lb ≤ C.K_i
        if không có i như vậy then C = con trỏ khác null cuối cùng của C
        else if lb = C.K_i then C = C.P_(i+1)
        else C = C.P_i
    /* C là lá có thể chứa lb */
    i = số nhỏ nhất sao cho C.K_i ≥ lb   (nếu không có: i = số khoá của C + 1)
    return new RangeIterator(C, i, ub)

class RangeIterator
    leaf      /* lá hiện tại */
    pos       /* vị trí khoá kế tiếp trong lá */
    ub        /* cận trên */
    done = false

    method next()   /* trả về record kế tiếp, hoặc null khi hết */
        if done then return null
        if pos > số khoá của leaf then
            leaf = leaf.P_n          /* lá kế tiếp */
            pos = 1
            if leaf = null then done = true; return null
        if leaf.K_pos > ub then done = true; return null
        r = record được trỏ bởi leaf.P_pos
        pos = pos + 1
        return r
```
Iterator chỉ giữ trạng thái (lá, vị trí, cận trên), không cần dựng sẵn toàn bộ kết quả.

</details>

**Câu 7.** 

> **Exercise 14.7.** If index entries were inserted into a B<sup>+</sup>-tree in sorted order, what would the occupancy of each leaf node be? Explain why.

**PE 14.7** — Nếu index entry được chèn theo thứ tự sắp xếp, mỗi lá của B+-tree đầy bao nhiêu? Vì sao?

<details><summary>Gợi ý đáp án</summary>

Chèn **tăng dần**: entry mới luôn đi vào **lá cuối**. Lá cuối đầy thì bị tách làm hai; nút trái không bao giờ được chèn thêm, mọi insert sau đi vào nút phải. Vì vậy mọi lá (trừ lá cuối) chỉ đầy **khoảng 50%**.

Chèn **giảm dần**: tình huống đối xứng — nút phải sau split không bao giờ được chạm lại; mọi lá trừ lá đầu tiên đầy khoảng 50%.

</details>

**Câu 8.** 

> **Exercise 14.8.** A secondary B<sup>+</sup>-tree index is to be built on a relation r containing n<sub>r</sub> tuples.
> 
> a. Give a formula for the cost of building the index by inserting one record at a time. Assume each block holds on average f entries and that all levels of the tree above the leaves are kept in memory.
> 
> b. If one random disk access takes 10 milliseconds, what does building the index cost for a relation with 10 million records?
> 
> c. Write pseudocode for the bottom-up construction of a B<sup>+</sup>-tree outlined in Section 14.4.4. You may assume a function that efficiently sorts a large file is available.

**PE 14.8** — (a) Công thức chi phí xây secondary B+-tree bằng cách chèn từng record (mỗi block f entry, các mức trên lá nằm trong bộ nhớ); (b) chi phí với 10 triệu record nếu một lần truy cập ngẫu nhiên tốn 10 ms; (c) pseudocode xây bottom-up.

<details><summary>Gợi ý đáp án</summary>

a. Tìm lá cần chèn gần như miễn phí (nút trong ở bộ nhớ). Ở mức lá: **một truy cập ngẫu nhiên để đọc** lá và **một để ghi** lại. Split lá cần thêm một lần ghi trang. Tổng cộng tối đa **2·n<sub>r</sub> truy cập ngẫu nhiên** và **n<sub>r</sub> + 2·(n<sub>r</sub>/f) lần ghi trang** (trường hợp xấu mỗi lá chỉ đầy một nửa nên số lần split ≈ 2·n<sub>r</sub>/f). Chi phí ghi nút trong ≈ 2·(n<sub>r</sub>/f)/f, nhỏ, có thể bỏ qua.

b. Bỏ qua chi phí ghi trang: 10 000 000 × 2 × 10 ms = 200 000 s ≈ **56 giờ** (bài CH14.16).

c. Sắp các cặp (khoá, con trỏ) bằng external sort, rồi:
```
function insert_in_leaf(K, P)
    if cây rỗng then tạo lá L, cũng là gốc
    else L = lá cuối cùng của chuỗi lá
    if L có ít hơn n − 1 khoá then chèn (K, P) vào chỗ trống đầu tiên của L
    else
        tạo lá mới L1; L.P_n = L1
        K1 = khoá cuối cùng của L     /* hoặc K, khoá nhỏ nhất của L1 */
        insert_in_parent(1, L, K, L1)
        chèn (K, P) vào đầu L1

function insert_in_parent(level l, P, K, P1)
    if mức l chưa có nút then
        tạo nút trong N làm gốc; ghi (P, K, P1) vào N; return
    N = nút phải nhất ở mức l
    if N có ít hơn n con trỏ then chèn (K, P1) vào chỗ trống đầu tiên của N
    else
        tạo nút trong mới N1; ghi P1 vào đầu N1
        insert_in_parent(l + 1, N, K, N1)
```
Gọi insert_in_leaf cho từng cặp theo thứ tự tăng dần. Giữ địa chỉ nút cuối mỗi mức trong một mảng để khỏi phải tìm. Nút cuối mỗi mức có thể chưa đầy một nửa → phân phối lại khoá giữa hai nút cuối của mức đó (nút áp chót luôn đầy). Mỗi trang chỉ được ghi một lần, tuần tự → nhanh hơn rất nhiều so với (b).

</details>

**Câu 9.** 

> **Exercise 14.9.** After a sequence of inserts, the leaf nodes of a B<sup>+</sup>-tree file organization may no longer be sequential on disk.
> 
> a. Explain why sequentiality can be lost.
> 
> b. To reduce seeks during a sequential scan, many databases allocate leaf pages in extents of n blocks, for some fairly large n. When the first leaf of a B<sup>+</sup>-tree is allocated, only one block of an n-block unit is used and the other pages stay free. When a page splits and its n-block unit still has a free page, the new page goes there. When the n-block unit is full, another n-block unit is allocated; the first n/2 leaf pages are kept in one n-block unit and the rest go to the second one. Assume, for simplicity, that there are no deletions.
> 
> 1. What is the worst-case occupancy of the allocated space, with no deletions, once the first n-block unit is full?
> 2. Can leaf nodes allocated to an n-node block unit be non-consecutive — that is, can two leaf nodes be in one n-node block while a leaf node lying between them in key order is in a different n-node block?
> 3. Assuming the buffer can hold an n-page block (a reasonable assumption), how many seeks does a leaf-level scan of the B<sup>+</sup>-tree need in the worst case? Compare this with the worst case when leaf pages are allocated one block at a time.
> 4. Redistributing values to siblings to improve space utilization is likely to be more efficient when combined with this allocation scheme for leaf blocks. Explain why.

**PE 14.9** — (a) Vì sao lá của B+-tree file organization mất tính tuần tự? (b) Cấp phát lá theo đơn vị n block: (i) độ đầy tệ nhất, (ii) lá của một đơn vị có thể không liên tiếp không, (iii) số seek khi quét mức lá, (iv) vì sao redistribution hiệu quả hơn với cách này?

<details><summary>Gợi ý đáp án</summary>

a. Khi mới tạo, có thể cấp các block gần như liên tiếp cho các lá liên tiếp. Sau nhiều insert/delete, lá mới sinh ra do split được đặt ở chỗ trống bất kỳ trên đĩa → các lá kề nhau trong cây nằm rải rác, quét tuần tự phải seek ngày càng nhiều.

b.
1. Tệ nhất mỗi đơn vị n block chỉ đầy một nửa và mỗi lá cũng chỉ đầy một nửa → **25%**.
2. **Không**: khi tách một đơn vị, n/2 lá đầu ở lại, phần còn lại sang đơn vị mới → thứ tự được giữ, các lá trong một đơn vị luôn liên tiếp nhau.
3. Cấp từng block: tệ nhất **một seek cho mỗi lá**. Cấp theo đơn vị: mỗi đơn vị chứa ít nhất n/2 lá và đọc được bằng một seek → số seek giảm khoảng **n/2 lần**.
4. Phân phối lại giữa các lá **trong cùng một đơn vị** không cần thêm seek (đơn vị đã ở trong buffer), trong khi B+-tree thường cần một seek cho mỗi lá tham gia. Độ đầy tệ nhất quay lại gần 50%.

</details>

**Câu 10.** 

> **Exercise 14.10.** You are given a database schema and a set of queries that run frequently. How would you use this information to decide which indices to create?

**PE 14.10** — Có schema và các truy vấn chạy thường xuyên; dựa vào đó quyết định tạo index nào thế nào?

<details><summary>Gợi ý đáp án</summary>

- Index trên các thuộc tính xuất hiện trong **điều kiện chọn** (where); nếu thuộc tính ít giá trị khác nhau → **bitmap index**, ngược lại B+-tree.
- B+-tree index trên **primary key** và **foreign key**.
- Index trên các thuộc tính trong **điều kiện join**.
- Cân nhắc **composite/covering index** cho truy vấn thường xuyên chỉ cần vài cột; tránh index cho bảng cập nhật nhiều mà ít truy vấn; bỏ index thừa (index có cột là tiền tố của index khác — bài CH14.17).

</details>

**Câu 11.** 

> **Exercise 14.11.** In write-optimized trees such as the LSM tree or the stepped-merge index, entries of one level are merged into the next level only once the level is full. Suggest how to change this policy to improve read performance during periods with many reads and no updates.

**PE 14.11** — LSM tree/stepped-merge chỉ gộp một mức xuống mức sau khi mức đầy. Đổi chính sách thế nào để tăng tốc đọc khi nhiều đọc, không cập nhật?

<details><summary>Gợi ý đáp án</summary>

Khi đã lâu không có cập nhật nhưng có nhiều lần tra cứu, **gộp sớm** các entry ở mức i vào mức i + 1 **dù mức i chưa đầy** (với stepped-merge: gộp các cây trong cùng một mức thành một). Lợi ích: lần đọc sau không phải tìm ở mức i (ít cây/mức hơn để tra), giảm chi phí đọc.

</details>

**Câu 12.** 

> **Exercise 14.12.** What trade-offs do buffer trees present compared with LSM trees?

**PE 14.12** — Buffer tree so với LSM tree có những đánh đổi gì?

<details><summary>Gợi ý đáp án</summary>

- **Buffer tree** áp dụng được cho **mọi cây index** (kể cả spatial index như R-tree) để giảm chi phí insert/update. **LSM tree** chỉ dùng được với dữ liệu **có thứ tự tuyến tính**, gộp được (merge).
- Nhưng buffer tree cần **nhiều I/O ngẫu nhiên hơn** khi insert so với (mọi biến thể) LSM tree, vốn ghi tuần tự.
- Cả hai (write-optimized) đều giảm mạnh chi phí insert so với B+-tree, nhưng **tra cứu** có thể đắt hơn B+-tree đáng kể.

</details>

**Câu 13.** 

> **Exercise 14.13.** Consider the *instructor* relation of Figure 14.1.
> 
> a. Build a bitmap index on the attribute *salary*, splitting salary values into four ranges: below 50,000; 50,000 to below 60,000; 60,000 to below 70,000; and 70,000 and above.
> 
> b. A query asks for all instructors in the Finance department whose salary is 80,000 or more. Describe the steps for answering the query and show the intermediate and final bitmaps built along the way.
> 
> *Figure 14.1 — The instructor relation:*
> 
> | ID | name | dept_name | salary |
> |---|---|---|---|
> | 10101 | Srinivasan | Comp. Sci. | 65000 |
> | 12121 | Wu | Finance | 90000 |
> | 15151 | Mozart | Music | 40000 |
> | 22222 | Einstein | Physics | 95000 |
> | 32343 | El Said | History | 60000 |
> | 33456 | Gold | Physics | 87000 |
> | 45565 | Katz | Comp. Sci. | 75000 |
> | 58583 | Califieri | History | 62000 |
> | 76543 | Singh | Finance | 80000 |
> | 76766 | Crick | Biology | 72000 |
> | 83821 | Brandt | Comp. Sci. | 92000 |
> | 98345 | Kim | Elec. Eng. | 80000 |

**PE 14.13** — (a) Lập bitmap index cho salary của instructor theo 4 khoảng (< 50000, 50000–< 60000, 60000–< 70000, ≥ 70000). (b) Các bước trả lời "instructor khoa Finance có salary ≥ 80000", kèm bitmap trung gian và cuối.

<details><summary>Gợi ý đáp án</summary>

Record theo thứ tự: 10101, 12121, 15151, 22222, 32343, 33456, 45565, 58583, 76543, 76766, 83821, 98345.

a.
| Khoảng | Bitmap |
|---|---|
| S₁: < 50000 | 0 0 1 0 0 0 0 0 0 0 0 0 |
| S₂: 50000–< 60000 | 0 0 0 0 0 0 0 0 0 0 0 0 |
| S₃: 60000–< 70000 | 1 0 0 0 1 0 0 1 0 0 0 0 |
| S₄: ≥ 70000 | 0 1 0 1 0 1 1 0 1 1 1 1 |

b. Cần thêm bitmap trên dept_name; Finance = 0 1 0 0 0 0 0 0 1 0 0 0.
1. AND bitmap Finance với S₄ (khoảng chứa mọi salary ≥ 80000): 0 1 0 0 0 0 0 0 1 0 0 0.
2. Đọc các record có bit 1 (Wu 90000, Singh 80000) và **kiểm tra lại** salary ≥ 80000 (vì S₄ bắt đầu từ 70000).
3. Kết quả: **Wu** và **Singh**.

Bài CH14.09–11 dựng các bitmap này bằng SQL.

</details>

**Câu 14.** 

> **Exercise 14.14.** A relation stores the x, y coordinates and names of restaurants. The only queries ever asked give a point and ask whether a restaurant is located exactly at that point. Which index is preferable, an R-tree or a B-tree? Why?

**PE 14.14** — Chỉ có truy vấn "có nhà hàng ở đúng điểm (x, y) không?". R-tree hay B-tree tốt hơn? Vì sao?

<details><summary>Gợi ý đáp án</summary>

**B-tree/B+-tree** trên khoá ghép (x, y). Truy vấn chỉ là **so sánh bằng** trên cả hai toạ độ nên index thứ tự trên (x, y) tìm được trong một đường đi từ gốc tới lá, chiều cao log, không có chồng lấn. R-tree được thiết kế cho truy vấn **vùng/nearest neighbor**; các hình chữ nhật bao có thể **chồng nhau** nên một tìm kiếm điểm có thể phải đi nhiều nhánh, và R-tree phức tạp, tốn hơn để duy trì. (Hash index trên (x, y) cũng là lựa chọn tốt cho truy vấn bằng.)

</details>

**Câu 15.** 

> **Exercise 14.15.** A spatial database supports region queries with circular regions but not nearest-neighbor queries. Describe an algorithm that finds the nearest neighbor using several region queries.

**PE 14.15** — CSDL không gian chỉ hỗ trợ truy vấn vùng tròn, không hỗ trợ nearest neighbor. Thuật toán tìm nearest neighbor bằng nhiều truy vấn vùng?

<details><summary>Gợi ý đáp án</summary>

Bắt đầu với bán kính r rất nhỏ quanh điểm truy vấn q. Nếu vùng tròn không chứa điểm nào, **tăng bán kính** (ví dụ nhân 1.5) và hỏi lại. Khi vùng chứa ít nhất một điểm, điểm gần nhất trong kết quả **chính là** nearest neighbor (mọi điểm ngoài vùng đều xa hơn r, còn điểm trong vùng có khoảng cách ≤ r). Vì bán kính chỉ lớn hơn bán kính tối thiểu cần thiết một hệ số nhỏ, kết quả mỗi truy vấn không có quá nhiều điểm.

</details>

## 4. Bài tập SQL (18 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH14.01 | create index | ★☆☆ | Tạo index B+-tree (mặc định) trên `instructor(dept_name)` để tăng tốc các truy vấn lọc theo khoa. Hệ thống liệt kê mọi index (không kể primary key) của instructor qua catalog. |
| CH14.02 | composite index | ★★☆ | Truy vấn thường xuyên: `select * from instructor where dept_name = ? and salary > ?`. Tạo một composite index phù hợp nhất (thứ tự cột quan trọng: điều kiện bằng trước, điều kiện khoảng sau). |
| CH14.03 | unique expression index | ★★☆ | Không cho hai sinh viên có tên trùng nhau không phân biệt hoa thường: tạo unique index trên `lower(name)` của student. Hệ thống kiểm tra catalog, rồi thử chèn sinh viên ('99001', 'SHANKAR', 'Comp. Sci.', 0) — phải bị từ chối (23505). |
| CH14.04 | partial index | ★★☆ | Chỉ các truy vấn về giảng viên lương cao (salary > 80000) cần index trên salary. Tạo partial index trên `instructor(salary)` chỉ chứa các dòng có `salary > 80000`. |
| CH14.05 | hash index | ★☆☆ | Tạo hash index trên `student(name)` (chỉ dùng cho so sánh bằng). |
| CH14.06 | covering index | ★★☆ | Truy vấn `select grade from takes where course_id = ?` chạy rất thường xuyên. Tạo covering index trên `takes(course_id)` có kèm cột grade (`include`) để trả lời mà không cần đọc bảng takes. Hệ thống đọc định nghĩa index từ `pg_indexes`. |
| CH14.07 | catalog: existing indexes | ★★☆ | Hầu hết hệ thống tự tạo index cho primary key. Dùng catalog `pg_indexes`, liệt kê mọi index của các bảng section, takes, teaches: tablename, indexname và `columns` = phần trong ngoặc của indexdef (ví dụ `id, course_id, ...`). Sắp theo tablename. |
| CH14.08 | PE 14.2 one clustering index | ★★★ | Exercise 14.2. Can a relation in general have two clustering indices on different search keys? Explain your answer.<br>Minh hoạ PE 14.2 trong PostgreSQL: tạo index `ix_inst_salary` trên instructor(salary) và `ix_inst_name` trên instructor(name); `cluster instructor using ix_inst_salary`, rồi `cluster instructor using ix_inst_name`. Cuối cùng trả về tên các index của instructor (`indexrelid::regclass::text`) và cột `indisclustered`, sắp theo tên. (Chỉ một index có thể là clustering index.) |
| CH14.09 | PE 14.13a bitmap on salary | ★★☆ | Exercise 14.13 (a). Consider the *instructor* relation of Figure 14.1.  a. Build a bitmap index on the attribute *salary*, splitting salary values into four ranges: below 50,000; 50,000 to below 60,000; 60,000 to below 70,000; and 70,000 and above.  *Figure 14.1 — The instructor relation:*  \| ID \| name \| dept_name \| salary \| \|---\|---\|---\|---\| \| 10101 \| Srinivasan \| Comp. Sci. \| 65000 \| \| 12121 \| Wu \| Finance \| 90000 \| \| 15151 \| Mozart \| Music \| 40000 \| \| 22222 \| Einstein \| Physics \| 95000 \| \| 32343 \| El Said \| History \| 60000 \| \| 33456 \| Gold \| Physics \| 87000 \| \| 45565 \| Katz \| Comp. Sci. \| 75000 \| \| 58583 \| Califieri \| History \| 62000 \| \| 76543 \| Singh \| Finance \| 80000 \| \| 76766 \| Crick \| Biology \| 72000 \| \| 83821 \| Brandt \| Comp. Sci. \| 92000 \| \| 98345 \| Kim \| Elec. Eng. \| 80000 \|<br>Lập bitmap index trên salary của instructor theo 4 khoảng: S1 (< 50000), S2 (50000 – < 60000), S3 (60000 – < 70000), S4 (≥ 70000). Record được đánh số theo thứ tự ID tăng dần; bitmap là chuỗi các ký tự 0/1 (không có khoảng trắng). Trả về `range` và `bitmap`, sắp theo range. Khoảng không có giá trị nào vẫn phải có dòng (toàn 0). |
| CH14.10 | PE 14.13b bitmap AND | ★★★ | Exercise 14.13 (b). Consider the *instructor* relation of Figure 14.1.  b. A query asks for all instructors in the Finance department whose salary is 80,000 or more. Describe the steps for answering the query and show the intermediate and final bitmaps built along the way.  *Figure 14.1 — The instructor relation:*  \| ID \| name \| dept_name \| salary \| \|---\|---\|---\|---\| \| 10101 \| Srinivasan \| Comp. Sci. \| 65000 \| \| 12121 \| Wu \| Finance \| 90000 \| \| 15151 \| Mozart \| Music \| 40000 \| \| 22222 \| Einstein \| Physics \| 95000 \| \| 32343 \| El Said \| History \| 60000 \| \| 33456 \| Gold \| Physics \| 87000 \| \| 45565 \| Katz \| Comp. Sci. \| 75000 \| \| 58583 \| Califieri \| History \| 62000 \| \| 76543 \| Singh \| Finance \| 80000 \| \| 76766 \| Crick \| Biology \| 72000 \| \| 83821 \| Brandt \| Comp. Sci. \| 92000 \| \| 98345 \| Kim \| Elec. Eng. \| 80000 \|<br>Tiếp CH14.09: trả về ba dòng (`name`, `bitmap`) theo thứ tự: 'S4' (bitmap salary ≥ 70000), 'Finance' (bitmap dept_name = Finance), 'S4 AND Finance' (AND từng bit). Dùng kiểu `bit varying` và toán tử `&` cho phép AND, rồi đổi về text. |
| CH14.11 | PE 14.13b answer from bitmap | ★★★ | Exercise 14.13 (b). Consider the *instructor* relation of Figure 14.1.  b. A query asks for all instructors in the Finance department whose salary is 80,000 or more. Describe the steps for answering the query and show the intermediate and final bitmaps built along the way.  *Figure 14.1 — The instructor relation:*  \| ID \| name \| dept_name \| salary \| \|---\|---\|---\|---\| \| 10101 \| Srinivasan \| Comp. Sci. \| 65000 \| \| 12121 \| Wu \| Finance \| 90000 \| \| 15151 \| Mozart \| Music \| 40000 \| \| 22222 \| Einstein \| Physics \| 95000 \| \| 32343 \| El Said \| History \| 60000 \| \| 33456 \| Gold \| Physics \| 87000 \| \| 45565 \| Katz \| Comp. Sci. \| 75000 \| \| 58583 \| Califieri \| History \| 62000 \| \| 76543 \| Singh \| Finance \| 80000 \| \| 76766 \| Crick \| Biology \| 72000 \| \| 83821 \| Brandt \| Comp. Sci. \| 92000 \| \| 98345 \| Kim \| Elec. Eng. \| 80000 \|<br>Hoàn tất PE 14.13b: dùng bitmap `S4 AND Finance` (như CH14.10), lấy các instructor ở những vị trí có bit 1 (vị trí theo thứ tự ID tăng dần, bắt đầu từ 1), rồi kiểm tra lại điều kiện salary ≥ 80000. Trả về ID, name, salary. |
| CH14.12 | sparse index | ★★☆ | `ix_seq_file(pos, id, name)` là file tuần tự đã sắp theo id, mỗi block chứa 3 record (block 0 gồm pos 0–2, …). Dựng sparse index: một entry cho mỗi block gồm `block_no` và `first_id` (id của record đầu block). |
| CH14.13 | sparse index lookup | ★★★ | Dùng sparse index của CH14.12 để tìm block cần quét cho các khoá tìm kiếm '33456', '76766', '99999' và '10000': block có `first_id` lớn nhất ≤ khoá (null nếu khoá nhỏ hơn mọi first_id). Trả về `search_key`, `block_no`, và `found` (true nếu id đó thực sự có trong file). |
| CH14.14 | B+-tree fan-out and height | ★★★ | Với mỗi dòng của `ix_index_spec(index_name, num_keys, key_bytes, ptr_bytes, block_bytes)`: `fanout` n = ⌊(block_bytes + key_bytes) / (key_bytes + ptr_bytes)⌋ (n con trỏ và n − 1 khoá vừa một block); `min_height` = ⌈log[n](num_keys)⌉ (mọi nút đầy); `max_height` = ⌈log[⌈n/2⌉](num_keys)⌉ (mọi nút chỉ đầy tối thiểu). Dùng hàm `log(b, x)` kiểu numeric. |
| CH14.15 | PE 14.3 node occupancy | ★☆☆ | Exercise 14.3. Build a B+-tree for the key values (2, 3, 5, 7, 11, 17, 19, 23, 29, 31). The tree starts empty and the values are inserted in ascending order. Build the trees for each of the following numbers of pointers that fit in one node:  a. Four  b. Six  c. Eight<br>Với n = 4, 6, 8 con trỏ mỗi nút (các trường hợp của PE 14.3): `leaf_min_keys` = ⌈(n − 1)/2⌉, `leaf_max_keys` = n − 1, `inner_min_ptrs` = ⌈n/2⌉, `inner_max_ptrs` = n. |
| CH14.16 | PE 14.8b build cost | ★★☆ | Exercise 14.8 (b). A secondary B+-tree index is to be built on a relation r containing n[r] tuples.  b. If one random disk access takes 10 milliseconds, what does building the index cost for a relation with 10 million records?<br>Chèn từng record vào secondary B+-tree tốn 2 truy cập ngẫu nhiên (đọc + ghi lá), mỗi lần 10 ms (bỏ qua chi phí ghi khi split). Với mỗi index trong `ix_index_spec`, trả về index_name và `build_hours` (làm tròn 1 chữ số) nếu xây bằng cách chèn từng record (mỗi khoá là một record). Thêm dòng 'pe_14_8' cho 10 000 000 record của PE 14.8b. |
| CH14.17 | redundant indexes | ★★★ | Bảng `ix_orders` có sẵn nhiều index. Một index (không unique) là thừa nếu danh sách cột của nó là tiền tố thực sự của danh sách cột của một index khác trên cùng bảng (ví dụ (customer_id) so với (customer_id, order_date)). Dùng `pg_index` (cột indkey) tìm các cặp `redundant`, `covered_by` (tên index, `::regclass::text`). |
| CH14.18 | drop redundant indexes | ★★☆ | Dựa vào CH14.17, xoá các index thừa của ix_orders (ix_orders_cust và ix_orders_date). Hệ thống liệt kê các index còn lại của ix_orders (tên, sắp theo tên). |
