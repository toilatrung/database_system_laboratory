# Chương 15 — Xử lý truy vấn

*Query Processing · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch15`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 1. Các bước xử lý truy vấn (slide 15.3–15.6)
1. **Parsing & translation**: kiểm tra cú pháp, tên bảng/cột, dịch SQL sang biểu thức đại số quan hệ.
2. **Optimization**: trong rất nhiều biểu thức tương đương và nhiều thuật toán cho mỗi phép toán, chọn **evaluation plan** có chi phí ước lượng thấp nhất (Chương 16).
3. **Evaluation**: query-execution engine chạy plan và trả kết quả.

Một **evaluation plan** = cây biểu thức đại số + chỉ rõ thuật toán cho từng nút (ví dụ "dùng index trên salary", "hash join") + cách các nút truyền dữ liệu (materialize hay pipeline). Trong PostgreSQL, `explain` in ra plan đã chọn.

### 2. Mô hình chi phí (slide 15.7–15.9)
Chi phí chủ yếu là I/O đĩa, đo bằng hai đại lượng:
- **t<sub>T</sub>** — thời gian truyền một block (block transfer), **t<sub>S</sub>** — thời gian một lần seek (định vị đầu đọc + rotational latency).
- Chi phí của b block transfer và S seek: **b · t<sub>T</sub> + S · t<sub>S</sub>**. Ổ cứng: t<sub>S</sub> ≈ 4 ms, t<sub>T</sub> ≈ 0.1 ms (block 4 KB); SSD: t<sub>S</sub> ≈ 20–90 µs, t<sub>T</sub> ≈ 2–10 µs.
- Bỏ qua chi phí CPU và chi phí **ghi kết quả cuối** ra đĩa (giống nhau giữa các plan).
- Thường tính **trường hợp xấu nhất**: buffer chỉ có số block tối thiểu thuật toán cần. Ký hiệu: **n<sub>r</sub>** số tuple, **b<sub>r</sub>** số block của r, **M** số block bộ nhớ, **h<sub>i</sub>** chiều cao B⁺-tree.

### 3. Selection (slide 15.10–15.20)
| Thuật toán | Điều kiện | Chi phí (transfer, seek) |
|---|---|---|
| **A1** linear scan | mọi điều kiện | b<sub>r</sub> transfer + 1 seek; nếu so sánh bằng trên khoá: trung bình b<sub>r</sub>/2 |
| **A2** primary B⁺-tree, bằng trên khoá | `A = v`, A là khoá | (h<sub>i</sub> + 1)(t<sub>T</sub> + t<sub>S</sub>) |
| **A3** primary index, bằng trên không-khoá | `A = v` | h<sub>i</sub>(t<sub>T</sub> + t<sub>S</sub>) + t<sub>S</sub> + b · t<sub>T</sub> (b = số block chứa tuple khớp, nằm liên tiếp) |
| **A4** secondary index, bằng | `A = v` | khoá: (h<sub>i</sub> + 1)(t<sub>T</sub> + t<sub>S</sub>); không-khoá: (h<sub>i</sub> + n)(t<sub>T</sub> + t<sub>S</sub>) — **mỗi tuple khớp có thể ở một block khác** |
| **A5** primary index, so sánh | `A ≥ v` / `A ≤ v` | ≥: dùng index tìm v rồi scan tuần tự; ≤: scan từ đầu file tới khi > v, không cần index |
| **A6** secondary index, so sánh | `A ≥ v` | duyệt lá của index; mỗi tuple một lần I/O — nhiều tuple thì **linear scan rẻ hơn** |

Điều kiện phức:
- **Conjunction** `θ₁ ∧ θ₂ ∧ …`: (A7) dùng index cho một θᵢ rẻ nhất rồi kiểm tra phần còn lại trong bộ nhớ; (A8) composite index; (A9) **giao các tập record pointer** từ nhiều index rồi mới đọc tuple.
- **Disjunction** `θ₁ ∨ θ₂`: (A10) **hợp** các tập pointer — chỉ được khi **mọi** θᵢ đều có index, nếu không thì linear scan.
- **Negation** `¬θ`: thường linear scan; nếu ít tuple thoả ¬θ và có index thì dùng index (ví dụ `¬(A < v)` ≡ `A ≥ v` — PE 15.6).
- **Bitmap index scan** (PostgreSQL): lấy tập pointer từ index, sắp theo địa chỉ vật lý thành bitmap, rồi đọc các block theo thứ tự — tránh lỗi "mỗi tuple một seek" của A6.

### 4. Sorting — external sort-merge (slide 15.21–15.27)
Khi quan hệ không vừa bộ nhớ (M block):
1. **Tạo run**: đọc M block, sắp trong bộ nhớ, ghi ra thành một **run**. Được ⌈b<sub>r</sub>/M⌉ run.
2. **Merge**: mỗi pass trộn tối đa **M − 1** run (M − 1 block input + 1 block output). Lặp tới khi còn một run.

Với b<sub>b</sub> block buffer cho mỗi run (để giảm seek), fan-in là ⌊M/b<sub>b</sub>⌋ − 1:
- Số pass merge: **⌈log<sub>⌊M/bb⌋−1</sub>(b<sub>r</sub>/M)⌉**.
- Block transfer: **b<sub>r</sub>(2⌈log<sub>⌊M/bb⌋−1</sub>(b<sub>r</sub>/M)⌉ + 1)** (không tính ghi kết quả cuối).
- Seek: **2⌈b<sub>r</sub>/M⌉ + ⌈b<sub>r</sub>/b<sub>b</sub>⌉(2⌈log<sub>⌊M/bb⌋−1</sub>(b<sub>r</sub>/M)⌉ − 1)**.
- Tăng b<sub>b</sub>: ít seek hơn nhưng fan-in nhỏ đi → có thể thêm pass (PE 15.9).

### 5. Join (slide 15.28–15.50) — r là outer, s là inner
| Thuật toán | Block transfer | Seek | Ghi chú |
|---|---|---|---|
| **Nested-loop** (xấu nhất) | n<sub>r</sub> · b<sub>s</sub> + b<sub>r</sub> | n<sub>r</sub> + b<sub>r</sub> | mọi điều kiện join; nếu bảng nhỏ vừa bộ nhớ: b<sub>r</sub> + b<sub>s</sub>, 2 seek |
| **Block nested-loop** | ⌈b<sub>r</sub>/(M − 2)⌉ · b<sub>s</sub> + b<sub>r</sub> | 2⌈b<sub>r</sub>/(M − 2)⌉ | M − 2 block cho outer, 1 cho inner, 1 cho output; chọn **bảng nhỏ làm outer** |
| **Indexed nested-loop** | b<sub>r</sub>(t<sub>T</sub> + t<sub>S</sub>) + n<sub>r</sub> · c | | c = chi phí một lần tra index trên s; chỉ cho equi-join/natural join |
| **Merge join** | b<sub>r</sub> + b<sub>s</sub> (+ chi phí sort) | ⌈b<sub>r</sub>/b<sub>b</sub>⌉ + ⌈b<sub>s</sub>/b<sub>b</sub>⌉ | hai bảng đã sắp theo thuộc tính join; equi/natural join |
| **Hash join** (không đệ quy) | 3(b<sub>r</sub> + b<sub>s</sub>) + 4n<sub>h</sub> | 2(⌈b<sub>r</sub>/b<sub>b</sub>⌉ + ⌈b<sub>s</sub>/b<sub>b</sub>⌉) + 2n<sub>h</sub> | s là **build** (nhỏ hơn), r là **probe**; cần M > n<sub>h</sub> + 1 |
| **Hash join** (đệ quy) | 2(b<sub>r</sub> + b<sub>s</sub>)⌈log<sub>M−1</sub>(b<sub>s</sub>) − 1⌉ + b<sub>r</sub> + b<sub>s</sub> | | khi build không chia vừa bộ nhớ trong một lần |

- **Hash join**: dùng hàm băm h chia r và s thành n<sub>h</sub> partition theo thuộc tính join; tuple của rᵢ chỉ có thể khớp với sᵢ. Với mỗi i: nạp sᵢ, dựng hash index trong bộ nhớ, đọc rᵢ và probe. **Overflow** khi một partition quá lớn (skew) → chia tiếp hoặc dùng fudge factor ~1.2.
- **Hybrid hash join**: giữ partition s₀ trong bộ nhớ ngay ở pha chia, tiết kiệm ghi/đọc lại s₀ và r₀.
- **Hybrid merge join**: một bảng đã sắp, bảng kia có secondary B⁺-tree: merge bảng đã sắp với **lá** của index, rồi sắp kết quả theo địa chỉ để đọc tuple (giống ý của PE 15.4).
- Điều kiện phức: conjunction → join theo một điều kiện rồi lọc phần còn lại; disjunction → hợp kết quả từng điều kiện.

### 6. Các phép toán khác (slide 15.51–15.57)
- **Loại trùng (distinct)**: sort rồi bỏ các tuple liền kề giống nhau, hoặc hash (tuple trùng rơi vào cùng bucket). Có thể loại trùng ngay khi tạo run/merge.
- **Projection**: chiếu từng tuple rồi loại trùng.
- **Union / intersect / except**: sort hai bảng rồi duyệt song song, hoặc chia partition bằng hash rồi xử lý từng cặp.
- **Outer join**: biến thể của merge/hash join, thêm tuple không khớp kèm null; hoặc join + phần anti-join.
- **Aggregation** (`group by`): giống loại trùng — sort/hash theo thuộc tính nhóm, gộp **từng phần** (partial aggregate: count, sum, min, max; avg = sum/count) ngay khi tạo run.
- **Semijoin r ⋉<sub>θ</sub> s / anti-semijoin** (PE 15.10): giữ tuple của r có (không có) tuple khớp trong s — đúng ngữ nghĩa `exists` / `not exists`, **giữ nguyên số lần lặp của r**.

### 7. Đánh giá biểu thức: materialization và pipelining (slide 15.58–15.68)
- **Materialization**: tính từng phép toán, ghi kết quả trung gian ra đĩa, phép trên đọc lại. Luôn dùng được; tốn thêm chi phí ghi/đọc.
- **Pipelining**: chuyển tuple sang phép trên ngay khi sinh ra, không ghi tạm. Không dùng được với phép **blocking** (sort, hash join cần đọc hết build trước khi probe, aggregation).
  - **Demand-driven (lazy, pull)**: phép trên gọi `next()` của phép dưới; mỗi phép là một **iterator** với `open()`, `next()`, `close()` và lưu **trạng thái** giữa các lần gọi. Tốt cho top-K (PE 15.11).
  - **Producer-driven (eager, push)**: phép dưới chủ động sinh tuple vào buffer cho phép trên; dừng khi buffer đầy. Hit rate của instruction cache tốt hơn (PE 15.12).
- **Double buffering**: dùng hai buffer để vừa xử lý vừa đọc trước.

### 8. Truy vấn trong bộ nhớ và column store (slide 15.69+)
- Khi dữ liệu nằm sẵn trong bộ nhớ, chi phí chính là **cache miss** của CPU: dùng thuật toán cache-conscious (sort/hash theo khối vừa cache), **query compilation** (biên dịch plan thành mã máy) thay vì thông dịch.
- **Column store**: mỗi cột lưu riêng → hợp với truy vấn đọc ít cột trên nhiều dòng (aggregation, phân tích); không hợp với truy vấn đọc trọn một dòng (PE 15.16). Join nên làm trên **cột join** trước rồi mới ghép tuple (PE 15.15).

### Công thức hay thi
| Câu hỏi | Công thức |
|---|---|
| Số block | b<sub>r</sub> = ⌈n<sub>r</sub> / f<sub>r</sub>⌉ (f<sub>r</sub> tuple/block) |
| Nested-loop | n<sub>r</sub>·b<sub>s</sub> + b<sub>r</sub> transfer, n<sub>r</sub> + b<sub>r</sub> seek |
| Block nested-loop | ⌈b<sub>r</sub>/(M−2)⌉·b<sub>s</sub> + b<sub>r</sub>; xấu nhất (M = 3): b<sub>r</sub>·b<sub>s</sub> + b<sub>r</sub> |
| Merge join (chưa sort) | sort(r) + sort(s) + b<sub>r</sub> + b<sub>s</sub> |
| Hash join | 3(b<sub>r</sub> + b<sub>s</sub>) + 4n<sub>h</sub>, cần M > n<sub>h</sub> + 1 với n<sub>h</sub> ≈ ⌈b<sub>s</sub>/M⌉ |
| External sort | b<sub>r</sub>(2⌈log<sub>M−1</sub>(b<sub>r</sub>/M)⌉ + 1) |

Lưu ý: lời giải PE 15.3 trong sách dùng **M − 1** cho block nested-loop và gộp seek với transfer thành "disk access"; slide và bài tập ở đây dùng **M − 2** và tách riêng seek như sách bản 7.

## 2. Trắc nghiệm (11 câu)

**Câu 1.** Chi phí của một plan được đo bằng gì trong mô hình của sách?

- A. Số tuple kết quả
- B. Số block transfer và số seek
- C. Thời gian CPU
- D. Số phép so sánh

<details><summary>Đáp án</summary>

**B** — b · t_T + S · t_S; CPU và chi phí ghi kết quả cuối được bỏ qua.

</details>

**Câu 2.** Selection `salary > 50000` dùng secondary B⁺-tree trên salary. Khi nào linear scan lại rẻ hơn?

- A. Khi bảng nhỏ
- B. Khi có nhiều tuple thoả điều kiện
- C. Khi index là clustered
- D. Không bao giờ

<details><summary>Đáp án</summary>

**B** — Mỗi tuple khớp qua secondary index có thể cần một seek + transfer riêng; nhiều tuple thì tốn hơn đọc tuần tự cả bảng.

</details>

**Câu 3.** Disjunction `θ₁ ∨ θ₂` dùng được phép hợp các tập record pointer (A10) khi nào?

- A. Khi có index cho ít nhất một θᵢ
- B. Khi có index cho mọi θᵢ
- C. Khi bảng đã sắp
- D. Luôn luôn

<details><summary>Đáp án</summary>

**B** — Thiếu index cho một θᵢ thì vẫn phải linear scan để tìm tuple thoả θᵢ đó, nên scan luôn cả bảng.

</details>

**Câu 4.** External sort-merge với M block bộ nhớ: mỗi pass merge trộn được tối đa bao nhiêu run?

- A. M
- B. M − 1
- C. M − 2
- D. 2

<details><summary>Đáp án</summary>

**B** — M − 1 block làm input (mỗi run một block), 1 block làm output.

</details>

**Câu 5.** Block nested-loop join: nên chọn bảng nào làm outer?

- A. Bảng có nhiều tuple hơn
- B. Bảng có ít block hơn
- C. Bảng có index
- D. Không quan trọng

<details><summary>Đáp án</summary>

**B** — Chi phí ⌈b_r/(M−2)⌉·b_s + b_r: outer nhỏ thì inner bị quét ít lần hơn.

</details>

**Câu 6.** Merge join và hash join dùng được cho loại điều kiện join nào?

- A. Mọi điều kiện θ
- B. Chỉ equi-join và natural join
- C. Chỉ điều kiện <
- D. Chỉ cross join

<details><summary>Đáp án</summary>

**B** — Cả hai dựa trên việc tuple khớp có cùng giá trị thuộc tính join (cùng vị trí khi sắp, cùng partition khi băm).

</details>

**Câu 7.** Trong hash join, quan hệ build nên là quan hệ nào?

- A. Quan hệ lớn hơn
- B. Quan hệ nhỏ hơn
- C. Quan hệ đã sắp
- D. Quan hệ có index

<details><summary>Đáp án</summary>

**B** — Mỗi partition của build phải vừa bộ nhớ để dựng hash index; build nhỏ thì ít partition, ít khả năng phải chia đệ quy.

</details>

**Câu 8.** Phép toán nào là blocking, không pipeline trọn vẹn được?

- A. Selection
- B. Projection không loại trùng
- C. Sort
- D. Indexed nested-loop join với outer được pipeline

<details><summary>Đáp án</summary>

**C** — Sort phải đọc hết input mới sinh được tuple đầu tiên của kết quả.

</details>

**Câu 9.** Truy vấn chỉ cần K kết quả đầu tiên: nên dùng kiểu pipelining nào?

- A. Producer-driven
- B. Demand-driven
- C. Materialization
- D. Không khác nhau

<details><summary>Đáp án</summary>

**B** — Demand-driven chỉ sinh tuple khi được gọi next(); producer-driven có thể sinh rất nhiều tuple không dùng (PE 15.11).

</details>

**Câu 10.** Multiset semijoin r ⋉ s: tuple xuất hiện 2 lần trong r và khớp 3 tuple của s thì xuất hiện bao nhiêu lần trong kết quả?

- A. 1
- B. 2
- C. 3
- D. 6

<details><summary>Đáp án</summary>

**B** — Semijoin giữ đúng số lần lặp của r (giống where exists); join thường mới cho 6.

</details>

**Câu 11.** Vì sao column store hợp với truy vấn "tổng số sinh viên theo (year, course_id) trên takes"?

- A. Vì cần đọc trọn từng dòng
- B. Vì chỉ đọc vài cột trên rất nhiều dòng
- C. Vì có index
- D. Vì takes nhỏ

<details><summary>Đáp án</summary>

**B** — Chỉ cần cột year, course_id (và ID): column store đọc ít dữ liệu hơn hẳn và nén tốt (PE 15.16b).

</details>

## 3. Câu hỏi tự luận (16 câu)

**Câu 1.** 

> **Exercise 15.1.** For simplicity, assume that a block holds exactly one tuple and that memory can hold at most three blocks. Sort the following tuples on their first attribute with the external sort-merge algorithm, and show the runs produced in every pass: (kangaroo, 17), (wallaby, 21), (emu, 1), (wombat, 13), (platypus, 3), (lion, 8), (warthog, 4), (zebra, 11), (meerkat, 6), (hyena, 9), (hornbill, 2), (baboon, 12).

**PE 15.1** — Mỗi block một tuple, bộ nhớ 3 block. Liệt kê các run sau từng pass của external sort-merge khi sắp 12 tuple theo thuộc tính đầu.

<details><summary>Gợi ý đáp án</summary>

Đánh số t₁ = (kangaroo, 17) … t₁₂ = (baboon, 12) theo thứ tự đọc.

**Tạo run** (mỗi lần đọc M = 3 block, sắp trong bộ nhớ):
- r₁₁ = ⟨emu, kangaroo, wallaby⟩ (t₃, t₁, t₂)
- r₁₂ = ⟨lion, platypus, wombat⟩ (t₆, t₅, t₄)
- r₁₃ = ⟨meerkat, warthog, zebra⟩ (t₉, t₇, t₈)
- r₁₄ = ⟨baboon, hornbill, hyena⟩ (t₁₂, t₁₁, t₁₀)

**Merge** — theo thuật toán của sách, mỗi pass trộn M − 1 = **2** run (1 block làm output):
- Pass 1: r₂₁ = ⟨emu, kangaroo, lion, platypus, wallaby, wombat⟩, r₂₂ = ⟨baboon, hornbill, hyena, meerkat, warthog, zebra⟩
- Pass 2: r₃₁ = ⟨baboon, emu, hornbill, hyena, kangaroo, lion, meerkat, platypus, wallaby, warthog, wombat, zebra⟩

Lời giải in của sách trộn **3** run mỗi pass (không dành block cho output): pass 1 cho r₂₁ = 9 tuple đầu đã sắp (t₃, t₁, t₆, t₉, t₅, t₂, t₇, t₄, t₈) và r₂₂ = r₁₄; pass 2 cho run cuối. Cả hai cách đều **2 pass merge**. Bài CH15.01–CH15.02 tái hiện các run này bằng SQL.

</details>

**Câu 2.** 

> **Exercise 15.2.** Using the bank database of Figure 15.14 (primary keys underlined), consider the SQL query
> 
> ```sql
> select T.branch_name
> from branch T, branch S
> where T.assets > S.assets and S.branch_city = 'Brooklyn'
> ```
> 
> Give an efficient relational-algebra expression equivalent to this query, and justify why you chose it.
> 
> *Figure 15.14 — Bank database* (primary keys underlined):
> 
> - branch (<u>branch_name</u>, branch_city, assets)
> - customer (<u>customer_name</u>, customer_street, customer_city)
> - loan (<u>loan_number</u>, branch_name, amount)
> - borrower (<u>customer_name, loan_number</u>)
> - account (<u>account_number</u>, branch_name, balance)
> - depositor (<u>customer_name, account_number</u>)

**PE 15.2** — Viết biểu thức đại số quan hệ hiệu quả cho truy vấn tìm branch có assets lớn hơn assets của một branch nào đó ở Brooklyn.

<details><summary>Gợi ý đáp án</summary>

Đẩy selection và projection xuống trước theta join:

Π<sub>T.branch_name</sub>( (Π<sub>branch_name, assets</sub>(ρ<sub>T</sub>(branch))) ⋈<sub>T.assets > S.assets</sub> (Π<sub>assets</sub>(σ<sub>branch_city = 'Brooklyn'</sub>(ρ<sub>S</sub>(branch)))) )

Lý do: theta join là phép đắt nhất (không dùng được hash/merge join, thường là nested-loop) nên phải chạy trên **ít dữ liệu nhất**: vế phải chỉ còn các branch ở Brooklyn và chỉ cột assets; vế trái chỉ hai cột cần.

Tốt hơn nữa: "assets lớn hơn **một** branch Brooklyn nào đó" ⇔ assets > **min** assets ở Brooklyn, nên thay join bằng một aggregate:
```sql
select branch_name from branch
where assets > (select min(assets) from branch where branch_city = 'Brooklyn');
```
Một lần quét lấy min, một lần quét lọc — tuyến tính thay vì bình phương (CH15.07). Lưu ý câu SQL gốc trả về một branch **nhiều lần** (mỗi branch Brooklyn nhỏ hơn một lần); biểu thức đại số (tập hợp) thì không.

</details>

**Câu 3.** 

> **Exercise 15.3.** Relations r<sub>1</sub>(A, B, C) and r<sub>2</sub>(C, D, E) have these properties: r<sub>1</sub> contains 20,000 tuples and r<sub>2</sub> contains 45,000 tuples; one block holds 25 tuples of r<sub>1</sub> or 30 tuples of r<sub>2</sub>. For r<sub>1</sub> ⋈ r<sub>2</sub>, estimate the number of block transfers and seeks needed by each join strategy below:
> 
> a. Nested-loop join.
> 
> b. Block nested-loop join.
> 
> c. Merge join.
> 
> d. Hash join.

**PE 15.3** — r₁: 20 000 tuple, 25 tuple/block; r₂: 45 000 tuple, 30 tuple/block. Ước lượng block transfer và seek cho r₁ ⋈ r₂ bằng nested-loop, block nested-loop, merge join, hash join.

<details><summary>Gợi ý đáp án</summary>

b<sub>r1</sub> = 20000/25 = **800**, b<sub>r2</sub> = 45000/30 = **1500**. Nếu M > 800 + 2 thì mọi cách đều chỉ đọc mỗi bảng một lần: 2300 transfer. Xét M nhỏ hơn.

**a. Nested-loop** (xấu nhất):
- r₁ outer: 20000 × 1500 + 800 = **30 000 800** transfer, 20000 + 800 = 20 800 seek.
- r₂ outer: 45000 × 800 + 1500 = **36 001 500** transfer, 46 500 seek. → chọn r₁ làm outer.

**b. Block nested-loop**: r₁ outer: ⌈800/(M−2)⌉ × 1500 + 800 transfer, 2⌈800/(M−2)⌉ seek. Xấu nhất M = 3: 800 × 1500 + 800 = 1 200 800. Với M = 52: 16 × 1500 + 800 = 24 800. (r₂ outer: ⌈1500/(M−2)⌉ × 800 + 1500, tệ hơn.)

**c. Merge join** (hai bảng chưa sắp): sort mỗi bảng tốn b(2⌈log<sub>M−1</sub>(b/M)⌉ + 1) transfer (cộng thêm b nếu tính ghi kết quả sort ra đĩa), rồi merge 800 + 1500 = 2300 transfer (giả sử các tuple cùng giá trị join vừa bộ nhớ). Ví dụ M = 52: sort r₁ cần ⌈log₅₁(800/52)⌉ = 1 pass → 800 × 3 = 2400 (+800 ghi), r₂: ⌈log₅₁(1500/52)⌉ = 1 → 4500 (+1500); tổng ≈ 2400 + 800 + 4500 + 1500 + 2300 = 11 500.

**d. Hash join**: r₁ nhỏ hơn làm build. n<sub>h</sub> ≈ ⌈800/M⌉. Không cần chia đệ quy khi M > n<sub>h</sub> + 1 (khoảng M ≥ 30): 3(1500 + 800) + 4n<sub>h</sub> ≈ **6900** transfer (sách bỏ qua 4n<sub>h</sub>); seek 2(800 + 1500) + 2n<sub>h</sub> nếu b<sub>b</sub> = 1. Nếu M nhỏ (ví dụ 12): 2(2300)⌈log₁₁(800) − 1⌉ + 2300 = 4600 × 2 + 2300 = 11 500.

Các bài CH15.04–CH15.06 tính các số này bằng SQL từ bảng `qp_rel_stats`.

</details>

**Câu 4.** 

> **Exercise 15.4.** The indexed nested-loop join of Section 15.5.3 may perform poorly when the index is a secondary index and many tuples share the same join-attribute value. Explain why it is inefficient. Describe a technique based on sorting that lowers the cost of fetching the tuples of the inner relation. Under which conditions would this technique beat hybrid merge join?

**PE 15.4** — Vì sao indexed nested-loop join kém hiệu quả với secondary index khi nhiều tuple cùng giá trị join? Cách cải thiện bằng sort, và khi nào nó tốt hơn hybrid merge join?

<details><summary>Gợi ý đáp án</summary>

Với secondary index, các tuple của inner có cùng giá trị join nằm rải rác: mỗi tuple của outer có thể kéo theo **một seek + một transfer cho mỗi tuple khớp** của inner, và cùng một block inner bị đọc đi đọc lại cho nhiều tuple outer.

Cải thiện: join outer với **lá của secondary index** (chỉ lấy record pointer của inner), hoãn việc đọc tuple inner. Kết quả trung gian (tuple outer, pointer) được **sắp theo địa chỉ vật lý** của pointer, rồi đọc các block inner **theo thứ tự vật lý** — mỗi block chỉ đọc một lần, seek ít.

So với hybrid merge join: hybrid merge join đòi outer **đã sắp** theo thuộc tính join (hoặc phải sort outer). Cách trên không cần outer sắp, nhưng mỗi tuple outer phải tra index một lần. Khi **outer nhỏ hơn nhiều so với inner** (hoặc outer chưa sắp và việc sort tốn kém), tổng chi phí tra index nhỏ hơn chi phí sort → cách trên tốt hơn.

</details>

**Câu 5.** 

> **Exercise 15.5.** Relations r and s have no indices and are not sorted. If memory were unlimited, what would be the cheapest way (counting I/O operations) to compute r ⋈ s, and how much memory would that algorithm need?

**PE 15.5** — r, s không index, chưa sắp, bộ nhớ vô hạn: cách nào rẻ nhất để tính r ⋈ s, và cần bao nhiêu bộ nhớ?

<details><summary>Gợi ý đáp án</summary>

Đọc **toàn bộ bảng nhỏ hơn** vào bộ nhớ (có thể dựng hash index trên nó), rồi đọc bảng lớn từng block và join với bảng trong bộ nhớ (nested-loop với bảng lớn làm outer, hoặc probe hash).

- I/O: **b<sub>r</sub> + b<sub>s</sub>** block transfer (mỗi bảng đọc đúng một lần) — đây là cận dưới, vì mọi thuật toán đều phải đọc cả hai bảng ít nhất một lần. Seek: khoảng 2.
- Bộ nhớ: **min(b<sub>r</sub>, b<sub>s</sub>) + 2** block — bảng nhỏ, một block input cho bảng lớn, một block output.

</details>

**Câu 6.** 

> **Exercise 15.6.** Using the bank database of Figure 15.14 (primary keys underlined), suppose relation *branch* has a B<sup>+</sup>-tree index on *branch_city* and no other index. List the different ways of evaluating each of the following selections that contain negation:
> 
> a. σ<sub>¬(branch_city < “Brooklyn”)</sub>(*branch*)
> 
> b. σ<sub>¬(branch_city = “Brooklyn”)</sub>(*branch*)
> 
> c. σ<sub>¬(branch_city < “Brooklyn” ∨ assets < 5000)</sub>(*branch*)
> 
> *Figure 15.14 — Bank database* (primary keys underlined):
> 
> - branch (<u>branch_name</u>, branch_city, assets)
> - customer (<u>customer_name</u>, customer_street, customer_city)
> - loan (<u>loan_number</u>, branch_name, amount)
> - borrower (<u>customer_name, loan_number</u>)
> - account (<u>account_number</u>, branch_name, balance)
> - depositor (<u>customer_name, account_number</u>)

**PE 15.6** — branch có B⁺-tree trên branch_city. Các cách xử lý selection có phủ định: (a) ¬(city < Brooklyn), (b) ¬(city = Brooklyn), (c) ¬(city < Brooklyn ∨ assets < 5000).

<details><summary>Gợi ý đáp án</summary>

a. ¬(branch_city < 'Brooklyn') ≡ **branch_city ≥ 'Brooklyn'**: dùng index tìm entry đầu tiên có giá trị 'Brooklyn', rồi đi theo lá (hoặc file nếu index là primary) tới cuối. Hoặc linear scan nếu phần lớn tuple thoả.

b. ¬(branch_city = 'Brooklyn') ≡ **branch_city ≠ 'Brooklyn'**: gần như mọi tuple thoả, index không giúp gì → **linear scan**. (Có thể dùng index cho hai khoảng < và > rồi hợp, nhưng chỉ đáng nếu rất ít tuple khác Brooklyn — vô lý trong thực tế.)

c. Theo De Morgan: ¬(A ∨ B) ≡ ¬A ∧ ¬B → **branch_city ≥ 'Brooklyn' ∧ assets ≥ 5000**. Dùng index trên branch_city lấy các tuple có city ≥ 'Brooklyn' (như câu a), kiểm tra thêm assets ≥ 5000 trên từng tuple (A7). Hoặc linear scan nếu điều kiện city không chọn lọc.

(Lời giải sách viết "assets < 5000" ở phần kiểm tra — nhầm dấu; phủ định của assets < 5000 là assets ≥ 5000.) Bài CH15.08 viết lại câu c không dùng `not`.

</details>

**Câu 7.** 

> **Exercise 15.7.** Write pseudocode for an iterator implementing indexed nested-loop join in which the outer relation is pipelined. The pseudocode must define the standard iterator functions *open*(), *next*(), and *close*(), and must show which state the iterator keeps between calls.

**PE 15.7** — Viết pseudocode iterator cho indexed nested-loop join với outer được pipeline: open(), next(), close() và trạng thái cần lưu.

<details><summary>Gợi ý đáp án</summary>

Trạng thái giữa các lần gọi: iterator **outer** (input pipeline), iterator **inner** (tra index trên s theo giá trị join), tuple outer hiện tại **t<sub>r</sub>**, cờ **done<sub>r</sub>** (outer đã hết chưa).

```
open():
  outer.open(); inner.open()
  if outer.next() then t_r := tuple vừa lấy; done_r := false
  else done_r := true
  if not done_r then inner.lookup(t_r[JoinAttrs])   -- định vị các tuple khớp

next():
  while not done_r:
    if inner.next() then                 -- còn tuple s khớp với t_r
      t_s := tuple vừa lấy
      return t_r ⋈ t_s
    else if outer.next() then            -- hết khớp: sang tuple outer kế tiếp
      t_r := tuple vừa lấy
      inner.lookup(t_r[JoinAttrs])       -- tra index lại với giá trị mới
    else
      done_r := true
  return "hết dữ liệu"

close():
  outer.close(); inner.close()
```
Điểm mấu chốt: `next()` trả về **đúng một** tuple rồi dừng, nên phải nhớ t<sub>r</sub> và vị trí của inner để lần gọi sau tiếp tục từ đó.

</details>

**Câu 8.** 

> **Exercise 15.8.** Design one sorting-based and one hashing-based algorithm for computing the relational division operation (Practice Exercise 2.9 defines division).

**PE 15.8** — Thiết kế thuật toán dựa trên sort và dựa trên hash cho phép chia r(T ∪ S) ÷ s(S).

<details><summary>Gợi ý đáp án</summary>

**Sort-based**: sắp s theo S; sắp r theo (T, S). Duyệt r theo nhóm cùng giá trị T; với mỗi nhóm, duyệt song song nhóm đó với s (như merge join) và kiểm tra **mọi** tuple của s đều xuất hiện làm phần S của nhóm. Nếu đúng, xuất giá trị T. Bỏ qua tuple trùng (r có thể có trùng). Sau khi sắp: r đọc một lần, s đọc lại một lần cho mỗi nhóm: |r| + N·|s| với N = số giá trị T khác nhau (s thường nhỏ, giữ trong bộ nhớ thì chỉ |r| + |s|).

**Hash-based**: giả sử mọi tuple r cùng một giá trị T vừa bộ nhớ. Chia r thành partition theo **hash(T)** sao cho mỗi partition vừa bộ nhớ. Với mỗi partition: dựng hash table trên các cặp (T, S) và một tập các giá trị T khác nhau. Với mỗi giá trị v<sub>T</sub> và mỗi tuple của s, probe (v<sub>T</sub>, s); thiếu bất kỳ cặp nào thì loại v<sub>T</sub>, ngược lại xuất v<sub>T</sub>. Tương đương: đếm số giá trị S khác nhau (thuộc s) của mỗi T và so với |s| — chính là `group by T having count(distinct S) = (select count(*) from s)` (CH15.11).

Nếu một nhóm T không vừa bộ nhớ: chia cả r và s theo hash(S) thành cặp (rᵢ, sᵢ), chạy thuật toán trên từng cặp, rồi lấy **giao** các tập T kết quả của mọi cặp.

</details>

**Câu 9.** 

> **Exercise 15.9.** Suppose the total memory available for buffering runs stays the same, but the number of buffer blocks given to each run is increased. How does this affect the cost of merging runs?

**PE 15.9** — Bộ nhớ dành cho merge cố định, tăng số buffer block cho mỗi run thì chi phí merge thay đổi thế nào?

<details><summary>Gợi ý đáp án</summary>

- **Seek giảm**: mỗi lần đọc một run ta đọc b<sub>b</sub> block liên tiếp với một seek, nên số seek mỗi pass ≈ 2⌈b<sub>r</sub>/b<sub>b</sub>⌉.
- **Fan-in giảm**: số run trộn được mỗi pass là ⌊M/b<sub>b</sub>⌋ − 1, nên số pass ⌈log<sub>⌊M/bb⌋−1</sub>(b<sub>r</sub>/M)⌉ có thể **tăng**, mỗi pass thêm 2b<sub>r</sub> block transfer.

Vì vậy phải chọn b<sub>b</sub> cân bằng giữa seek và số pass để tổng chi phí nhỏ nhất. Ví dụ trong bảng `qp_sort_params`: b<sub>r</sub> = 100 000, M = 101 — b<sub>b</sub> = 1 cho 2 pass, 301 982 seek; b<sub>b</sub> = 10 cho 4 pass (900 000 transfer thay vì 500 000) nhưng chỉ 71 982 seek (CH15.03).

</details>

**Câu 10.** 

> **Exercise 15.10.** Consider the extended relational-algebra operators below. For each one, explain how it can be implemented with sorting and with hashing.
> 
> a. Semijoin (⋉<sub>θ</sub>): in the multiset semijoin r ⋉<sub>θ</sub> s, a tuple r<sub>i</sub> occurring n times in r occurs n times in the result if at least one tuple s<sub>j</sub> exists such that r<sub>i</sub> and s<sub>j</sub> satisfy θ; otherwise r<sub>i</sub> does not occur in the result.
> 
> b. Anti-semijoin (⊳̄<sub>θ</sub>): in the multiset anti-semijoin of r and s, a tuple r<sub>i</sub> occurring n times in r occurs n times in the result if no tuple s<sub>j</sub> of s satisfies θ together with r<sub>i</sub>; otherwise r<sub>i</sub> does not occur in the result.

**PE 15.10** — Hiện thực multiset semijoin và anti-semijoin bằng sort và bằng hash.

<details><summary>Gợi ý đáp án</summary>

Với điều kiện θ tuỳ ý thì không dùng được sort/hash — phải (block) nested-loop. Với **equi-join**:

**Semijoin r ⋉ s**
- Sort: sắp r và s theo thuộc tính join, duyệt song song như merge join; khi giá trị của tuple r hiện tại có trong s thì xuất tuple r — **mỗi tuple r một lần**, không lặp theo số tuple khớp của s.
- Hash: dựng hash index trên thuộc tính join của s (chỉ cần tập giá trị khác nhau). Duyệt r, mỗi tuple tra hash: có thì xuất. Nếu s nhỏ hơn r thì ngược lại cũng được: dựng index trên r, probe bằng s, khi tuple r khớp thì xuất và **xoá** nó khỏi index (để không xuất lại).
- r, s lớn: chia partition theo hash của thuộc tính join rồi làm từng cặp.

**Anti-semijoin**
- Sort: như trên nhưng xuất tuple r khi **không** có giá trị khớp trong s.
- Hash: tra hash index trên s, **không** tìm thấy thì xuất. Hoặc dựng index trên r, probe bằng s và xoá các tuple r khớp; cuối cùng xuất những tuple **còn lại** trong index.

Tuple r trùng nhau xuất đúng số lần của nó (multiset) — tương ứng `where exists` / `where not exists` trong SQL. Chú ý null: tuple r có giá trị join null không khớp gì nên **có** trong anti-semijoin; `not in` trong SQL lại cho rỗng khi s chứa null (CH15.09–CH15.10).

</details>

**Câu 11.** 

> **Exercise 15.11.** A query needs only the first K results of an operation and stops after that. Which is the better choice for it: demand-driven pipelining or producer-driven pipelining (with buffering)? Explain.

**PE 15.11** — Truy vấn chỉ lấy K kết quả đầu: chọn demand-driven hay producer-driven pipelining?

<details><summary>Gợi ý đáp án</summary>

**Demand-driven**: tuple chỉ được sinh khi phép trên gọi `next()`, nên sau K lần gọi là dừng, không tốn công cho phần còn lại. Producer-driven sinh tuple liên tục vào buffer (tới khi buffer đầy) — có thể sinh nhiều tuple không bao giờ dùng. (Nếu kết quả phải sắp — `order by … limit K` — thì phép sort vẫn blocking, nhưng có thể dùng top-K heap.)

</details>

**Câu 12.** 

> **Exercise 15.12.** Modern CPUs have an instruction cache holding recently executed instructions. A function call is therefore expensive, because the set of instructions being executed changes and causes misses in the instruction cache.
> 
> a. Explain why producer-driven pipelining with buffering probably gives a better instruction-cache hit rate than demand-driven pipelining.
> 
> b. Explain why changing demand-driven pipelining so that one call to *next*() produces several results and returns them together can improve the instruction-cache hit rate.

**PE 15.12** — Vì sao producer-driven có instruction-cache hit rate tốt hơn demand-driven; và vì sao next() trả về nhiều tuple một lần giúp cải thiện?

<details><summary>Gợi ý đáp án</summary>

a. Producer-driven: mỗi phép toán chạy **một vòng lặp** sinh nhiều tuple liên tiếp từ input đã có trong buffer — cùng một đoạn mã được thực thi lặp lại nên nằm sẵn trong instruction cache. Demand-driven chuyển qua lại giữa mã của các phép toán **với mỗi tuple** (gọi next() của con, trả về cha…), mỗi lần chuyển có thể gây cache miss.

b. Nếu `next()` trả về một **lô** tuple (vectorized/batch execution), mỗi phép toán xử lý cả lô trong một vòng lặp trước khi trả quyền điều khiển — số lần chuyển giữa các hàm giảm theo kích thước lô, nên hit rate tăng.

</details>

**Câu 13.** 

> **Exercise 15.13.** You need the documents that contain at least k of a given set of n keywords. A keyword index is available that returns, for a given keyword, a sorted list of the identifiers of the documents containing it. Give an efficient algorithm that finds the required documents.

**PE 15.13** — Có keyword index trả về danh sách document id đã sắp cho mỗi keyword. Thuật toán hiệu quả tìm document chứa ít nhất k trong n keyword cho trước?

<details><summary>Gợi ý đáp án</summary>

Duy trì danh sách L (sắp theo document id) các bản ghi (doc_id, count), ban đầu rỗng. Với mỗi keyword trong n keyword: lấy danh sách D của nó và **merge** D vào L (cả hai đã sắp): doc có trong L thì count + 1, chưa có thì thêm với count = 1. Cuối cùng xuất các doc có count ≥ k.

Mỗi lần merge tốn thời gian tỉ lệ |L| + |D|, nên tổng thời gian tỉ lệ khoảng n × (tổng độ dài các danh sách). Cách khác: merge **đồng thời** n danh sách bằng heap (n-way merge), mỗi doc id được đếm khi nó xuất hiện ở đầu các danh sách — O(N log n) với N là tổng độ dài.

Trong SQL: `group by doc_id having count(distinct keyword) >= k` sau khi lọc các keyword cần tìm (CH15.13).

</details>

**Câu 14.** 

> **Exercise 15.14.** Suggest a way to index a document that contains a word (for example “leopard”) so that it is found efficiently by queries that use a more general concept (such as “carnivore” or “mammal”). You may assume the concept hierarchy is shallow, so each concept has only a few generalizations (although a concept may have many specializations), and that a function is available that returns the concept of each word in a document. Also suggest how a query that uses a specialized concept can retrieve documents through a more general concept.

**PE 15.14** — Đánh index cho document chứa từ "leopard" để truy vấn bằng khái niệm tổng quát ("carnivore", "mammal") tìm được hiệu quả; và truy vấn khái niệm cụ thể dùng khái niệm tổng quát thế nào?

<details><summary>Gợi ý đáp án</summary>

Khi đánh index một document, với mỗi từ, ngoài entry cho chính từ (và khái niệm của nó, ví dụ leopard) còn thêm document vào **danh sách index của mọi khái niệm tổng quát hơn** (carnivore, mammal, animal). Vì hệ phân cấp nông, mỗi khái niệm chỉ có vài tổ tiên → index chỉ to thêm một hằng số lần. Khi đó truy vấn "carnivore" chỉ cần đọc một danh sách, không phải hợp hàng nghìn danh sách của mọi loài ăn thịt.

Ngược lại, truy vấn bằng khái niệm **cụ thể** (leopard) có thể dùng danh sách của khái niệm tổng quát hơn (carnivore) làm tập ứng viên khi danh sách cụ thể quá ít kết quả, rồi lọc/xếp hạng lại các document ứng viên theo mức liên quan tới leopard. (Không nên đánh index xuống mọi khái niệm con vì một khái niệm có thể có rất nhiều con.)

</details>

**Câu 15.** 

> **Exercise 15.15.** Explain why the nested-loops join algorithm (Section 15.5.1) performs badly on a database stored column-wise. Describe an alternative algorithm that works better, and explain why it is better.

**PE 15.15** — Vì sao nested-loops join chạy kém trên column store? Thuật toán thay thế và vì sao tốt hơn?

<details><summary>Gợi ý đáp án</summary>

Nested-loops join như mô tả cần **tuple hoàn chỉnh** của hai bảng; trong column store mỗi cột ở một vùng đĩa khác nhau nên ghép tuple rất đắt, và phí công cho phần lớn cặp tuple không thoả điều kiện join.

Tốt hơn: chỉ đọc **cột join** (kèm record id) của hai bảng và join chúng bằng hash join, sort-merge join hoặc indexed nested-loop join. Sau khi biết các cặp (rid<sub>r</sub>, rid<sub>s</sub>) khớp, mới ghép các cột còn lại: sắp kết quả theo rid của r để đọc các cột của r tuần tự, rồi sắp lại theo rid của s để đọc các cột của s. Như vậy chỉ ghép tuple cho các dòng **thực sự có trong kết quả**, và đọc cột theo thứ tự vật lý.

</details>

**Câu 16.** 

> **Exercise 15.16.** For each query below, say whether column-oriented storage is likely to help, and explain why.
> 
> a. Retrieve the ID, name and dept_name of the student whose ID is 12345.
> 
> b. Group the *takes* relation by *year* and *course_id* and find the total number of students for each (*year*, *course_id*) combination.

**PE 15.16** — Column store có lợi không cho: (a) lấy ID, name, dept_name của sinh viên 12345; (b) nhóm takes theo (year, course_id) và đếm sinh viên?

<details><summary>Gợi ý đáp án</summary>

a. **Không có lợi**: truy vấn lấy (gần như) trọn một dòng theo khoá. Row store đọc một block; column store phải đọc ở ba vùng cột khác nhau (ít nhất ba lần I/O) rồi ghép lại. Đây là kiểu truy vấn OLTP.

b. **Có lợi**: chỉ cần cột year, course_id (và ID/đếm) trên **mọi** dòng của takes. Column store chỉ đọc những cột này (bỏ qua sec_id, semester, grade), các cột lặp giá trị nhiều nên nén rất tốt, và aggregate có thể chạy vectorized. Đây là kiểu truy vấn phân tích.

</details>

## 4. Bài tập SQL (15 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH15.01 | PE 15.1 tạo run | ★★☆ | Exercise 15.1. For simplicity, assume that a block holds exactly one tuple and that memory can hold at most three blocks. Sort the following tuples on their first attribute with the external sort-merge algorithm, and show the runs produced in every pass: (kangaroo, 17), (wallaby, 21), (emu, 1), (wombat, 13), (platypus, 3), (lion, 8), (warthog, 4), (zebra, 11), (meerkat, 6), (hyena, 9), (hornbill, 2), (baboon, 12).<br>Bảng `qp_sort_input(pos, name, num)` chứa 12 tuple của PE 15.1, `pos` là thứ tự trong file. Mỗi block một tuple, M = 3. Mô phỏng bước tạo run: mỗi lần đọc 3 tuple liên tiếp (pos 1–3, 4–6, …), sắp theo `name`.  Trả về `run` (1, 2, …), `k` (vị trí trong run, từ 1) và `name`, sắp theo run, k. |
| CH15.02 | PE 15.1 pass merge | ★★☆ | Exercise 15.1. For simplicity, assume that a block holds exactly one tuple and that memory can hold at most three blocks. Sort the following tuples on their first attribute with the external sort-merge algorithm, and show the runs produced in every pass: (kangaroo, 17), (wallaby, 21), (emu, 1), (wombat, 13), (platypus, 3), (lion, 8), (warthog, 4), (zebra, 11), (meerkat, 6), (hyena, 9), (hornbill, 2), (baboon, 12).<br>Tiếp CH15.01. Pass merge thứ nhất trộn M − 1 = 2 run liên tiếp (run 1 với 2, run 3 với 4) thành một run mới. Trả về `run`, `k`, `name` của các run sau pass 1, sắp theo run, k. |
| CH15.03 | chi phí external sort | ★★★ | Bảng `qp_sort_params(case_id, b_r, m, bb)`. Với mỗi case tính chi phí external sort-merge: - `initial_runs` = ⌈b_r / m⌉ - `merge_passes`: số pass cần để còn 1 run, mỗi pass trộn tối đa ⌊m / bb⌋ − 1 run (tính chính xác bằng cách lặp, không dùng log số thực) - `transfers` = b_r · (2 · merge_passes + 1) - `seeks` = 2 · ⌈b_r / m⌉ + ⌈b_r / bb⌉ · (2 · merge_passes − 1)  Trả về case_id, initial_runs, merge_passes, transfers, seeks. |
| CH15.04 | PE 15.3a nested-loop | ★☆☆ | Exercise 15.3 (a). Relations r[1](A, B, C) and r[2](C, D, E) have these properties: r[1] contains 20,000 tuples and r[2] contains 45,000 tuples; one block holds 25 tuples of r[1] or 30 tuples of r[2]. For r[1] ⋈ r[2], estimate the number of block transfers and seeks needed by each join strategy below:  a. Nested-loop join.<br>Bảng `qp_rel_stats(rel, n_tuples, tuples_per_block)` chứa r1, r2 của PE 15.3. Với cả hai cách chọn outer, tính chi phí nested-loop join trường hợp xấu nhất: `transfers` = n[outer] · b[inner] + b[outer], `seeks` = n[outer] + b[outer], với b = ⌈n_tuples / tuples_per_block⌉.  Trả về outer_rel, inner_rel, transfers, seeks (kiểu số nguyên). |
| CH15.05 | PE 15.3b block nested-loop | ★★☆ | Exercise 15.3 (b). Relations r[1](A, B, C) and r[2](C, D, E) have these properties: r[1] contains 20,000 tuples and r[2] contains 45,000 tuples; one block holds 25 tuples of r[1] or 30 tuples of r[2]. For r[1] ⋈ r[2], estimate the number of block transfers and seeks needed by each join strategy below:  b. Block nested-loop join.<br>Với r1 làm outer, r2 làm inner (bảng `qp_rel_stats`) và mỗi kích thước bộ nhớ M trong `qp_memory(m)`, tính chi phí block nested-loop join: `transfers` = ⌈b[r1] / (M − 2)⌉ · b[r2] + b[r1], `seeks` = 2 · ⌈b[r1] / (M − 2)⌉.  Trả về m, transfers, seeks (số nguyên). |
| CH15.06 | PE 15.3d hash join | ★★★ | Exercise 15.3 (d). Relations r[1](A, B, C) and r[2](C, D, E) have these properties: r[1] contains 20,000 tuples and r[2] contains 45,000 tuples; one block holds 25 tuples of r[1] or 30 tuples of r[2]. For r[1] ⋈ r[2], estimate the number of block transfers and seeks needed by each join strategy below:  d. Hash join.<br>Hash join r1 ⋈ r2 với r1 làm build (nhỏ hơn). Với mỗi M trong `qp_memory`: - `n_h` = ⌈b[r1] / M⌉ - `recursive` = true nếu n_h + 1 > M (phải chia partition đệ quy) - `transfers`: nếu không đệ quy = 3(b[r1] + b[r2]) + 4·n_h; nếu đệ quy = 2(b[r1] + b[r2])·⌈log[M−1](b[r1]) − 1⌉ + b[r1] + b[r2]  Trả về m, n_h, recursive, transfers (số nguyên). |
| CH15.07 | PE 15.2 bỏ theta join | ★★☆ | Exercise 15.2. Using the bank database of Figure 15.14 (primary keys underlined), consider the SQL query  ```sql select T.branch_name from branch T, branch S where T.assets > S.assets and S.branch_city = 'Brooklyn' ```  Give an efficient relational-algebra expression equivalent to this query, and justify why you chose it.  *Figure 15.14 — Bank database* (primary keys underlined):  - branch (branch_name, branch_city, assets) - customer (customer_name, customer_street, customer_city) - loan (loan_number, branch_name, amount) - borrower (customer_name, loan_number) - account (account_number, branch_name, balance) - depositor (customer_name, account_number)<br>Bảng `qp_branch(branch_name, branch_city, assets)`. Viết truy vấn tương đương PE 15.2 nhưng không dùng self-join: tên các branch có assets lớn hơn assets của ít nhất một branch ở Brooklyn, mỗi tên một lần. |
| CH15.08 | PE 15.6c phủ định | ★☆☆ | Exercise 15.6 (c). Using the bank database of Figure 15.14 (primary keys underlined), suppose relation *branch* has a B+-tree index on *branch_city* and no other index. List the different ways of evaluating each of the following selections that contain negation:  c. σ[¬(branch_city branch_name, branch_city, assets) - customer (customer_name, customer_street, customer_city) - loan (loan_number, branch_name, amount) - borrower (customer_name, loan_number) - account (account_number, branch_name, balance) - depositor (customer_name, account_number)<br>Viết σ[¬(branch_city < 'Brooklyn' ∨ assets < 5000)](qp_branch) không dùng `not` (áp dụng De Morgan để điều kiện trên branch_city có dạng dùng được B⁺-tree). Trả về branch_name, branch_city, assets. |
| CH15.09 | PE 15.10a semijoin | ★★☆ | Exercise 15.10 (a). Consider the extended relational-algebra operators below. For each one, explain how it can be implemented with sorting and with hashing.  a. Semijoin (⋉[θ]): in the multiset semijoin r ⋉[θ] s, a tuple r[i] occurring n times in r occurs n times in the result if at least one tuple s[j] exists such that r[i] and s[j] satisfy θ; otherwise r[i] does not occur in the result.<br>Multiset semijoin `qp_orders ⋉ qp_vip` theo điều kiện `qp_orders.cust = qp_vip.cust`. Cả hai bảng có dòng trùng: kết quả phải giữ đúng số lần lặp của mỗi dòng qp_orders (không bị nhân lên theo số dòng khớp của qp_vip). Trả về cust, item. |
| CH15.10 | PE 15.10b anti-semijoin | ★★☆ | Exercise 15.10 (b). Consider the extended relational-algebra operators below. For each one, explain how it can be implemented with sorting and with hashing.  b. Anti-semijoin (⊳̄[θ]): in the multiset anti-semijoin of r and s, a tuple r[i] occurring n times in r occurs n times in the result if no tuple s[j] of s satisfies θ together with r[i]; otherwise r[i] does not occur in the result.<br>Multiset anti-semijoin của `qp_orders` với `qp_blocked` theo điều kiện `qp_orders.cust = qp_blocked.cust`: giữ (đúng số lần) mọi dòng qp_orders mà không có dòng nào của qp_blocked thoả điều kiện. Lưu ý qp_blocked chứa null và qp_orders có một dòng cust null. Trả về cust, item. |
| CH15.11 | PE 15.8 division (hash) | ★★☆ | Exercise 15.8. Design one sorting-based and one hashing-based algorithm for computing the relational division operation (Practice Exercise 2.9 defines division).<br>Phép chia `qp_supply(supplier, part) ÷ qp_req_part(part)`: các supplier cung cấp mọi part trong qp_req_part. qp_supply có dòng trùng và có part ngoài danh sách. Viết theo kiểu hash-based: nhóm theo supplier và đếm số part khác nhau thuộc danh sách. |
| CH15.12 | loại trùng bằng sort | ★★☆ | Loại trùng theo kiểu sort-based: trả về các cặp (cust, item) khác nhau của `qp_orders` (kể cả dòng cust null) không dùng `distinct`, `group by` hay `union` — sắp theo (cust, item) và chỉ giữ dòng đầu tiên của mỗi nhóm giống nhau. |
| CH15.13 | PE 15.13 ≥ k keyword | ★★☆ | Exercise 15.13. You need the documents that contain at least k of a given set of n keywords. A keyword index is available that returns, for a given keyword, a sorted list of the identifiers of the documents containing it. Give an efficient algorithm that finds the required documents.<br>`qp_doc_kw(doc_id, keyword)` là keyword index, `qp_query_kw(keyword)` là n keyword cần tìm. Tìm các document chứa ít nhất k = 3 keyword trong qp_query_kw. Trả về doc_id và `matched` (số keyword khớp). |
| CH15.14 | top-K với hoà | ★☆☆ | Lấy các account có balance thuộc 2 giá trị cao nhất đầu tiên theo thứ tự của `qp_account` — tức 2 dòng balance cao nhất, nhưng nếu dòng cuối hoà với các dòng sau thì lấy cả các dòng hoà đó. Trả về account_number, balance. (Dùng cú pháp chuẩn SQL cho top-K có hoà.) |
| CH15.15 | indexed nested-loop | ★☆☆ | Indexed nested-loop join r1 ⋈ r2 với r1 làm outer; r2 có B⁺-tree primary index trên thuộc tính join (mỗi tuple r1 khớp tối đa một tuple r2), chiều cao h = 3, nên mỗi lần tra c = h + 1 = 4 block transfer và 4 seek. Từ `qp_rel_stats`, tính `transfers` = b[r1] + n[r1] · 4 và `seeks` = b[r1] + n[r1] · 4 (đọc mỗi block outer cũng tốn một seek trong trường hợp xấu nhất). Trả về một dòng hai cột. |
