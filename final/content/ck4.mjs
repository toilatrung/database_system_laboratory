export default {
  key: 'ck4',
  slug: 'ck4_mock_final',
  label: 'Đề thi thử CK',
  navLabel: 'Đề CK',
  kind: 'Đề thi thử',
  short: 'Đề CK',
  title: 'Mock Final (Chapters 6–7)',
  titleVi: 'Đề thi thử cuối kỳ — Chương 6–7',
  source: 'Biến thể của Practice Exercises chương 6–7, Database System Concepts 7th Ed.',

  summary: `
### 1. Cách làm đề thi thử
- **Thời gian gợi ý: 120 phút**, không mở slide. Làm **Trắc nghiệm** và **Tự luận** trên giấy trước (khoảng 80 phút), rồi mới làm **Bài tập SQL** (khoảng 40 phút).
- Các bài phụ thuộc hàm là lược đồ **mới** (không có trong sách) để kiểm tra bạn làm được thuật toán, không phải nhớ đáp án. Làm tay xong thì đối chiếu bằng **Công cụ › Phụ thuộc hàm (FD)** trên thanh menu — công cụ hiện từng bước bao đóng, khoá, canonical cover, phân rã BCNF/3NF.
- Câu vẽ E-R: đáp án dùng sơ đồ chữ (ASCII). Trong phòng thi hãy vẽ đúng ký hiệu của sách: hình chữ nhật (entity set, liệt kê thuộc tính, gạch chân khoá), hình thoi (relationship set), mũi tên = "một", đường đôi = total participation, hình chữ nhật đôi/hình thoi đôi = weak entity set/identifying relationship, discriminator gạch chân nét đứt.

| Phần | Nội dung | Điểm |
|---|---|---|
| A. Trắc nghiệm | 25 câu × 0,16 | 4,0 |
| B. Tự luận | Câu 1–2 (E-R) 1,0đ mỗi câu; Câu 3–6 (FD) 0,75đ mỗi câu | 5,0 |
| C. SQL | 10 bài × 0,1 | 1,0 |
| **Tổng** | | **10** |

### 2. Kế hoạch ôn (tuần 13–15, song song thuyết trình project)
| Thời điểm | Việc cần làm | Ở đâu |
|---|---|---|
| Tuần 13, buổi 1 | Đọc lại tóm tắt Chương 6; làm PE 6.1–6.7 (vẽ E-R, ternary vs binary, weak entity) | Part 2 · Chương 6 → **CK1** |
| Tuần 13, buổi 2 | PE 6.8–6.13 (chuyển E-R sang bảng, ép cardinality/participation bằng PK/FK/unique/not null, specialization, temporal) | **CK1** |
| Tuần 14, buổi 1 | Chương 7: FD, bao đóng, khoá, lossless, BCNF, 3NF; PE 7.1–7.10 | Part 2 · Chương 7 → **CK2** |
| Tuần 14, buổi 2 | PE 7.11–7.20 (canonical cover, chứng minh Armstrong, 2NF/3NF/4NF); tự kiểm tra bằng công cụ FD | **CK2** |
| Đầu tuần 15 | Ôn nhanh SQL/đại số quan hệ phòng câu tổng hợp | **CK3** |
| 2 ngày trước thi | Làm đề thi thử này trong 120 phút, chấm điểm, làm lại câu sai | **Đề CK** |

### 3. Checklist "phải thuộc"
- **Mapping cardinality**: mũi tên chỉ vào phía "một". Ternary: tối đa một mũi tên.
- **Chuyển E-R → bảng**: strong entity → bảng cùng khoá; composite → làm phẳng; multivalued → bảng riêng (khoá entity + giá trị); M:N → bảng có khoá = hợp khoá hai bên; M:1 total ở phía "many" → gộp vào bảng phía many (FK, not null nếu total); 1:1 → gộp bên nào cũng được + \`unique\` cho FK; weak entity → khoá = khoá strong entity + discriminator, FK \`on delete cascade\`, bảng của identifying relationship là thừa.
- **Specialization**: cách 1 (bảng cha + bảng con chứa khoá cha) dùng được mọi trường hợp; cách 2 (chỉ bảng con, chứa cả thuộc tính kế thừa) chỉ hợp khi **total + disjoint**.
- **Aggregation**: bảng của relationship ngoài chứa khoá của relationship được aggregate + khoá entity kia.
- **FD**: α → β đúng trên r nếu hai tuple trùng α thì trùng β. K là superkey ⇔ K⁺ = R. Candidate key = superkey tối thiểu. Thuộc tính không xuất hiện ở vế phải nào phải có trong **mọi** khoá.
- **Lossless** (2 lược đồ): R<sub>1</sub> ∩ R<sub>2</sub> → R<sub>1</sub> hoặc R<sub>1</sub> ∩ R<sub>2</sub> → R<sub>2</sub>.
- **Dependency preserving**: mỗi FD kiểm tra được trong một lược đồ con (hoặc suy ra được từ các F<sub>i</sub>).
- **BCNF**: mọi α → β không tầm thường có α là superkey. **3NF**: hoặc α superkey, hoặc mọi thuộc tính của β − α là prime. BCNF ⇒ 3NF.
- **Canonical cover**: hợp vế trái trùng; bỏ **từng** thuộc tính thừa (trái: (α − A)⁺ ⊇ β dưới F; phải: α⁺ dưới F' vẫn chứa A).
- **3NF synthesis**: mỗi FD trong F<sub>c</sub> → một lược đồ αβ; thêm một candidate key nếu chưa có; bỏ lược đồ nằm trong lược đồ khác.
`,

  quiz: [
    {
      q: 'Một instructor có thể có nhiều số điện thoại. Trong E-R, phone nên là loại thuộc tính nào?',
      options: ['Composite', 'Multivalued {phone}', 'Derived phone()', 'Khoá'],
      answer: 1,
      explain: 'Nhiều giá trị cho một entity → multivalued, chuyển thành bảng riêng inst_phone(ID, phone).',
    },
    {
      q: 'Thuộc tính age của student tính được từ date_of_birth. Đây là?',
      options: ['Multivalued attribute', 'Derived attribute', 'Composite attribute', 'Discriminator'],
      answer: 1,
      explain: 'Derived attribute (ký hiệu age()), thường không lưu trong bảng.',
    },
    {
      q: 'Relationship advisor: đường từ advisor tới instructor có mũi tên, tới student không có mũi tên. Nghĩa là?',
      options: ['Mỗi instructor tối đa một student', 'Mỗi student có tối đa một advisor; một instructor có thể hướng dẫn nhiều student', 'One-to-one', 'Many-to-many'],
      answer: 1,
      explain: 'Mũi tên chỉ vào phía "một": quan hệ one-to-many từ instructor tới student.',
    },
    {
      q: 'Đường đôi nối student với advisor nghĩa là?',
      options: ['Mỗi student có đúng hai advisor', 'Total participation: mọi student phải tham gia ít nhất một quan hệ advisor', 'student là weak entity', 'advisor có thuộc tính'],
      answer: 1,
      explain: 'Double line = total participation.',
    },
    {
      q: 'Trên đường student — advisor ghi 1..1, đường instructor — advisor ghi 0..*. Điều nào đúng?',
      options: ['Mỗi instructor đúng một student', 'Mỗi student đúng một advisor; instructor có thể không hướng dẫn ai', 'Mỗi student có thể không có advisor', 'Quan hệ many-to-many'],
      answer: 1,
      explain: 'l..h ghi số lần tối thiểu/tối đa entity đó tham gia relationship.',
    },
    {
      q: 'Primary key của weak entity set section (identifying entity course, discriminator sec_id, semester, year) là?',
      options: ['(sec_id, semester, year)', '(course_id, sec_id, semester, year)', '(course_id)', 'Không có khoá'],
      answer: 1,
      explain: 'Khoá strong entity + discriminator.',
    },
    {
      q: 'Relationship set takes là many-to-many giữa student và section, có thuộc tính grade. Khoá của bảng takes là?',
      options: ['ID', '(course_id, sec_id, semester, year)', '(ID, course_id, sec_id, semester, year)', '(ID, grade)'],
      answer: 2,
      explain: 'M:N → hợp khoá hai bên; thuộc tính của relationship (grade) không vào khoá.',
    },
    {
      q: 'inst_dept là many-to-one từ instructor tới department, total ở phía instructor. Cách chuyển tốt nhất?',
      options: ['Bảng inst_dept(ID, dept_name) riêng', 'Thêm cột dept_name (not null, FK) vào bảng instructor, bỏ bảng inst_dept', 'Thêm cột ID vào department', 'Gộp instructor và department'],
      answer: 1,
      explain: 'Bảng relationship M:1 total ở phía many là thừa; gộp vào phía many (PE 6.10).',
    },
    {
      q: 'advisor được đổi thành one-to-one; bảng advisor(s_ID PK, i_ID). Cần thêm ràng buộc gì?',
      options: ['check (i_ID > 0)', 'unique (i_ID)', 'not null s_ID', 'Không cần'],
      answer: 1,
      explain: 'PE 6.9: i_ID cũng phải là superkey.',
    },
    {
      q: 'Composite attribute name(first_name, last_name) của instructor được chuyển thành?',
      options: ['Một cột name kiểu text', 'Hai cột name_first_name, name_last_name (hoặc first_name, last_name) trong bảng instructor', 'Bảng riêng instructor_name', 'Không chuyển'],
      answer: 1,
      explain: 'Composite được làm phẳng thành các cột thành phần.',
    },
    {
      q: 'person được specialize thành employee và student; một người có thể vừa là employee vừa là student. Đây là specialization?',
      options: ['Disjoint', 'Overlapping', 'Weak', 'Aggregation'],
      answer: 1,
      explain: 'Overlapping (ký hiệu một mũi tên ISA chung có nhánh, không ghi disjoint).',
    },
    {
      q: 'Với specialization overlapping và partial, cách chuyển nào phù hợp?',
      options: ['Chỉ tạo bảng cho các lower-level entity (cách 2)', 'Bảng cho higher-level + bảng cho mỗi lower-level chứa khoá higher-level (cách 1)', 'Một bảng duy nhất không có khoá', 'Không chuyển được'],
      answer: 1,
      explain: 'Cách 2 lặp dữ liệu khi overlapping và không lưu được entity chỉ thuộc lớp cha khi partial.',
    },
    {
      q: 'Aggregation dùng để làm gì?',
      options: ['Tính tổng thuộc tính', 'Coi một relationship set như một entity để nó tham gia relationship khác (ví dụ eval_for trên proj_guide)', 'Thay weak entity', 'Thay specialization'],
      answer: 1,
      explain: 'Tránh redundancy giữa ternary relationship và relationship lồng.',
    },
    {
      q: 'Vì sao ternary relationship chỉ cho phép tối đa một mũi tên?',
      options: ['Vì vẽ khó', 'Nhiều mũi tên có thể hiểu theo hai nghĩa khác nhau, gây mơ hồ', 'Vì SQL không hỗ trợ', 'Vì ternary luôn many-to-many'],
      answer: 1,
      explain: 'Slide 6.33 (cardinality trên ternary).',
    },
    {
      q: 'Thêm khoá của identifying entity vào weak entity để biến nó thành strong entity gây ra vấn đề gì?',
      options: ['Không có vấn đề', 'Redundancy: khoá đó xuất hiện cả ở entity và relationship, phải luôn bằng nhau', 'Mất dữ liệu', 'Vi phạm 1NF'],
      answer: 1,
      explain: 'PE 6.7.',
    },
    {
      q: 'FD nào là trivial?',
      options: ['ID → name', 'ID, name → name', 'name → ID', 'dept_name → building'],
      answer: 1,
      explain: 'β ⊆ α.',
    },
    {
      q: 'R(A, B, C, D), F = {A → B, B → C, C → D}. Phân rã {(A,B), (A,C), (A,D)} là?',
      options: ['Lossy', 'Lossless và bảo toàn phụ thuộc', 'Lossless nhưng KHÔNG bảo toàn B → C, C → D', 'Không phủ hết R'],
      answer: 2,
      explain: 'Giao luôn là A (khoá) nên lossless; nhưng B → C không kiểm tra được trong lược đồ nào.',
    },
    {
      q: 'R(A, B, C, D), F = {AB → C, C → D, D → A}. Candidate key của R là?',
      options: ['AB', 'AB, BC, BD', 'AB, CD', 'B'],
      answer: 1,
      explain: 'B phải có (không ở vế phải); B kết hợp với A, C hoặc D đều suy ra R.',
    },
    {
      q: 'Với R và F ở câu trước, R đạt dạng chuẩn nào?',
      options: ['BCNF', '3NF nhưng không BCNF', 'Không đạt 3NF', 'Không xác định'],
      answer: 1,
      explain: 'C → D, D → A có vế trái không phải superkey (vi phạm BCNF), nhưng A, D đều prime nên đạt 3NF.',
    },
    {
      q: 'Phân rã R thành R1, R2 là lossless khi?',
      options: ['R1 ∩ R2 = ∅', 'R1 ∩ R2 → R1 hoặc R1 ∩ R2 → R2 thuộc F⁺', 'R1 ∪ R2 ≠ R', 'R1 và R2 cùng ở BCNF'],
      answer: 1,
      explain: 'Phần chung là superkey của ít nhất một bên.',
    },
    {
      q: 'dept_advisor(s_ID, i_ID, dept_name) với i_ID → dept_name và s_ID, dept_name → i_ID. Nhận xét nào ĐÚNG?',
      options: ['Ở BCNF', 'Không ở BCNF; mọi phân rã BCNF đều mất s_ID, dept_name → i_ID', 'Không ở 3NF', 'Không có candidate key'],
      answer: 1,
      explain: 'Ví dụ kinh điển BCNF không bảo toàn phụ thuộc; nhưng lược đồ ở 3NF.',
    },
    {
      q: 'Điều nào luôn làm được với mọi lược đồ?',
      options: ['Phân rã BCNF lossless và bảo toàn phụ thuộc', 'Phân rã 3NF lossless và bảo toàn phụ thuộc', 'Phân rã 4NF bảo toàn phụ thuộc', 'Không có'],
      answer: 1,
      explain: '3NF synthesis luôn đảm bảo cả hai; BCNF có thể mất phụ thuộc.',
    },
    {
      q: 'Canonical cover F<sub>c</sub> của F KHÔNG cần thoả điều nào?',
      options: ['F<sub>c</sub> tương đương F', 'Không FD nào có thuộc tính thừa', 'Không hai FD cùng vế trái', 'Là duy nhất với mỗi F'],
      answer: 3,
      explain: 'PE 7.14: một F có thể có nhiều canonical cover.',
    },
    {
      q: 'Ba tiên đề Armstrong là?',
      options: ['Union, decomposition, pseudotransitivity', 'Reflexivity, augmentation, transitivity', 'Reflexivity, union, transitivity', 'Augmentation, decomposition, union'],
      answer: 1,
      explain: 'Union, decomposition, pseudotransitivity là luật suy ra (PE 7.4, 7.5).',
    },
    {
      q: 'inst_info(ID, child_name, phone): một giảng viên nhiều con và nhiều số điện thoại, không có FD không tầm thường. Vì sao vẫn chưa tốt?',
      options: ['Vi phạm BCNF', 'Ở BCNF nhưng có multivalued dependency ID →→ child_name, ID →→ phone gây lặp; nên tách theo 4NF', 'Vi phạm 1NF', 'Không có khoá'],
      answer: 1,
      explain: 'Slide 7.33–7.35: động lực của 4NF.',
    },
  ],

  questions: [
    {
      q: '(1,0đ) **Thiết kế E-R.** Thư viện quản lý: *thành viên* (mã, tên, nhiều số điện thoại); *đầu sách* (ISBN, tên, năm xuất bản) có một hoặc nhiều *tác giả* (mã, tên), một tác giả viết nhiều đầu sách; mỗi đầu sách do đúng một *nhà xuất bản* (tên, thành phố); thư viện có nhiều *bản sao* của mỗi đầu sách, bản sao đánh số 1, 2, 3… trong từng đầu sách và có tình trạng; mỗi *lượt mượn* ghi thành viên nào mượn bản sao nào, ngày mượn, hạn trả, ngày trả (một thành viên có thể mượn lại cùng bản sao nhiều lần). Vẽ E-R và chuyển sang lược đồ quan hệ (gạch chân khoá, ghi FK).',
      answer: `**Sơ đồ (ASCII):**
\`\`\`
 member(member_id, name, {phone})          author(author_id, name)
        |                                          |
        | 1                                        | (many)
     <borrows>                                  <writes>
        |                                          |
        | *                                        | (many, total)
 loan(loan_id, loan_date, due_date,      book(isbn, title, year) ==<published_by>--> publisher(pub_name, city)
      return_date)                         ||   (total, many-to-one: mũi tên chỉ vào publisher)
        | *                                ||
     <of_copy>                          <<has_copy>>   (identifying relationship, hình thoi đôi)
        | 1                                ||
        +-------------------------------> [[copy(copy_no - - -, condition)]]  (weak entity, copy_no là discriminator)
\`\`\`
**Ý chấm:**
- **copy** là **weak entity** của book (copy_no chỉ duy nhất trong một đầu sách), total participation, identifying relationship hình thoi đôi.
- **writes** many-to-many, book tham gia total (ít nhất một tác giả). **published_by** many-to-one, total phía book.
- Mượn lại cùng bản sao nhiều lần ⇒ không dùng relationship member–copy với khoá (member_id, isbn, copy_no); mô hình **loan** thành entity (hoặc thêm loan_date vào khoá).
- phone là **multivalued**.

**Lược đồ:**
- member(<u>member_id</u>, name); member_phone(<u>member_id, phone</u>) FK member_id → member
- author(<u>author_id</u>, name); publisher(<u>pub_name</u>, city)
- book(<u>isbn</u>, title, year, pub_name **not null**) FK pub_name → publisher (gộp published_by vào book)
- writes(<u>isbn, author_id</u>) FK → book, author
- copy(<u>isbn, copy_no</u>, condition) FK isbn → book **on delete cascade** (bảng has_copy thừa)
- loan(<u>loan_id</u>, member_id not null, isbn, copy_no, loan_date, due_date, return_date) FK member_id → member, (isbn, copy_no) → copy (gộp borrows và of_copy vì many-to-one, total phía loan)`,
    },
    {
      q: '(1,0đ) **Chuyển E-R sang bảng.** E-R gồm: employee(ID, name, {skill}); weak entity dependent(dep_name, relationship) phụ thuộc employee; employee được specialize **overlapping, partial** thành engineer(specialty) và manager(bonus); project(proj_id, title); works_on là many-to-many giữa employee và project, thuộc tính hours; **aggregation** works_on tham gia relationship monitors với manager, mỗi phân công (employee, project) do **tối đa một** manager giám sát. Viết lược đồ quan hệ, chỉ rõ PK/FK và giải thích lựa chọn.',
      answer: `- employee(<u>ID</u>, name)
- employee_skill(<u>ID, skill</u>), FK ID → employee — **multivalued** thành bảng riêng.
- dependent(<u>ID, dep_name</u>, relationship), FK ID → employee **on delete cascade** — khoá weak entity = khoá employee + discriminator; bảng của identifying relationship là thừa.
- engineer(<u>ID</u>, specialty), FK ID → employee; manager(<u>ID</u>, bonus), FK ID → employee — **cách 1** vì overlapping (cách 2 sẽ lặp name cho người vừa là engineer vừa là manager) và partial (cách 2 không lưu được employee không thuộc lớp con nào).
- project(<u>proj_id</u>, title)
- works_on(<u>ID, proj_id</u>, hours), FK → employee, project — M:N.
- monitors(<u>ID, proj_id</u>, manager_id), FK (ID, proj_id) → works_on, FK manager_id → manager — khoá chỉ gồm khoá của aggregation vì **many-to-one** từ aggregation tới manager. Có thể gộp vào works_on dưới dạng cột manager_id **nullable** (partial).`,
    },
    {
      q: '(0,75đ) R = (A, B, C, D, E), F = {A → B, BC → E, ED → A}. (a) Tính (BC)⁺. (b) Tìm **mọi** candidate key. (c) R có ở 3NF không? BCNF không? Giải thích.',
      answer: `**(a)** (BC)⁺: result = BC → dùng BC → E: BCE. Không FD nào thêm được (A → B cần A; ED → A cần D). **(BC)⁺ = BCE** — không phải superkey.

**(b)** C và D không xuất hiện ở vế phải nào ⇒ thuộc **mọi** khoá. (CD)⁺ = CD — chưa đủ. Thử thêm một thuộc tính:
- (ACD)⁺: A → B ⇒ ABCD; BC → E ⇒ ABCDE ✓
- (BCD)⁺: BC → E ⇒ BCDE; ED → A ⇒ ABCDE ✓
- (CDE)⁺: ED → A ⇒ ACDE; A → B ⇒ ABCDE ✓

Mọi tập lớn hơn chứa một trong ba tập này. **Candidate key: ACD, BCD, CDE.**

**(c)** Mọi thuộc tính A, B, C, D, E đều **prime** ⇒ mọi FD thoả điều kiện thứ ba của 3NF ⇒ **R ở 3NF**. Nhưng vế trái A, BC, ED đều **không phải superkey** ⇒ **không ở BCNF**. (Kiểm tra bằng công cụ FD: nhập R = ABCDE và ba FD.)`,
    },
    {
      q: '(0,75đ) Tính **canonical cover** của F = {A → BC, B → C, AB → D, D → E, AD → E} trên R = (A, B, C, D, E). Ghi rõ từng thuộc tính thừa và lý do.',
      answer: `1. Không có hai vế trái trùng nhau ban đầu.
2. **C thừa ở vế phải của A → BC**: bỏ C được F' = {A → B, B → C, AB → D, D → E, AD → E}; dưới F', A⁺ = ABCDE vẫn chứa C ⇒ còn **A → B**.
3. **B thừa ở vế trái của AB → D**: dưới F, A⁺ = ABCDE ⊇ D ⇒ thay bằng **A → D**. Hợp: **A → BD**.
4. **A thừa ở vế trái của AD → E**: D⁺ = DE ⊇ E ⇒ thành D → E, trùng FD có sẵn — gộp lại.
5. Kiểm tra lại: trong A → BD, B không thừa (bỏ B thì A⁺ = ADE, không có B); D không thừa (bỏ D thì A⁺ = ABC). B → C, D → E không còn gì thừa.

**F<sub>c</sub> = {A → BD, B → C, D → E}.** (Mỗi bước chỉ bỏ **một** thuộc tính — PE 7.15.)`,
    },
    {
      q: '(0,75đ) R = (C, T, H, R, S, G) (Course, Teacher, Hour, Room, Student, Grade), F = {C → T, HR → C, HT → R, CS → G, HS → R}. (a) Chứng minh HS là khoá duy nhất. (b) Phân rã R về BCNF (ghi từng bước). (c) Phân rã có lossless không? FD nào bị mất?',
      answer: `**(a)** H, S không ở vế phải nào ⇒ thuộc mọi khoá. (HS)⁺: HS → R ⇒ HSR; HR → C ⇒ HSRC; CS → G ⇒ +G; C → T ⇒ +T = CTHRSG ✓. Vì HS nằm trong mọi khoá và HS đã là superkey ⇒ **HS là candidate key duy nhất**.

**(b)** (Thứ tự chọn FD khác nhau có thể cho kết quả khác nhưng đều đúng.)
1. CTHRSG vi phạm BCNF do **C → T** (C⁺ = CT) ⇒ tách **CT** và **CHRSG**.
2. Trong CHRSG: (CH)⁺ = CHTR, nên **CH → R** đúng và CH không phải superkey của CHRSG ⇒ tách **CHR** và **CHSG**.
3. Trong CHSG: **CS → G**, CS không phải superkey ⇒ tách **CSG** và **CHS**.

Kết quả: **CT, CHR, CSG, CHS** — mỗi lược đồ đều BCNF (khoá CHS là HS; CHR có khoá HR và CH).

**(c)** Mỗi bước tách theo α → β với α là phần chung và α → β ⇒ **lossless**. **HT → R bị mất**: không lược đồ nào chứa cả H, T, R, và không suy ra được từ các F<sub>i</sub> (T chỉ nằm trong CT). Các FD còn lại vẫn kiểm tra được (HS → R suy từ HS → C trong CHS và HC → R trong CHR).`,
    },
    {
      q: '(0,75đ) R = (A, B, C, D, E, F, G, H), F = {A → B, ABCD → E, EF → G, EF → H, ACDF → EG}. (a) Tìm canonical cover và candidate key. (b) Phân rã 3NF bằng thuật toán tổng hợp. (c) So sánh với BCNF.',
      answer: `**(a)** Hợp EF → G, EF → H thành EF → GH. **B thừa** trong ABCD → E vì (ACD)⁺ = ABCDE ⊇ E ⇒ ACD → E. Trong ACDF → EG: **E thừa** (ACDF⁺ dưới F' vẫn có E nhờ A → B, ACD → E) và sau đó **G thừa** (từ E, F suy ra G) ⇒ FD này bị xoá.
**F<sub>c</sub> = {A → B, ACD → E, EF → GH}.**
A, C, D, F không ở vế phải nào ⇒ trong mọi khoá; (ACDF)⁺ = ABCDEFGH ⇒ **khoá duy nhất ACDF**.

**(b)** Mỗi FD của F<sub>c</sub> cho một lược đồ: **(A, B)**, **(A, C, D, E)**, **(E, F, G, H)**. Không lược đồ nào chứa khoá ACDF ⇒ thêm **(A, C, D, F)**. Không lược đồ nào nằm trong lược đồ khác.
Kết quả: **AB, ACDE, EFGH, ACDF** — lossless (có lược đồ chứa khoá) và bảo toàn phụ thuộc.

**(c)** Phân rã BCNF ở đây cho **cùng kết quả** (tách theo A → B, EF → GH, ACD → E) và không mất FD nào — không phải lúc nào cũng vậy (xem câu 5).`,
    },
  ],

  exercises: [
    {
      id: 'CK4.01', topic: 'weak entity → DDL', level: 2,
      prompt: `Tạo bảng cho strong entity \`hotel(hotel_id varchar(5), name, city)\` và **weak entity** \`hotel_room\` của hotel với discriminator \`room_no varchar(5)\` và thuộc tính \`floor integer\`. Khoá và foreign key đúng quy tắc chuyển weak entity; xoá một hotel thì các phòng của nó bị xoá theo.`,
      solution: `create table hotel (
  hotel_id varchar(5) primary key,
  name     varchar(30),
  city     varchar(30));
create table hotel_room (
  hotel_id varchar(5) references hotel on delete cascade,
  room_no  varchar(5),
  floor    integer,
  primary key (hotel_id, room_no));`,
      check: `select (select string_agg(k.column_name, ', ' order by k.column_name)
        from information_schema.table_constraints t
        join information_schema.key_column_usage k on k.constraint_name = t.constraint_name and k.table_name = t.table_name
        where t.table_name = 'hotel_room' and t.constraint_type = 'PRIMARY KEY') as room_pk,
       try_sql($$insert into hotel values ('H1', 'Sunrise', 'Hue')$$) as add_hotel,
       try_sql($$insert into hotel_room values ('H1', '101', 1)$$) as add_room,
       try_sql($$insert into hotel_room values ('H1', '101', 2)$$) as dup_room,
       try_sql($$insert into hotel_room values ('H9', '101', 1)$$) as room_of_unknown_hotel,
       try_sql($$delete from hotel where hotel_id = 'H1'$$) as delete_hotel,
       sql_value('select count(*) from hotel_room') as rooms_left;`,
    },
    {
      id: 'CK4.02', topic: 'M:N → DDL', level: 3,
      prompt: `Tiếp CK4.01 (tạo lại hotel, hotel_room trong cùng câu trả lời). Thêm entity \`guest(guest_id varchar(5), name)\` và relationship **many-to-many** \`stay\` giữa guest và hotel_room với thuộc tính \`nights integer\`. Bảng \`stay\` có khoá theo quy tắc chuyển M:N và foreign key tới cả hai bên.`,
      hint: 'Khoá của hotel_room là kép, nên FK từ stay tới hotel_room cũng là kép: foreign key (hotel_id, room_no) references hotel_room.',
      solution: `create table hotel (hotel_id varchar(5) primary key, name varchar(30), city varchar(30));
create table hotel_room (
  hotel_id varchar(5) references hotel on delete cascade,
  room_no  varchar(5),
  floor    integer,
  primary key (hotel_id, room_no));
create table guest (guest_id varchar(5) primary key, name varchar(30));
create table stay (
  guest_id varchar(5) references guest,
  hotel_id varchar(5),
  room_no  varchar(5),
  nights   integer,
  primary key (guest_id, hotel_id, room_no),
  foreign key (hotel_id, room_no) references hotel_room);`,
      check: `select (select string_agg(k.column_name, ', ' order by k.column_name)
        from information_schema.table_constraints t
        join information_schema.key_column_usage k on k.constraint_name = t.constraint_name and k.table_name = t.table_name
        where t.table_name = 'stay' and t.constraint_type = 'PRIMARY KEY') as stay_pk,
       (select count(*) from information_schema.table_constraints
        where table_name = 'stay' and constraint_type = 'FOREIGN KEY') as stay_fks,
       try_sql($$insert into hotel values ('H1', 'Sunrise', 'Hue')$$)
       || try_sql($$insert into hotel_room values ('H1', '101', 1)$$)
       || try_sql($$insert into guest values ('G1', 'Lan')$$) as setup,
       try_sql($$insert into stay values ('G1', 'H1', '101', 3)$$) as valid_stay,
       try_sql($$insert into stay values ('G1', 'H1', '999', 2)$$) as unknown_room;`,
    },
    {
      id: 'CK4.03', topic: '1:1 + total', level: 2,
      prompt: `Mỗi department có **đúng một** trưởng khoa là một instructor, và một instructor làm trưởng **tối đa một** khoa. Tạo bảng \`dept_head(dept_name, head_id)\` (dept_name là khoá, FK tới department; head_id FK tới instructor) với các ràng buộc ép đúng cardinality one-to-one và total phía department-trong-bảng (head_id không được để trống).`,
      hint: 'PE 6.9 và 6.10: unique + not null.',
      solution: `create table dept_head (
  dept_name varchar(20) primary key references department,
  head_id   varchar(5) not null unique references instructor);`,
      check: `select try_sql($$insert into dept_head values ('Physics', '22222')$$) as ok_row,
       try_sql($$insert into dept_head values ('Biology', '22222')$$) as same_head_twice,
       try_sql($$insert into dept_head values ('Physics', '33456')$$) as two_heads,
       try_sql($$insert into dept_head values ('Music', null)$$) as no_head,
       try_sql($$insert into dept_head values ('Music', '99999')$$) as unknown_instructor;`,
    },
    {
      id: 'CK4.04', topic: 'multivalued → DDL', level: 1,
      prompt: `instructor có thuộc tính multivalued \`{phone}\`. Tạo bảng \`inst_phone\` tương ứng (cột ID, phone varchar(15)); xoá instructor thì số điện thoại của họ bị xoá theo.`,
      solution: `create table inst_phone (
  ID    varchar(5) references instructor on delete cascade,
  phone varchar(15),
  primary key (ID, phone));`,
      check: `select try_sql($$insert into instructor values ('99001', 'Tester', 'Physics', 50000)$$) as new_instructor,
       try_sql($$insert into inst_phone values ('99001', '555-0101')$$) as phone1,
       try_sql($$insert into inst_phone values ('99001', '555-0102')$$) as phone2,
       try_sql($$insert into inst_phone values ('99001', '555-0101')$$) as duplicate,
       try_sql($$insert into inst_phone values ('00000', '555-0000')$$) as unknown_id,
       try_sql($$delete from instructor where ID = '99001'$$) as delete_instructor,
       sql_value('select count(*) from inst_phone') as phones_left;`,
    },
    {
      id: 'CK4.05', topic: 'specialization → DDL', level: 2,
      prompt: `vehicle(vin, make) được specialize thành truck(capacity integer) và bus(seats integer). Dùng **cách 1**: tạo \`vehicle(vin varchar(10) primary key, make varchar(20))\`, \`truck\`, \`bus\` — mỗi bảng con có khoá là vin, tham chiếu vehicle, xoá theo khi xoá vehicle.`,
      solution: `create table vehicle (vin varchar(10) primary key, make varchar(20));
create table truck (vin varchar(10) primary key references vehicle on delete cascade, capacity integer);
create table bus (vin varchar(10) primary key references vehicle on delete cascade, seats integer);`,
      check: `select try_sql($$insert into vehicle values ('V1', 'Volvo')$$) as add_vehicle,
       try_sql($$insert into truck values ('V1', 20)$$) as as_truck,
       try_sql($$insert into bus values ('V1', 45)$$) as also_bus,
       try_sql($$insert into truck values ('V9', 10)$$) as truck_without_vehicle,
       try_sql($$delete from vehicle where vin = 'V1'$$) as delete_vehicle,
       sql_value('select count(*) from truck') as trucks_left,
       sql_value('select count(*) from bus') as buses_left;`,
    },
    {
      id: 'CK4.06', topic: 'FD test (vi phạm)', level: 2,
      prompt: 'Trên `fr_enrollment`, FD **instructor → course_id** có đúng không? Trả về các instructor làm FD này sai (dạy hơn một course) cùng số course khác nhau họ dạy.',
      hint: 'PE 7.9: group by vế trái, having count(distinct vế phải) > 1.',
      solution: `select instructor, count(distinct course_id) as num_courses
from fr_enrollment
group by instructor
having count(distinct course_id) > 1;`,
    },
    {
      id: 'CK4.07', topic: 'FD test (update anomaly)', level: 2,
      prompt: 'Bảng `fr_supply` lẽ ra phải thoả **supplier_id → supplier_city** nhưng dữ liệu bị cập nhật lệch. Tìm các supplier_id vi phạm và số thành phố khác nhau được ghi cho mỗi supplier.',
      solution: `select supplier_id, count(distinct supplier_city) as num_cities
from fr_supply
group by supplier_id
having count(distinct supplier_city) > 1;`,
    },
    {
      id: 'CK4.08', topic: 'kiểm tra nhiều FD', level: 3,
      prompt: `Viết **một** truy vấn trả về hai cột \`fd\` (text) và \`holds\` (boolean) cho 5 FD trên \`fr_enrollment\`: \`'student_id -> student_name'\`, \`'course_id -> instructor'\`, \`'instructor -> office'\`, \`'instructor -> course_id'\`, \`'office -> instructor'\`. (Lưu ý: dữ liệu chỉ chứng minh được một FD **sai**, không chứng minh được FD **đúng** với mọi instance.)`,
      hint: 'not exists (select ... group by X having count(distinct Y) > 1), nối các dòng bằng union all.',
      solution: `select 'student_id -> student_name' as fd,
       not exists (select 1 from fr_enrollment group by student_id having count(distinct student_name) > 1) as holds
union all
select 'course_id -> instructor',
       not exists (select 1 from fr_enrollment group by course_id having count(distinct instructor) > 1)
union all
select 'instructor -> office',
       not exists (select 1 from fr_enrollment group by instructor having count(distinct office) > 1)
union all
select 'instructor -> course_id',
       not exists (select 1 from fr_enrollment group by instructor having count(distinct course_id) > 1)
union all
select 'office -> instructor',
       not exists (select 1 from fr_enrollment group by office having count(distinct instructor) > 1);`,
    },
    {
      id: 'CK4.09', topic: 'phân rã BCNF + lossless', level: 3,
      prompt: `Với FD student_id → student_name; course_id → course_title, instructor; instructor → office; (student_id, course_id) → grade, phân rã BCNF của fr_enrollment là:
\`fr_student(student_id, student_name)\`, \`fr_course(course_id, course_title, instructor)\`, \`fr_instructor(instructor, office)\`, \`fr_grade(student_id, course_id, grade)\`.
Tạo 4 bảng này bằng \`create table ... as select distinct ...\` từ fr_enrollment.`,
      solution: `create table fr_student as select distinct student_id, student_name from fr_enrollment;
create table fr_course as select distinct course_id, course_title, instructor from fr_enrollment;
create table fr_instructor as select distinct instructor, office from fr_enrollment;
create table fr_grade as select distinct student_id, course_id, grade from fr_enrollment;`,
      check: `with joined as (
  select student_id, student_name, course_id, course_title, instructor, office, grade
  from fr_grade natural join fr_student natural join fr_course natural join fr_instructor)
select (select count(*) from fr_student) as students,
       (select count(*) from fr_course) as courses,
       (select count(*) from fr_instructor) as instructors,
       (select count(*) from fr_grade) as grades,
       (select count(*) from (select * from joined except select * from fr_enrollment) x) as spurious_rows,
       (select count(*) from (select * from fr_enrollment except select * from joined) y) as lost_rows;`,
    },
    {
      id: 'CK4.10', topic: 'phân rã lossy', level: 3,
      prompt: 'Phân rã **sai**: chiếu fr_enrollment thành r1(student_id, instructor) và r2(instructor, course_id) (distinct), rồi natural join lại. Trả về hai số: `original_rows` = số bộ (student_id, instructor, course_id) khác nhau trong fr_enrollment, và `joined_rows` = số dòng của r1 ⋈ r2. Vì sao joined_rows lớn hơn?',
      hint: 'Phần chung là instructor, mà instructor không phải superkey của r1 hay r2 → lossy (sinh tuple giả).',
      solution: `with r1 as (select distinct student_id, instructor from fr_enrollment),
     r2 as (select distinct instructor, course_id from fr_enrollment)
select (select count(*) from (select distinct student_id, instructor, course_id from fr_enrollment) o) as original_rows,
       (select count(*) from r1 natural join r2) as joined_rows;`,
    },
  ],
};
