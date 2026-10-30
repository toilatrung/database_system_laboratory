export default {
  number: 7,
  slug: 'ch7_normalization',
  title: 'Normalization',
  titleVi: 'Chuẩn hoá (Relational Database Design)',

  summary: `
### Phạm vi theo lịch học (số slide in ở chân trang)
| Tuần | Slide | Nội dung |
|---|---|---|
| 11 | 7.1 – 7.21 | Thiết kế tốt/xấu (in_dep), decomposition, lossy vs lossless, normalization theory, functional dependency, legal instance, key qua FD, FD tầm thường, kiểm tra lossless bằng FD, dependency preservation |
| 12 | 7.21 – 7.35 | BCNF, phân rã BCNF, BCNF vs bảo toàn phụ thuộc, 3NF, dư thừa trong 3NF, so sánh BCNF/3NF, mục tiêu chuẩn hoá, "BCNF đã đủ tốt chưa?" → multivalued dependency (inst_info) |
| Mở rộng | 7.37 trở đi | F⁺, Armstrong, bao đóng thuộc tính, canonical cover, thuật toán BCNF/3NF, 4NF, 1NF — **không nằm trong slide 35 nhưng Practice Exercises cần tới**, nên phải học |

Tự kiểm tra mọi bài tính tay bằng **Công cụ › Phụ thuộc hàm (FD)** (có sẵn các ví dụ của slide và Practice Exercises).

### 1. Thiết kế xấu: dư thừa (slide 7.3)
Gộp instructor và department thành \`in_dep(ID, name, salary, dept_name, building, budget)\`:
- **Lặp thông tin**: building, budget của một khoa lặp lại ở mọi giảng viên của khoa.
- **Update anomaly**: đổi budget ở một dòng mà quên dòng khác → dữ liệu mâu thuẫn.
- **Insertion anomaly**: không thể ghi một khoa mới chưa có giảng viên (trừ khi dùng null).
- **Deletion anomaly**: xoá giảng viên cuối cùng của khoa thì mất luôn thông tin khoa.

### 2. Decomposition, lossy và lossless (slide 7.4–7.7)
- Phân rã R thành R₁, R₂ với R = R₁ ∪ R₂.
- **Lossless (lossless-join)**: với mọi instance hợp lệ r, Π<sub>R1</sub>(r) ⋈ Π<sub>R2</sub>(r) = r.
- **Lossy**: phép join cho ra **nhiều tuple hơn** (tuple giả — spurious tuples), nên ta *mất thông tin* tuple nào là thật. Ví dụ: employee(ID, name, street, city, salary) tách thành (ID, name) và (name, street, city, salary): hai nhân viên cùng tên Kim sinh ra 4 tổ hợp.
- Luôn có r ⊆ Π<sub>R1</sub>(r) ⋈ Π<sub>R2</sub>(r) (PE 7.12): phân rã không bao giờ làm *mất* tuple, chỉ có thể *thêm* tuple.

### 3. Functional dependency (slide 7.9–7.15)
- α → β đúng trên R nếu với mọi instance hợp lệ: t₁[α] = t₂[α] ⇒ t₁[β] = t₂[β].
- FD là ràng buộc trên **mọi instance hợp lệ (legal instance)**; một instance cụ thể có thể *thoả* một FD một cách tình cờ (ví dụ name → ID đúng trên dữ liệu mẫu nhưng không phải FD).
- **K là superkey ⇔ K → R**. **K là candidate key ⇔ K → R và không tập con thực sự nào của K → R**.
- FD dùng để: kiểm tra một instance có hợp lệ không; *đặc tả* ràng buộc trên lược đồ.
- **FD tầm thường (trivial)**: α → β với β ⊆ α (ví dụ ID, name → ID).
- **F⁺** (bao đóng của F): mọi FD được suy ra từ F.

Kiểm tra một FD trên dữ liệu bằng SQL (PE 7.9):
\`\`\`sql
select B from r group by B having count(distinct C) > 1;  -- rỗng ⇔ B → C đúng trên r
\`\`\`

### 4. Kiểm tra lossless bằng FD (slide 7.16–7.17)
Phân rã R thành R₁, R₂ là lossless nếu **ít nhất một** trong hai FD sau thuộc F⁺:
- R₁ ∩ R₂ → R₁, hoặc
- R₁ ∩ R₂ → R₂

(tức là phần chung là superkey của R₁ hoặc của R₂). Ví dụ R = (A, B, C), F = {A → B, B → C}: (A, B), (B, C) lossless vì B → BC; (A, B), (A, C) cũng lossless vì A → AB.

### 5. Dependency preservation (slide 7.18–7.21)
- F<sub>i</sub> = các FD trong F⁺ chỉ chứa thuộc tính của R<sub>i</sub>. Phân rã **bảo toàn phụ thuộc** nếu (F₁ ∪ … ∪ F<sub>n</sub>)⁺ = F⁺.
- Ý nghĩa: kiểm tra mọi FD chỉ cần nhìn **từng bảng riêng lẻ**, không phải join.
- Ví dụ \`dept_advisor(s_ID, i_ID, dept_name)\` với i_ID → dept_name và s_ID, dept_name → i_ID: tách (s_ID, i_ID), (i_ID, dept_name) làm mất s_ID, dept_name → i_ID.

### 6. BCNF (slide 7.23–7.27)
R ở **BCNF** nếu với mọi α → β trong F⁺ (α, β ⊆ R), ít nhất một điều sau đúng:
- α → β tầm thường (β ⊆ α), hoặc
- α là **superkey** của R.

in_dep không ở BCNF vì dept_name → building, budget mà dept_name không phải superkey.

**Phân rã khi vi phạm** bởi α → β: thay R bằng **(α ∪ β)** và **(R − (β − α))**. Ví dụ in_dep → (dept_name, building, budget) và (ID, name, salary, dept_name). Phần chung dept_name là key của bảng thứ nhất → lossless.

**BCNF và bảo toàn phụ thuộc**: không phải lúc nào cũng đạt cả hai (dept_advisor: không có phân rã BCNF nào bảo toàn s_ID, dept_name → i_ID).

### 7. 3NF (slide 7.28–7.31)
R ở **3NF** nếu với mọi α → β trong F⁺, ít nhất một điều đúng:
- α → β tầm thường, hoặc
- α là superkey, hoặc
- mỗi thuộc tính A ∈ β − α nằm trong **một candidate key** nào đó (A là *prime*; có thể mỗi A thuộc một key khác nhau).

BCNF ⇒ 3NF (3NF nới lỏng thêm điều kiện thứ ba). dept_advisor ở 3NF vì dept_name là prime (thuộc key {s_ID, dept_name}).

**Dư thừa trong 3NF** (slide 7.30): vẫn lặp (i_ID, dept_name) và có thể phải dùng null.

| | BCNF | 3NF |
|---|---|---|
| Dư thừa do FD | không | có thể còn |
| Luôn có phân rã lossless | có | có |
| Luôn bảo toàn phụ thuộc | **không** | **có** |

**Mục tiêu thiết kế** (slide 7.32): BCNF + lossless + bảo toàn phụ thuộc; nếu không được thì chấp nhận *hoặc* mất bảo toàn phụ thuộc *hoặc* dư thừa của 3NF. (SQL chỉ kiểm tra hiệu quả superkey qua primary key/unique; FD khác cần assertion — đắt và không được hỗ trợ — hoặc trigger.)

### 8. BCNF đã đủ tốt chưa? (slide 7.33–7.35)
\`inst_info(ID, child_name, phone)\`: một giảng viên có nhiều con, nhiều số điện thoại, hai thông tin độc lập. Không có FD không tầm thường → **đã ở BCNF**, nhưng phải lưu **mọi tổ hợp** con × số điện thoại (thêm một số điện thoại phải chèn nhiều dòng). Tách thành inst_child(ID, child_name) và inst_phone(ID, phone) tốt hơn → cần dạng chuẩn cao hơn: **4NF** dựa trên **multivalued dependency**.

### Mở rộng — cần cho Practice Exercises

#### 9. F⁺ và Armstrong's axioms (slide 7.37–7.41)
- **Reflexivity**: β ⊆ α ⇒ α → β
- **Augmentation**: α → β ⇒ γα → γβ
- **Transitivity**: α → β, β → γ ⇒ α → γ

Ba tiên đề **sound** (chỉ sinh FD đúng) và **complete** (sinh ra toàn bộ F⁺). Luật suy ra:
- **Union**: α → β, α → γ ⇒ α → βγ (PE 7.4)
- **Decomposition**: α → βγ ⇒ α → β và α → γ
- **Pseudotransitivity**: α → β, γβ → δ ⇒ αγ → δ (PE 7.5)

Ví dụ R = (A, B, C, G, H, I), F = {A → B, A → C, CG → H, CG → I, B → H}: A → H (bắc cầu A → B → H); AG → I (augment A → C thành AG → CG, rồi bắc cầu với CG → I); CG → HI (union).

#### 10. Bao đóng thuộc tính α⁺ (slide 7.42–7.44)
\`\`\`text
result := α
while (result thay đổi) do
  for each β → γ in F do
    if β ⊆ result then result := result ∪ γ
\`\`\`
Ví dụ trên: (AG)⁺: AG → ABG (A → B) → ABCG (A → C) → ABCGH (CG → H) → ABCGHI (CG → I). Vậy AG là superkey; A⁺ = ABCH, G⁺ = G nên AG là **candidate key**.

Công dụng: kiểm tra **superkey** (α⁺ ⊇ R); kiểm tra α → β ∈ F⁺ (β ⊆ α⁺); tính F⁺ (với mọi γ ⊆ R, γ → S cho mọi S ⊆ γ⁺).

**Tìm candidate key nhanh**: thuộc tính không xuất hiện ở vế phải nào phải có trong **mọi** key; thuộc tính chỉ xuất hiện ở vế phải thì **không** thuộc key nào.

#### 11. Canonical cover F<sub>c</sub> (slide 7.45–7.53)
- A **thừa ở vế trái** của α → β nếu F ⇒ (α − A) → β: kiểm tra (α − A)⁺ dưới **F** có chứa β.
- A **thừa ở vế phải** nếu F' = (F − {α → β}) ∪ {α → (β − A)} ⇒ F: kiểm tra α⁺ dưới **F'** có chứa A.
- F<sub>c</sub>: tương đương F, không thuộc tính thừa, vế trái không trùng nhau.

Thuật toán: lặp { gộp các FD cùng vế trái (union); tìm **một** thuộc tính thừa rồi xoá } cho tới khi không đổi.

Ví dụ F = {A → BC, B → C, A → B, AB → C}: gộp A → BC, A → B thành A → BC; A thừa trong AB → C (B⁺ = BC chứa C) → B → C; C thừa trong A → BC (A⁺ dưới {A → B, B → C} chứa C) → **F<sub>c</sub> = {A → B, B → C}**. Canonical cover có thể không duy nhất (PE 7.14).

#### 12. Kiểm tra BCNF / 3NF (slide 7.55–7.62)
- Trên **lược đồ ban đầu R**: chỉ cần xét các FD trong F (không cần F⁺): mỗi α → β không tầm thường phải có α⁺ ⊇ R.
- Trên một **bảng con R<sub>i</sub>** sau phân rã, xét F thôi là **sai** (ví dụ R = (A, B, C, D, E), F = {A → B, BC → D}, R₁ = (A, C, D, E): F không có FD nào nằm trong R₁ nhưng AC → D ∈ F⁺ vi phạm). Phải kiểm tra: với mọi α ⊆ R<sub>i</sub>, α⁺ ∩ (R<sub>i</sub> − α) rỗng hoặc chứa hết R<sub>i</sub>.
- 3NF: mỗi α → β ∈ F, α superkey hoặc mọi thuộc tính trong β − α là prime (cần biết các candidate key).

#### 13. Thuật toán phân rã BCNF (slide 7.57–7.59)
\`\`\`text
result := {R}
while (có R_i trong result không ở BCNF) do
  chọn α → β vi phạm trên R_i (α → R_i ∉ F⁺, α ∩ β = ∅)
  result := (result − R_i) ∪ {R_i − β} ∪ {(α, β)}
\`\`\`
Ví dụ class(course_id, title, dept_name, credits, sec_id, semester, year, building, room_number, capacity, time_slot_id) với course_id → title, dept_name, credits; building, room_number → capacity; course_id, sec_id, semester, year → building, room_number, time_slot_id. Key: {course_id, sec_id, semester, year}. Tách theo course_id → course(course_id, title, dept_name, credits); phần còn lại tách theo building, room_number → classroom(building, room_number, capacity) và section(course_id, sec_id, semester, year, building, room_number, time_slot_id). Kết quả lossless và ở BCNF.

#### 14. Thuật toán tổng hợp 3NF (slide 7.63–7.66)
\`\`\`text
F_c := canonical cover của F; i := 0
for each α → β in F_c: nếu chưa R_j nào chứa αβ thì i++, R_i := αβ
nếu chưa R_j nào chứa một candidate key của R thì i++, R_i := một candidate key
(tuỳ chọn) bỏ R_j nằm trọn trong R_k khác
\`\`\`
Kết quả luôn: mỗi R<sub>i</sub> ở 3NF, **lossless** và **bảo toàn phụ thuộc**. Ví dụ cust_banker_branch(customer_id, employee_id, branch_name, type), F<sub>c</sub> = {customer_id, employee_id → type; employee_id → branch_name; customer_id, branch_name → employee_id} → (customer_id, employee_id, type), (employee_id, branch_name), (customer_id, branch_name, employee_id); bỏ (employee_id, branch_name) vì nằm trong lược đồ thứ ba. Key {customer_id, employee_id} đã có trong lược đồ đầu nên không cần thêm.

#### 15. Multivalued dependency và 4NF (slide 7.69–7.79)
- α →→ β: với mọi t₁, t₂ cùng α, tồn tại t₃, t₄ sao cho t₃ = (α, β của t₁, phần còn lại của t₂), t₄ = (α, β của t₂, phần còn lại của t₁). Nghĩa: với mỗi giá trị α, tập β **độc lập** với phần còn lại → lưu đủ mọi tổ hợp.
- Mọi FD là MVD: α → β ⇒ α →→ β. Nếu α →→ β thì α →→ R − α − β.
- **4NF**: mọi α →→ β không tầm thường (β ⊄ α và α ∪ β ≠ R) có α là superkey. 4NF ⇒ BCNF.
- inst_info: ID →→ child_name, ID →→ phone; ID không phải superkey → tách inst_child, inst_phone.

#### 16. 1NF và 2NF
- **1NF**: mọi domain **atomic** (không có thuộc tính đa trị/composite, không mã hoá nhiều thông tin trong một chuỗi như "CS0012").
- **2NF** (PE 7.19): không thuộc tính không khoá nào **phụ thuộc bộ phận** vào một candidate key (phụ thuộc vào tập con thực sự của key). Ví dụ (student_id, course_id, student_name, grade) với student_id → student_name: không 2NF. Mọi lược đồ 3NF đều ở 2NF.

| Dạng chuẩn | Điều kiện cho α → A không tầm thường |
|---|---|
| 2NF | A prime, hoặc A không phụ thuộc vào tập con thực sự của một candidate key |
| 3NF | α superkey, hoặc A prime |
| BCNF | α superkey |
| 4NF | (cho cả MVD) α superkey |
`,

  quiz: [
    {
      q: 'Lược đồ in_dep(ID, name, salary, dept_name, building, budget) có vấn đề gì?',
      options: ['Không có primary key', 'building, budget của một khoa bị lặp ở mọi giảng viên của khoa', 'Không thể join', 'Vi phạm 1NF'],
      answer: 1,
      explain: 'dept_name → building, budget nhưng dept_name không phải key → lặp thông tin, gây update/insert/delete anomaly.',
    },
    {
      q: 'Phân rã lossy nghĩa là gì?',
      options: ['Join các bảng con mất một số tuple gốc', 'Join các bảng con cho ra thêm tuple không có trong bảng gốc', 'Bảng con không có primary key', 'Một FD không được bảo toàn'],
      answer: 1,
      explain: 'r luôn ⊆ join các projection; lossy là join có tuple giả → không biết tuple nào là thật.',
    },
    {
      q: 'R = (A, B, C), F = {A → B}. Phân rã nào lossless?',
      options: ['(A, B), (B, C)', '(A, B), (A, C)', '(A, C), (B, C)', 'Không phân rã nào'],
      answer: 1,
      explain: 'R₁ ∩ R₂ = A và A → AB = R₁. Với (A, B), (B, C): phần chung B không xác định A hay C.',
    },
    {
      q: 'Trên một instance, mọi giảng viên có tên khác nhau. Có thể kết luận name → ID là FD của lược đồ instructor?',
      options: ['Có', 'Không — FD phải đúng trên mọi instance hợp lệ', 'Có, nếu bảng có trên 10 dòng', 'Chỉ khi name là unique'],
      answer: 1,
      explain: 'Một instance chỉ có thể chứng minh FD *không* đúng, không thể chứng minh FD đúng.',
    },
    {
      q: 'FD nào là tầm thường (trivial)?',
      options: ['ID → name', 'ID, name → name', 'name → ID', 'dept_name → building'],
      answer: 1,
      explain: 'β ⊆ α: {name} ⊆ {ID, name}.',
    },
    {
      q: 'K là superkey của R khi và chỉ khi:',
      options: ['K → R', 'R → K', 'K có một thuộc tính', 'K là primary key'],
      answer: 0,
      explain: 'K xác định mọi thuộc tính của R. Candidate key: thêm điều kiện tối thiểu.',
    },
    {
      q: 'R ở BCNF nếu mọi α → β không tầm thường trong F⁺ có:',
      options: ['α là candidate key', 'α là superkey', 'β là prime', 'α là superkey hoặc β prime'],
      answer: 1,
      explain: 'Superkey (không nhất thiết tối thiểu). "β − α prime" là điều kiện nới lỏng của 3NF.',
    },
    {
      q: 'Phân rã R theo FD vi phạm BCNF α → β cho ra:',
      options: ['(α ∪ β) và (R − (β − α))', '(α) và (β)', '(α ∪ β) và (R − α)', '(R − α) và (R − β)'],
      answer: 0,
      explain: 'Phần chung là α, là superkey của (α ∪ β) → lossless.',
    },
    {
      q: 'dept_advisor(s_ID, i_ID, dept_name), F = {i_ID → dept_name; s_ID, dept_name → i_ID}. Khẳng định nào đúng?',
      options: ['Ở BCNF', 'Ở 3NF nhưng không ở BCNF', 'Không ở 3NF', 'Không có candidate key'],
      answer: 1,
      explain: 'i_ID không phải superkey (vi phạm BCNF), nhưng dept_name thuộc key {s_ID, dept_name} nên vẫn 3NF.',
    },
    {
      q: 'Ưu điểm của 3NF so với BCNF là:',
      options: ['Không bao giờ dư thừa', 'Luôn tìm được phân rã 3NF lossless và bảo toàn phụ thuộc', 'Ít bảng hơn', 'Không cần FD'],
      answer: 1,
      explain: 'BCNF không phải lúc nào cũng bảo toàn phụ thuộc được (ví dụ dept_advisor).',
    },
    {
      q: 'Phân rã bảo toàn phụ thuộc có lợi gì?',
      options: ['Join nhanh hơn', 'Kiểm tra mọi FD chỉ cần xét từng bảng riêng, không cần join', 'Luôn lossless', 'Không cần primary key'],
      answer: 1,
      explain: 'Nếu một FD bị mất, mỗi lần update phải join các bảng để kiểm tra.',
    },
    {
      q: 'inst_info(ID, child_name, phone) không có FD không tầm thường. Khẳng định nào đúng?',
      options: ['Không ở BCNF', 'Ở BCNF nhưng vẫn dư thừa → cần 4NF', 'Ở 4NF', 'Vi phạm 1NF'],
      answer: 1,
      explain: 'ID →→ child_name là MVD không tầm thường, ID không phải superkey → không 4NF.',
    },
    {
      q: 'Luật nào KHÔNG phải tiên đề Armstrong?',
      options: ['Reflexivity', 'Augmentation', 'Transitivity', 'Union'],
      answer: 3,
      explain: 'Union được suy ra từ augmentation + transitivity (PE 7.4).',
    },
    {
      q: 'R = (A, B, C, G, H, I), F = {A → B, A → C, CG → H, CG → I, B → H}. (AG)⁺ = ?',
      options: ['ABCG', 'ABCGH', 'ABCGHI', 'AG'],
      answer: 2,
      explain: 'AG → +B, +C (A), +H, +I (CG) → ABCGHI, nên AG là superkey.',
    },
    {
      q: 'Kiểm tra A có thừa ở VẾ TRÁI của α → β, ta tính:',
      options: ['(α − A)⁺ dưới F, xem có chứa β', 'α⁺ dưới F, xem có chứa A', '(α − A)⁺ dưới F − {α → β}', 'β⁺ dưới F'],
      answer: 0,
      explain: 'Vế phải thì ngược lại: tính α⁺ dưới F\' (đã bỏ A khỏi β) xem còn chứa A không.',
    },
    {
      q: 'F = {A → BC, B → C, A → B, AB → C}. Canonical cover là:',
      options: ['{A → BC, B → C}', '{A → B, B → C}', '{A → B, AB → C}', '{A → C, B → C}'],
      answer: 1,
      explain: 'Gộp A → BC; A thừa trong AB → C; C thừa trong A → BC.',
    },
    {
      q: 'Bước cuối của thuật toán 3NF: nếu không lược đồ nào chứa candidate key thì thêm một lược đồ là candidate key. Mục đích?',
      options: ['Bảo toàn phụ thuộc', 'Đảm bảo lossless', 'Đảm bảo BCNF', 'Giảm số bảng'],
      answer: 1,
      explain: 'Bảo toàn phụ thuộc đã có nhờ mỗi FD trong F_c thành một bảng; key đảm bảo lossless (PE 7.16).',
    },
    {
      q: 'Lược đồ (student_id, course_id, student_name, grade), F = {student_id → student_name; student_id, course_id → grade}. Dạng chuẩn cao nhất?',
      options: ['1NF (không 2NF)', '2NF', '3NF', 'BCNF'],
      answer: 0,
      explain: 'student_name (không khoá) phụ thuộc bộ phận vào key {student_id, course_id}.',
    },
  ],

  questions: [
    {
      q: 'Cho R = (A, B, C, D, E), F = {AB → C, C → D, D → E}. Tính (AB)⁺, C⁺, tìm mọi candidate key.',
      answer: `- (AB)⁺: AB → ABC (AB → C) → ABCD (C → D) → ABCDE (D → E). AB là superkey.
- C⁺ = CDE, A⁺ = A, B⁺ = B → AB tối thiểu.
- A và B không xuất hiện ở vế phải nào → phải có trong mọi key; AB đã là superkey → **candidate key duy nhất: AB**.`,
    },
    {
      q: 'Tiếp tục bài trên: R có ở BCNF/3NF không? Phân rã R về BCNF; phân rã có bảo toàn phụ thuộc không?',
      answer: `- C → D: C không phải superkey, D không prime → vi phạm cả BCNF và 3NF (tương tự D → E).
- Tách theo C → D: dùng C⁺ = CDE, ta có (C, D, E) và (A, B, C).
- (C, D, E): D → E, D không phải superkey của CDE → tách (D, E) và (C, D).
- Kết quả: **(A, B, C), (C, D), (D, E)**. Mọi FD AB → C, C → D, D → E đều nằm trọn trong một bảng → **bảo toàn phụ thuộc**. Mỗi bước tách có phần chung là key của một bên → lossless.`,
    },
    {
      q: 'R = (A, B, C, D), F = {AB → C, C → D, D → A}. Tìm candidate key; R có ở 3NF? BCNF?',
      answer: `- B không ở vế phải nào → B thuộc mọi key. B⁺ = B.
- (AB)⁺ = ABCD; (BC)⁺: C → D → A → ABCD; (BD)⁺: D → A, AB → C → ABCD. **Key: AB, BC, BD** (đều tối thiểu).
- Mọi thuộc tính A, B, C, D đều prime → mọi FD thoả điều kiện thứ ba → **3NF**.
- C → D, D → A có vế trái không phải superkey → **không BCNF**.
- Phân rã BCNF (một cách): theo C → D → (C, D) và (A, B, C); trong (A, B, C) có C → A (suy ra qua C → D → A) vi phạm → (A, C), (B, C). Kết quả (C, D), (A, C), (B, C) — **mất AB → C** và D → A. Đây là lý do có lúc ta chọn dừng ở 3NF.`,
    },
    {
      q: 'Tính canonical cover của F = {A → BD, B → C, AB → C, D → C, A → C} trên R = (A, B, C, D).',
      answer: `1. Gộp A → BD và A → C: **A → BCD**.
2. Vế phải của A → BCD: bỏ C, F' = {A → BD, B → C, AB → C, D → C}; A⁺ dưới F' = ABCD chứa C → **C thừa** → A → BD.
3. Vế trái của AB → C: B⁺ = BC chứa C → **A thừa** → B → C (trùng FD đã có, gộp lại).
4. Kiểm tra tiếp: B và D trong A → BD không thừa (bỏ B: A⁺ = ACD thiếu B; bỏ D: A⁺ = ABC thiếu D).
**F<sub>c</sub> = {A → BD, B → C, D → C}**.`,
    },
    {
      q: 'R = (A, B, C, D), F = {A → B, C → D}. Phân rã nào lossless: (a) (A, B), (C, D); (b) (A, B, C), (C, D); (c) (A, B), (A, C, D)?',
      answer: `- (a) R₁ ∩ R₂ = ∅ → không xác định gì → **lossy** (join là Cartesian product).
- (b) Phần chung C, C⁺ = CD = R₂ → **lossless**.
- (c) Phần chung A, A⁺ = AB = R₁ → **lossless**.
Chú ý (b), (c) vẫn chưa ở BCNF: (A, B, C) có A → B với key AC; phân rã BCNF hoàn chỉnh là (A, B), (C, D), (A, C).`,
    },
    {
      q: 'R = (A, B, C), F = {A → B, B → C}. So sánh hai phân rã (A, B), (A, C) và (A, B), (B, C).',
      answer: `- Cả hai đều **lossless** (phần chung A → AB; phần chung B → BC).
- (A, B), (A, C): F₁ = {A → B}, F₂ = {A → C}; B → C **không** suy ra được từ F₁ ∪ F₂ → **không bảo toàn phụ thuộc**: muốn kiểm tra B → C phải join.
- (A, B), (B, C): A → B nằm trong R₁, B → C nằm trong R₂ → **bảo toàn phụ thuộc**, và cả hai bảng ở BCNF → phân rã tốt hơn.`,
    },
    {
      q: 'Dùng Armstrong\'s axioms chứng minh: từ F = {A → B, B → C, CD → E} suy ra AD → E.',
      answer: `1. A → B (cho), B → C (cho) ⇒ **A → C** (transitivity).
2. Augmentation với D: **AD → CD**.
3. AD → CD, CD → E ⇒ **AD → E** (transitivity).
(Hoặc dùng pseudotransitivity: A → C và CD → E ⇒ AD → E.) Kiểm tra bằng bao đóng: (AD)⁺ = ABCDE chứa E.`,
    },
    {
      q: 'R = (A, B, C, D, E, F), F = {A → B, B → C, CD → E, E → F}. Tìm key và phân rã 3NF bằng thuật toán tổng hợp.',
      answer: `- A, D không ở vế phải nào → thuộc mọi key; (AD)⁺: A → B → C, CD → E → F → **ABCDEF**. Key duy nhất: **AD**.
- F đã là canonical cover (vế trái khác nhau, không thuộc tính thừa).
- Mỗi FD một lược đồ: (A, B), (B, C), (C, D, E), (E, F).
- Chưa lược đồ nào chứa key AD → thêm **(A, D)**.
- Kết quả: (A, B), (B, C), (C, D, E), (E, F), (A, D) — 3NF, lossless, bảo toàn phụ thuộc.`,
    },
    {
      q: 'Phân rã class(course_id, title, dept_name, credits, sec_id, semester, year, building, room_number, capacity, time_slot_id) về BCNF (FD như slide 7.58). Giải thích vì sao kết quả lossless.',
      answer: `- Key: {course_id, sec_id, semester, year}.
- course_id → title, dept_name, credits vi phạm → **course(course_id, title, dept_name, credits)** và class-1(course_id, sec_id, semester, year, building, room_number, capacity, time_slot_id). Phần chung course_id là key của course → lossless.
- Trong class-1: building, room_number → capacity vi phạm → **classroom(building, room_number, capacity)** và **section(course_id, sec_id, semester, year, building, room_number, time_slot_id)**. Phần chung (building, room_number) là key của classroom → lossless.
- Ba bảng đều ở BCNF (vế trái mỗi FD còn lại là key của bảng chứa nó) và mọi FD đều nằm trong một bảng → bảo toàn phụ thuộc.`,
    },
    {
      q: 'Vì sao dept_advisor(s_ID, i_ID, dept_name) không thể vừa BCNF vừa bảo toàn phụ thuộc? Nếu giữ ở 3NF thì phải chịu dư thừa gì?',
      answer: `- Vi phạm BCNF là i_ID → dept_name → tách (i_ID, dept_name), (s_ID, i_ID). FD s_ID, dept_name → i_ID cần cả ba thuộc tính, không nằm trong bảng nào → mất. Mọi phân rã thực sự khác cũng tách rời ba thuộc tính này.
- Giữ nguyên 3NF: (i_ID, dept_name) bị lặp cho mỗi sinh viên mà giảng viên đó hướng dẫn; muốn ghi một giảng viên thuộc khoa nào mà chưa có sinh viên thì phải để s_ID null. Đổi lại, s_ID, dept_name → i_ID kiểm tra được bằng \`unique (s_ID, dept_name)\`.`,
    },
    {
      q: 'Cho inst_info(ID, child_name, phone). Giải thích ID →→ child_name bằng định nghĩa t₁, t₂, t₃, t₄; vì sao không ở 4NF và phân rã thế nào?',
      answer: `- Với t₁ = (99999, David, 512-555-1234) và t₂ = (99999, William, 512-555-4321), MVD đòi hỏi tồn tại t₃ = (99999, David, 512-555-4321) và t₄ = (99999, William, 512-555-1234): con và số điện thoại độc lập nên phải có đủ mọi tổ hợp.
- ID →→ child_name không tầm thường (child_name ⊄ ID và ID ∪ child_name ≠ R), ID không phải superkey → **không 4NF** (dù ở BCNF vì không có FD không tầm thường).
- Phân rã: **inst_child(ID, child_name)**, **inst_phone(ID, phone)**. Lossless vì phần chung ID →→ child_name. Thêm một số điện thoại giờ chỉ là một dòng.`,
    },
    {
      q: 'Cho R(student_id, course_id, student_name, grade), F = {student_id → student_name; student_id, course_id → grade}. Xác định dạng chuẩn và đưa về BCNF.',
      answer: `- Key: {student_id, course_id}. student_name không khoá, phụ thuộc vào student_id ⊂ key → **phụ thuộc bộ phận → không 2NF** (do đó không 3NF, không BCNF). Chỉ ở 1NF.
- Tách theo student_id → student_name: **(student_id, student_name)** và **(student_id, course_id, grade)**. Cả hai ở BCNF, lossless (phần chung student_id là key của bảng đầu), bảo toàn phụ thuộc.`,
    },
  ],

  exercises: [
    // ---------------- Redundancy & anomalies ----------------
    {
      id: '7.01', topic: 'redundancy', level: 1,
      prompt: 'Bảng `nf_in_dep(ID, name, salary, dept_name, building, budget)` là instructor ⋈ department (slide 7.3). Liệt kê các bộ (dept_name, building, budget) bị **lặp lại**, kèm số lần lặp `copies` (chỉ những bộ xuất hiện từ 2 lần).',
      solution: `select dept_name, building, budget, count(*) as copies
from nf_in_dep
group by dept_name, building, budget
having count(*) > 1;`,
    },
    {
      id: '7.02', topic: 'update anomaly', level: 1,
      prompt: 'Mô phỏng **update anomaly**: đổi budget của khoa Physics thành 95000 nhưng **chỉ** ở dòng của giảng viên ID `22222` trong `nf_in_dep`. (Hệ thống sẽ kiểm tra các khoa giờ có nhiều hơn một budget.)',
      solution: `update nf_in_dep set budget = 95000 where ID = '22222';`,
      check: `select dept_name, count(distinct budget) as n_budgets
from nf_in_dep group by dept_name having count(distinct budget) > 1;`,
    },
    // ---------------- Testing FDs on data ----------------
    {
      id: '7.03', topic: 'test FD', level: 1,
      prompt: 'Bảng `nf_enroll_raw(student_id, student_name, course_id, course_title, grade)` có dữ liệu "bẩn". Trả về các `student_id` **vi phạm** FD student_id → student_name.',
      hint: 'group by student_id having count(distinct student_name) > 1',
      solution: `select student_id
from nf_enroll_raw
group by student_id
having count(distinct student_name) > 1;`,
    },
    {
      id: '7.04', topic: 'FD violation tuples', level: 2,
      prompt: 'Liệt kê **mọi dòng** (mọi cột) của `nf_enroll_raw` tham gia vi phạm FD course_id → course_title.',
      solution: `select *
from nf_enroll_raw
where course_id in (select course_id from nf_enroll_raw
                    group by course_id
                    having count(distinct course_title) > 1);`,
    },
    {
      id: '7.05', topic: 'test FD', level: 2,
      prompt: 'Bảng `nf_class` là course ⋈ section ⋈ classroom (slide 7.58). Trả về **một dòng, hai cột boolean**: `room_capacity` — FD building, room_number → capacity có đúng trên instance không; `course_title` — FD course_id → title có đúng không.',
      hint: 'not exists (select ... group by ... having count(distinct ...) > 1)',
      solution: `select not exists (select building, room_number from nf_class
                   group by building, room_number
                   having count(distinct capacity) > 1) as room_capacity,
       not exists (select course_id from nf_class
                   group by course_id
                   having count(distinct title) > 1) as course_title;`,
    },
    {
      id: '7.06', topic: 'superkey on instance', level: 2,
      prompt: 'Trên `nf_class`, kiểm tra hai tập thuộc tính có xác định duy nhất mỗi dòng không. Trả về một dòng hai cột boolean: `k1` cho {course_id, sec_id, semester, year}, `k2` cho {course_id, semester, year}.',
      hint: 'count(*) = count(distinct (a, b, ...))',
      solution: `select count(*) = count(distinct (course_id, sec_id, semester, year)) as k1,
       count(*) = count(distinct (course_id, semester, year)) as k2
from nf_class;`,
    },
    {
      id: '7.07', topic: 'not a key', level: 1,
      prompt: 'Vì sao không được dùng name làm khoá khi phân rã `nf_employee(ID, name, street, city, salary)`? Trả về các name bị trùng và số nhân viên mang tên đó (`n`).',
      solution: `select name, count(*) as n from nf_employee group by name having count(*) > 1;`,
    },
    // ---------------- Lossy vs lossless ----------------
    {
      id: '7.08', topic: 'lossy decomposition', level: 2,
      prompt: 'Phân rã `nf_employee` thành R₁(ID, name) và R₂(name, street, city, salary) (slide 7.5). Trả về các **tuple giả**: có trong Π<sub>R1</sub> ⋈ Π<sub>R2</sub> nhưng không có trong bảng gốc, theo thứ tự cột ID, name, street, city, salary.',
      hint: '(select ID, name, street, city, salary from (...) r1 natural join (...) r2) except (select * from nf_employee)',
      solution: `select ID, name, street, city, salary
from (select ID, name from nf_employee) r1
     natural join (select name, street, city, salary from nf_employee) r2
except
select ID, name, street, city, salary from nf_employee;`,
    },
    {
      id: '7.09', topic: 'lossy decomposition', level: 1,
      prompt: 'Cùng phân rã như 7.08: trả về một dòng hai cột `original_rows` (số dòng của nf_employee) và `joined_rows` (số dòng của R₁ ⋈ R₂).',
      solution: `select (select count(*) from nf_employee) as original_rows,
       (select count(*)
        from (select ID, name from nf_employee) r1
             natural join (select name, street, city, salary from nf_employee) r2) as joined_rows;`,
    },
    {
      id: '7.10', topic: 'lossless decomposition', level: 2,
      prompt: 'Phân rã `nf_in_dep` thành (ID, name, salary, dept_name) và (dept_name, building, budget). Chứng minh trên dữ liệu là lossless: trả về một dòng ba cột `joined_rows`, `extra` (số tuple có trong join mà không có trong bảng gốc), `missing` (số tuple có trong bảng gốc mà không có trong join).',
      solution: `with j as (
  select ID, name, salary, dept_name, building, budget
  from (select ID, name, salary, dept_name from nf_in_dep) r1
       natural join (select distinct dept_name, building, budget from nf_in_dep) r2
)
select (select count(*) from j) as joined_rows,
       (select count(*) from (select * from j except select * from nf_in_dep) x) as extra,
       (select count(*) from (select * from nf_in_dep except select * from j) y) as missing;`,
    },
    // ---------------- BCNF ----------------
    {
      id: '7.11', topic: 'BCNF decomposition', level: 2,
      prompt: `Đưa \`nf_in_dep\` về BCNF theo FD dept_name → building, budget. Tạo:
- \`nf_department_part(dept_name primary key, building, budget)\`
- \`nf_instructor_part(ID primary key, name, salary, dept_name)\` với dept_name là **foreign key** tham chiếu nf_department_part

rồi chép dữ liệu từ nf_in_dep sang (không lặp).`,
      hint: 'insert into ... select distinct ...; tạo bảng department trước bảng instructor.',
      solution: `create table nf_department_part (
  dept_name  varchar(20) primary key,
  building   varchar(15),
  budget     numeric(12,2)
);
create table nf_instructor_part (
  ID         varchar(5) primary key,
  name       varchar(20),
  salary     numeric(8,2),
  dept_name  varchar(20) references nf_department_part
);
insert into nf_department_part select distinct dept_name, building, budget from nf_in_dep;
insert into nf_instructor_part select ID, name, salary, dept_name from nf_in_dep;`,
      check: `select (select count(*) from nf_department_part) as depts,
       (select count(*) from nf_instructor_part) as instructors,
       (select count(*) from information_schema.table_constraints
        where table_name in ('nf_department_part', 'nf_instructor_part')
          and constraint_type in ('PRIMARY KEY', 'FOREIGN KEY')) as key_constraints;`,
    },
    {
      id: '7.12', topic: 'BCNF decomposition', level: 3,
      prompt: 'Phân rã `nf_class` về BCNF như slide 7.58–7.59, dùng `create table ... as select distinct`: `nf_c_course(course_id, title, dept_name, credits)`, `nf_c_room(building, room_number, capacity)`, `nf_c_section(course_id, sec_id, semester, year, building, room_number, time_slot_id)`. (Hệ thống đếm số dòng mỗi bảng và số dòng của natural join ba bảng.)',
      solution: `create table nf_c_course as
  select distinct course_id, title, dept_name, credits from nf_class;
create table nf_c_room as
  select distinct building, room_number, capacity from nf_class;
create table nf_c_section as
  select distinct course_id, sec_id, semester, year, building, room_number, time_slot_id from nf_class;`,
      check: `select (select count(*) from nf_c_course) as courses,
       (select count(*) from nf_c_room) as rooms,
       (select count(*) from nf_c_section) as sections,
       (select count(*) from nf_c_section natural join nf_c_course natural join nf_c_room) as joined;`,
    },
    // ---------------- 3NF & dependency preservation ----------------
    {
      id: '7.13', topic: 'test FD (3NF)', level: 1,
      prompt: 'Bảng `nf_dept_advisor(s_ID, i_ID, dept_name)`. Trả về một dòng hai cột boolean: `fd1` — i_ID → dept_name có đúng; `fd2` — s_ID, dept_name → i_ID có đúng.',
      solution: `select not exists (select i_ID from nf_dept_advisor group by i_ID
                   having count(distinct dept_name) > 1) as fd1,
       not exists (select s_ID, dept_name from nf_dept_advisor group by s_ID, dept_name
                   having count(distinct i_ID) > 1) as fd2;`,
    },
    {
      id: '7.14', topic: 'lost dependency', level: 3,
      prompt: `Phân rã BCNF của dept_advisor: tạo \`nf_da_instr(i_ID primary key, dept_name)\` và \`nf_da_student(s_ID, i_ID, primary key (s_ID, i_ID))\` từ nf_dept_advisor. Sau đó chèn \`('00128', '45565')\` vào nf_da_student — không có ràng buộc nào của từng bảng bị vi phạm.
(Hệ thống join hai bảng để tìm vi phạm s_ID, dept_name → i_ID: đó chính là FD bị mất.)`,
      solution: `create table nf_da_instr (
  i_ID       varchar(5) primary key,
  dept_name  varchar(20)
);
create table nf_da_student (
  s_ID  varchar(5),
  i_ID  varchar(5),
  primary key (s_ID, i_ID)
);
insert into nf_da_instr select distinct i_ID, dept_name from nf_dept_advisor;
insert into nf_da_student select s_ID, i_ID from nf_dept_advisor;
insert into nf_da_student values ('00128', '45565');`,
      check: `select s_ID, dept_name, count(distinct i_ID) as advisors
from nf_da_student natural join nf_da_instr
group by s_ID, dept_name
having count(distinct i_ID) > 1;`,
    },
    {
      id: '7.15', topic: 'enforce FD by trigger', level: 3,
      prompt: `Tạo lại hai bảng \`nf_da_instr\`, \`nf_da_student\` như 7.14 (có dữ liệu), rồi viết **trigger** trên nf_da_student để từ chối insert/update làm một sinh viên có hai advisor cùng khoa (tức ép FD s_ID, dept_name → i_ID qua join).
Hệ thống thử chèn ('00128', '45565') — phải bị từ chối — và ('19991', '22222') — phải thành công.`,
      hint: 'Trigger function plpgsql: if exists (select ... from nf_da_student s join nf_da_instr a ... join nf_da_instr b on b.i_ID = new.i_ID where s.s_ID = new.s_ID and a.dept_name = b.dept_name and s.i_ID <> new.i_ID) then raise exception ...',
      solution: `create table nf_da_instr (i_ID varchar(5) primary key, dept_name varchar(20));
create table nf_da_student (s_ID varchar(5), i_ID varchar(5), primary key (s_ID, i_ID));
insert into nf_da_instr select distinct i_ID, dept_name from nf_dept_advisor;
insert into nf_da_student select s_ID, i_ID from nf_dept_advisor;

create function nf_check_one_advisor_per_dept() returns trigger
language plpgsql as $$
begin
  if exists (select 1
             from nf_da_student s
                  join nf_da_instr a on a.i_ID = s.i_ID
                  join nf_da_instr b on b.i_ID = new.i_ID
             where s.s_ID = new.s_ID and a.dept_name = b.dept_name and s.i_ID <> new.i_ID) then
    raise exception 'student % already has an advisor in that department', new.s_ID;
  end if;
  return new;
end $$;

create trigger nf_one_advisor_per_dept
before insert or update on nf_da_student
for each row execute function nf_check_one_advisor_per_dept();`,
      check: `select try_sql($$insert into nf_da_student values ('00128', '45565')$$) <> 'ok' as bad_rejected,
       try_sql($$insert into nf_da_student values ('19991', '22222')$$) as good_insert;`,
    },
    {
      id: '7.16', topic: '3NF + unique', level: 2,
      prompt: 'Giữ `nf_dept_advisor` ở 3NF thì FD s_ID, dept_name → i_ID kiểm tra được bằng một ràng buộc của chính bảng. Thêm ràng buộc đó. (Hệ thống thử chèn (\'00128\', \'45565\', \'Comp. Sci.\') — phải lỗi — và (\'19991\', \'22222\', \'Physics\') — phải được.)',
      solution: `alter table nf_dept_advisor add unique (s_ID, dept_name);`,
      check: `select try_sql($$insert into nf_dept_advisor values ('00128', '45565', 'Comp. Sci.')$$) as violating,
       try_sql($$insert into nf_dept_advisor values ('19991', '22222', 'Physics')$$) as valid;`,
    },
    {
      id: '7.17', topic: '3NF synthesis', level: 3,
      prompt: 'Bảng `nf_cust_banker(customer_id, employee_id, branch_name, type)` (slide 7.65). Tạo phân rã 3NF cuối cùng của slide bằng `create table ... as select distinct`: `nf_cb_type(customer_id, employee_id, type)` và `nf_cb_branch(customer_id, branch_name, employee_id)`. (Hệ thống đếm dòng mỗi bảng và kiểm tra join hai bảng tái tạo đúng bảng gốc.)',
      solution: `create table nf_cb_type as
  select distinct customer_id, employee_id, type from nf_cust_banker;
create table nf_cb_branch as
  select distinct customer_id, branch_name, employee_id from nf_cust_banker;`,
      check: `with j as (select customer_id, employee_id, branch_name, type from nf_cb_type natural join nf_cb_branch)
select (select count(*) from nf_cb_type) as type_rows,
       (select count(*) from nf_cb_branch) as branch_rows,
       (select count(*) from j) as joined_rows,
       (select count(*) from (select * from j except select * from nf_cust_banker) x) as extra;`,
    },
    // ---------------- MVD & 4NF ----------------
    {
      id: '7.18', topic: 'test MVD', level: 3,
      prompt: 'Bảng `nf_inst_info(ID, child_name, phone)`. MVD ID →→ child_name đúng với một ID khi các dòng của ID đó là **đủ mọi tổ hợp** con × số điện thoại. Trả về các ID **vi phạm**.',
      hint: 'count(*) <> count(distinct child_name) * count(distinct phone)',
      solution: `select ID
from nf_inst_info
group by ID
having count(*) <> count(distinct child_name) * count(distinct phone);`,
    },
    {
      id: '7.19', topic: '4NF decomposition', level: 2,
      prompt: 'Phân rã 4NF: tạo `nf_inst_child(ID, child_name)` và `nf_inst_phone(ID, phone)` từ nf_inst_info bằng `create table ... as select distinct`. (Hệ thống đếm dòng hai bảng và dòng của join — so với 7 dòng gốc, dòng thừa chính là tổ hợp mà MVD đòi hỏi nhưng instance 88888 còn thiếu.)',
      solution: `create table nf_inst_child as select distinct ID, child_name from nf_inst_info;
create table nf_inst_phone as select distinct ID, phone from nf_inst_info;`,
      check: `select (select count(*) from nf_inst_child) as children,
       (select count(*) from nf_inst_phone) as phones,
       (select count(*) from nf_inst_child natural join nf_inst_phone) as joined_rows;`,
    },
  ],
};
