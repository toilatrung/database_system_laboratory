export default {
  key: 'ck2',
  slug: 'ck2_pe_ch7',
  label: 'Ôn CK · Phần 2',
  navLabel: 'CK2',
  kind: 'Ôn tập',
  short: 'CK2',
  title: 'Practice Exercises — Chapter 7',
  titleVi: 'Practice Exercises Chương 7 (Normalization)',
  source: 'Practice Exercises 7.1–7.20, Database System Concepts, 7th Ed.',

  summary: `
### Cách ôn phần này
1. Đọc **cheat sheet** dưới đây, thuộc 6 thuật toán.
2. Làm **Câu hỏi tự luận**: mỗi câu là đúng một Practice Exercise (PE 7.1 → 7.20) — tự giải ra giấy rồi mới mở đáp án.
3. Làm **Bài tập SQL**: chạy các kết luận của PE trên dữ liệu thật (kiểm tra FD, lossless, bảo toàn phụ thuộc, 4NF).
4. Đối chiếu mọi bài tính tay bằng **Công cụ › Phụ thuộc hàm (FD)** (có preset cho PE 7.1/7.6/7.7/7.13, 7.14, 7.17).

### Cheat sheet — thuật toán cần thuộc
**A. Bao đóng α⁺**
1. result := α
2. Lặp: với mỗi β → γ ∈ F, nếu β ⊆ result thì result := result ∪ γ
3. Dừng khi không đổi. α superkey ⇔ α⁺ = R; α → β ∈ F⁺ ⇔ β ⊆ α⁺.

**B. Tìm candidate key**
1. Thuộc tính không ở vế phải nào → có trong mọi key (gọi là lõi).
2. Nếu lõi⁺ = R thì lõi là key duy nhất.
3. Ngược lại thử thêm lần lượt 1, 2, … thuộc tính (chỉ những thuộc tính xuất hiện ở cả hai vế), bỏ qua tập chứa key đã tìm.

**C. Canonical cover**
1. Gộp các FD cùng vế trái (union).
2. Tìm **một** thuộc tính thừa: vế trái — A ∈ α thừa nếu (α − A)⁺ dưới F chứa β; vế phải — A ∈ β thừa nếu α⁺ dưới F' (đã bỏ A khỏi β) chứa A.
3. Xoá nó, quay lại bước 1 tới khi không đổi. **Không xoá hai thuộc tính cùng lúc** (PE 7.15). Kết quả có thể không duy nhất (PE 7.14).

**D. Lossless (phân rã đôi)**: R₁ ∩ R₂ → R₁ hoặc R₁ ∩ R₂ → R₂ (tính (R₁ ∩ R₂)⁺).

**E. Bảo toàn phụ thuộc**: với mỗi α → β ∈ F: result := α; lặp với từng R<sub>i</sub>: result := result ∪ ((result ∩ R<sub>i</sub>)⁺ ∩ R<sub>i</sub>); FD được bảo toàn ⇔ β ⊆ result. (Mẹo nhanh: FD nằm trọn trong một R<sub>i</sub> thì chắc chắn được bảo toàn.)

**F. BCNF**: mọi α → β không tầm thường: α superkey. Phân rã: R → (α ∪ β), (R − (β − α)); lặp cho tới khi mọi bảng ở BCNF (trên bảng con phải xét F⁺, không chỉ F).

**G. 3NF**: mọi α → β: tầm thường, hoặc α superkey, hoặc mọi thuộc tính của β − α là prime. Tổng hợp: F<sub>c</sub> → mỗi FD một bảng αβ (nếu chưa có bảng chứa) → thêm một candidate key nếu chưa bảng nào chứa key → bỏ bảng nằm trong bảng khác.

**H. Dạng chuẩn**: 1NF (atomic) ⊃ 2NF (không phụ thuộc bộ phận vào key) ⊃ 3NF (không phụ thuộc bắc cầu vào key) ⊃ BCNF (vế trái là superkey) ⊃ 4NF (kể cả MVD).

### Bảng đối chiếu Practice Exercise → câu ôn
| PE | Nội dung | Tự luận | SQL |
|---|---|---|---|
| 7.1 | Lossless của (ABC), (ADE) | Câu 1 | CK2.05 |
| 7.2 | Liệt kê FD thoả trên một instance | Câu 2 | CK2.01, CK2.02 |
| 7.3 | FD biểu diễn quan hệ 1-1 / nhiều-1 | Câu 3 | CK2.14 |
| 7.4 | Chứng minh union rule | Câu 4 | — |
| 7.5 | Chứng minh pseudotransitivity | Câu 5 | — |
| 7.6 | F⁺ và candidate key | Câu 6 | CK2.06 |
| 7.7 | Canonical cover | Câu 7 | — |
| 7.8 | Thuật toán α⁺ tuyến tính | Câu 8 | — |
| 7.9 | SQL kiểm tra và ép FD B → C | Câu 9 | CK2.03, CK2.04 |
| 7.10 | Null ở vế trái FD làm hỏng lossless | Câu 10 | CK2.08 |
| 7.11 | PK/FK sau phân rã BCNF/3NF | Câu 11 | CK2.09 |
| 7.12 | u ⊆ r₁ ⋈ … ⋈ r<sub>n</sub> | Câu 12 | CK2.10 |
| 7.13 | (ABC), (ADE) không bảo toàn phụ thuộc | Câu 13 | CK2.07 |
| 7.14 | Nhiều canonical cover | Câu 14 | — |
| 7.15 | Không xoá hai thuộc tính thừa cùng lúc | Câu 15 | — |
| 7.16 | 3NF + candidate key ⇒ lossless | Câu 16 | — |
| 7.17 | Ba phân rã BCNF khác nhau | Câu 17 | CK2.11 |
| 7.18 | Định nghĩa 3NF qua phụ thuộc bắc cầu | Câu 18 | — |
| 7.19 | 3NF ⇒ 2NF | Câu 19 | — |
| 7.20 | BCNF nhưng không 4NF | Câu 20 | CK2.12, CK2.13 |

Các PE chỉ có "—" là chứng minh/lập luận, không chạy SQL được; hãy luyện viết ra giấy.
`,

  quiz: [
    {
      q: '(PE 7.1) R = (A, B, C, D, E), F = {A → BC, CD → E, B → D, E → A}, phân rã (A, B, C), (A, D, E). Vì sao lossless?',
      options: ['Vì A → D', 'Vì R₁ ∩ R₂ = A và A → ABC (A là candidate key)', 'Vì mọi phân rã thành 2 bảng đều lossless', 'Vì E → A'],
      answer: 1,
      explain: 'Phần chung A là superkey của R₁ (thậm chí của R).',
    },
    {
      q: '(PE 7.2) Instance r(A, B, C) = {(a1,b1,c1), (a1,b1,c2), (a2,b1,c1), (a2,b1,c3)}. FD đơn nào thoả?',
      options: ['A → C', 'C → A', 'A → B và C → B', 'B → A'],
      answer: 2,
      explain: 'Mọi dòng có cùng b1 nên mọi X → B đều thoả; A → C sai (dòng 1, 2), C → A sai (dòng 1, 3).',
    },
    {
      q: '(PE 7.3) FD nào biểu diễn quan hệ NHIỀU-MỘT từ student tới instructor?',
      options: ['Pk(instructor) → Pk(student)', 'Pk(student) → Pk(instructor)', 'Cả hai chiều', 'Không biểu diễn được bằng FD'],
      answer: 1,
      explain: 'Mỗi student ứng với ≤ 1 instructor. Có thêm chiều ngược lại thì thành một-một.',
    },
    {
      q: '(PE 7.4) Chứng minh union rule (α → β, α → γ ⇒ α → βγ) cần những tiên đề nào?',
      options: ['Chỉ reflexivity', 'Augmentation (hai lần) và transitivity', 'Chỉ transitivity', 'Decomposition'],
      answer: 1,
      explain: 'α → αβ (augment α), αβ → γβ (augment β), rồi bắc cầu.',
    },
    {
      q: '(PE 7.6) Candidate key của R = (A, B, C, D, E) với F = {A → BC, CD → E, B → D, E → A}:',
      options: ['A', 'A, E', 'A, E, BC, CD', 'A, BC, BD'],
      answer: 2,
      explain: 'A⁺ = E⁺ = (BC)⁺ = (CD)⁺ = R; B⁺ = BD, (BD)⁺ = BD nên BD không phải key.',
    },
    {
      q: '(PE 7.7) Canonical cover của F trong PE 7.6 là:',
      options: ['F (không có gì thừa)', '{A → B, A → C, CD → E, B → D, E → A}', '{A → BC, B → D, E → A}', '{A → BCDE, E → A}'],
      answer: 0,
      explain: 'Vế trái khác nhau, kiểm tra từng thuộc tính đều không thừa.',
    },
    {
      q: '(PE 7.9) Câu SQL nào trả về rỗng khi và chỉ khi B → C đúng trên r?',
      options: ['select B from r group by B having count(distinct C) > 1', 'select B, C from r group by B, C having count(*) > 1', 'select C from r group by C having count(distinct B) > 1', 'select count(*) from r'],
      answer: 0,
      explain: 'Một giá trị B đi với ≥ 2 giá trị C là vi phạm. Đáp án C kiểm tra C → B.',
    },
    {
      q: '(PE 7.10) Vì sao null ở vế trái của FD dùng để phân rã có thể làm phân rã thành lossy?',
      options: ['Vì null làm sai primary key', 'Vì natural join so sánh null = null cho unknown nên các tuple có null ở thuộc tính chung bị loại khỏi kết quả', 'Vì null chiếm nhiều bộ nhớ', 'Vì FD không áp dụng cho null'],
      answer: 1,
      explain: 'Ở đây "lossy" theo nghĩa mất tuple, khác lossy thông thường (thừa tuple).',
    },
    {
      q: '(PE 7.11) Phân rã BCNF r(α, β, γ) theo α → β thành r₁(α, β), r₂(α, γ). Ràng buộc nên có:',
      options: ['α là primary key của r₂', 'α là primary key của r₁, và α trong r₂ là foreign key tham chiếu r₁', 'β là foreign key', 'Không cần ràng buộc'],
      answer: 1,
      explain: 'Thiếu FK thì có thể xoá dòng ở r₁ mà vẫn còn dòng tham chiếu ở r₂.',
    },
    {
      q: '(PE 7.12) Với phân rã bất kỳ, quan hệ giữa u và r₁ ⋈ … ⋈ r<sub>n</sub> (r<sub>i</sub> = Π<sub>Ri</sub>(u)) là:',
      options: ['u = join', 'u ⊆ join', 'join ⊆ u', 'Không xác định'],
      answer: 1,
      explain: 'Mỗi tuple t của u tự join lại thành t. Bằng nhau khi phân rã lossless.',
    },
    {
      q: '(PE 7.13) FD nào KHÔNG được bảo toàn khi tách R ở PE 7.1 thành (A, B, C), (A, D, E)?',
      options: ['A → BC', 'E → A', 'B → D', 'Mọi FD đều được bảo toàn'],
      answer: 2,
      explain: 'B và D ở hai bảng khác nhau; B⁺ trong R₁ chỉ là B nên không bắc cầu qua A được. (CD → E cũng bị mất.)',
    },
    {
      q: '(PE 7.14) F = {X → YZ, Y → XZ, Z → XY}. Khẳng định nào đúng?',
      options: ['Canonical cover là duy nhất', 'Có nhiều canonical cover, ví dụ {X → Y, Y → Z, Z → X} và {X → Z, Y → X, Z → Y}', 'F không có canonical cover', 'Canonical cover phải giữ nguyên F'],
      answer: 1,
      explain: 'Thứ tự xoá thuộc tính thừa khác nhau cho kết quả khác nhau nhưng tương đương.',
    },
    {
      q: '(PE 7.15) Trong X → YZ (PE 7.14), Y và Z đều được suy ra là thừa. Xoá cả hai cùng lúc thì sao?',
      options: ['Vẫn đúng', 'Mất X → YZ: không còn suy ra được từ F mới', 'Lỗi cú pháp', 'Được canonical cover nhỏ hơn'],
      answer: 1,
      explain: 'Xoá Y thì Z không còn thừa và ngược lại; phải xoá từng thuộc tính một.',
    },
    {
      q: '(PE 7.16) Phân rã 3NF bảo toàn phụ thuộc trở thành lossless khi:',
      options: ['Mọi bảng có primary key', 'Ít nhất một bảng chứa một candidate key của R', 'Có đúng 2 bảng', 'Không có null'],
      answer: 1,
      explain: 'Đó là lý do thuật toán 3NF thêm một bảng là candidate key nếu cần.',
    },
    {
      q: '(PE 7.19) Mọi lược đồ 3NF đều ở 2NF vì:',
      options: ['Mọi phụ thuộc bộ phận vào key là một phụ thuộc bắc cầu', '2NF mạnh hơn 3NF', 'Mọi thuộc tính đều prime', 'Không có FD'],
      answer: 0,
      explain: 'Nếu A phụ thuộc vào β ⊂ key α thì α → β, β ↛ α, β → A: A bắc cầu vào α.',
    },
    {
      q: '(PE 7.20) R(A, B, C) chỉ có MVD không tầm thường A →→ B. R ở:',
      options: ['4NF', 'BCNF nhưng không 4NF', 'Không ở BCNF', '3NF nhưng không BCNF'],
      answer: 1,
      explain: 'Không có FD không tầm thường → BCNF; A không phải superkey mà A →→ B không tầm thường → không 4NF.',
    },
  ],

  questions: [
    {
      q: '**PE 7.1.** Phân rã R = (A, B, C, D, E) thành (A, B, C) và (A, D, E). Chứng minh phân rã lossless nếu F = {A → BC, CD → E, B → D, E → A}.',
      answer: `- R₁ = (A, B, C), R₂ = (A, D, E), **R₁ ∩ R₂ = A**.
- Tính A⁺: A → ABC (A → BC) → ABCD (B → D) → ABCDE (CD → E). Vậy A → ABC = R₁ (A là candidate key của R, xem PE 7.6).
- Theo tiêu chuẩn lossless: R₁ ∩ R₂ → R₁ ∈ F⁺ ⇒ **lossless**.`,
    },
    {
      q: '**PE 7.2.** Liệt kê mọi FD không tầm thường thoả bởi instance r(A, B, C) = {(a1, b1, c1), (a1, b1, c2), (a2, b1, c1), (a2, b1, c3)}.',
      answer: `*(Errata: lời giải trong sách ghi "Figure 7.18", đúng ra là Figure 7.17.)*
- Mọi dòng có cùng B = b1 ⇒ vế phải B luôn thoả: **A → B**, **C → B**, và hệ quả **AC → B**.
- **A ↛ C**: dòng 1, 2 cùng a1 nhưng c1 ≠ c2. Cũng dòng đó cho **B ↛ C**.
- **C ↛ A**: dòng 1, 3 cùng c1 nhưng a1 ≠ a2. Cũng dòng đó cho **B ↛ A**.
- Các tập vế trái khác (AB, BC) cũng không xác định thêm thuộc tính nào: AB ↛ C (dòng 1, 2), BC ↛ A (dòng 1, 3). (AC là duy nhất trên instance nên AC → B là FD không tầm thường duy nhất có vế trái hai thuộc tính.)
- Có **19** FD tầm thường α → β (β ⊆ α, β ≠ ∅): 3·1 + 3·3 + 1·7 = 19.`,
    },
    {
      q: '**PE 7.3.** Dùng FD để biểu diễn: (a) quan hệ một-một giữa student và instructor; (b) quan hệ nhiều-một giữa student và instructor.',
      answer: `Gọi Pk(r) là primary key của r, xét relation của relationship set.
- (a) **Pk(student) → Pk(instructor)** và **Pk(instructor) → Pk(student)**: hai tuple cùng student phải cùng instructor và ngược lại.
- (b) Chỉ **Pk(student) → Pk(instructor)**: một student ứng với tối đa một instructor, nhưng nhiều student có thể cùng một instructor.
(Thử trên bảng advisor của University ở CK2.14: s_ID → i_ID đúng, i_ID → s_ID sai ⇒ nhiều-một.)`,
    },
    {
      q: '**PE 7.4.** Dùng Armstrong\'s axioms chứng minh tính đúng đắn (soundness) của union rule: α → β và α → γ ⇒ α → βγ.',
      answer: `1. α → β (giả thiết)
2. αα → αβ, tức **α → αβ** (augmentation với α; αα = α)
3. α → γ (giả thiết)
4. **αβ → γβ** (augmentation với β)
5. α → αβ và αβ → γβ ⇒ **α → βγ** (transitivity; γβ = βγ).`,
    },
    {
      q: '**PE 7.5.** Dùng Armstrong\'s axioms chứng minh pseudotransitivity: α → β và γβ → δ ⇒ αγ → δ.',
      answer: `1. α → β (giả thiết)
2. **γα → γβ** (augmentation với γ; viết lại αγ → γβ)
3. γβ → δ (giả thiết)
4. αγ → γβ, γβ → δ ⇒ **αγ → δ** (transitivity).`,
    },
    {
      q: '**PE 7.6.** Tính F⁺ của F = {A → BC, CD → E, B → D, E → A} trên R = (A, B, C, D, E) và liệt kê candidate key.',
      answer: `Không cần liệt kê hết F⁺ — chỉ cần các bao đóng:
- **A⁺** = ABCDE (A → BC, B → D, CD → E).
- **E⁺** = ABCDE (E → A rồi như trên).
- **(CD)⁺** = ABCDE (CD → E, E → A, A → BC).
- **(BC)⁺** = ABCDE (B → D, CD → E, E → A).
- B⁺ = BD, C⁺ = C, D⁺ = D, (BD)⁺ = BD.

Do đó F⁺ gồm: **mọi FD có vế trái chứa A, E, BC hoặc CD** (với vế phải bất kỳ ⊆ R), cộng các FD từ những vế trái còn lại: B → D, B → BD, BD → D, BD → B, BD → BD, và các FD tầm thường (C → C, D → D, …).

**Candidate key: A, E, BC, CD** (mỗi tập đều tối thiểu; các tập không chứa A, E chỉ có BC, CD là superkey, BD thì không).`,
    },
    {
      q: '**PE 7.7.** Dùng F của PE 7.6, tính canonical cover.',
      answer: `- Vế trái A, CD, B, E đôi một khác nhau → không gộp được.
- A → BC: bỏ B, F' có A → C ⇒ A⁺ = AC không chứa B → B không thừa; bỏ C ⇒ A⁺ = ABD không chứa C → C không thừa.
- CD → E: C thừa? D⁺ = D không chứa E → không; D thừa? C⁺ = C → không.
- B → D, E → A: vế trái và vế phải chỉ một thuộc tính; bỏ vế phải thì B⁺ = B, E⁺ = E → không thừa.
⇒ **F<sub>c</sub> = F** = {A → BC, CD → E, B → D, E → A}.`,
    },
    {
      q: '**PE 7.8.** Xét thuật toán tính α⁺ dùng mảng fdcount (số thuộc tính vế trái của FD thứ i chưa có trong α⁺) và appears[A] (danh sách FD có A ở vế trái), với thủ tục đệ quy addin. Chứng minh thuật toán đúng và hiệu quả hơn thuật toán của Figure 7.8.',
      answer: `**Đúng (chỉ thêm thuộc tính thuộc α⁺)**: α ⊆ α⁺ hiển nhiên. Một thuộc tính A ∉ α chỉ được thêm khi có FD β → γ với A ∈ γ và fdcount = 0, tức β ⊆ result; quy nạp theo độ sâu đệ quy: mọi thứ trong result thuộc α⁺ ⇒ β ⊆ α⁺ ⇒ γ ⊆ α⁺.

**Đầy đủ (mọi A ∈ α⁺ đều được thêm)**: quy nạp theo độ dài chứng minh α → A bằng Armstrong. Gọi addin(α) thì mọi thuộc tính của α được thêm; khi fdcount của một FD về 0 thì mọi thuộc tính vế phải của nó được thêm. Nếu bước cuối của chứng minh là reflexivity/augmentation thì A đã có sẵn; nếu là transitivity với β → γ (A ∈ γ, α → β chứng minh được trong ≤ n bước) thì theo giả thiết quy nạp β ⊆ result nên fdcount của β → γ về 0 và A được thêm.

**Hiệu quả**: mỗi FD được duyệt một lần để khởi tạo; mảng appears có kích thước tỉ lệ tổng độ dài F; mỗi thuộc tính được thêm vào result đúng một lần và mỗi lần giảm fdcount tương ứng một phần tử của appears ⇒ **tuyến tính** theo kích thước F. Thuật toán Figure 7.8 có thể lặp vòng while |F| lần, mỗi vòng duyệt cả F ⇒ **bậc hai**.`,
    },
    {
      q: '**PE 7.9.** Cho R(A, B, C) và relation r. Viết câu SQL kiểm tra FD B → C có đúng trên r không, và một SQL assertion ép FD này (giả sử không có null).',
      answer: `Kiểm tra (kết quả **khác rỗng ⇔ B → C bị vi phạm**):
\`\`\`sql
select B from r group by B having count(distinct C) > 1;
\`\`\`
Assertion (chuẩn SQL):
\`\`\`sql
create assertion b_to_c check (not exists (
  select B from r group by B having count(distinct C) > 1));
\`\`\`
PostgreSQL (và các DBMS phổ biến) **không hỗ trợ assertion** → dùng trigger kiểm tra trước insert/update (xem CK2.04). Nếu B là khoá của một bảng riêng (B, C) thì chỉ cần primary key — đó chính là lợi ích của phân rã BCNF.`,
    },
    {
      q: '**PE 7.10.** Thảo luận lossless ngầm giả định thuộc tính ở vế trái FD không được null. Điều gì có thể sai nếu vi phạm giả định này?',
      answer: `Natural join định nghĩa qua Cartesian product + selection; so sánh với null cho **unknown** nên tuple có null ở thuộc tính chung **không khớp** với tuple nào — kể cả "bản sao" của chính nó ở bảng kia. Vì vậy khi phân rã theo α → β mà α có null, các tuple đó **biến mất** khỏi join: phân rã trở thành lossy theo nghĩa *mất tuple* (khác lossy thông thường là *thừa tuple*). Null ở thuộc tính chỉ nằm ở vế phải thì không gây vấn đề. Xem CK2.08.`,
    },
    {
      q: '**PE 7.11.** Trong thuật toán BCNF, dùng α → β để tách r(α, β, γ) thành r₁(α, β), r₂(α, γ). (a) Nên có primary key/foreign key nào? (b) Nếu không ép foreign key thì bất nhất gì có thể xảy ra? (c) Với phân rã 3NF (thuật toán 7.5.2), PK/FK nào nên có?',
      answer: `- (a) **α là primary key của r₁**; **α trong r₂ là foreign key tham chiếu r₁**.
- (b) Xoá một tuple của r₁ mà không xoá các tuple tham chiếu nó trong r₂: join r₁ ⋈ r₂ sẽ mất các tuple đó — tương đương với việc *đặt β thành null* trong các tuple gốc thay vì xoá chúng. (Tương tự: chèn vào r₂ một α không có trong r₁.) CK2.09 cho thấy FK chặn được cả hai.
- (c) Với mỗi lược đồ r<sub>i</sub>(α, β) sinh từ α → β: **α là primary key**. Lược đồ chứa candidate key của R: key đó là primary key. Foreign key: nếu primary key của r<sub>i</sub> xuất hiện trong r<sub>j</sub> khác thì các thuộc tính đó trong r<sub>j</sub> là foreign key tham chiếu r<sub>i</sub>.`,
    },
    {
      q: '**PE 7.12.** Cho R₁, …, R<sub>n</sub> là phân rã của U, u(U) là relation và r<sub>i</sub> = Π<sub>Ri</sub>(u). Chứng minh u ⊆ r₁ ⋈ r₂ ⋈ … ⋈ r<sub>n</sub>.',
      answer: `Lấy t bất kỳ thuộc u. Vì r<sub>i</sub> = Π<sub>Ri</sub>(u) nên t[R<sub>i</sub>] ∈ r<sub>i</sub> với mọi i, do đó t[R₁] ⋈ … ⋈ t[R<sub>n</sub>] ⊆ r₁ ⋈ … ⋈ r<sub>n</sub>.
Theo định nghĩa natural join, t[R₁] ⋈ … ⋈ t[R<sub>n</sub>] = Π<sub>U</sub>(σ<sub>θ</sub>(t[R₁] × … × t[R<sub>n</sub>])) với θ: các thuộc tính trùng tên bằng nhau. Tích Cartesian của các tuple đơn cho một tuple; θ thoả vì mọi thuộc tính trùng tên đều lấy từ cùng t; phép chiếu bỏ cột trùng. Vì U = R₁ ∪ … ∪ R<sub>n</sub>, tuple thu được chứa đủ mọi thuộc tính của t, tức **chính là t**. Vậy t ∈ r₁ ⋈ … ⋈ r<sub>n</sub>; do t tuỳ ý nên u ⊆ r₁ ⋈ … ⋈ r<sub>n</sub>. (Dấu bằng xảy ra khi phân rã lossless.) Xem CK2.10.`,
    },
    {
      q: '**PE 7.13.** Chứng minh phân rã ở PE 7.1 không bảo toàn phụ thuộc.',
      answer: `Xét **B → D**. F₁ (FD của F⁺ trên (A, B, C)) không có FD nào có D ở vế phải (D không thuộc R₁). F₂ (trên (A, D, E)) không có FD nào có B ở vế trái. Để suy ra B → D từ F₁ ∪ F₂ phải có B → γ ∈ F₁⁺ và γ → D ∈ F₂⁺, với γ ⊆ R₁ ∩ R₂ = A. Nhưng **B → A ∉ F₁⁺** vì B⁺ = BD. Vậy B → D không được bảo toàn.
Kiểm tra bằng thuật toán bảo toàn: result = B; (B ∩ R₁)⁺ ∩ R₁ = BD ∩ ABC = B; (B ∩ R₂) = ∅ → result dừng ở B, không chứa D. (Tương tự **CD → E** cũng bị mất.) Trên dữ liệu: CK2.07 chèn hai tuple hợp lệ ở từng bảng nhưng join vi phạm B → D.`,
    },
    {
      q: '**PE 7.14.** Chứng minh có thể có nhiều canonical cover, dùng F = {X → YZ, Y → XZ, Z → XY}.',
      answer: `- Z thừa trong X → YZ (vì X → Y, Y → XZ cho X → Z) → X → Y; tiếp theo X thừa trong Y → XZ → Y → Z; Y thừa trong Z → XY → Z → X. Được **{X → Y, Y → Z, Z → X}**.
- Hoặc: Y thừa trong X → YZ → X → Z; Z thừa trong Y → XZ → Y → X; X thừa trong Z → XY → Z → Y. Được **{X → Z, Y → X, Z → Y}**.
- Còn có cách khác: bỏ Y khỏi X → YZ, bỏ X khỏi Y → XZ, rồi không còn gì thừa trong Z → XY: **{X → Z, Y → Z, Z → XY}** (công cụ FD trả về kết quả này). Mọi cover trên đều tương đương F (X, Y, Z xác định lẫn nhau).`,
    },
    {
      q: '**PE 7.15.** Thuật toán canonical cover chỉ xoá **một** thuộc tính thừa mỗi lần. Dùng F của PE 7.14 để chỉ ra điều gì sai nếu xoá hai thuộc tính cùng lúc.',
      answer: `Trong X → YZ: Y thừa (vì X → Z → … → Y qua các FD khác) và Z cũng thừa (vì X → Y → … → Z). Nhưng nếu **xoá cả hai** thì còn X → ∅ (bỏ FD), và F mới {Y → XZ, Z → XY} không suy ra được X → YZ (X⁺ = X). Lý do: sau khi xoá Y, Z **không còn** thừa nữa (nó là con đường duy nhất để X suy ra Y), và ngược lại. Mỗi kết luận "thừa" chỉ đúng với F hiện tại, nên phải xoá từng thuộc tính rồi kiểm tra lại.`,
    },
    {
      q: '**PE 7.16.** Chứng minh phân rã 3NF bảo toàn phụ thuộc là lossless nếu ít nhất một lược đồ chứa candidate key của lược đồ bị phân rã.',
      answer: `Gọi δ = {R₁, …, R<sub>n</sub>} là phân rã 3NF bảo toàn phụ thuộc, X là candidate key nằm trong một R<sub>k</sub>; r là instance hợp lệ, j = Π<sub>X</sub>(r) ⋈ Π<sub>R1</sub>(r) ⋈ … ⋈ Π<sub>Rn</sub>(r).
1. **Khẳng định**: hai tuple t₁, t₂ ∈ j cùng giá trị X thì t₁ = t₂. Chạy thuật toán bao đóng X⁺ dưới F' = F₁ ∪ … ∪ F<sub>n</sub>; quy nạp theo số bước: ban đầu result = X nên t₁[result] = t₂[result]; mỗi bước dùng β → γ với β ⊆ result và β → γ thuộc một F<sub>i</sub>; vì t₁[R<sub>i</sub>], t₂[R<sub>i</sub>] ∈ Π<sub>Ri</sub>(r) thoả β → γ nên t₁[γ] = t₂[γ]. Do δ bảo toàn phụ thuộc và X là key, cuối cùng result = R ⇒ t₁ = t₂.
2. Vậy |j| = |Π<sub>X</sub>(j)| = |Π<sub>X</sub>(r)| = |r| (X là key của r).
3. Theo PE 7.12, r ⊆ j; cùng số tuple ⇒ **r = j**, tức lossless. (Vì vậy thuật toán 3NF thêm lược đồ X nếu chưa có.)`,
    },
    {
      q: '**PE 7.17.** Cho ví dụ lược đồ R\' và tập F\' sao cho có ít nhất ba phân rã lossless khác nhau của R\' thành BCNF.',
      answer: `R\' = (A, B, C, D), F\' = {A → B, C → D, B → C} (key duy nhất: A). Ba phân rã BCNF:
- **{(A, B), (C, D), (B, C)}** — tách theo C → D, rồi B → C. Bảo toàn mọi FD.
- **{(A, B), (C, D), (A, C)}** — tách theo C → D, rồi A → B (hoặc theo A → C suy ra). Mất B → C.
- **{(B, C), (A, D), (A, B)}** — tách theo B → C, rồi A → B (A → D suy ra). Mất C → D.
Mỗi bảng hai thuộc tính luôn ở BCNF; mỗi bước tách có phần chung là key của một bên nên lossless (đã kiểm tra bằng chase trong công cụ FD và trên dữ liệu ở CK2.11). Ví dụ cho thấy kết quả thuật toán BCNF phụ thuộc thứ tự chọn FD — và không phải phân rã nào cũng tốt như nhau.`,
    },
    {
      q: '**PE 7.18.** Thuộc tính prime là thuộc tính nằm trong ít nhất một candidate key. A *phụ thuộc bắc cầu* vào α nếu α → β, β ↛ α, β → A, A ∉ α, A ∉ β. Chứng minh định nghĩa "R ở 3NF nếu không có thuộc tính không khoá A nào phụ thuộc bắc cầu vào một key" tương đương định nghĩa của sách.',
      answer: `**Sách ⇒ định nghĩa mới**: giả sử A không khoá phụ thuộc bắc cầu vào key α qua β. Xét β → A: (1) không tầm thường vì A ∉ β; (2) β không phải superkey vì β ↛ α; (3) A không thuộc candidate key nào vì A không khoá. Cả ba điều kiện 3NF đều sai ⇒ mâu thuẫn với R ở 3NF theo sách.

**Định nghĩa mới ⇒ sách**: giả sử R không ở 3NF theo sách: có α → β mà (1) không tầm thường, (2) α không phải superkey, (3) có A ∈ β − α không thuộc key nào. Lấy γ là một candidate key: γ → α; α ↛ γ (vì α không phải superkey); α → A; A ∉ α; A ∉ γ (A không khoá). Vậy A phụ thuộc bắc cầu vào key γ ⇒ vi phạm định nghĩa mới.`,
    },
    {
      q: '**PE 7.19.** α → β là phụ thuộc bộ phận nếu có γ ⊂ α thực sự với γ → β. R ở 2NF nếu mỗi thuộc tính A hoặc thuộc một candidate key, hoặc không phụ thuộc bộ phận vào candidate key nào. Chứng minh mọi lược đồ 3NF đều ở 2NF.',
      answer: `Viết lại 2NF: không có thuộc tính không khoá A nào phụ thuộc bộ phận vào một candidate key. Dùng định nghĩa 3NF của PE 7.18, chỉ cần chứng minh: **mọi phụ thuộc bộ phận của A không khoá vào key α là một phụ thuộc bắc cầu**.
- A phụ thuộc bộ phận vào α ⇒ có β ⊂ α thực sự với β → A.
- β ⊂ α ⇒ α → β (reflexivity). β ↛ α vì nếu không β là superkey nhỏ hơn α, mâu thuẫn với α là candidate key.
- A không khoá ⇒ A ∉ α và A ∉ β.
Vậy α → β, β ↛ α, β → A: **A phụ thuộc bắc cầu vào α**. Lược đồ 3NF không có phụ thuộc bắc cầu nào như vậy nên cũng không có phụ thuộc bộ phận ⇒ ở 2NF.`,
    },
    {
      q: '**PE 7.20.** Cho ví dụ lược đồ R và tập phụ thuộc sao cho R ở BCNF nhưng không ở 4NF.',
      answer: `*(Lời giải trong file PDF bị cắt — đây là đáp án chuẩn.)*
R = (A, B, C) với phụ thuộc không tầm thường duy nhất là **A →→ B** (do đó cũng A →→ C).
- **BCNF**: không có FD không tầm thường nào (A ↛ B, A ↛ C…) nên điều kiện BCNF thoả hiển nhiên.
- **Không 4NF**: A →→ B không tầm thường (B ⊄ A và A ∪ B ≠ R) nhưng A không phải superkey.
- Phân rã 4NF: (A, B) và (A, C) — lossless vì phần chung A →→ B. Ví dụ đời thực: inst_info(ID, child_name, phone). Xem CK2.12, CK2.13.`,
    },
  ],

  exercises: [
    {
      id: 'CK2.01', topic: 'PE 7.2 — test FD', level: 1,
      prompt: 'Bảng `nf_r_abc(a, b, c)` là instance của PE 7.2. Trả về **một dòng, 6 cột boolean** theo thứ tự `a_b, a_c, b_a, b_c, c_a, c_b` cho biết mỗi FD A → B, A → C, B → A, B → C, C → A, C → B có thoả trên instance không.',
      hint: 'X → Y thoả ⇔ not exists (select X from r group by X having count(distinct Y) > 1)',
      solution: `select not exists (select a from nf_r_abc group by a having count(distinct b) > 1) as a_b,
       not exists (select a from nf_r_abc group by a having count(distinct c) > 1) as a_c,
       not exists (select b from nf_r_abc group by b having count(distinct a) > 1) as b_a,
       not exists (select b from nf_r_abc group by b having count(distinct c) > 1) as b_c,
       not exists (select c from nf_r_abc group by c having count(distinct a) > 1) as c_a,
       not exists (select c from nf_r_abc group by c having count(distinct b) > 1) as c_b;`,
    },
    {
      id: 'CK2.02', topic: 'PE 7.2 — composite FD', level: 2,
      prompt: 'Tiếp PE 7.2: trả về một dòng ba cột boolean: `ac_b` (AC → B có thoả), `ab_c` (AB → C có thoả), `ac_unique` (AC có xác định duy nhất mỗi dòng trên instance).',
      solution: `select not exists (select a, c from nf_r_abc group by a, c having count(distinct b) > 1) as ac_b,
       not exists (select a, b from nf_r_abc group by a, b having count(distinct c) > 1) as ab_c,
       count(*) = count(distinct (a, c)) as ac_unique
from nf_r_abc;`,
    },
    {
      id: 'CK2.03', topic: 'PE 7.9 — test FD', level: 1,
      prompt: 'PE 7.9a: bảng `nf_pe79_r(a, b, c)`. Viết câu truy vấn trả về các giá trị b **vi phạm** FD B → C (kết quả rỗng ⇔ FD đúng).',
      solution: `select b from nf_pe79_r group by b having count(distinct c) > 1;`,
    },
    {
      id: 'CK2.04', topic: 'PE 7.9 — enforce FD', level: 3,
      prompt: `PE 7.9b: PostgreSQL không hỗ trợ \`create assertion\`. Hãy ép FD B → C trên bảng \`nf_pe79_clean(a, b, c)\` bằng **trigger** (before insert or update, raise exception khi có dòng khác cùng b mà khác c).
Hệ thống thử chèn (4, 'x', 11) — phải bị từ chối — và (5, 'x', 10) — phải thành công.`,
      solution: `create function nf_pe79_b_to_c() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from nf_pe79_clean
             where b = new.b and c <> new.c and a <> new.a) then
    raise exception 'FD B -> C violated for b = %', new.b;
  end if;
  return new;
end $$;

create trigger nf_pe79_fd
before insert or update on nf_pe79_clean
for each row execute function nf_pe79_b_to_c();`,
      check: `select try_sql($$insert into nf_pe79_clean values (4, 'x', 11)$$) <> 'ok' as violating_rejected,
       try_sql($$insert into nf_pe79_clean values (5, 'x', 10)$$) as valid_insert;`,
    },
    {
      id: 'CK2.05', topic: 'PE 7.1 — lossless', level: 2,
      prompt: 'PE 7.1 trên dữ liệu: `nf_pe71(a, b, c, d, e)` thoả F = {A → BC, CD → E, B → D, E → A}. Phân rã thành (a, b, c) và (a, d, e). Trả về một dòng ba cột `joined_rows`, `extra`, `missing` (số tuple thừa / thiếu của join so với bảng gốc).',
      solution: `with j as (
  select a, b, c, d, e
  from (select a, b, c from nf_pe71) r1 natural join (select a, d, e from nf_pe71) r2
)
select (select count(*) from j) as joined_rows,
       (select count(*) from (select * from j except select * from nf_pe71) x) as extra,
       (select count(*) from (select * from nf_pe71 except select * from j) y) as missing;`,
    },
    {
      id: 'CK2.06', topic: 'PE 7.6 — keys on data', level: 2,
      prompt: 'PE 7.6: candidate key là A, E, BC, CD; B không phải key. Minh hoạ trên `nf_pe71`: trả về một dòng 5 cột boolean `a, e, bc, cd, b` — mỗi tập có xác định duy nhất mỗi dòng của instance không.',
      solution: `select count(*) = count(distinct a) as a,
       count(*) = count(distinct e) as e,
       count(*) = count(distinct (b, c)) as bc,
       count(*) = count(distinct (c, d)) as cd,
       count(*) = count(distinct b) as b
from nf_pe71;`,
    },
    {
      id: 'CK2.07', topic: 'PE 7.13 — lost FD', level: 3,
      prompt: `PE 7.13 trên dữ liệu: tạo \`nf_pe71_r1(a primary key, b, c)\` và \`nf_pe71_r2(a primary key, d, e)\` từ nf_pe71 (A là key của cả hai). Rồi chèn ('a5', 'b1', 'c9') vào r1 và ('a5', 'd9', 'e9') vào r2 — ràng buộc của từng bảng đều thoả.
(Hệ thống join hai bảng và tìm các b vi phạm B → D — FD không được bảo toàn.)`,
      solution: `create table nf_pe71_r1 (a varchar(2) primary key, b varchar(2), c varchar(2));
create table nf_pe71_r2 (a varchar(2) primary key, d varchar(2), e varchar(2));
insert into nf_pe71_r1 select a, b, c from nf_pe71;
insert into nf_pe71_r2 select a, d, e from nf_pe71;
insert into nf_pe71_r1 values ('a5', 'b1', 'c9');
insert into nf_pe71_r2 values ('a5', 'd9', 'e9');`,
      check: `select b, count(distinct d) as d_values
from nf_pe71_r1 natural join nf_pe71_r2
group by b having count(distinct d) > 1;`,
    },
    {
      id: 'CK2.08', topic: 'PE 7.10 — nulls', level: 2,
      prompt: 'PE 7.10: `nf_pe710(a, b, c)` với A → B, một số dòng có a là null. Phân rã thành (a, b) và (a, c). Trả về các dòng của bảng gốc **bị mất** sau natural join (cột a, b, c).',
      hint: 'select * from nf_pe710 except select a, b, c from (...) natural join (...)',
      solution: `select a, b, c from nf_pe710
except
select a, b, c from (select a, b from nf_pe710) r1 natural join (select a, c from nf_pe710) r2;`,
    },
    {
      id: 'CK2.09', topic: 'PE 7.11 — PK/FK', level: 2,
      prompt: `PE 7.11: phân rã BCNF \`nf_in_dep\` theo dept_name → building, budget thành \`nf_dept(dept_name primary key, building, budget)\` và \`nf_inst(ID primary key, name, salary, dept_name)\` với dept_name **foreign key** tham chiếu nf_dept; chép dữ liệu sang.
(Hệ thống thử xoá khoa Physics khỏi nf_dept và chèn giảng viên thuộc khoa 'Nowhere' — cả hai phải bị foreign key chặn, mã 23503.)`,
      solution: `create table nf_dept (dept_name varchar(20) primary key, building varchar(15), budget numeric(12,2));
create table nf_inst (ID varchar(5) primary key, name varchar(20), salary numeric(8,2),
                      dept_name varchar(20) references nf_dept);
insert into nf_dept select distinct dept_name, building, budget from nf_in_dep;
insert into nf_inst select ID, name, salary, dept_name from nf_in_dep;`,
      check: `select try_sql($$delete from nf_dept where dept_name = 'Physics'$$) as delete_referenced,
       try_sql($$insert into nf_inst values ('99999', 'Nobody', 1000, 'Nowhere')$$) as insert_dangling,
       (select count(*) from nf_inst) as instructors;`,
    },
    {
      id: 'CK2.10', topic: 'PE 7.12 — u ⊆ join', level: 2,
      prompt: 'PE 7.12 trên dữ liệu: u = `nf_r_abc`, phân rã (a, b), (b, c) — r₁, r₂ là **projection** (loại trùng). Trả về một dòng ba cột: `u_rows`, `joined_rows`, `missing` (số tuple của u không có trong join — phải bằng 0).',
      solution: `with j as (select a, b, c from (select distinct a, b from nf_r_abc) r1 natural join (select distinct b, c from nf_r_abc) r2)
select (select count(*) from nf_r_abc) as u_rows,
       (select count(*) from j) as joined_rows,
       (select count(*) from (select * from nf_r_abc except select * from j) x) as missing;`,
    },
    {
      id: 'CK2.11', topic: 'PE 7.17 — 3 BCNF decompositions', level: 3,
      prompt: 'PE 7.17: `nf_pe717(a, b, c, d)` thoả A → B, C → D, B → C. Với ba phân rã {(a,b),(c,d),(b,c)}, {(a,b),(c,d),(a,c)}, {(b,c),(a,d),(a,b)}, trả về một dòng ba cột `extra1, extra2, extra3`: số tuple **thừa** của natural join các projection so với bảng gốc (lossless ⇒ 0).',
      solution: `with r as (select distinct * from nf_pe717),
j1 as (select a, b, c, d from (select distinct a, b from r) x natural join (select distinct c, d from r) y natural join (select distinct b, c from r) z),
j2 as (select a, b, c, d from (select distinct a, b from r) x natural join (select distinct c, d from r) y natural join (select distinct a, c from r) z),
j3 as (select a, b, c, d from (select distinct b, c from r) x natural join (select distinct a, d from r) y natural join (select distinct a, b from r) z)
select (select count(*) from (select * from j1 except select * from r) t) as extra1,
       (select count(*) from (select * from j2 except select * from r) t) as extra2,
       (select count(*) from (select * from j3 except select * from r) t) as extra3;`,
    },
    {
      id: 'CK2.12', topic: 'PE 7.20 — MVD vs FD', level: 2,
      prompt: 'PE 7.20: `nf_pe720(a, b, c)`. Trả về một dòng hai cột boolean: `mvd_a_b` — A →→ B thoả trên instance (với mỗi a, các dòng là đủ mọi tổ hợp b × c); `fd_a_b` — FD A → B có thoả không.',
      solution: `select not exists (select a from nf_pe720 group by a
                   having count(*) <> count(distinct b) * count(distinct c)) as mvd_a_b,
       not exists (select a from nf_pe720 group by a having count(distinct b) > 1) as fd_a_b;`,
    },
    {
      id: 'CK2.13', topic: 'PE 7.20 — 4NF', level: 2,
      prompt: 'Phân rã 4NF của PE 7.20: tạo `nf_pe720_ab(a, b)` và `nf_pe720_ac(a, c)` bằng `create table ... as select distinct`. (Hệ thống đếm dòng hai bảng và số tuple thừa của join so với nf_pe720.)',
      solution: `create table nf_pe720_ab as select distinct a, b from nf_pe720;
create table nf_pe720_ac as select distinct a, c from nf_pe720;`,
      check: `select (select count(*) from nf_pe720_ab) as ab_rows,
       (select count(*) from nf_pe720_ac) as ac_rows,
       (select count(*) from (select a, b, c from nf_pe720_ab natural join nf_pe720_ac
                              except select * from nf_pe720) x) as extra;`,
    },
    {
      id: 'CK2.14', topic: 'PE 7.3 — cardinality via FD', level: 1,
      prompt: 'PE 7.3 trên bảng `advisor(s_ID, i_ID)` của University: trả về một dòng hai cột boolean `s_to_i` (s_ID → i_ID có thoả) và `i_to_s` (i_ID → s_ID có thoả). Kết quả cho biết quan hệ advisor là một-một hay nhiều-một?',
      solution: `select not exists (select s_ID from advisor group by s_ID having count(distinct i_ID) > 1) as s_to_i,
       not exists (select i_ID from advisor group by i_ID having count(distinct s_ID) > 1) as i_to_s;`,
    },
  ],
};
