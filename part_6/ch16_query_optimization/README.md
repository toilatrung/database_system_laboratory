# Chương 16 — Tối ưu truy vấn

*Query Optimization · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch16`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 1. Tối ưu truy vấn là gì (slide 16.2–16.6)
Một truy vấn có nhiều **evaluation plan** tương đương — khác nhau ở biểu thức đại số (thứ tự join, vị trí selection…) và thuật toán cho từng phép toán. Chi phí giữa các plan có thể chênh **nhiều bậc độ lớn**. **Cost-based optimization** gồm ba bước:
1. Sinh các biểu thức tương đương bằng **luật tương đương**.
2. Gắn thuật toán cho từng phép toán để được các plan.
3. **Ước lượng chi phí** mỗi plan (dựa vào thống kê) và chọn plan rẻ nhất.

PostgreSQL: `explain <query>` cho plan + chi phí ước lượng, `explain analyze` chạy thật và in thời gian/số dòng thực tế.

### 2. Luật tương đương (slide 16.7–16.20)
Hai biểu thức tương đương nếu cho **cùng tập tuple trên mọi instance hợp lệ** (với SQL: cùng multiset).
1. σ<sub>θ₁∧θ₂</sub>(E) ≡ σ<sub>θ₁</sub>(σ<sub>θ₂</sub>(E)) — tách conjunction.
2. σ<sub>θ₁</sub>(σ<sub>θ₂</sub>(E)) ≡ σ<sub>θ₂</sub>(σ<sub>θ₁</sub>(E)) — selection giao hoán.
3. Π<sub>L₁</sub>(Π<sub>L₂</sub>(…(E))) ≡ Π<sub>L₁</sub>(E) với L₁ ⊆ L₂ ⊆ … — chỉ giữ projection ngoài cùng.
4. σ<sub>θ</sub>(E₁ × E₂) ≡ E₁ ⋈<sub>θ</sub> E₂ và σ<sub>θ₁</sub>(E₁ ⋈<sub>θ₂</sub> E₂) ≡ E₁ ⋈<sub>θ₁∧θ₂</sub> E₂.
5. Theta join (và natural join) **giao hoán**: E₁ ⋈<sub>θ</sub> E₂ ≡ E₂ ⋈<sub>θ</sub> E₁.
6. Natural join **kết hợp**: (E₁ ⋈ E₂) ⋈ E₃ ≡ E₁ ⋈ (E₂ ⋈ E₃); theta join kết hợp khi điều kiện chỉ dùng thuộc tính phù hợp.
7. **Đẩy selection xuống join**: σ<sub>θ₀</sub>(E₁ ⋈ E₂) ≡ σ<sub>θ₀</sub>(E₁) ⋈ E₂ nếu θ₀ chỉ dùng thuộc tính của E₁; σ<sub>θ₁∧θ₂</sub>(E₁ ⋈ E₂) ≡ σ<sub>θ₁</sub>(E₁) ⋈ σ<sub>θ₂</sub>(E₂).
8. **Đẩy projection xuống join**: giữ lại các thuộc tính cần cho điều kiện join và cho kết quả.
9. ∪, ∩ giao hoán và kết hợp; − thì không.
10. σ phân phối qua ∪, ∩, −: σ<sub>θ</sub>(E₁ − E₂) ≡ σ<sub>θ</sub>(E₁) − E₂.
11. Π phân phối qua ∪ (nhưng **không** qua − : PE 16.3a).
12. Aggregation: σ<sub>θ</sub>(<sub>A</sub>γ<sub>F</sub>(E)) ≡ <sub>A</sub>γ<sub>F</sub>(σ<sub>θ</sub>(E)) khi θ chỉ dùng thuộc tính nhóm A (PE 16.2b) — tức chuyển `having` trên cột nhóm thành `where`.
13. Outer join: **không giao hoán/kết hợp tuỳ ý**. σ<sub>θ</sub>(E₁ ⟕ E₂) ≡ σ<sub>θ</sub>(E₁) ⟕ E₂ khi θ chỉ dùng thuộc tính E₁ (PE 16.2c); nhưng đẩy θ trên E₂ xuống E₂ thì **sai** (PE 16.3e). Khi θ loại bỏ null của E₂ (null-rejecting), σ<sub>θ</sub>(E₁ ⟕ E₂) ≡ σ<sub>θ</sub>(E₁ ⋈ E₂).

Ví dụ kinh điển (slide 16.15): `Π name, title (σ dept_name='Music' ∧ year=2017 (instructor ⋈ (teaches ⋈ course)))` → đẩy σ dept_name xuống instructor, σ year xuống teaches, và join instructor với teaches **trước** vì kết quả nhỏ.

Thuật toán sinh mọi biểu thức tương đương tốn rất nhiều bộ nhớ → dùng **chia sẻ biểu thức con** và các heuristic.

### 3. Thống kê và ước lượng kích thước (slide 16.21–16.40)
Catalog lưu: **n<sub>r</sub>** (số tuple), **b<sub>r</sub>** (số block), **l<sub>r</sub>** (kích thước tuple), **f<sub>r</sub>** (blocking factor), **V(A, r)** (số giá trị khác nhau của A = kích thước Π<sub>A</sub>(r)), và **histogram**.
- **Histogram equi-width**: chia miền giá trị thành các khoảng đều nhau, lưu số tuple mỗi khoảng. **Equi-depth**: mỗi bucket cùng số tuple, lưu biên. Giả sử phân bố đều **trong** mỗi bucket. PostgreSQL lưu equi-depth histogram + danh sách giá trị phổ biến nhất (most common values) trong `pg_stats`.

Ước lượng selection:
| Biểu thức | Số tuple ước lượng |
|---|---|
| σ<sub>A=v</sub>(r) | n<sub>r</sub> / V(A, r) (dùng histogram nếu có); A là khoá → 1 |
| σ<sub>A≤v</sub>(r) | n<sub>r</sub> · (v − min(A, r)) / (max(A, r) − min(A, r)); v < min → 0; v ≥ max → n<sub>r</sub>; không biết v → n<sub>r</sub>/2 |
| conjunction θ₁ ∧ … ∧ θₙ | n<sub>r</sub> · (s₁ · s₂ ⋯ sₙ) / n<sub>r</sub><sup>n</sup> (giả sử độc lập; sᵢ là kích thước của σ<sub>θᵢ</sub>) |
| disjunction θ₁ ∨ … ∨ θₙ | n<sub>r</sub> · (1 − (1 − s₁/n<sub>r</sub>)(1 − s₂/n<sub>r</sub>)⋯) |
| negation ¬θ | n<sub>r</sub> − kích thước(σ<sub>θ</sub>(r)) |

Ước lượng join r(R) ⋈ s(S):
- R ∩ S = ∅: n<sub>r</sub> · n<sub>s</sub> (tích Descartes).
- R ∩ S là **khoá của R**: mỗi tuple s khớp tối đa một tuple r → **≤ n<sub>s</sub>**; nếu thêm là foreign key từ S tham chiếu R (và not null) → **đúng n<sub>s</sub>**.
- R ∩ S = {A} không là khoá: **n<sub>r</sub> · n<sub>s</sub> / max(V(A, r), V(A, s))** (lấy ước lượng nhỏ hơn trong hai cách n<sub>r</sub>·n<sub>s</sub>/V(A, s) và n<sub>r</sub>·n<sub>s</sub>/V(A, r)).
- Các phép khác: projection Π<sub>A</sub>(r) → V(A, r); aggregation <sub>A</sub>γ<sub>F</sub>(r) → V(A, r); r ∪ s ≤ n<sub>r</sub> + n<sub>s</sub>; r ∩ s ≤ min(n<sub>r</sub>, n<sub>s</sub>); r − s ≤ n<sub>r</sub>; left outer join = kích thước join + n<sub>r</sub>.
- Ước lượng V(A, kết quả): selection A = v → 1; join → min(V(A, r), V(A, s)) …

### 4. Chọn evaluation plan (slide 16.41–16.58)
- Không thể chọn thuật toán rẻ nhất cho từng phép toán một cách độc lập: merge join có thể đắt hơn hash join nhưng tạo kết quả **đã sắp**, giúp phép trên rẻ hơn (**interesting sort order**, PE 16.10).
- **Số thứ tự join**: với n quan hệ có **(2(n − 1))! / (n − 1)!** cây join (PE 16.12): n = 3 → 12, n = 7 → 665 280, n = 10 → > 17,6 tỉ. Chỉ xét **left-deep** (vế phải mỗi join là một quan hệ gốc): n! thứ tự.
- **Dynamic programming** (*FindBestPlan*): với mỗi tập con S của các quan hệ, tính plan tốt nhất một lần rồi ghi nhớ; plan của S được ghép từ plan tốt nhất của S₁ và S − S₁. Thời gian **O(3ⁿ)**, bộ nhớ O(2ⁿ) (PE 16.13). Chỉ xét left-deep: **O(n · 2ⁿ)** (PE 16.14, System R). Với interesting orders: lưu plan tốt nhất cho **mỗi (tập con, thứ tự)** (PE 16.11).
- **Heuristic**: đẩy selection xuống sớm nhất; đẩy projection xuống; thực hiện selection/join hạn chế nhất (cho kết quả nhỏ nhất) trước; tránh tích Descartes. Nhiều optimizer kết hợp: heuristic để thu hẹp, cost-based cho thứ tự join và thuật toán.
- Optimizer thực tế: System R (left-deep, DP, interesting order), PostgreSQL (DP tới ~12 bảng, sau đó **genetic algorithm** GEQO), SQL Server (Cascades/Volcano: biến đổi + memoization). **Plan caching** cho truy vấn tham số hoá; dừng tối ưu khi chi phí tối ưu vượt chi phí thực thi ước lượng.

### 5. Truy vấn lồng và khử tương quan (slide 16.59–16.64)
- **Correlated evaluation**: chạy subquery một lần cho **mỗi tuple** của truy vấn ngoài — rất chậm khi bảng ngoài lớn.
- **Decorrelation**: viết lại thành join. `exists` → **semijoin** (⋉), `not exists` → **anti-semijoin**; subquery có aggregate (ví dụ so với max theo nhóm) → tính aggregate **một lần** bằng `group by` (bảng tạm/derived table) rồi join (PE 16.15).
- Ví dụ:
```sql
-- lồng, có tương quan
select name from instructor
where exists (select * from teaches where teaches.ID = instructor.ID and teaches.year = 2019);
-- khử tương quan: semijoin
select name from instructor
where ID in (select ID from teaches where year = 2019);   -- PostgreSQL chạy bằng Hash Semi Join
```
- Cẩn thận `not in` với null; `not exists` ⇔ anti-semijoin luôn đúng.

### 6. Materialized view (slide 16.65–16.75)
- **Materialized view**: kết quả view được tính và **lưu**; truy vấn đọc thẳng, nhưng phải **bảo trì** khi bảng gốc đổi.
- **Incremental view maintenance**: tính phần thay đổi (differential) thay vì tính lại toàn bộ. Với v = r ⋈ s, chèn i<sub>r</sub> vào r: v<sup>new</sup> = v<sup>old</sup> ∪ (i<sub>r</sub> ⋈ s); xoá d<sub>r</sub>: v<sup>new</sup> = v<sup>old</sup> − (d<sub>r</sub> ⋈ s).
- Selection/projection: projection cần **đếm số lần** mỗi tuple được suy ra (count) để biết khi nào xoá. Aggregate: count, sum bảo trì được bằng cộng/trừ; avg = sum/count; min/max khi xoá đúng giá trị min/max phải tính lại từ nhóm.
- **Immediate** (cùng giao dịch, bằng trigger) vs **deferred** (định kỳ, `refresh materialized view` trong PostgreSQL — PostgreSQL không tự bảo trì incremental).
- **Query optimization với materialized view**: viết lại truy vấn để dùng view đã có (view matching), hoặc ngược lại thay view bằng định nghĩa nếu rẻ hơn; **chọn view nên materialize** dựa trên workload.

### 7. Các kỹ thuật nâng cao (slide 16.76+)
- **Top-K optimization** (`order by … limit K`), **join minimization** (bỏ join thừa qua foreign key), **halloween problem** khi update dùng index trên chính cột bị update, **multiquery optimization** (chia sẻ biểu thức con giữa nhiều truy vấn), **parametric/adaptive optimization**.

### Công thức hay thi
| Câu hỏi | Trả lời |
|---|---|
| σ<sub>A=v</sub> | n<sub>r</sub> / V(A, r) |
| σ<sub>A≤v</sub> | n<sub>r</sub>(v − min)/(max − min) |
| r ⋈ s trên A, không khoá | n<sub>r</sub>n<sub>s</sub> / max(V(A, r), V(A, s)) |
| r ⋈ s, A là khoá của r, FK từ s | n<sub>s</sub> |
| Số cây join | (2(n−1))!/(n−1)! ; left-deep: n! |
| DP tìm thứ tự join | O(3ⁿ); left-deep O(n2ⁿ) |

## 2. Trắc nghiệm (11 câu)

**Câu 1.** Hai biểu thức đại số được gọi là tương đương khi nào?

- A. Cho cùng kết quả trên dữ liệu hiện tại
- B. Cho cùng kết quả trên mọi instance hợp lệ
- C. Có cùng chi phí
- D. Dùng cùng các bảng

<details><summary>Đáp án</summary>

**B** — Tương đương phải đúng với mọi instance hợp lệ, không chỉ dữ liệu hiện có.

</details>

**Câu 2.** σ<sub>θ</sub>(E₁ ⟕ E₂) ≡ E₁ ⟕ σ<sub>θ</sub>(E₂) đúng không, với θ chỉ dùng thuộc tính của E₂?

- A. Luôn đúng
- B. Sai — vế phải giữ tuple E₁ không khớp với null, vế trái có thể loại chúng
- C. Chỉ đúng khi E₂ rỗng
- D. Đúng với natural join

<details><summary>Đáp án</summary>

**B** — PE 16.3e. Đẩy selection xuống chỉ an toàn ở phía được bảo toàn (E₁).

</details>

**Câu 3.** Đẩy `having dept_name = 'Physics'` thành `where` trước `group by dept_name` có đúng không?

- A. Có, vì điều kiện chỉ dùng thuộc tính nhóm
- B. Không bao giờ
- C. Chỉ khi có index
- D. Chỉ với count

<details><summary>Đáp án</summary>

**A** — PE 16.2b: σ_θ(Aγ_F(E)) ≡ Aγ_F(σ_θ(E)) khi θ chỉ dùng thuộc tính của A.

</details>

**Câu 4.** n<sub>r</sub> = 10 000, V(A, r) = 50. Ước lượng kích thước σ<sub>A=v</sub>(r)?

- A. 50
- B. 200
- C. 10 000
- D. 1

<details><summary>Đáp án</summary>

**B** — n_r / V(A, r) = 10000 / 50.

</details>

**Câu 5.** r ⋈ s trên A; n<sub>r</sub> = 1000, n<sub>s</sub> = 2000, V(A, r) = 100, V(A, s) = 400; A không là khoá. Ước lượng?

- A. 5 000
- B. 20 000
- C. 2 000 000
- D. 2 000

<details><summary>Đáp án</summary>

**A** — n_r·n_s / max(V) = 2 000 000 / 400 = 5 000.

</details>

**Câu 6.** takes ⋈ student trên ID (ID là khoá của student, takes.ID là foreign key not null). Kích thước kết quả?

- A. n_student
- B. n_takes
- C. n_takes · n_student
- D. n_student / V(ID, takes)

<details><summary>Đáp án</summary>

**B** — Mỗi tuple takes khớp đúng một student.

</details>

**Câu 7.** Có bao nhiêu thứ tự join (cây join bất kỳ) cho 4 quan hệ?

- A. 24
- B. 120
- C. 12
- D. 6

<details><summary>Đáp án</summary>

**B** — (2(n−1))!/(n−1)! = 6!/3! = 120; left-deep chỉ 4! = 24.

</details>

**Câu 8.** Thuật toán dynamic programming tìm thứ tự join tối ưu (cây bất kỳ) chạy trong thời gian nào?

- A. O(n!)
- B. O(3ⁿ)
- C. O(n²)
- D. O(2ⁿ)

<details><summary>Đáp án</summary>

**B** — Mỗi tập con S xét mọi cách chia thành S₁, S − S₁; tổng Σ C(n,k)·2ᵏ = 3ⁿ (PE 16.13).

</details>

**Câu 9.** Vì sao optimizer có thể chọn merge join dù hash join rẻ hơn cho riêng phép join đó?

- A. Merge join dùng ít bộ nhớ
- B. Kết quả đã sắp (interesting order) giúp phép phía trên rẻ hơn
- C. Hash join không hỗ trợ equi-join
- D. Merge join không cần sort

<details><summary>Đáp án</summary>

**B** — Ví dụ phép trên là order by / group by / merge join khác trên cùng thuộc tính.

</details>

**Câu 10.** Khử tương quan `where exists (select … where s.A = r.A)` cho ra phép toán nào?

- A. Natural join
- B. Semijoin
- C. Anti-semijoin
- D. Outer join

<details><summary>Đáp án</summary>

**B** — exists → semijoin (giữ tuple r một lần); not exists → anti-semijoin.

</details>

**Câu 11.** Materialized view v = sum(amount) group by branch. Khi xoá một tuple, cập nhật incremental thế nào?

- A. Phải tính lại toàn bộ
- B. Trừ amount khỏi tổng của nhóm (giảm count, xoá nhóm khi count = 0)
- C. Không cần làm gì
- D. Xoá cả nhóm

<details><summary>Đáp án</summary>

**B** — sum và count bảo trì được bằng cộng/trừ; min/max mới có thể phải tính lại.

</details>

## 3. Câu hỏi tự luận (15 câu)

**Câu 1.** 

> **Exercise 16.1.** Get the university schema and the large university dataset from db-book.com, create the schema in a database system of your choice, and load the large dataset. Using the *explain* feature (Note 16.1), look at the plan the database chooses in each case below.
> 
> a. A query with an equality condition on *student.name* (which has no index).
> 
> b. The same query after creating an index on *student.name*.
> 
> c. Simple queries joining two relations, and joining three relations.
> 
> d. A query computing an aggregate with grouping.
> 
> e. An SQL query whose chosen plan uses a semijoin operation.
> 
> f. An SQL query with a **not in** clause whose subquery uses aggregation; observe the chosen plan.
> 
> g. A query for which the chosen plan uses correlated evaluation (databases show this differently; most display a filter or project operator containing a subplan or subquery).
> 
> h. An SQL update that changes a single row of a relation; look at its plan.
> 
> i. An SQL update that changes many rows of a relation, computing the new value with a subquery; look at its plan.

**PE 16.1** — Dùng `explain` để xem plan trong các trường hợp (a)–(i). Viết truy vấn mẫu cho từng trường hợp trên PostgreSQL và cho biết plan thường thấy.

<details><summary>Gợi ý đáp án</summary>

Kết quả phụ thuộc hệ quản trị và dữ liệu; dưới đây là truy vấn mẫu và plan PostgreSQL thường chọn trên large university dataset (chạy được ở tab SQL với dữ liệu nhỏ, nhưng dữ liệu nhỏ thì hầu như luôn là Seq Scan):

a. `explain select * from student where name = 'Zhang';` → **Seq Scan** on student, Filter: name = 'Zhang'.
b. `create index student_name_idx on student(name);` rồi chạy lại → **Index Scan** (hoặc Bitmap Index Scan + Bitmap Heap Scan) using student_name_idx. Sau khi tạo index nên `analyze student`.
c. `explain select * from student natural join takes;` → **Hash Join** (Seq Scan takes, Hash trên student). Ba bảng: `… natural join course` → hai Hash Join lồng nhau; thứ tự do optimizer chọn theo kích thước.
d. `explain select dept_name, count(*) from instructor group by dept_name;` → **HashAggregate** (hoặc Sort + GroupAggregate).
e. `explain select * from instructor where ID in (select ID from teaches);` → **Hash Semi Join** (hoặc Hash Join với HashAggregate loại trùng trên teaches).
f. `explain select * from instructor where salary not in (select max(salary) from instructor group by dept_name);` → Seq Scan với Filter **NOT (hashed SubPlan 1)**; subplan là HashAggregate.
g. `explain select name from instructor i where salary > (select avg(salary) from instructor j where j.dept_name = i.dept_name);` → Seq Scan với Filter dùng **SubPlan 1** chạy lại cho mỗi dòng (correlated evaluation).
h. `explain update instructor set salary = salary * 1.05 where ID = '10101';` → **Update** on instructor ← **Index Scan** using instructor_pkey.
i. `explain update instructor i set salary = (select avg(salary) from instructor j where j.dept_name = i.dept_name);` → Update ← Seq Scan on instructor, với **SubPlan** tính avg cho từng dòng.

</details>

**Câu 2.** 

> **Exercise 16.2.** Prove the following equivalences, and explain how each can be used to make certain queries more efficient:
> 
> a. E<sub>1</sub> ⋈<sub>θ</sub> (E<sub>2</sub> − E<sub>3</sub>) ≡ (E<sub>1</sub> ⋈<sub>θ</sub> E<sub>2</sub> − E<sub>1</sub> ⋈<sub>θ</sub> E<sub>3</sub>).
> 
> b. σ<sub>θ</sub>(<sub>A</sub>γ<sub>F</sub>(E)) ≡ <sub>A</sub>γ<sub>F</sub>(σ<sub>θ</sub>(E)), where θ uses only attributes of A.
> 
> c. σ<sub>θ</sub>(E<sub>1</sub> ⟕ E<sub>2</sub>) ≡ σ<sub>θ</sub>(E<sub>1</sub>) ⟕ E<sub>2</sub>, where θ uses only attributes of E<sub>1</sub>.

**PE 16.2** — Chứng minh ba luật tương đương (a) join phân phối qua hiệu, (b) đẩy selection qua aggregation, (c) đẩy selection qua left outer join, và cho biết chúng giúp tối ưu thế nào.

<details><summary>Gợi ý đáp án</summary>

**a. E₁ ⋈<sub>θ</sub> (E₂ − E₃) ≡ E₁ ⋈<sub>θ</sub> E₂ − E₁ ⋈<sub>θ</sub> E₃** (E₂, E₃ cùng schema).
Đặt R₁ = vế trái, R₂ = E₁ ⋈<sub>θ</sub> E₂, R₃ = E₁ ⋈<sub>θ</sub> E₃.
- t ∈ R₁ ⇒ t = t₁·t₂ với t₁ ∈ E₁, t₂ ∈ E₂, t₂ ∉ E₃, thoả θ ⇒ t ∈ R₂; và t ∉ R₃ vì phần E₃ của t là t₂ ∉ E₃. Vậy t ∈ R₂ − R₃.
- t ∈ R₂ − R₃ ⇒ t = t₁·t₂, t₂ ∈ E₂, thoả θ; nếu t₂ ∈ E₃ thì t ∈ R₃ (vô lý) ⇒ t₂ ∈ E₂ − E₃ ⇒ t ∈ R₁.
Ứng dụng: theo chiều phải → trái, thay hai join lớn (mà phần lớn tuple sẽ bị trừ đi) bằng một phép trừ trên E₂, E₃ rồi chỉ một join.

**b. σ<sub>θ</sub>(<sub>A</sub>γ<sub>F</sub>(E)) ≡ <sub>A</sub>γ<sub>F</sub>(σ<sub>θ</sub>(E))**, θ chỉ dùng thuộc tính của A.
Mọi tuple của E trong cùng một nhóm có cùng giá trị A, nên θ (chỉ phụ thuộc A) cho cùng kết quả trên mọi tuple của nhóm: nhóm bị loại ở vế trái ⇔ **toàn bộ** tuple của nhóm bị loại ở vế phải; nhóm được giữ thì giữ nguyên mọi tuple nên giá trị aggregate F không đổi.
Ứng dụng: lọc trước khi aggregate → không tốn công tính aggregate cho các nhóm sẽ bị loại (chuyển `having` trên cột nhóm thành `where`).

**c. σ<sub>θ</sub>(E₁ ⟕ E₂) ≡ σ<sub>θ</sub>(E₁) ⟕ E₂**, θ chỉ dùng thuộc tính của E₁.
Mỗi tuple của E₁ ⟕ E₂ có phần E₁ là một tuple t₁ của E₁ (khớp với tuple E₂ hoặc kèm null). θ chỉ xét t₁ nên tuple bị loại ở vế trái ⇔ t₁ không thoả θ ⇔ t₁ không có trong σ<sub>θ</sub>(E₁), và mọi tuple sinh từ t₁ bị loại ở cả hai vế; t₁ thoả θ thì sinh đúng cùng các tuple (khớp hoặc null) ở hai vế.
Ứng dụng: lọc E₁ trước khi outer join → join nhỏ hơn nhiều.

Bài CH16.06 kiểm chứng luật b trên dữ liệu.

</details>

**Câu 3.** 

> **Exercise 16.3.** For each pair of expressions below, give relation instances showing that the two expressions are not equivalent.
> 
> a. Π<sub>A</sub>(r − s) and Π<sub>A</sub>(r) − Π<sub>A</sub>(s).
> 
> b. σ<sub>B<4</sub>(<sub>A</sub>γ<sub>max(B) as B</sub>(r)) and <sub>A</sub>γ<sub>max(B) as B</sub>(σ<sub>B<4</sub>(r)).
> 
> c. If both occurrences of max in the previous expressions were replaced by min, would the expressions be equivalent?
> 
> d. (r ⟖ s) ⟖ t and r ⟖ (s ⟖ t). In other words, the natural right outer join is not associative.
> 
> e. σ<sub>θ</sub>(E<sub>1</sub> ⟕ E<sub>2</sub>) and E<sub>1</sub> ⟕ σ<sub>θ</sub>(E<sub>2</sub>), where θ uses only attributes of E<sub>2</sub>.

**PE 16.3** — Cho instance chứng tỏ các cặp biểu thức (a), (b), (d), (e) không tương đương; (c) thay max bằng min thì sao?

<details><summary>Gợi ý đáp án</summary>

a. Π<sub>A</sub>(r − s) vs Π<sub>A</sub>(r) − Π<sub>A</sub>(s): r = {(1, 2)}, s = {(1, 3)} (schema (A, B)). r − s = {(1, 2)} → vế trái {(1)}; Π<sub>A</sub>(r) − Π<sub>A</sub>(s) = {1} − {1} = ∅.

b. σ<sub>B<4</sub>(<sub>A</sub>γ<sub>max(B) as B</sub>(r)) vs <sub>A</sub>γ<sub>max(B) as B</sub>(σ<sub>B<4</sub>(r)): r = {(1, 2), (1, 5)}. Vế trái: max = 5, không < 4 → ∅. Vế phải: lọc còn (1, 2) → {(1, 2)}.

c. Với **min** thì **tương đương**: nếu min của nhóm < 4 thì tuple đạt min vẫn còn sau khi lọc B < 4 và vẫn là min của phần còn lại; nếu min ≥ 4 thì mọi tuple của nhóm bị lọc, nhóm biến mất ở cả hai vế.

d. (r ⟖ s) ⟖ t vs r ⟖ (s ⟖ t) — lời giải in trong sách (R = {(1, 2)}, S = {(2, 3)}, T = {(1, 4)}) cho hai vế **bằng nhau** nếu t có schema (A, D). Một instance đúng với r(A, B), s(B, C), t(A, D): r = {(1, 2)}, s = {(5, 3)}, t = {(1, 4)}.
- r ⟖ s = {(null, 5, 3)} (s không khớp r); ⟖ t trên A: null ≠ 1 → {(A = 1, B = null, C = null, D = 4)}.
- s ⟖ t: không có thuộc tính chung → tích {(5, 3, 1, 4)}; r ⟖ đó trên (A, B): (1, 2) không khớp (1, 5) → {(1, 5, 3, 4)}.
Hai kết quả khác nhau (CH16.03).

e. σ<sub>θ</sub>(E₁ ⟕ E₂) vs E₁ ⟕ σ<sub>θ</sub>(E₂), θ trên E₂: E₁(A, B) = {(1, 2)}, E₂(A, C) = {(2, 3)}, θ: C = 1. Vế trái: E₁ ⟕ E₂ = {(1, 2, null)}, θ trên null là unknown → ∅. Vế phải: σ<sub>θ</sub>(E₂) = ∅ nên {(1, 2, null)}.

Các bài CH16.01–CH16.05 yêu cầu tự dựng instance và hệ thống kiểm tra hai vế khác nhau.

</details>

**Câu 4.** 

> **Exercise 16.4.** SQL relations may contain duplicates (Chapter 3), and Notes 3.1, 3.2 and 3.3 define a multiset version of the relational algebra. Determine which of the equivalence rules 1 through 7.b still hold for the multiset version of the relational algebra.

**PE 16.4** — Các luật tương đương 1 tới 7.b có còn đúng với đại số quan hệ multiset không?

<details><summary>Gợi ý đáp án</summary>

**Có** — các luật 1 tới 7.b (tách/giao hoán selection, chỉ giữ projection ngoài cùng, gộp selection vào join, join giao hoán và kết hợp, đẩy selection xuống join) đều đúng với multiset: mỗi luật chỉ lọc hoặc ghép từng tuple một cách độc lập, nên số lần xuất hiện của mỗi tuple kết quả (tích số lần của các tuple thành phần) như nhau ở hai vế. Lưu ý luật 3 với multiset: projection không loại trùng, nên Π<sub>L₁</sub>(Π<sub>L₂</sub>(E)) vẫn giữ đúng số lần.

Có những luật đúng với tập hợp nhưng **sai** với multiset, ví dụ A ∪ B = (A − B) ∪ (B − A) ∪ (A ∩ B): nếu t xuất hiện 4 lần trong A và 3 lần trong B, multiset union cho 7 lần, còn vế phải cho 1 + 0 + 3 = 4 lần. (Ví dụ của sách viết A ∩ B = A ∪ B − (A − B) − (B − A): vế trái 3 lần, vế phải 7 − 1 − 0 = 6 lần.) Nguyên nhân: union, intersect, except multiset bất đối xứng (cộng / min / trừ số lần).

</details>

**Câu 5.** 

> **Exercise 16.5.** Relations r<sub>1</sub>(A, B, C), r<sub>2</sub>(C, D, E), and r<sub>3</sub>(E, F) have primary keys A, C, and E respectively. r<sub>1</sub> contains 1000 tuples, r<sub>2</sub> contains 1500 tuples, and r<sub>3</sub> contains 750 tuples. Estimate the size of r<sub>1</sub> ⋈ r<sub>2</sub> ⋈ r<sub>3</sub>, and give an efficient strategy for computing this join.

**PE 16.5** — r₁(A, B, C), r₂(C, D, E), r₃(E, F) với khoá A, C, E; 1000, 1500, 750 tuple. Ước lượng kích thước r₁ ⋈ r₂ ⋈ r₃ và chiến lược tính.

<details><summary>Gợi ý đáp án</summary>

Kết quả không phụ thuộc thứ tự join. Xét (r₁ ⋈ r₂) ⋈ r₃: C là **khoá của r₂** nên mỗi tuple r₁ khớp tối đa một tuple r₂ → r₁ ⋈ r₂ có **≤ 1000** tuple; E là khoá của r₃ nên mỗi tuple của kết quả đó khớp tối đa một tuple r₃ → kết quả cuối **≤ 1000** tuple. (Nếu thêm C, E là foreign key not null thì đúng 1000.)

Chiến lược: dùng (hoặc tạo) index trên r₂.C và r₃.E. Với mỗi tuple r₁: tra index r₂ theo C (tối đa một tuple), rồi tra index r₃ theo E của tuple đó (tối đa một tuple) — indexed nested-loop hai tầng, chi phí ≈ b<sub>r1</sub> + 1000 × (c<sub>r2</sub> + c<sub>r3</sub>), không bao giờ tạo kết quả trung gian lớn. Hash join r₁ với r₂ rồi với r₃ cũng tốt.

</details>

**Câu 6.** 

> **Exercise 16.6.** Take the relations r<sub>1</sub>(A, B, C), r<sub>2</sub>(C, D, E), and r<sub>3</sub>(E, F) of Practice Exercise 16.5, but assume now that the only primary key of each relation is its whole schema. Let V(C, r<sub>1</sub>) = 900, V(C, r<sub>2</sub>) = 1100, V(E, r<sub>2</sub>) = 50, and V(E, r<sub>3</sub>) = 100, with r<sub>1</sub> having 1000 tuples, r<sub>2</sub> 1500 tuples, and r<sub>3</sub> 750 tuples. Estimate the size of r<sub>1</sub> ⋈ r<sub>2</sub> ⋈ r<sub>3</sub> and give an efficient strategy for computing the join.

**PE 16.6** — Như PE 16.5 nhưng không có khoá; V(C, r₁) = 900, V(C, r₂) = 1100, V(E, r₂) = 50, V(E, r₃) = 100. Ước lượng kích thước và chiến lược.

<details><summary>Gợi ý đáp án</summary>

r₁ ⋈ r₂ trên C: 1000 × 1500 / max(900, 1100) = 1 500 000 / 1100 ≈ **1364** tuple (mỗi tuple r₁ khớp trung bình 15/11 tuple r₂).

Kết quả đó ⋈ r₃ trên E: 1364 × 750 / max(V(E, r₂), V(E, r₃)) = (15000/11) × 750 / 100 ≈ **10 227** tuple. (V(E, r₁ ⋈ r₂) ≤ V(E, r₂) = 50, nên dùng max(50, 100) = 100.)

Chiến lược: so các kết quả trung gian — r₁ ⋈ r₂ ≈ 1364; r₂ ⋈ r₃ = 1500 × 750 / 100 = 11 250; r₁ × r₃ (không có thuộc tính chung) = 750 000. Vậy join **r₁ với r₂ trước** (kết quả trung gian nhỏ, cỡ r₁, r₂), rồi join với r₃ — ví dụ hash join với r₁ làm build, sau đó hash join kết quả với r₃ (r₃ làm build vì nhỏ hơn). CH16.07–CH16.08 tính các số này bằng SQL.

</details>

**Câu 7.** 

> **Exercise 16.7.** Relation *department* has a B<sup>+</sup>-tree index on *building* and no other index. What is the best way to evaluate each of the following selections involving negation?
> 
> a. σ<sub>¬(building < “Watson”)</sub>(*department*)
> 
> b. σ<sub>¬(building = “Watson”)</sub>(*department*)
> 
> c. σ<sub>¬(building < “Watson” ∨ budget < 50000)</sub>(*department*)

**PE 16.7** — department có B⁺-tree trên building. Cách tốt nhất cho (a) ¬(building < Watson), (b) ¬(building = Watson), (c) ¬(building < Watson ∨ budget < 50000)?

<details><summary>Gợi ý đáp án</summary>

a. ≡ building ≥ 'Watson': dùng index tìm entry đầu tiên ≥ 'Watson' rồi duyệt lá tới cuối (nếu ít tuple thoả); ngược lại linear scan.

b. ≡ building ≠ 'Watson': gần như mọi tuple thoả → **linear scan**, index vô dụng.

c. Theo De Morgan ≡ **building ≥ 'Watson' ∧ budget ≥ 50000**: dùng index lấy các tuple building ≥ 'Watson' rồi kiểm tra budget ≥ 50000 trên từng tuple (lời giải sách in "budget < 5000" là lỗi gõ). Nếu điều kiện building không chọn lọc thì linear scan.

</details>

**Câu 8.** 

> **Exercise 16.8.** Consider the query
> 
> ```sql
> select *
> from r, s
> where upper(r.A) = upper(s.A);
> ```
> 
> where *upper* returns its argument with every lowercase letter replaced by the corresponding uppercase letter.
> 
> a. Find out which plan your database system generates for this query.
> 
> b. Some database systems evaluate this query with a (block) nested-loop join, which can be very slow. Briefly explain how a hash join or a merge join could be used instead.

**PE 16.8** — Truy vấn join trên `upper(r.A) = upper(s.A)`: plan của hệ thống bạn dùng là gì, và làm sao dùng hash join hoặc merge join?

<details><summary>Gợi ý đáp án</summary>

a. Tạo r, s và ít dữ liệu rồi `explain`. PostgreSQL chọn **Hash Join** với Hash Cond: upper(r.a) = upper(s.a) (hoặc Merge Join sau khi Sort theo upper(...)) — vì điều kiện vẫn là phép **bằng** giữa hai biểu thức, mỗi biểu thức chỉ phụ thuộc một bảng. So với `r.A = s.A`: plan có thể giống nhưng **ước lượng số dòng** khác hẳn, vì không có thống kê cho upper(A) (trừ khi tạo expression index rồi analyze).

b. Hash join: áp dụng upper() lên giá trị **trước khi băm** — chia partition và dựng hash table theo upper(r.A), probe bằng upper(s.A). Merge join: sắp hai bảng theo upper(A) rồi merge bình thường. Thuật toán không đổi, chỉ thay khoá join bằng biểu thức. Thêm expression index `create index on s (upper(A))` cho phép indexed nested-loop join và cho optimizer thống kê đúng (CH16.17–CH16.18).

</details>

**Câu 9.** 

> **Exercise 16.9.** State conditions under which the expressions
> 
> <sub>A,B</sub>γ<sub>agg(C)</sub>(E<sub>1</sub> ⋈ E<sub>2</sub>) and (<sub>A</sub>γ<sub>agg(C)</sub>(E<sub>1</sub>)) ⋈ E<sub>2</sub>
> 
> are equivalent, where agg is any aggregation operation. How can these conditions be relaxed when agg is min or max?

**PE 16.9** — Khi nào <sub>A,B</sub>γ<sub>agg(C)</sub>(E₁ ⋈ E₂) ≡ (<sub>A</sub>γ<sub>agg(C)</sub>(E₁)) ⋈ E₂? Nới lỏng thế nào với min/max?

<details><summary>Gợi ý đáp án</summary>

Tương đương khi **E₂ chỉ gồm các thuộc tính A và B, với A là khoá của E₂** (không có hai tuple E₂ cùng A). Khi đó mỗi tuple E₁ khớp tối đa một tuple E₂ nên nhóm theo (A, B) ở vế trái chính là nhóm theo A, và aggregate không bị đếm lặp. Giá trị A có ở E₁ mà không có ở E₂ bị loại ở cả hai vế, không sao.

Nếu E₂ có hai tuple **trùng cả (A, B)**, ví dụ (1, x) hai lần: join nhân đôi mọi tuple E₁ có A = 1, nên vế trái (một nhóm (1, x)) có sum, count gấp đôi; vế phải aggregate trên E₁ trước (tổng đúng) rồi join ra **hai** dòng (1, x, tổng). Nếu A trùng nhưng B khác ((1, x), (1, y)) thì mỗi nhóm (A, B) vẫn nhận đủ các tuple E₁ của A nên sum/count hai vế tình cờ bằng nhau — nhưng điều kiện an toàn tổng quát là A là khoá của E₂.

Với **min/max**: trùng lặp không làm đổi giá trị min/max, nên chỉ cần **không có tuple trùng trên (A, B)** trong E₂ (vế trái loại trùng nhờ group by, vế phải thì không) — A không cần là khoá. CH16.19 yêu cầu dựng instance cho thấy hai vế khác nhau với sum.

</details>

**Câu 10.** 

> **Exercise 16.10.** Consider interesting orders in query optimization. A query computes the natural join of a set S of relations. For a subset S1 of S, which orders of S1 are interesting?

**PE 16.10** — Truy vấn natural join tập S; với tập con S1 ⊆ S, các thứ tự (sort order) nào của S1 là interesting?

<details><summary>Gợi ý đáp án</summary>

Interesting order là thứ tự có thể có ích cho các phép **phía trên**. Với natural join, chỉ các join tiếp theo dùng được thứ tự. Đặt T = tập thuộc tính của S1 **cũng xuất hiện trong một quan hệ nào đó thuộc S − S1** (các thuộc tính có thể tham gia điều kiện join sau này). Khi đó **mọi thứ tự trên mọi tập con của T** đều là interesting order. (Nếu truy vấn có order by / group by thì thêm thứ tự trên các thuộc tính đó.)

</details>

**Câu 11.** 

> **Exercise 16.11.** Change the function *FindBestPlan*(S) into a function *FindBestPlan*(S, O), where O is a required sort order for S, so that interesting sort orders are taken into account. A null order means the order does not matter. Hints: an algorithm A may already produce the order O; if it does not, a sort operation may have to be added. If A is a merge join, *FindBestPlan* must be called on the two inputs with the orders those inputs need.

**PE 16.11** — Sửa FindBestPlan(S) thành FindBestPlan(S, O) có xét sort order O.

<details><summary>Gợi ý đáp án</summary>

Lưu plan tốt nhất theo cặp (S, O) thay vì chỉ S.

```
procedure FindBestPlan(S, O)
  if bestplan[S, O].cost ≠ ∞ then return bestplan[S, O]
  if S chỉ có một quan hệ r:
     với mỗi cách truy cập r (scan, các index): nếu cách đó cho thứ tự O (hoặc O = null)
        cost = chi phí truy cập; nếu không thì cost = chi phí truy cập + chi phí sort theo O
     lấy cách rẻ nhất → bestplan[S, O]
  else:
     for each tập con khác rỗng S1 ⊂ S, S1 ≠ S:
        for each thuật toán join A cho S1 ⋈ (S − S1):
           if A là merge join trên thuộc tính J:
              p1 = FindBestPlan(S1, J); p2 = FindBestPlan(S − S1, J)
           else:
              p1 = FindBestPlan(S1, null); p2 = FindBestPlan(S − S1, null)
           cost = p1.cost + p2.cost + chi phí A
           if A không cho kết quả theo thứ tự O (và O ≠ null): cost += chi phí sort theo O
           if cost < bestplan[S, O].cost: ghi nhận (p1, p2, A, có thêm sort hay không)
  return bestplan[S, O]
```
Gọi ở mức ngoài cùng với O = thứ tự của order by (hoặc null). Có thể giới hạn O ở các interesting order (PE 16.10) để bảng ghi nhớ không quá lớn.

</details>

**Câu 12.** 

> **Exercise 16.12.** Show that n relations have (2(n − 1))!/(n − 1)! different join orders.
> 
> Hint: a *complete binary tree* is one in which every internal node has exactly two children. Use the fact that the number of different complete binary trees with n leaf nodes is (1/n)·C(2(n − 1), n − 1), where C denotes the binomial coefficient. If you like, derive this from the number of binary trees with n nodes, which is (1/(n + 1))·C(2n, n) — the Catalan number, derived in standard data-structures or algorithms textbooks.

**PE 16.12** — Chứng minh n quan hệ có (2(n − 1))!/(n − 1)! thứ tự join.

<details><summary>Gợi ý đáp án</summary>

Mỗi thứ tự join là một **cây nhị phân đầy đủ** (mọi nút trong có đúng hai con) với n lá là n quan hệ (có thứ tự trái/phải vì cây con trái, phải là hai input khác nhau).

- Cây nhị phân đầy đủ có n lá thì có n − 1 nút trong. Bỏ hết lá được một cây nhị phân (bất kỳ) n − 1 nút; ngược lại từ cây nhị phân n − 1 nút, thêm lá vào mọi chỗ trống được duy nhất một cây đầy đủ n lá. Đây là song ánh, nên số **hình dạng** cây = số cây nhị phân n − 1 nút = số Catalan C<sub>n−1</sub> = (1/n)·C(2(n − 1), n − 1).
- Gán n quan hệ vào n lá: n! cách.

Tổng: n! · (1/n) · (2(n−1))! / ((n−1)! (n−1)!) = (n−1)! · (2(n−1))! / ((n−1)!)² = **(2(n − 1))! / (n − 1)!**. Ví dụ n = 3: 4!/2! = 12; n = 7: 12!/6! = 665 280 (CH16.12).

</details>

**Câu 13.** 

> **Exercise 16.13.** Show that the cheapest join order can be found in O(3<sup>n</sup>) time. Assume that information about a set of relations (such as its optimal join order and the cost of that order) can be stored and retrieved in constant time. (If this is too hard, at least show the weaker bound O(2<sup>2n</sup>).)

**PE 16.13** — Chứng minh thứ tự join rẻ nhất tìm được trong O(3ⁿ).

<details><summary>Gợi ý đáp án</summary>

Dynamic programming: với mỗi tập con S của n quan hệ (tính theo kích thước tăng dần), plan tốt nhất của S = min trên mọi cách chia S thành S1 và S − S1 (S1 ≠ ∅, S1 ≠ S) của bestplan(S1) + bestplan(S − S1) + chi phí join. Tra/ghi bestplan tốn O(1).

Tập S có k phần tử có 2ᵏ − 2 cách chọn S1, mỗi cách O(1). Tổng thời gian:

Σ<sub>k=1..n</sub> C(n, k) · 2ᵏ ≤ Σ<sub>k=0..n</sub> C(n, k) · 2ᵏ · 1<sup>n−k</sup> = (1 + 2)ⁿ = **3ⁿ** (khai triển nhị thức).

Cận lỏng O(2²ⁿ): có 2ⁿ tập S, mỗi tập xét không quá 2ⁿ tập con S1 → 2ⁿ · 2ⁿ = 2²ⁿ = 4ⁿ.

</details>

**Câu 14.** 

> **Exercise 16.14.** Show that if only left-deep join trees are considered, as in the System R optimizer, finding the most efficient join order takes time about n·2<sup>n</sup>. Assume there is only one interesting sort order.

**PE 16.14** — Chỉ xét left-deep join tree: chứng minh thời gian tìm thứ tự tốt nhất khoảng n·2ⁿ.

<details><summary>Gợi ý đáp án</summary>

Với left-deep tree, vế phải của phép join trên cùng phải là **một** quan hệ, nên với tập S có k phần tử chỉ có k cách chia (S − {r}, {r}) thay vì 2ᵏ − 2. Tổng thời gian:

Σ<sub>k=1..n</sub> C(n, k) · k = n · Σ<sub>k=1..n</sub> C(n − 1, k − 1) = n · 2<sup>n−1</sup> (dùng k·C(n, k) = n·C(n−1, k−1) và Σ C(n−1, j) = 2<sup>n−1</sup>).

Vậy khoảng **n·2ⁿ** (với một interesting order; mỗi order thêm nhân một hằng số). Ví dụ n = 10: 10 · 512 = 5120 bước, so với 3¹⁰ = 59 049 của cây bất kỳ và 10! = 3 628 800 nếu liệt kê mọi left-deep order.

</details>

**Câu 15.** 

> **Exercise 16.15.** Using the bank database of Figure 16.9 (primary keys underlined), write the following:
> 
> a. A nested query on relation *account* that finds, for every branch whose name begins with “B”, all accounts having the maximum balance at that branch.
> 
> b. The same query rewritten without a nested subquery — that is, decorrelated, but still in SQL.
> 
> c. A relational-algebra expression, using semijoin, equivalent to the query.
> 
> d. A procedure (similar to the one in Section 16.4.4) for decorrelating queries of this kind.
> 
> *Figure 16.9 — Banking database* (primary keys underlined):
> 
> - branch (<u>branch_name</u>, branch_city, assets)
> - customer (<u>customer_name</u>, customer_street, customer_city)
> - loan (<u>loan_number</u>, branch_name, amount)
> - borrower (<u>customer_name, loan_number</u>)
> - account (<u>account_number</u>, branch_name, balance)
> - depositor (<u>customer_name, account_number</u>)

**PE 16.15** — Bank database: (a) truy vấn lồng tìm account có balance lớn nhất ở mỗi branch tên bắt đầu bằng B; (b) khử tương quan bằng SQL; (c) biểu thức đại số dùng semijoin; (d) thủ tục khử tương quan tổng quát.

<details><summary>Gợi ý đáp án</summary>

a.
```sql
select S.account_number
from account S
where S.branch_name like 'B%'
  and S.balance = (select max(T.balance) from account T where T.branch_name = S.branch_name);
```
b.
```sql
with t1 (branch_name, max_balance) as (
  select branch_name, max(balance) from account group by branch_name)
select account_number
from account join t1 using (branch_name)
where account.branch_name like 'B%' and account.balance = t1.max_balance;
```
(Tốt hơn: đưa `where branch_name like 'B%'` vào t1 để chỉ aggregate các branch cần.)

c. Đặt t1 = <sub>branch_name</sub>γ<sub>max(balance) as max_balance</sub>(σ<sub>branch_name like 'B%'</sub>(account)). Khi đó

Π<sub>account_number</sub>( σ<sub>branch_name like 'B%'</sub>(account) ⋉<sub>account.branch_name = t1.branch_name ∧ account.balance = t1.max_balance</sub> t1 )

Semijoin giữ mỗi account đúng một lần, kể cả khi nhiều account cùng đạt max.

d. Truy vấn dạng
```
select … from L1 where P1 and A1 op (select f(A2) from L2 where P2)
```
với P2 chứa các điều kiện tương quan (dùng biến của L1):
1. Tách P2 = P2¹ ∧ P2², P2¹ chỉ dùng biến của L2, P2² là các điều kiện tương quan dạng (L2.X = L1.Y). Gọi V là tập thuộc tính của L2 xuất hiện trong P2².
2. Tạo t1 = `select V, f(A2) as fa from L2 where P2¹ group by V` (đại số: <sub>V</sub>γ<sub>f(A2)</sub>(σ<sub>P2¹</sub>(L2))).
3. Viết lại: `select … from L1, t1 where P1 and P2²[L2.V → t1.V] and A1 op t1.fa` — hoặc dùng semijoin L1 ⋉<sub>P2² ∧ A1 op fa</sub> t1 để không nhân dòng.
Chú ý: với f = count, nhóm rỗng trong truy vấn lồng cho 0 nhưng không có dòng trong t1 — phải dùng outer join và coalesce(fa, 0).

CH16.14–CH16.15 chạy câu a và b trên `qp_account`.

</details>

## 4. Bài tập SQL (20 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH16.01 | PE 16.3a phản ví dụ | ★★☆ | Exercise 16.3 (a). For each pair of expressions below, give relation instances showing that the two expressions are not equivalent.  a. Π[A](r − s) and Π[A](r) − Π[A](s).<br>Tạo hai bảng `qp_x_r(a int, b int)`, `qp_x_s(a int, b int)` và chèn dữ liệu sao cho Π[A](r − s) khác Π[A](r) − Π[A](s). Hệ thống tính hai vế (dùng `except`) và trả về `differ`. |
| CH16.02 | PE 16.3b phản ví dụ | ★★☆ | Exercise 16.3 (b). For each pair of expressions below, give relation instances showing that the two expressions are not equivalent.  b. σ[B<4]([A]γ[max(B) as B](r)) and [A]γ[max(B) as B](σ[B<4](r)).<br>Tạo `qp_x_m(a int, b int)` với dữ liệu sao cho σ[B<4]([A]γ[max(B) as B](r)) khác [A]γ[max(B) as B](σ[B<4](r)). Hệ thống so sánh hai vế và trả về `differ`. |
| CH16.03 | PE 16.3d right outer join | ★★★ | Exercise 16.3 (d). For each pair of expressions below, give relation instances showing that the two expressions are not equivalent.  d. (r ⟖ s) ⟖ t and r ⟖ (s ⟖ t). In other words, the natural right outer join is not associative.<br>Tạo `qp_x_r(a int, b int)`, `qp_x_s(b int, c int)`, `qp_x_t(a int, d int)` và chèn dữ liệu sao cho `(qp_x_r natural right join qp_x_s) natural right join qp_x_t` khác `qp_x_r natural right join (qp_x_s natural right join qp_x_t)` (so sánh trên các cột a, b, c, d). Hệ thống trả về `differ`. |
| CH16.04 | PE 16.3e selection & outer join | ★★☆ | Exercise 16.3 (e). For each pair of expressions below, give relation instances showing that the two expressions are not equivalent.  e. σ[θ](E[1] ⟕ E[2]) and E[1] ⟕ σ[θ](E[2]), where θ uses only attributes of E[2].<br>Tạo `qp_x_e1(a int, b int)`, `qp_x_e2(a int, c int)` với dữ liệu sao cho σ[c = 1](E₁ ⟕ E₂) khác E₁ ⟕ σ[c = 1](E₂) (natural left join trên a). Hệ thống trả về `differ`. |
| CH16.05 | PE 16.3c min vs max | ★★☆ | Exercise 16.3 (b, c). For each pair of expressions below, give relation instances showing that the two expressions are not equivalent.  b. σ[B<4]([A]γ[max(B) as B](r)) and [A]γ[max(B) as B](σ[B<4](r)).  c. If both occurrences of max in the previous expressions were replaced by min, would the expressions be equivalent?<br>Trên `qp_emp(id, dept, salary)` với ngưỡng 30000: so sánh "aggregate rồi lọc" với "lọc rồi aggregate" theo dept. Trả về một dòng hai cột boolean: - `min_same`: `select dept, min(salary) … group by dept having min(salary) < 30000` có cùng kết quả với `… where salary < 30000 group by dept` không; - `max_same`: câu hỏi tương tự với max. |
| CH16.06 | PE 16.2b having → where | ★☆☆ | Exercise 16.2 (b). Prove the following equivalences, and explain how each can be used to make certain queries more efficient:  b. σ[θ]([A]γ[F](E)) ≡ [A]γ[F](σ[θ](E)), where θ uses only attributes of A.<br>Truy vấn sau tính lương trung bình mọi khoa rồi mới lọc: ```sql select dept_name, avg(salary) from instructor group by dept_name having dept_name in ('Comp. Sci.', 'Physics', 'Finance'); ``` Viết lại theo luật PE 16.2b: lọc trước khi aggregate (không dùng having). Trả về dept_name, avg_salary (làm tròn 2 chữ số). |
| CH16.07 | PE 16.6 ước lượng join | ★★☆ | Exercise 16.6. Take the relations r[1](A, B, C), r[2](C, D, E), and r[3](E, F) of Practice Exercise 16.5, but assume now that the only primary key of each relation is its whole schema. Let V(C, r[1]) = 900, V(C, r[2]) = 1100, V(E, r[2]) = 50, and V(E, r[3]) = 100, with r[1] having 1000 tuples, r[2] 1500 tuples, and r[3] 750 tuples. Estimate the size of r[1] ⋈ r[2] ⋈ r[3] and give an efficient strategy for computing the join.<br>Bảng `qp_card(rel, n)` và `qp_vstats(rel, attr, v)` chứa số liệu PE 16.6. Tính: - `est_r1_r2` = n[r1] · n[r2] / max(V(C, r1), V(C, r2)), làm tròn 1 chữ số; - `est_all` = est_r1_r2 (chưa làm tròn) · n[r3] / max(V(E, r2), V(E, r3)), làm tròn tới số nguyên. |
| CH16.08 | PE 16.6 chọn join đầu tiên | ★★☆ | Exercise 16.6. Take the relations r[1](A, B, C), r[2](C, D, E), and r[3](E, F) of Practice Exercise 16.5, but assume now that the only primary key of each relation is its whole schema. Let V(C, r[1]) = 900, V(C, r[2]) = 1100, V(E, r[2]) = 50, and V(E, r[3]) = 100, with r[1] having 1000 tuples, r[2] 1500 tuples, and r[3] 750 tuples. Estimate the size of r[1] ⋈ r[2] ⋈ r[3] and give an efficient strategy for computing the join.<br>Vẫn số liệu PE 16.6. Ước lượng kích thước kết quả trung gian cho ba cách chọn cặp join đầu tiên: `r1⋈r2` (trên C), `r2⋈r3` (trên E), `r1⋈r3` (không có thuộc tính chung → tích Descartes). Trả về `pair` (đúng ba chuỗi trên) và `est` (làm tròn tới số nguyên), sắp theo est tăng dần. |
| CH16.09 | ước lượng σ A ≤ v | ★★☆ | Ước lượng số instructor có salary ≤ 70000 bằng công thức n[r] · (v − min) / (max − min) (min, max, n[r] lấy từ bảng instructor), rồi so với số thực tế. Trả về `estimate` (làm tròn 2 chữ số) và `actual`. |
| CH16.10 | histogram equi-width | ★★☆ | Dựng histogram equi-width 4 bucket cho `qp_emp.salary` trên khoảng [20000, 100000) (mỗi bucket rộng 20000). Trả về `bucket` (1–4), `lo`, `hi` (biên dưới, biên trên của bucket) và `cnt`, sắp theo bucket. |
| CH16.11 | ước lượng bằng histogram | ★★★ | Dùng histogram của CH16.10 (giả sử phân bố đều trong mỗi bucket) để ước lượng số nhân viên có salary < 45000: toàn bộ bucket [20000, 40000) cộng với phần (45000 − 40000)/20000 của bucket [40000, 60000). Trả về `estimate` (làm tròn 1 chữ số) và `actual`. |
| CH16.12 | PE 16.12 số thứ tự join | ★☆☆ | Exercise 16.12. Show that n relations have (2(n − 1))!/(n − 1)! different join orders.  Hint: a *complete binary tree* is one in which every internal node has exactly two children. Use the fact that the number of different complete binary trees with n leaf nodes is (1/n)·C(2(n − 1), n − 1), where C denotes the binomial coefficient. If you like, derive this from the number of binary trees with n nodes, which is (1/(n + 1))·C(2n, n) — the Catalan number, derived in standard data-structures or algorithms textbooks.<br>Với n = 1 … 8, trả về `n`, `all_orders` = (2(n − 1))! / (n − 1)! (mọi cây join) và `left_deep` = n! (chỉ left-deep), kiểu số nguyên, sắp theo n. |
| CH16.13 | thứ tự join left-deep tốt nhất | ★★★ | `qp_jrel(id, name, n)`: 4 quan hệ A, B, C, D (id 0–3). `qp_jpred(r1, r2, sel)`: điều kiện join giữa hai quan hệ và selectivity (cặp không có trong bảng là tích Descartes, sel = 1). Liệt kê mọi left-deep order (thứ tự thêm quan hệ, ví dụ `'B C D A'`). Khi thêm quan hệ R vào kết quả hiện có kích thước s: kích thước mới = s · n[R] · tích các sel của điều kiện nối R với các quan hệ đã có. Chi phí của một order = tổng kích thước mọi kết quả join (kể cả kết quả cuối).  Trả về `best_cost` (chi phí nhỏ nhất, làm tròn số nguyên) và `orders`: các order đạt chi phí đó, nối bằng `', '` theo thứ tự chữ cái. |
| CH16.14 | PE 16.15a truy vấn lồng | ★★☆ | Exercise 16.15 (a). Using the bank database of Figure 16.9 (primary keys underlined), write the following:  a. A nested query on relation *account* that finds, for every branch whose name begins with “B”, all accounts having the maximum balance at that branch.  *Figure 16.9 — Banking database* (primary keys underlined):  - branch (branch_name, branch_city, assets) - customer (customer_name, customer_street, customer_city) - loan (loan_number, branch_name, amount) - borrower (customer_name, loan_number) - account (account_number, branch_name, balance) - depositor (customer_name, account_number)<br>Trên `qp_account(account_number, branch_name, balance)`: viết truy vấn lồng có tương quan tìm, với mỗi branch có tên bắt đầu bằng `B`, mọi account có balance lớn nhất ở branch đó. Trả về account_number, branch_name. |
| CH16.15 | PE 16.15b khử tương quan | ★★☆ | Exercise 16.15 (b). Using the bank database of Figure 16.9 (primary keys underlined), write the following:  b. The same query rewritten without a nested subquery — that is, decorrelated, but still in SQL.  *Figure 16.9 — Banking database* (primary keys underlined):  - branch (branch_name, branch_city, assets) - customer (customer_name, customer_street, customer_city) - loan (loan_number, branch_name, amount) - borrower (customer_name, loan_number) - account (account_number, branch_name, balance) - depositor (customer_name, account_number)<br>Viết lại CH16.14 không có subquery tương quan: tính max balance của mỗi branch một lần (with hoặc derived table + group by) rồi join. Trả về account_number, branch_name. |
| CH16.16 | not exists → anti-join | ★★☆ | Tìm các branch không có account nào, viết bằng left outer join … is null (anti-join) thay cho `not exists`. Trả về branch_name, branch_city. |
| CH16.17 | PE 16.8 join trên upper() | ★☆☆ | Exercise 16.8. Consider the query  ```sql select * from r, s where upper(r.A) = upper(s.A); ```  where *upper* returns its argument with every lowercase letter replaced by the corresponding uppercase letter.  a. Find out which plan your database system generates for this query.  b. Some database systems evaluate this query with a (block) nested-loop join, which can be very slow. Briefly explain how a hash join or a merge join could be used instead.<br>Join `qp_names_r(id, name)` với `qp_names_s(code, name)` theo tên không phân biệt hoa thường (dùng upper). Trả về id, r_name, code. |
| CH16.18 | expression index | ★★☆ | Exercise 16.8. Consider the query  ```sql select * from r, s where upper(r.A) = upper(s.A); ```  where *upper* returns its argument with every lowercase letter replaced by the corresponding uppercase letter.  a. Find out which plan your database system generates for this query.  b. Some database systems evaluate this query with a (block) nested-loop join, which can be very slow. Briefly explain how a hash join or a merge join could be used instead.<br>Tạo expression index trên `qp_names_s` theo `upper(name)` để join của CH16.17 dùng được index (indexed nested-loop) và optimizer có thống kê. Hệ thống kiểm tra trong `pg_indexes` có index của qp_names_s mà định nghĩa chứa `upper`. |
| CH16.19 | PE 16.9 đẩy aggregate qua join | ★★★ | Exercise 16.9. State conditions under which the expressions  [A,B]γ[agg(C)](E[1] ⋈ E[2]) and ([A]γ[agg(C)](E[1])) ⋈ E[2]  are equivalent, where agg is any aggregation operation. How can these conditions be relaxed when agg is min or max?<br>Tạo `qp_x_e1(a int, c int)` và `qp_x_e2(a int, b text)` với dữ liệu sao cho [A,B]γ[sum(C)](E₁ ⋈ E₂) khác ([A]γ[sum(C)](E₁)) ⋈ E₂ (natural join trên a; so sánh trên các cột a, b, tổng). Hệ thống trả về `differ`. |
| CH16.20 | bảo trì materialized view | ★★★ | Hiện thực một materialized view được bảo trì incremental (immediate, bằng trigger): 1. Tạo bảng `qp_branch_total(branch_name varchar(20) primary key, total numeric(12,2), num_accounts integer)` và nạp sẵn tổng balance, số account của mỗi branch từ `qp_account` (chỉ các branch có account). 2. Tạo trigger after insert trên `qp_account` (for each row, plpgsql) cộng balance và tăng num_accounts cho branch tương ứng — nếu branch chưa có trong qp_branch_total thì thêm dòng mới.  Hệ thống chèn hai account (`('A-900', 'Austin', 100)`, `('A-901', 'Brighton', 50)`) rồi đọc qp_branch_total. |
