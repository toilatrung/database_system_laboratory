export default {
  number: 16,
  slug: 'ch16_query_optimization',
  title: 'Query Optimization',
  titleVi: 'Tối ưu truy vấn',

  summary: `
### 1. Tối ưu truy vấn là gì (slide 16.2–16.6)
Một truy vấn có nhiều **evaluation plan** tương đương — khác nhau ở biểu thức đại số (thứ tự join, vị trí selection…) và thuật toán cho từng phép toán. Chi phí giữa các plan có thể chênh **nhiều bậc độ lớn**. **Cost-based optimization** gồm ba bước:
1. Sinh các biểu thức tương đương bằng **luật tương đương**.
2. Gắn thuật toán cho từng phép toán để được các plan.
3. **Ước lượng chi phí** mỗi plan (dựa vào thống kê) và chọn plan rẻ nhất.

PostgreSQL: \`explain <query>\` cho plan + chi phí ước lượng, \`explain analyze\` chạy thật và in thời gian/số dòng thực tế.

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
12. Aggregation: σ<sub>θ</sub>(<sub>A</sub>γ<sub>F</sub>(E)) ≡ <sub>A</sub>γ<sub>F</sub>(σ<sub>θ</sub>(E)) khi θ chỉ dùng thuộc tính nhóm A (PE 16.2b) — tức chuyển \`having\` trên cột nhóm thành \`where\`.
13. Outer join: **không giao hoán/kết hợp tuỳ ý**. σ<sub>θ</sub>(E₁ ⟕ E₂) ≡ σ<sub>θ</sub>(E₁) ⟕ E₂ khi θ chỉ dùng thuộc tính E₁ (PE 16.2c); nhưng đẩy θ trên E₂ xuống E₂ thì **sai** (PE 16.3e). Khi θ loại bỏ null của E₂ (null-rejecting), σ<sub>θ</sub>(E₁ ⟕ E₂) ≡ σ<sub>θ</sub>(E₁ ⋈ E₂).

Ví dụ kinh điển (slide 16.15): \`Π name, title (σ dept_name='Music' ∧ year=2017 (instructor ⋈ (teaches ⋈ course)))\` → đẩy σ dept_name xuống instructor, σ year xuống teaches, và join instructor với teaches **trước** vì kết quả nhỏ.

Thuật toán sinh mọi biểu thức tương đương tốn rất nhiều bộ nhớ → dùng **chia sẻ biểu thức con** và các heuristic.

### 3. Thống kê và ước lượng kích thước (slide 16.21–16.40)
Catalog lưu: **n<sub>r</sub>** (số tuple), **b<sub>r</sub>** (số block), **l<sub>r</sub>** (kích thước tuple), **f<sub>r</sub>** (blocking factor), **V(A, r)** (số giá trị khác nhau của A = kích thước Π<sub>A</sub>(r)), và **histogram**.
- **Histogram equi-width**: chia miền giá trị thành các khoảng đều nhau, lưu số tuple mỗi khoảng. **Equi-depth**: mỗi bucket cùng số tuple, lưu biên. Giả sử phân bố đều **trong** mỗi bucket. PostgreSQL lưu equi-depth histogram + danh sách giá trị phổ biến nhất (most common values) trong \`pg_stats\`.

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
- **Decorrelation**: viết lại thành join. \`exists\` → **semijoin** (⋉), \`not exists\` → **anti-semijoin**; subquery có aggregate (ví dụ so với max theo nhóm) → tính aggregate **một lần** bằng \`group by\` (bảng tạm/derived table) rồi join (PE 16.15).
- Ví dụ:
\`\`\`sql
-- lồng, có tương quan
select name from instructor
where exists (select * from teaches where teaches.ID = instructor.ID and teaches.year = 2019);
-- khử tương quan: semijoin
select name from instructor
where ID in (select ID from teaches where year = 2019);   -- PostgreSQL chạy bằng Hash Semi Join
\`\`\`
- Cẩn thận \`not in\` với null; \`not exists\` ⇔ anti-semijoin luôn đúng.

### 6. Materialized view (slide 16.65–16.75)
- **Materialized view**: kết quả view được tính và **lưu**; truy vấn đọc thẳng, nhưng phải **bảo trì** khi bảng gốc đổi.
- **Incremental view maintenance**: tính phần thay đổi (differential) thay vì tính lại toàn bộ. Với v = r ⋈ s, chèn i<sub>r</sub> vào r: v<sup>new</sup> = v<sup>old</sup> ∪ (i<sub>r</sub> ⋈ s); xoá d<sub>r</sub>: v<sup>new</sup> = v<sup>old</sup> − (d<sub>r</sub> ⋈ s).
- Selection/projection: projection cần **đếm số lần** mỗi tuple được suy ra (count) để biết khi nào xoá. Aggregate: count, sum bảo trì được bằng cộng/trừ; avg = sum/count; min/max khi xoá đúng giá trị min/max phải tính lại từ nhóm.
- **Immediate** (cùng giao dịch, bằng trigger) vs **deferred** (định kỳ, \`refresh materialized view\` trong PostgreSQL — PostgreSQL không tự bảo trì incremental).
- **Query optimization với materialized view**: viết lại truy vấn để dùng view đã có (view matching), hoặc ngược lại thay view bằng định nghĩa nếu rẻ hơn; **chọn view nên materialize** dựa trên workload.

### 7. Các kỹ thuật nâng cao (slide 16.76+)
- **Top-K optimization** (\`order by … limit K\`), **join minimization** (bỏ join thừa qua foreign key), **halloween problem** khi update dùng index trên chính cột bị update, **multiquery optimization** (chia sẻ biểu thức con giữa nhiều truy vấn), **parametric/adaptive optimization**.

### Công thức hay thi
| Câu hỏi | Trả lời |
|---|---|
| σ<sub>A=v</sub> | n<sub>r</sub> / V(A, r) |
| σ<sub>A≤v</sub> | n<sub>r</sub>(v − min)/(max − min) |
| r ⋈ s trên A, không khoá | n<sub>r</sub>n<sub>s</sub> / max(V(A, r), V(A, s)) |
| r ⋈ s, A là khoá của r, FK từ s | n<sub>s</sub> |
| Số cây join | (2(n−1))!/(n−1)! ; left-deep: n! |
| DP tìm thứ tự join | O(3ⁿ); left-deep O(n2ⁿ) |
`,

  quiz: [
    {
      q: 'Hai biểu thức đại số được gọi là tương đương khi nào?',
      options: ['Cho cùng kết quả trên dữ liệu hiện tại', 'Cho cùng kết quả trên mọi instance hợp lệ', 'Có cùng chi phí', 'Dùng cùng các bảng'],
      answer: 1,
      explain: 'Tương đương phải đúng với mọi instance hợp lệ, không chỉ dữ liệu hiện có.',
    },
    {
      q: 'σ<sub>θ</sub>(E₁ ⟕ E₂) ≡ E₁ ⟕ σ<sub>θ</sub>(E₂) đúng không, với θ chỉ dùng thuộc tính của E₂?',
      options: ['Luôn đúng', 'Sai — vế phải giữ tuple E₁ không khớp với null, vế trái có thể loại chúng', 'Chỉ đúng khi E₂ rỗng', 'Đúng với natural join'],
      answer: 1,
      explain: 'PE 16.3e. Đẩy selection xuống chỉ an toàn ở phía được bảo toàn (E₁).',
    },
    {
      q: 'Đẩy `having dept_name = \'Physics\'` thành `where` trước `group by dept_name` có đúng không?',
      options: ['Có, vì điều kiện chỉ dùng thuộc tính nhóm', 'Không bao giờ', 'Chỉ khi có index', 'Chỉ với count'],
      answer: 0,
      explain: 'PE 16.2b: σ_θ(Aγ_F(E)) ≡ Aγ_F(σ_θ(E)) khi θ chỉ dùng thuộc tính của A.',
    },
    {
      q: 'n<sub>r</sub> = 10 000, V(A, r) = 50. Ước lượng kích thước σ<sub>A=v</sub>(r)?',
      options: ['50', '200', '10 000', '1'],
      answer: 1,
      explain: 'n_r / V(A, r) = 10000 / 50.',
    },
    {
      q: 'r ⋈ s trên A; n<sub>r</sub> = 1000, n<sub>s</sub> = 2000, V(A, r) = 100, V(A, s) = 400; A không là khoá. Ước lượng?',
      options: ['5 000', '20 000', '2 000 000', '2 000'],
      answer: 0,
      explain: 'n_r·n_s / max(V) = 2 000 000 / 400 = 5 000.',
    },
    {
      q: 'takes ⋈ student trên ID (ID là khoá của student, takes.ID là foreign key not null). Kích thước kết quả?',
      options: ['n_student', 'n_takes', 'n_takes · n_student', 'n_student / V(ID, takes)'],
      answer: 1,
      explain: 'Mỗi tuple takes khớp đúng một student.',
    },
    {
      q: 'Có bao nhiêu thứ tự join (cây join bất kỳ) cho 4 quan hệ?',
      options: ['24', '120', '12', '6'],
      answer: 1,
      explain: '(2(n−1))!/(n−1)! = 6!/3! = 120; left-deep chỉ 4! = 24.',
    },
    {
      q: 'Thuật toán dynamic programming tìm thứ tự join tối ưu (cây bất kỳ) chạy trong thời gian nào?',
      options: ['O(n!)', 'O(3ⁿ)', 'O(n²)', 'O(2ⁿ)'],
      answer: 1,
      explain: 'Mỗi tập con S xét mọi cách chia thành S₁, S − S₁; tổng Σ C(n,k)·2ᵏ = 3ⁿ (PE 16.13).',
    },
    {
      q: 'Vì sao optimizer có thể chọn merge join dù hash join rẻ hơn cho riêng phép join đó?',
      options: ['Merge join dùng ít bộ nhớ', 'Kết quả đã sắp (interesting order) giúp phép phía trên rẻ hơn', 'Hash join không hỗ trợ equi-join', 'Merge join không cần sort'],
      answer: 1,
      explain: 'Ví dụ phép trên là order by / group by / merge join khác trên cùng thuộc tính.',
    },
    {
      q: 'Khử tương quan `where exists (select … where s.A = r.A)` cho ra phép toán nào?',
      options: ['Natural join', 'Semijoin', 'Anti-semijoin', 'Outer join'],
      answer: 1,
      explain: 'exists → semijoin (giữ tuple r một lần); not exists → anti-semijoin.',
    },
    {
      q: 'Materialized view v = sum(amount) group by branch. Khi xoá một tuple, cập nhật incremental thế nào?',
      options: ['Phải tính lại toàn bộ', 'Trừ amount khỏi tổng của nhóm (giảm count, xoá nhóm khi count = 0)', 'Không cần làm gì', 'Xoá cả nhóm'],
      answer: 1,
      explain: 'sum và count bảo trì được bằng cộng/trừ; min/max mới có thể phải tính lại.',
    },
  ],

  questions: [
    {
      pe: '16.1',
      q: '**PE 16.1** — Dùng `explain` để xem plan trong các trường hợp (a)–(i). Viết truy vấn mẫu cho từng trường hợp trên PostgreSQL và cho biết plan thường thấy.',
      answer: `Kết quả phụ thuộc hệ quản trị và dữ liệu; dưới đây là truy vấn mẫu và plan PostgreSQL thường chọn trên large university dataset (chạy được ở tab SQL với dữ liệu nhỏ, nhưng dữ liệu nhỏ thì hầu như luôn là Seq Scan):

a. \`explain select * from student where name = 'Zhang';\` → **Seq Scan** on student, Filter: name = 'Zhang'.
b. \`create index student_name_idx on student(name);\` rồi chạy lại → **Index Scan** (hoặc Bitmap Index Scan + Bitmap Heap Scan) using student_name_idx. Sau khi tạo index nên \`analyze student\`.
c. \`explain select * from student natural join takes;\` → **Hash Join** (Seq Scan takes, Hash trên student). Ba bảng: \`… natural join course\` → hai Hash Join lồng nhau; thứ tự do optimizer chọn theo kích thước.
d. \`explain select dept_name, count(*) from instructor group by dept_name;\` → **HashAggregate** (hoặc Sort + GroupAggregate).
e. \`explain select * from instructor where ID in (select ID from teaches);\` → **Hash Semi Join** (hoặc Hash Join với HashAggregate loại trùng trên teaches).
f. \`explain select * from instructor where salary not in (select max(salary) from instructor group by dept_name);\` → Seq Scan với Filter **NOT (hashed SubPlan 1)**; subplan là HashAggregate.
g. \`explain select name from instructor i where salary > (select avg(salary) from instructor j where j.dept_name = i.dept_name);\` → Seq Scan với Filter dùng **SubPlan 1** chạy lại cho mỗi dòng (correlated evaluation).
h. \`explain update instructor set salary = salary * 1.05 where ID = '10101';\` → **Update** on instructor ← **Index Scan** using instructor_pkey.
i. \`explain update instructor i set salary = (select avg(salary) from instructor j where j.dept_name = i.dept_name);\` → Update ← Seq Scan on instructor, với **SubPlan** tính avg cho từng dòng.`,
    },
    {
      pe: '16.2',
      q: '**PE 16.2** — Chứng minh ba luật tương đương (a) join phân phối qua hiệu, (b) đẩy selection qua aggregation, (c) đẩy selection qua left outer join, và cho biết chúng giúp tối ưu thế nào.',
      answer: `**a. E₁ ⋈<sub>θ</sub> (E₂ − E₃) ≡ E₁ ⋈<sub>θ</sub> E₂ − E₁ ⋈<sub>θ</sub> E₃** (E₂, E₃ cùng schema).
Đặt R₁ = vế trái, R₂ = E₁ ⋈<sub>θ</sub> E₂, R₃ = E₁ ⋈<sub>θ</sub> E₃.
- t ∈ R₁ ⇒ t = t₁·t₂ với t₁ ∈ E₁, t₂ ∈ E₂, t₂ ∉ E₃, thoả θ ⇒ t ∈ R₂; và t ∉ R₃ vì phần E₃ của t là t₂ ∉ E₃. Vậy t ∈ R₂ − R₃.
- t ∈ R₂ − R₃ ⇒ t = t₁·t₂, t₂ ∈ E₂, thoả θ; nếu t₂ ∈ E₃ thì t ∈ R₃ (vô lý) ⇒ t₂ ∈ E₂ − E₃ ⇒ t ∈ R₁.
Ứng dụng: theo chiều phải → trái, thay hai join lớn (mà phần lớn tuple sẽ bị trừ đi) bằng một phép trừ trên E₂, E₃ rồi chỉ một join.

**b. σ<sub>θ</sub>(<sub>A</sub>γ<sub>F</sub>(E)) ≡ <sub>A</sub>γ<sub>F</sub>(σ<sub>θ</sub>(E))**, θ chỉ dùng thuộc tính của A.
Mọi tuple của E trong cùng một nhóm có cùng giá trị A, nên θ (chỉ phụ thuộc A) cho cùng kết quả trên mọi tuple của nhóm: nhóm bị loại ở vế trái ⇔ **toàn bộ** tuple của nhóm bị loại ở vế phải; nhóm được giữ thì giữ nguyên mọi tuple nên giá trị aggregate F không đổi.
Ứng dụng: lọc trước khi aggregate → không tốn công tính aggregate cho các nhóm sẽ bị loại (chuyển \`having\` trên cột nhóm thành \`where\`).

**c. σ<sub>θ</sub>(E₁ ⟕ E₂) ≡ σ<sub>θ</sub>(E₁) ⟕ E₂**, θ chỉ dùng thuộc tính của E₁.
Mỗi tuple của E₁ ⟕ E₂ có phần E₁ là một tuple t₁ của E₁ (khớp với tuple E₂ hoặc kèm null). θ chỉ xét t₁ nên tuple bị loại ở vế trái ⇔ t₁ không thoả θ ⇔ t₁ không có trong σ<sub>θ</sub>(E₁), và mọi tuple sinh từ t₁ bị loại ở cả hai vế; t₁ thoả θ thì sinh đúng cùng các tuple (khớp hoặc null) ở hai vế.
Ứng dụng: lọc E₁ trước khi outer join → join nhỏ hơn nhiều.

Bài CH16.06 kiểm chứng luật b trên dữ liệu.`,
    },
    {
      pe: '16.3',
      q: '**PE 16.3** — Cho instance chứng tỏ các cặp biểu thức (a), (b), (d), (e) không tương đương; (c) thay max bằng min thì sao?',
      answer: `a. Π<sub>A</sub>(r − s) vs Π<sub>A</sub>(r) − Π<sub>A</sub>(s): r = {(1, 2)}, s = {(1, 3)} (schema (A, B)). r − s = {(1, 2)} → vế trái {(1)}; Π<sub>A</sub>(r) − Π<sub>A</sub>(s) = {1} − {1} = ∅.

b. σ<sub>B<4</sub>(<sub>A</sub>γ<sub>max(B) as B</sub>(r)) vs <sub>A</sub>γ<sub>max(B) as B</sub>(σ<sub>B<4</sub>(r)): r = {(1, 2), (1, 5)}. Vế trái: max = 5, không < 4 → ∅. Vế phải: lọc còn (1, 2) → {(1, 2)}.

c. Với **min** thì **tương đương**: nếu min của nhóm < 4 thì tuple đạt min vẫn còn sau khi lọc B < 4 và vẫn là min của phần còn lại; nếu min ≥ 4 thì mọi tuple của nhóm bị lọc, nhóm biến mất ở cả hai vế.

d. (r ⟖ s) ⟖ t vs r ⟖ (s ⟖ t) — lời giải in trong sách (R = {(1, 2)}, S = {(2, 3)}, T = {(1, 4)}) cho hai vế **bằng nhau** nếu t có schema (A, D). Một instance đúng với r(A, B), s(B, C), t(A, D): r = {(1, 2)}, s = {(5, 3)}, t = {(1, 4)}.
- r ⟖ s = {(null, 5, 3)} (s không khớp r); ⟖ t trên A: null ≠ 1 → {(A = 1, B = null, C = null, D = 4)}.
- s ⟖ t: không có thuộc tính chung → tích {(5, 3, 1, 4)}; r ⟖ đó trên (A, B): (1, 2) không khớp (1, 5) → {(1, 5, 3, 4)}.
Hai kết quả khác nhau (CH16.03).

e. σ<sub>θ</sub>(E₁ ⟕ E₂) vs E₁ ⟕ σ<sub>θ</sub>(E₂), θ trên E₂: E₁(A, B) = {(1, 2)}, E₂(A, C) = {(2, 3)}, θ: C = 1. Vế trái: E₁ ⟕ E₂ = {(1, 2, null)}, θ trên null là unknown → ∅. Vế phải: σ<sub>θ</sub>(E₂) = ∅ nên {(1, 2, null)}.

Các bài CH16.01–CH16.05 yêu cầu tự dựng instance và hệ thống kiểm tra hai vế khác nhau.`,
    },
    {
      pe: '16.4',
      q: '**PE 16.4** — Các luật tương đương 1 tới 7.b có còn đúng với đại số quan hệ multiset không?',
      answer: `**Có** — các luật 1 tới 7.b (tách/giao hoán selection, chỉ giữ projection ngoài cùng, gộp selection vào join, join giao hoán và kết hợp, đẩy selection xuống join) đều đúng với multiset: mỗi luật chỉ lọc hoặc ghép từng tuple một cách độc lập, nên số lần xuất hiện của mỗi tuple kết quả (tích số lần của các tuple thành phần) như nhau ở hai vế. Lưu ý luật 3 với multiset: projection không loại trùng, nên Π<sub>L₁</sub>(Π<sub>L₂</sub>(E)) vẫn giữ đúng số lần.

Có những luật đúng với tập hợp nhưng **sai** với multiset, ví dụ A ∪ B = (A − B) ∪ (B − A) ∪ (A ∩ B): nếu t xuất hiện 4 lần trong A và 3 lần trong B, multiset union cho 7 lần, còn vế phải cho 1 + 0 + 3 = 4 lần. (Ví dụ của sách viết A ∩ B = A ∪ B − (A − B) − (B − A): vế trái 3 lần, vế phải 7 − 1 − 0 = 6 lần.) Nguyên nhân: union, intersect, except multiset bất đối xứng (cộng / min / trừ số lần).`,
    },
    {
      pe: '16.5',
      q: '**PE 16.5** — r₁(A, B, C), r₂(C, D, E), r₃(E, F) với khoá A, C, E; 1000, 1500, 750 tuple. Ước lượng kích thước r₁ ⋈ r₂ ⋈ r₃ và chiến lược tính.',
      answer: `Kết quả không phụ thuộc thứ tự join. Xét (r₁ ⋈ r₂) ⋈ r₃: C là **khoá của r₂** nên mỗi tuple r₁ khớp tối đa một tuple r₂ → r₁ ⋈ r₂ có **≤ 1000** tuple; E là khoá của r₃ nên mỗi tuple của kết quả đó khớp tối đa một tuple r₃ → kết quả cuối **≤ 1000** tuple. (Nếu thêm C, E là foreign key not null thì đúng 1000.)

Chiến lược: dùng (hoặc tạo) index trên r₂.C và r₃.E. Với mỗi tuple r₁: tra index r₂ theo C (tối đa một tuple), rồi tra index r₃ theo E của tuple đó (tối đa một tuple) — indexed nested-loop hai tầng, chi phí ≈ b<sub>r1</sub> + 1000 × (c<sub>r2</sub> + c<sub>r3</sub>), không bao giờ tạo kết quả trung gian lớn. Hash join r₁ với r₂ rồi với r₃ cũng tốt.`,
    },
    {
      pe: '16.6',
      q: '**PE 16.6** — Như PE 16.5 nhưng không có khoá; V(C, r₁) = 900, V(C, r₂) = 1100, V(E, r₂) = 50, V(E, r₃) = 100. Ước lượng kích thước và chiến lược.',
      answer: `r₁ ⋈ r₂ trên C: 1000 × 1500 / max(900, 1100) = 1 500 000 / 1100 ≈ **1364** tuple (mỗi tuple r₁ khớp trung bình 15/11 tuple r₂).

Kết quả đó ⋈ r₃ trên E: 1364 × 750 / max(V(E, r₂), V(E, r₃)) = (15000/11) × 750 / 100 ≈ **10 227** tuple. (V(E, r₁ ⋈ r₂) ≤ V(E, r₂) = 50, nên dùng max(50, 100) = 100.)

Chiến lược: so các kết quả trung gian — r₁ ⋈ r₂ ≈ 1364; r₂ ⋈ r₃ = 1500 × 750 / 100 = 11 250; r₁ × r₃ (không có thuộc tính chung) = 750 000. Vậy join **r₁ với r₂ trước** (kết quả trung gian nhỏ, cỡ r₁, r₂), rồi join với r₃ — ví dụ hash join với r₁ làm build, sau đó hash join kết quả với r₃ (r₃ làm build vì nhỏ hơn). CH16.07–CH16.08 tính các số này bằng SQL.`,
    },
    {
      pe: '16.7',
      q: '**PE 16.7** — department có B⁺-tree trên building. Cách tốt nhất cho (a) ¬(building < Watson), (b) ¬(building = Watson), (c) ¬(building < Watson ∨ budget < 50000)?',
      answer: `a. ≡ building ≥ 'Watson': dùng index tìm entry đầu tiên ≥ 'Watson' rồi duyệt lá tới cuối (nếu ít tuple thoả); ngược lại linear scan.

b. ≡ building ≠ 'Watson': gần như mọi tuple thoả → **linear scan**, index vô dụng.

c. Theo De Morgan ≡ **building ≥ 'Watson' ∧ budget ≥ 50000**: dùng index lấy các tuple building ≥ 'Watson' rồi kiểm tra budget ≥ 50000 trên từng tuple (lời giải sách in "budget < 5000" là lỗi gõ). Nếu điều kiện building không chọn lọc thì linear scan.`,
    },
    {
      pe: '16.8',
      q: '**PE 16.8** — Truy vấn join trên `upper(r.A) = upper(s.A)`: plan của hệ thống bạn dùng là gì, và làm sao dùng hash join hoặc merge join?',
      answer: `a. Tạo r, s và ít dữ liệu rồi \`explain\`. PostgreSQL chọn **Hash Join** với Hash Cond: upper(r.a) = upper(s.a) (hoặc Merge Join sau khi Sort theo upper(...)) — vì điều kiện vẫn là phép **bằng** giữa hai biểu thức, mỗi biểu thức chỉ phụ thuộc một bảng. So với \`r.A = s.A\`: plan có thể giống nhưng **ước lượng số dòng** khác hẳn, vì không có thống kê cho upper(A) (trừ khi tạo expression index rồi analyze).

b. Hash join: áp dụng upper() lên giá trị **trước khi băm** — chia partition và dựng hash table theo upper(r.A), probe bằng upper(s.A). Merge join: sắp hai bảng theo upper(A) rồi merge bình thường. Thuật toán không đổi, chỉ thay khoá join bằng biểu thức. Thêm expression index \`create index on s (upper(A))\` cho phép indexed nested-loop join và cho optimizer thống kê đúng (CH16.17–CH16.18).`,
    },
    {
      pe: '16.9',
      q: '**PE 16.9** — Khi nào <sub>A,B</sub>γ<sub>agg(C)</sub>(E₁ ⋈ E₂) ≡ (<sub>A</sub>γ<sub>agg(C)</sub>(E₁)) ⋈ E₂? Nới lỏng thế nào với min/max?',
      answer: `Tương đương khi **E₂ chỉ gồm các thuộc tính A và B, với A là khoá của E₂** (không có hai tuple E₂ cùng A). Khi đó mỗi tuple E₁ khớp tối đa một tuple E₂ nên nhóm theo (A, B) ở vế trái chính là nhóm theo A, và aggregate không bị đếm lặp. Giá trị A có ở E₁ mà không có ở E₂ bị loại ở cả hai vế, không sao.

Nếu E₂ có hai tuple **trùng cả (A, B)**, ví dụ (1, x) hai lần: join nhân đôi mọi tuple E₁ có A = 1, nên vế trái (một nhóm (1, x)) có sum, count gấp đôi; vế phải aggregate trên E₁ trước (tổng đúng) rồi join ra **hai** dòng (1, x, tổng). Nếu A trùng nhưng B khác ((1, x), (1, y)) thì mỗi nhóm (A, B) vẫn nhận đủ các tuple E₁ của A nên sum/count hai vế tình cờ bằng nhau — nhưng điều kiện an toàn tổng quát là A là khoá của E₂.

Với **min/max**: trùng lặp không làm đổi giá trị min/max, nên chỉ cần **không có tuple trùng trên (A, B)** trong E₂ (vế trái loại trùng nhờ group by, vế phải thì không) — A không cần là khoá. CH16.19 yêu cầu dựng instance cho thấy hai vế khác nhau với sum.`,
    },
    {
      pe: '16.10',
      q: '**PE 16.10** — Truy vấn natural join tập S; với tập con S1 ⊆ S, các thứ tự (sort order) nào của S1 là interesting?',
      answer: `Interesting order là thứ tự có thể có ích cho các phép **phía trên**. Với natural join, chỉ các join tiếp theo dùng được thứ tự. Đặt T = tập thuộc tính của S1 **cũng xuất hiện trong một quan hệ nào đó thuộc S − S1** (các thuộc tính có thể tham gia điều kiện join sau này). Khi đó **mọi thứ tự trên mọi tập con của T** đều là interesting order. (Nếu truy vấn có order by / group by thì thêm thứ tự trên các thuộc tính đó.)`,
    },
    {
      pe: '16.11',
      q: '**PE 16.11** — Sửa FindBestPlan(S) thành FindBestPlan(S, O) có xét sort order O.',
      answer: `Lưu plan tốt nhất theo cặp (S, O) thay vì chỉ S.

\`\`\`
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
\`\`\`
Gọi ở mức ngoài cùng với O = thứ tự của order by (hoặc null). Có thể giới hạn O ở các interesting order (PE 16.10) để bảng ghi nhớ không quá lớn.`,
    },
    {
      pe: '16.12',
      q: '**PE 16.12** — Chứng minh n quan hệ có (2(n − 1))!/(n − 1)! thứ tự join.',
      answer: `Mỗi thứ tự join là một **cây nhị phân đầy đủ** (mọi nút trong có đúng hai con) với n lá là n quan hệ (có thứ tự trái/phải vì cây con trái, phải là hai input khác nhau).

- Cây nhị phân đầy đủ có n lá thì có n − 1 nút trong. Bỏ hết lá được một cây nhị phân (bất kỳ) n − 1 nút; ngược lại từ cây nhị phân n − 1 nút, thêm lá vào mọi chỗ trống được duy nhất một cây đầy đủ n lá. Đây là song ánh, nên số **hình dạng** cây = số cây nhị phân n − 1 nút = số Catalan C<sub>n−1</sub> = (1/n)·C(2(n − 1), n − 1).
- Gán n quan hệ vào n lá: n! cách.

Tổng: n! · (1/n) · (2(n−1))! / ((n−1)! (n−1)!) = (n−1)! · (2(n−1))! / ((n−1)!)² = **(2(n − 1))! / (n − 1)!**. Ví dụ n = 3: 4!/2! = 12; n = 7: 12!/6! = 665 280 (CH16.12).`,
    },
    {
      pe: '16.13',
      q: '**PE 16.13** — Chứng minh thứ tự join rẻ nhất tìm được trong O(3ⁿ).',
      answer: `Dynamic programming: với mỗi tập con S của n quan hệ (tính theo kích thước tăng dần), plan tốt nhất của S = min trên mọi cách chia S thành S1 và S − S1 (S1 ≠ ∅, S1 ≠ S) của bestplan(S1) + bestplan(S − S1) + chi phí join. Tra/ghi bestplan tốn O(1).

Tập S có k phần tử có 2ᵏ − 2 cách chọn S1, mỗi cách O(1). Tổng thời gian:

Σ<sub>k=1..n</sub> C(n, k) · 2ᵏ ≤ Σ<sub>k=0..n</sub> C(n, k) · 2ᵏ · 1<sup>n−k</sup> = (1 + 2)ⁿ = **3ⁿ** (khai triển nhị thức).

Cận lỏng O(2²ⁿ): có 2ⁿ tập S, mỗi tập xét không quá 2ⁿ tập con S1 → 2ⁿ · 2ⁿ = 2²ⁿ = 4ⁿ.`,
    },
    {
      pe: '16.14',
      q: '**PE 16.14** — Chỉ xét left-deep join tree: chứng minh thời gian tìm thứ tự tốt nhất khoảng n·2ⁿ.',
      answer: `Với left-deep tree, vế phải của phép join trên cùng phải là **một** quan hệ, nên với tập S có k phần tử chỉ có k cách chia (S − {r}, {r}) thay vì 2ᵏ − 2. Tổng thời gian:

Σ<sub>k=1..n</sub> C(n, k) · k = n · Σ<sub>k=1..n</sub> C(n − 1, k − 1) = n · 2<sup>n−1</sup> (dùng k·C(n, k) = n·C(n−1, k−1) và Σ C(n−1, j) = 2<sup>n−1</sup>).

Vậy khoảng **n·2ⁿ** (với một interesting order; mỗi order thêm nhân một hằng số). Ví dụ n = 10: 10 · 512 = 5120 bước, so với 3¹⁰ = 59 049 của cây bất kỳ và 10! = 3 628 800 nếu liệt kê mọi left-deep order.`,
    },
    {
      pe: '16.15',
      q: '**PE 16.15** — Bank database: (a) truy vấn lồng tìm account có balance lớn nhất ở mỗi branch tên bắt đầu bằng B; (b) khử tương quan bằng SQL; (c) biểu thức đại số dùng semijoin; (d) thủ tục khử tương quan tổng quát.',
      answer: `a.
\`\`\`sql
select S.account_number
from account S
where S.branch_name like 'B%'
  and S.balance = (select max(T.balance) from account T where T.branch_name = S.branch_name);
\`\`\`
b.
\`\`\`sql
with t1 (branch_name, max_balance) as (
  select branch_name, max(balance) from account group by branch_name)
select account_number
from account join t1 using (branch_name)
where account.branch_name like 'B%' and account.balance = t1.max_balance;
\`\`\`
(Tốt hơn: đưa \`where branch_name like 'B%'\` vào t1 để chỉ aggregate các branch cần.)

c. Đặt t1 = <sub>branch_name</sub>γ<sub>max(balance) as max_balance</sub>(σ<sub>branch_name like 'B%'</sub>(account)). Khi đó

Π<sub>account_number</sub>( σ<sub>branch_name like 'B%'</sub>(account) ⋉<sub>account.branch_name = t1.branch_name ∧ account.balance = t1.max_balance</sub> t1 )

Semijoin giữ mỗi account đúng một lần, kể cả khi nhiều account cùng đạt max.

d. Truy vấn dạng
\`\`\`
select … from L1 where P1 and A1 op (select f(A2) from L2 where P2)
\`\`\`
với P2 chứa các điều kiện tương quan (dùng biến của L1):
1. Tách P2 = P2¹ ∧ P2², P2¹ chỉ dùng biến của L2, P2² là các điều kiện tương quan dạng (L2.X = L1.Y). Gọi V là tập thuộc tính của L2 xuất hiện trong P2².
2. Tạo t1 = \`select V, f(A2) as fa from L2 where P2¹ group by V\` (đại số: <sub>V</sub>γ<sub>f(A2)</sub>(σ<sub>P2¹</sub>(L2))).
3. Viết lại: \`select … from L1, t1 where P1 and P2²[L2.V → t1.V] and A1 op t1.fa\` — hoặc dùng semijoin L1 ⋉<sub>P2² ∧ A1 op fa</sub> t1 để không nhân dòng.
Chú ý: với f = count, nhóm rỗng trong truy vấn lồng cho 0 nhưng không có dòng trong t1 — phải dùng outer join và coalesce(fa, 0).

CH16.14–CH16.15 chạy câu a và b trên \`qp_account\`.`,
    },
  ],

  exercises: [
    // ---------------- Counterexamples to (false) equivalences ----------------
    {
      id: 'CH16.01', topic: 'PE 16.3a phản ví dụ', level: 2, pe: '16.3a',
      prompt: `Tạo hai bảng \`qp_x_r(a int, b int)\`, \`qp_x_s(a int, b int)\` và chèn dữ liệu sao cho Π<sub>A</sub>(r − s) **khác** Π<sub>A</sub>(r) − Π<sub>A</sub>(s). Hệ thống tính hai vế (dùng \`except\`) và trả về \`differ\`.`,
      solution: `create table qp_x_r (a int, b int);
create table qp_x_s (a int, b int);
insert into qp_x_r values (1, 2);
insert into qp_x_s values (1, 3);`,
      check: `with lhs as (select a from (select * from qp_x_r except select * from qp_x_s) d),
     rhs as (select a from qp_x_r except select a from qp_x_s)
select exists (select * from lhs except select * from rhs)
    or exists (select * from rhs except select * from lhs) as differ;`,
    },
    {
      id: 'CH16.02', topic: 'PE 16.3b phản ví dụ', level: 2, pe: '16.3b',
      prompt: `Tạo \`qp_x_m(a int, b int)\` với dữ liệu sao cho σ<sub>B<4</sub>(<sub>A</sub>γ<sub>max(B) as B</sub>(r)) khác <sub>A</sub>γ<sub>max(B) as B</sub>(σ<sub>B<4</sub>(r)). Hệ thống so sánh hai vế và trả về \`differ\`.`,
      solution: `create table qp_x_m (a int, b int);
insert into qp_x_m values (1, 2), (1, 5);`,
      check: `with lhs as (select a, max(b) as b from qp_x_m group by a having max(b) < 4),
     rhs as (select a, max(b) as b from qp_x_m where b < 4 group by a)
select exists (select * from lhs except select * from rhs)
    or exists (select * from rhs except select * from lhs) as differ;`,
    },
    {
      id: 'CH16.03', topic: 'PE 16.3d right outer join', level: 3, pe: '16.3d',
      prompt: `Tạo \`qp_x_r(a int, b int)\`, \`qp_x_s(b int, c int)\`, \`qp_x_t(a int, d int)\` và chèn dữ liệu sao cho \`(qp_x_r natural right join qp_x_s) natural right join qp_x_t\` **khác** \`qp_x_r natural right join (qp_x_s natural right join qp_x_t)\` (so sánh trên các cột a, b, c, d). Hệ thống trả về \`differ\`.`,
      hint: 'Cho một tuple của s không khớp r, để vế trái sinh a = null rồi không khớp t.',
      solution: `create table qp_x_r (a int, b int);
create table qp_x_s (b int, c int);
create table qp_x_t (a int, d int);
insert into qp_x_r values (1, 2);
insert into qp_x_s values (5, 3);
insert into qp_x_t values (1, 4);`,
      check: `with lhs as (select a, b, c, d from ((qp_x_r natural right join qp_x_s) natural right join qp_x_t) x),
     rhs as (select a, b, c, d from (qp_x_r natural right join (qp_x_s natural right join qp_x_t)) y)
select exists (select * from lhs except select * from rhs)
    or exists (select * from rhs except select * from lhs) as differ;`,
    },
    {
      id: 'CH16.04', topic: 'PE 16.3e selection & outer join', level: 2, pe: '16.3e',
      prompt: `Tạo \`qp_x_e1(a int, b int)\`, \`qp_x_e2(a int, c int)\` với dữ liệu sao cho σ<sub>c = 1</sub>(E₁ ⟕ E₂) khác E₁ ⟕ σ<sub>c = 1</sub>(E₂) (natural left join trên a). Hệ thống trả về \`differ\`.`,
      solution: `create table qp_x_e1 (a int, b int);
create table qp_x_e2 (a int, c int);
insert into qp_x_e1 values (1, 2);
insert into qp_x_e2 values (2, 3);`,
      check: `with lhs as (select a, b, c from qp_x_e1 natural left join qp_x_e2 where c = 1),
     rhs as (select a, b, c from qp_x_e1 natural left join (select * from qp_x_e2 where c = 1) e)
select exists (select * from lhs except select * from rhs)
    or exists (select * from rhs except select * from lhs) as differ;`,
    },
    {
      id: 'CH16.05', topic: 'PE 16.3c min vs max', level: 2, pe: '16.3bc',
      prompt: `Trên \`qp_emp(id, dept, salary)\` với ngưỡng 30000: so sánh "aggregate rồi lọc" với "lọc rồi aggregate" theo dept. Trả về một dòng hai cột boolean:
- \`min_same\`: \`select dept, min(salary) … group by dept having min(salary) < 30000\` có **cùng kết quả** với \`… where salary < 30000 group by dept\` không;
- \`max_same\`: câu hỏi tương tự với max.`,
      solution: `with lmin as (select dept, min(salary) as v from qp_emp group by dept having min(salary) < 30000),
     rmin as (select dept, min(salary) as v from qp_emp where salary < 30000 group by dept),
     lmax as (select dept, max(salary) as v from qp_emp group by dept having max(salary) < 30000),
     rmax as (select dept, max(salary) as v from qp_emp where salary < 30000 group by dept)
select not exists ((select * from lmin except select * from rmin) union (select * from rmin except select * from lmin)) as min_same,
       not exists ((select * from lmax except select * from rmax) union (select * from rmax except select * from lmax)) as max_same;`,
    },
    {
      id: 'CH16.06', topic: 'PE 16.2b having → where', level: 1, pe: '16.2b',
      prompt: `Truy vấn sau tính lương trung bình mọi khoa rồi mới lọc:
\`\`\`sql
select dept_name, avg(salary) from instructor group by dept_name
having dept_name in ('Comp. Sci.', 'Physics', 'Finance');
\`\`\`
Viết lại theo luật PE 16.2b: lọc **trước** khi aggregate (không dùng having). Trả về dept_name, avg_salary (làm tròn 2 chữ số).`,
      solution: `select dept_name, round(avg(salary), 2) as avg_salary
from instructor
where dept_name in ('Comp. Sci.', 'Physics', 'Finance')
group by dept_name;`,
    },
    // ---------------- Size estimation ----------------
    {
      id: 'CH16.07', topic: 'PE 16.6 ước lượng join', level: 2, pe: '16.6',
      prompt: `Bảng \`qp_card(rel, n)\` và \`qp_vstats(rel, attr, v)\` chứa số liệu PE 16.6. Tính:
- \`est_r1_r2\` = n<sub>r1</sub> · n<sub>r2</sub> / max(V(C, r1), V(C, r2)), làm tròn 1 chữ số;
- \`est_all\` = est_r1_r2 (chưa làm tròn) · n<sub>r3</sub> / max(V(E, r2), V(E, r3)), làm tròn tới số nguyên.`,
      solution: `with n as (select max(n) filter (where rel = 'r1') as n1, max(n) filter (where rel = 'r2') as n2,
                  max(n) filter (where rel = 'r3') as n3 from qp_card),
     v as (select max(v) filter (where rel = 'r1' and attr = 'C') as c1, max(v) filter (where rel = 'r2' and attr = 'C') as c2,
                  max(v) filter (where rel = 'r2' and attr = 'E') as e2, max(v) filter (where rel = 'r3' and attr = 'E') as e3
           from qp_vstats),
     j as (select n1::numeric * n2 / greatest(c1, c2) as e12, n3, e2, e3 from n, v)
select round(e12, 1) as est_r1_r2, round(e12 * n3 / greatest(e2, e3)) as est_all from j;`,
    },
    {
      id: 'CH16.08', topic: 'PE 16.6 chọn join đầu tiên', level: 2, pe: '16.6',
      prompt: `Vẫn số liệu PE 16.6. Ước lượng kích thước kết quả trung gian cho ba cách chọn cặp join đầu tiên: \`r1⋈r2\` (trên C), \`r2⋈r3\` (trên E), \`r1⋈r3\` (không có thuộc tính chung → tích Descartes). Trả về \`pair\` (đúng ba chuỗi trên) và \`est\` (làm tròn tới số nguyên), sắp theo est tăng dần.`,
      solution: `with n as (select max(n) filter (where rel = 'r1') as n1, max(n) filter (where rel = 'r2') as n2,
                  max(n) filter (where rel = 'r3') as n3 from qp_card),
     v as (select max(v) filter (where rel = 'r1' and attr = 'C') as c1, max(v) filter (where rel = 'r2' and attr = 'C') as c2,
                  max(v) filter (where rel = 'r2' and attr = 'E') as e2, max(v) filter (where rel = 'r3' and attr = 'E') as e3
           from qp_vstats)
select pair, round(est) as est from (
  select 'r1⋈r2' as pair, n1::numeric * n2 / greatest(c1, c2) as est from n, v
  union all select 'r2⋈r3', n2::numeric * n3 / greatest(e2, e3) from n, v
  union all select 'r1⋈r3', n1::numeric * n3 from n, v) t
order by est;`,
      ordered: true,
    },
    {
      id: 'CH16.09', topic: 'ước lượng σ A ≤ v', level: 2,
      prompt: `Ước lượng số instructor có salary ≤ 70000 bằng công thức n<sub>r</sub> · (v − min) / (max − min) (min, max, n<sub>r</sub> lấy từ bảng instructor), rồi so với số thực tế. Trả về \`estimate\` (làm tròn 2 chữ số) và \`actual\`.`,
      solution: `select round(count(*) * (70000 - min(salary)) / (max(salary) - min(salary)), 2) as estimate,
       count(*) filter (where salary <= 70000) as actual
from instructor;`,
    },
    {
      id: 'CH16.10', topic: 'histogram equi-width', level: 2, ordered: true,
      prompt: `Dựng histogram **equi-width** 4 bucket cho \`qp_emp.salary\` trên khoảng [20000, 100000) (mỗi bucket rộng 20000). Trả về \`bucket\` (1–4), \`lo\`, \`hi\` (biên dưới, biên trên của bucket) và \`cnt\`, sắp theo bucket.`,
      hint: 'width_bucket(salary, 20000, 100000, 4).',
      solution: `select width_bucket(salary, 20000, 100000, 4) as bucket,
       20000 + (width_bucket(salary, 20000, 100000, 4) - 1) * 20000 as lo,
       20000 + width_bucket(salary, 20000, 100000, 4) * 20000 as hi,
       count(*) as cnt
from qp_emp
group by 1
order by 1;`,
    },
    {
      id: 'CH16.11', topic: 'ước lượng bằng histogram', level: 3,
      prompt: `Dùng histogram của CH16.10 (giả sử phân bố đều **trong** mỗi bucket) để ước lượng số nhân viên có salary < 45000: toàn bộ bucket [20000, 40000) cộng với phần (45000 − 40000)/20000 của bucket [40000, 60000). Trả về \`estimate\` (làm tròn 1 chữ số) và \`actual\`.`,
      solution: `with h as (select width_bucket(salary, 20000, 100000, 4) as bucket, count(*) as cnt from qp_emp group by 1)
select round(sum(case when bucket = 1 then cnt when bucket = 2 then cnt * (45000 - 40000) / 20000.0 else 0 end), 1) as estimate,
       (select count(*) from qp_emp where salary < 45000) as actual
from h;`,
    },
    // ---------------- Join ordering ----------------
    {
      id: 'CH16.12', topic: 'PE 16.12 số thứ tự join', level: 1, pe: '16.12', ordered: true,
      prompt: `Với n = 1 … 8, trả về \`n\`, \`all_orders\` = (2(n − 1))! / (n − 1)! (mọi cây join) và \`left_deep\` = n! (chỉ left-deep), kiểu số nguyên, sắp theo n.`,
      solution: `select n,
       (factorial(2 * (n - 1)) / factorial(n - 1))::bigint as all_orders,
       factorial(n)::bigint as left_deep
from generate_series(1, 8) as n
order by n;`,
    },
    {
      id: 'CH16.13', topic: 'thứ tự join left-deep tốt nhất', level: 3,
      prompt: `\`qp_jrel(id, name, n)\`: 4 quan hệ A, B, C, D (id 0–3). \`qp_jpred(r1, r2, sel)\`: điều kiện join giữa hai quan hệ và selectivity (cặp không có trong bảng là tích Descartes, sel = 1). Liệt kê **mọi left-deep order** (thứ tự thêm quan hệ, ví dụ \`'B C D A'\`). Khi thêm quan hệ R vào kết quả hiện có kích thước s: kích thước mới = s · n<sub>R</sub> · tích các sel của điều kiện nối R với các quan hệ đã có. **Chi phí** của một order = tổng kích thước mọi kết quả join (kể cả kết quả cuối).

Trả về \`best_cost\` (chi phí nhỏ nhất, làm tròn số nguyên) và \`orders\`: các order đạt chi phí đó, nối bằng \`', '\` theo thứ tự chữ cái.`,
      hint: 'with recursive trên bitmask (1 << id); tích các sel = exp(sum(ln(sel))); làm tròn kích thước mỗi bước tới 4 chữ số để tránh sai số.',
      solution: `with recursive plan(mask, ord, size, cost) as (
  select 1 << id, name::text, n::numeric, 0::numeric from qp_jrel
  union all
  select p.mask | (1 << r.id), p.ord || ' ' || r.name, x.s, p.cost + x.s
  from plan p
  join qp_jrel r on p.mask & (1 << r.id) = 0
  cross join lateral (
    select round(p.size * r.n * coalesce(
             (select exp(sum(ln(j.sel))) from qp_jpred j
              where (j.r1 = r.id and p.mask & (1 << j.r2) <> 0)
                 or (j.r2 = r.id and p.mask & (1 << j.r1) <> 0)), 1), 4) as s) x
),
full_plans as (select ord, round(cost) as cost from plan where mask = 15)
select cost as best_cost, string_agg(ord, ', ' order by ord) as orders
from full_plans
where cost = (select min(cost) from full_plans)
group by cost;`,
    },
    // ---------------- Decorrelation ----------------
    {
      id: 'CH16.14', topic: 'PE 16.15a truy vấn lồng', level: 2, pe: '16.15a',
      prompt: `Trên \`qp_account(account_number, branch_name, balance)\`: viết **truy vấn lồng có tương quan** tìm, với mỗi branch có tên bắt đầu bằng \`B\`, mọi account có balance lớn nhất ở branch đó. Trả về account_number, branch_name.`,
      solution: `select S.account_number, S.branch_name
from qp_account S
where S.branch_name like 'B%'
  and S.balance = (select max(T.balance) from qp_account T where T.branch_name = S.branch_name);`,
    },
    {
      id: 'CH16.15', topic: 'PE 16.15b khử tương quan', level: 2, pe: '16.15b',
      prompt: `Viết lại CH16.14 **không có subquery tương quan**: tính max balance của mỗi branch một lần (with hoặc derived table + group by) rồi join. Trả về account_number, branch_name.`,
      solution: `with t1 as (
  select branch_name, max(balance) as max_balance
  from qp_account where branch_name like 'B%'
  group by branch_name)
select a.account_number, a.branch_name
from qp_account a join t1 on a.branch_name = t1.branch_name and a.balance = t1.max_balance;`,
    },
    {
      id: 'CH16.16', topic: 'not exists → anti-join', level: 2,
      prompt: `Tìm các branch **không có** account nào, viết bằng **left outer join … is null** (anti-join) thay cho \`not exists\`. Trả về branch_name, branch_city.`,
      solution: `select b.branch_name, b.branch_city
from qp_branch b left join qp_account a on a.branch_name = b.branch_name
where a.account_number is null;`,
    },
    // ---------------- upper() join, aggregation pushdown ----------------
    {
      id: 'CH16.17', topic: 'PE 16.8 join trên upper()', level: 1, pe: '16.8',
      prompt: `Join \`qp_names_r(id, name)\` với \`qp_names_s(code, name)\` theo tên **không phân biệt hoa thường** (dùng upper). Trả về id, r_name, code.`,
      solution: `select r.id, r.name as r_name, s.code
from qp_names_r r join qp_names_s s on upper(r.name) = upper(s.name);`,
    },
    {
      id: 'CH16.18', topic: 'expression index', level: 2, pe: '16.8',
      prompt: `Tạo **expression index** trên \`qp_names_s\` theo \`upper(name)\` để join của CH16.17 dùng được index (indexed nested-loop) và optimizer có thống kê. Hệ thống kiểm tra trong \`pg_indexes\` có index của qp_names_s mà định nghĩa chứa \`upper\`.`,
      solution: `create index qp_names_s_upper on qp_names_s (upper(name));`,
      check: `select count(*) > 0 as has_upper_index
from pg_indexes
where tablename = 'qp_names_s' and indexdef ilike '%upper(%';`,
    },
    {
      id: 'CH16.19', topic: 'PE 16.9 đẩy aggregate qua join', level: 3, pe: '16.9',
      prompt: `Tạo \`qp_x_e1(a int, c int)\` và \`qp_x_e2(a int, b text)\` với dữ liệu sao cho <sub>A,B</sub>γ<sub>sum(C)</sub>(E₁ ⋈ E₂) **khác** (<sub>A</sub>γ<sub>sum(C)</sub>(E₁)) ⋈ E₂ (natural join trên a; so sánh trên các cột a, b, tổng). Hệ thống trả về \`differ\`.`,
      hint: 'Cho E₂ chứa cùng một tuple (a, b) hai lần.',
      solution: `create table qp_x_e1 (a int, c int);
create table qp_x_e2 (a int, b text);
insert into qp_x_e1 values (1, 10), (1, 20);
insert into qp_x_e2 values (1, 'x'), (1, 'x');`,
      check: `with lhs as (select a, b, sum(c) as total from qp_x_e1 natural join qp_x_e2 group by a, b),
     rhs as (select a, b, total from (select a, sum(c) as total from qp_x_e1 group by a) g natural join qp_x_e2)
select exists (select * from lhs except all select * from rhs)
    or exists (select * from rhs except all select * from lhs) as differ;`,
    },
    // ---------------- Materialized view maintenance ----------------
    {
      id: 'CH16.20', topic: 'bảo trì materialized view', level: 3,
      prompt: `Hiện thực một materialized view được bảo trì **incremental** (immediate, bằng trigger):
1. Tạo bảng \`qp_branch_total(branch_name varchar(20) primary key, total numeric(12,2), num_accounts integer)\` và nạp sẵn tổng balance, số account của mỗi branch từ \`qp_account\` (chỉ các branch có account).
2. Tạo trigger **after insert** trên \`qp_account\` (for each row, plpgsql) cộng balance và tăng num_accounts cho branch tương ứng — nếu branch chưa có trong qp_branch_total thì thêm dòng mới.

Hệ thống chèn hai account (\`('A-900', 'Austin', 100)\`, \`('A-901', 'Brighton', 50)\`) rồi đọc qp_branch_total.`,
      hint: 'insert … on conflict (branch_name) do update set total = qp_branch_total.total + excluded.total, …',
      solution: `create table qp_branch_total (
  branch_name   varchar(20) primary key,
  total         numeric(12,2),
  num_accounts  integer
);
insert into qp_branch_total
select branch_name, sum(balance), count(*) from qp_account group by branch_name;

create function qp_branch_total_ins() returns trigger language plpgsql as $$
begin
  insert into qp_branch_total values (new.branch_name, new.balance, 1)
  on conflict (branch_name) do update
    set total = qp_branch_total.total + excluded.total,
        num_accounts = qp_branch_total.num_accounts + 1;
  return new;
end $$;

create trigger qp_account_ins after insert on qp_account
for each row execute function qp_branch_total_ins();`,
      check: `insert into qp_account values ('A-900', 'Austin', 100), ('A-901', 'Brighton', 50);
select * from qp_branch_total;`,
    },
  ],
};
