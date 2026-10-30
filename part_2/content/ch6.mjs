export default {
  number: 6,
  slug: 'ch6_er_model',
  title: 'Database Design Using the E-R Model',
  titleVi: 'Thiết kế CSDL bằng mô hình E-R',

  summary: `
### 0. Phạm vi theo lịch học
| Tuần | Slide (số ở chân trang) | Nội dung |
|---|---|---|
| 9 | 6.1 – 6.43 | Design phases, entity set, relationship set, attribute (simple/composite, single/multivalued, derived), mapping cardinality, participation, primary key, weak entity set, redundant attribute, E-R diagram của University |
| 10 | 6.44 – 6.73 | **Reduction to relation schemas**, extended E-R (specialization, generalization, completeness constraint, aggregation), design issues (lỗi thường gặp, entity vs attribute, entity vs relationship, binary vs n-ary), E-R design decisions |
| (đọc thêm) | 6.74 – 6.84 | Bảng ký hiệu, ký hiệu Chen / crow's foot, UML class diagram |

### 1. Các pha thiết kế
1. **Requirements**: mô tả đầy đủ nhu cầu dữ liệu của người dùng.
2. **Conceptual design**: chọn data model (ở đây là E-R) và dịch yêu cầu thành *conceptual schema*; mô tả cả các thao tác (functional requirements).
3. **Logical design**: chuyển sang lược đồ quan hệ (bài toán "chia thuộc tính vào các relation" — Khoa học máy tính) và quyết định lưu thuộc tính nào (bài toán nghiệp vụ).
4. **Physical design**: tổ chức lưu trữ vật lý.

Hai cạm bẫy cần tránh: **redundancy** (lặp thông tin → không nhất quán) và **incompleteness** (không mô hình hoá được một khía cạnh của doanh nghiệp).

### 2. Entity set, relationship set, attribute
- **Entity** = đối tượng phân biệt được; **entity set** = tập các entity cùng loại (hình chữ nhật). Thuộc tính khoá gạch chân.
- **Relationship set** (hình thoi) = quan hệ toán học trên ≥ 2 entity set: {(e<sub>1</sub>, …, e<sub>n</sub>) | e<sub>i</sub> ∈ E<sub>i</sub>}. Relationship set có thể có **thuộc tính riêng** (ví dụ \`date\` của advisor) — vẽ trong hình chữ nhật nối nét đứt.
- **Role**: khi một entity set xuất hiện nhiều lần trong cùng relationship set (prereq: course_id và prereq_id).
- **Degree**: binary (phổ biến), ternary (ví dụ proj_guide(instructor, student, project)).
- Thuộc tính: **simple / composite** (name → first_name, middle_initial, last_name), **single-valued / multivalued** \`{phone_number}\`, **derived** \`age()\` (tính từ date_of_birth). **Domain** = tập giá trị cho phép.

### 3. Ràng buộc
| Ràng buộc | Ký hiệu | Ý nghĩa |
|---|---|---|
| one-to-one | mũi tên ở cả hai phía | mỗi A ↔ tối đa một B và ngược lại |
| one-to-many (instructor → student) | mũi tên về phía "one" (instructor) | một instructor nhiều student, mỗi student ≤ 1 instructor |
| many-to-many | không mũi tên | không giới hạn |
| **total participation** | **đường đôi** | mọi entity phải tham gia ít nhất một relationship |
| partial participation | đường đơn | có thể không tham gia |
| \`l..h\` | ghi trên đường nối | min..max số relationship mà mỗi entity tham gia; \`1..1\` = total + tối đa 1; \`0..*\` = không ràng buộc |

Với quan hệ **ternary**, chỉ cho phép **tối đa một mũi tên** (nhiều mũi tên có thể hiểu theo hai cách khác nhau).

### 4. Primary key
- Entity set: một superkey tối thiểu được chọn.
- Relationship set R giữa E<sub>1</sub>…E<sub>n</sub>: hợp các primary key của E<sub>i</sub> là superkey. Chọn primary key theo cardinality:

| Cardinality của R(A, B) | Primary key của R |
|---|---|
| many-to-many | PK(A) ∪ PK(B) |
| one-to-many (A "one", B "many") | PK(B) |
| many-to-one (A "many") | PK(A) |
| one-to-one | PK(A) hoặc PK(B) |

### 5. Weak entity set
- Không có đủ thuộc tính để tạo primary key; tồn tại **phụ thuộc** vào một **identifying (owner) entity set** qua **identifying relationship** (many-to-one, **total** từ phía weak).
- Ký hiệu: hình chữ nhật **đôi**, hình thoi đôi; **discriminator** (partial key) gạch chân **nét đứt**.
- PK(weak) = PK(owner) ∪ discriminator. Ví dụ section(<u>sec_id, semester, year</u>) phụ thuộc course → PK = (course_id, sec_id, semester, year).
- **Redundant attribute**: nếu student có thuộc tính dept_name và cũng có relationship stud_dept tới department thì dept_name là thừa → bỏ khỏi entity (nó sẽ quay lại khi chuyển sang bảng).

### 6. Reduction to relation schemas (slide 6.44–6.52)
| Thành phần E-R | Lược đồ quan hệ |
|---|---|
| Strong entity set | cùng tên, cùng thuộc tính đơn: student(<u>ID</u>, name, tot_cred) |
| Composite attribute | **làm phẳng**: name.first_name → \`first_name\` (bỏ thuộc tính cha) |
| Multivalued attribute M của E | bảng riêng EM(PK(E), M), PK = tất cả; FK → E. Ví dụ inst_phone(<u>ID, phone_number</u>) |
| Derived attribute | không lưu; tính bằng view/hàm |
| Weak entity set | bảng gồm PK(owner) + discriminator + thuộc tính; FK → owner (**on delete cascade**) |
| Relationship many-to-many | bảng gồm PK các bên + thuộc tính của relationship |
| many-to-one / one-to-many, **total** phía many | **không** tạo bảng riêng: thêm PK phía "one" vào bảng phía "many" (inst_dept → cột dept_name trong instructor) |
| many-to-one, partial phía many | vẫn có thể gộp, giá trị null cho entity không tham gia |
| one-to-one | gộp vào bên nào cũng được; thêm \`unique\` để giữ đúng one-to-one |
| Identifying relationship của weak entity | thừa — đã nằm trong bảng weak entity |

**Ràng buộc trong SQL**: many-to-one được ép bởi PK; one-to-one cần thêm \`unique\`; total participation của phía many (sau khi gộp) ép bằng \`not null\`; total participation phía "one" hoặc của many-to-many **không** ép được bằng PK/FK/not null (cần assertion/trigger).

### 7. Extended E-R features
- **Specialization** (top-down, ISA, tam giác): entity con thừa kế thuộc tính + relationship của cha. **Overlapping** (employee & student; mũi tên riêng) vs **disjoint** (instructor | secretary; mũi tên chung). **Generalization** = bottom-up, cùng ký hiệu.
- **Completeness constraint**: **total** (mọi entity cha phải thuộc ít nhất một entity con) vs **partial** (mặc định).
- Chuyển specialization thành bảng:

| Cách | Bảng | Ưu / nhược |
|---|---|---|
| Method 1 | person(<u>ID</u>, name, street, city), employee(<u>ID</u>, salary), student(<u>ID</u>, tot_cred); ID con là FK → cha | Không lặp dữ liệu; lấy đủ thông tin employee phải **join** |
| Method 2 | employee(<u>ID</u>, name, street, city, salary), student(<u>ID</u>, name, street, city, tot_cred) | Không cần join; nếu **overlapping** thì name/street/city bị **lặp**; nếu specialization partial thì cần bảng person cho entity không thuộc con nào; FK tới "person" khó |

- **Aggregation**: coi một relationship (proj_guide) như một entity trừu tượng để nó tham gia relationship khác (eval_for với evaluation). Bảng eval_for(<u>PK(proj_guide), evaluation_id</u>), FK → proj_guide. Tránh được việc tạo ternary eval_for(instructor, student, project, evaluation) lặp thông tin với proj_guide.

### 8. Design issues
- **Lỗi thường gặp**: dùng PK của entity khác làm thuộc tính (dept_name trong student khi đã có stud_dept); dùng thuộc tính relationship sai chỗ (gán \`assignment_marks\` single-valued vào takes thay vì multivalued/entity riêng).
- **Entity hay attribute?** phone là attribute nếu chỉ lưu số; là entity nếu cần thêm thông tin (location, loại) hoặc dùng chung.
- **Entity hay relationship?** Một hành động giữa các entity thường là relationship; tách thành entity (registration) khi nó có thuộc tính/quan hệ riêng.
- **Binary hay n-ary?** n-ary thể hiện rõ việc nhiều entity cùng tham gia (proj_guide). Có thể thay R(A, B, C) bằng entity E + ba relationship R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub> (E có thuộc tính định danh riêng), nhưng phải dịch cả ràng buộc và có thể sinh ra instance không ứng với R nào.
- **Design decisions**: attribute hay entity; relationship hay entity; binary hay n-ary; có dùng weak entity/specialization/aggregation không.

### 9. Ký hiệu (đọc đề)
| Ý nghĩa | Sách (Chen cải tiến) | Crow's foot | UML |
|---|---|---|---|
| Many | không mũi tên | chân chim | \`*\` |
| One | mũi tên | gạch đứng | \`1\` / \`0..1\` |
| Total | đường đôi | gạch đứng ở phía đối diện ("ít nhất một") | \`1..*\` |
| Weak entity | chữ nhật đôi | — | — |

Lưu ý: UML ghi cardinality ở **phía ngược** so với \`l..h\` của sách.
`,

  quiz: [
    {
      q: 'Trong E-R diagram của sách, **đường đôi** nối entity set với relationship set biểu diễn điều gì?',
      options: ['Many-to-many', 'Total participation', 'Weak entity set', 'Derived attribute'],
      answer: 1,
      explain: 'Đường đôi = mọi entity của entity set phải tham gia ít nhất một relationship.',
    },
    {
      q: 'advisor là one-to-many từ instructor tới student (một instructor nhiều student). Mũi tên được vẽ ở đâu?',
      options: ['Từ advisor tới student', 'Từ advisor tới instructor', 'Cả hai phía', 'Không có mũi tên'],
      answer: 1,
      explain: 'Mũi tên chỉ về phía "one": mỗi student có tối đa một instructor.',
    },
    {
      q: 'Nhãn `1..1` trên đường nối student — advisor nghĩa là gì?',
      options: ['Mỗi student có đúng một advisor', 'Mỗi student có tối đa một advisor', 'Mỗi instructor có đúng một student', 'Advisor là quan hệ one-to-one'],
      answer: 0,
      explain: 'min = 1 (total participation) và max = 1.',
    },
    {
      q: 'Primary key của relationship set many-to-many R giữa A và B là gì?',
      options: ['PK(A)', 'PK(B)', 'PK(A) ∪ PK(B)', 'Một thuộc tính mới'],
      answer: 2,
      explain: 'Một cặp (a, b) chỉ xuất hiện một lần; mỗi a có thể đi với nhiều b và ngược lại.',
    },
    {
      q: 'R là many-to-one từ A tới B. Primary key của R là?',
      options: ['PK(A)', 'PK(B)', 'PK(A) ∪ PK(B)', 'Không xác định được'],
      answer: 0,
      explain: 'Mỗi a liên kết tối đa một b nên PK(A) đã xác định duy nhất relationship.',
    },
    {
      q: 'Discriminator của weak entity set được vẽ thế nào?',
      options: ['Gạch chân nét liền', 'Gạch chân nét đứt', 'Trong ngoặc nhọn {}', 'Kèm dấu ()'],
      answer: 1,
      explain: 'Gạch chân nét đứt = partial key; {} là multivalued; () là derived.',
    },
    {
      q: 'Primary key của bảng sinh ra từ weak entity set section (discriminator sec_id, semester, year; owner course) là?',
      options: ['(sec_id, semester, year)', '(course_id)', '(course_id, sec_id, semester, year)', '(sec_id)'],
      answer: 2,
      explain: 'PK(weak) = PK(owner) ∪ discriminator.',
    },
    {
      q: 'Identifying relationship của một weak entity set có đặc điểm nào?',
      options: ['Many-to-many, partial', 'Many-to-one từ weak tới owner, total phía weak', 'One-to-one, partial', 'Luôn có thuộc tính riêng'],
      answer: 1,
      explain: 'Mỗi entity yếu thuộc đúng một owner và phải có owner.',
    },
    {
      q: 'Thuộc tính multivalued `{phone_number}` của instructor được chuyển thành gì?',
      options: ['Cột phone_number trong instructor', 'Bảng inst_phone(ID, phone_number) với PK (ID, phone_number)', 'Bảng inst_phone(phone_number) với PK phone_number', 'Không lưu'],
      answer: 1,
      explain: 'Mỗi giá trị là một dòng; PK gồm cả hai cột; ID là FK → instructor.',
    },
    {
      q: 'Composite attribute `address(street, city, zip)` được chuyển thành bảng thế nào?',
      options: ['Một cột address kiểu text', 'Bảng riêng address', 'Các cột street, city, zip (làm phẳng)', 'Một cột JSON'],
      answer: 2,
      explain: 'Làm phẳng: mỗi thành phần đơn thành một cột, bỏ thuộc tính cha.',
    },
    {
      q: 'inst_dept là many-to-one từ instructor tới department, total phía instructor. Cách chuyển hợp lý nhất?',
      options: ['Tạo bảng inst_dept(ID, dept_name)', 'Thêm dept_name vào instructor (not null), không tạo bảng riêng', 'Thêm ID vào department', 'Gộp instructor và department'],
      answer: 1,
      explain: 'Bảng inst_dept sẽ có PK = ID trùng với instructor → gộp vào instructor; total → not null.',
    },
    {
      q: 'Với relationship one-to-one giữa A và B được gộp vào bảng của A (thêm cột b_id), cần thêm ràng buộc gì để giữ đúng one-to-one?',
      options: ['primary key (b_id)', 'unique (b_id)', 'not null (b_id)', 'check (b_id > 0)'],
      answer: 1,
      explain: 'Không có unique thì nhiều a có thể trỏ tới cùng một b → many-to-one.',
    },
    {
      q: 'Specialization person → {employee, student} là **overlapping** nghĩa là?',
      options: ['Một person có thể vừa là employee vừa là student', 'Mỗi person phải thuộc ít nhất một entity con', 'Một person chỉ thuộc tối đa một entity con', 'employee và student có cùng thuộc tính'],
      answer: 0,
      explain: 'Overlapping vẽ hai mũi tên riêng; disjoint vẽ một mũi tên chung.',
    },
    {
      q: 'Total generalization (completeness constraint) nghĩa là?',
      options: ['Mỗi entity cha phải thuộc ít nhất một entity con', 'Entity con có mọi thuộc tính của cha', 'Các entity con rời nhau', 'Có tối đa hai entity con'],
      answer: 0,
      explain: 'Partial là mặc định; total vẽ bằng nét đôi / ghi "total".',
    },
    {
      q: 'Nhược điểm của **method 2** (mỗi entity con một bảng chứa cả thuộc tính của cha) khi specialization là overlapping?',
      options: ['Phải join để lấy thông tin', 'Thuộc tính của cha bị lặp ở nhiều bảng', 'Không biểu diễn được entity con', 'Không có primary key'],
      answer: 1,
      explain: 'Một người vừa là employee vừa là student có name/street/city ở cả hai bảng.',
    },
    {
      q: 'Aggregation được dùng khi nào?',
      options: ['Khi cần tính tổng (sum)', 'Khi một relationship cần tham gia vào một relationship khác', 'Khi entity có thuộc tính multivalued', 'Khi có specialization'],
      answer: 1,
      explain: 'Ví dụ eval_for nối proj_guide (relationship) với evaluation.',
    },
    {
      q: 'Trong quan hệ ternary, vì sao sách chỉ cho phép tối đa một mũi tên?',
      options: ['Vì SQL không hỗ trợ', 'Vì nhiều mũi tên có thể hiểu theo hai nghĩa khác nhau', 'Vì ternary luôn là many-to-many', 'Vì mũi tên chỉ dùng cho weak entity'],
      answer: 1,
      explain: 'A→, B→ có thể là "mỗi (A,C) có một B và mỗi (B,C) có một A" hoặc "mỗi C có một (A,B)"...',
    },
    {
      q: 'student có thuộc tính dept_name và đồng thời có relationship stud_dept tới department. Đây là lỗi gì?',
      options: ['Weak entity', 'Redundant attribute', 'Composite attribute', 'Role'],
      answer: 1,
      explain: 'dept_name lặp thông tin của stud_dept → bỏ khỏi entity student.',
    },
    {
      q: 'Phone nên được mô hình là **entity** thay vì attribute khi nào?',
      options: ['Khi mỗi người chỉ có một số', 'Khi cần lưu thêm thông tin về số điện thoại (loại, vị trí) hoặc nhiều người dùng chung', 'Khi số điện thoại là số nguyên', 'Không bao giờ'],
      answer: 1,
      explain: 'Entity cho phép có thuộc tính và relationship riêng.',
    },
  ],

  questions: [
    {
      q: 'Phân biệt redundancy và incompleteness trong thiết kế. Cho ví dụ mỗi loại với University database.',
      answer: `- **Redundancy**: một thông tin được lưu nhiều lần, ví dụ gộp instructor và department thành in_dep → building, budget của khoa lặp ở mỗi giảng viên; sửa một bản sẽ không nhất quán.
- **Incompleteness**: thiết kế không biểu diễn được một khía cạnh, ví dụ chỉ có bảng section chứa cả thông tin course → không lưu được một course chưa mở section nào.`,
    },
    {
      q: 'Đọc diagram: `[instructor] <---- <advisor> ==== [student]` — instructor(ID, name), student(ID, name), relationship advisor có thuộc tính `date`; mũi tên chỉ về instructor, đường đôi ở phía student. Cho biết cardinality, participation, rồi viết các lược đồ quan hệ.',
      answer: `- Mũi tên về instructor → mỗi student có **tối đa một** advisor: **many-to-one** từ student tới instructor (one-to-many từ instructor).
- Đường đôi phía student → **total**: mỗi student phải có advisor. Phía instructor partial.
- Lược đồ: instructor(<u>ID</u>, name), student(<u>ID</u>, name), và do total + many-to-one có thể gộp: student(<u>ID</u>, name, advisor_id **not null** → instructor, advisor_date). Nếu để bảng riêng: advisor(<u>s_ID</u>, i_ID, date).`,
    },
    {
      q: 'Vì sao section được mô hình là weak entity set? Nêu một cách khác tránh weak entity và nhược điểm của nó.',
      answer: `section không có course_id thì không định danh được (sec_id 1 của Fall 2017 có ở nhiều course). Thay vì lưu course_id trong section (trùng với relationship sec_course), ta coi section là weak, phụ thuộc course qua sec_course.

Cách khác: cho section một thuộc tính định danh riêng \`section_id\` (strong entity). Nhược điểm: mất ràng buộc tự nhiên (course_id, sec_id, semester, year) phải unique — phải khai báo thêm; khoá nhân tạo khó đọc.`,
    },
    {
      q: 'Cho entity set instructor(ID, name(first_name, last_name), address(street(street_number, street_name), city), {phone_number}, date_of_birth, age()). Viết các lược đồ quan hệ.',
      answer: `- instructor(<u>ID</u>, first_name, last_name, street_number, street_name, city, date_of_birth) — composite làm phẳng; age() là derived nên không lưu.
- instructor_phone(<u>ID, phone_number</u>), ID → instructor.
- age tính bằng view, ví dụ \`extract(year from age(date_of_birth))\`.`,
    },
    {
      q: 'Một relationship many-to-one R từ A tới B. Khi nào nên gộp R vào bảng A, khi nào giữ bảng riêng?',
      answer: `Gộp (thêm PK(B) vào A) khi A tham gia **total** hoặc hầu hết a đều có b — tránh join, PK vẫn là PK(A). Nếu participation của A rất partial, cột FK sẽ nhiều null; khi đó có thể giữ bảng R(<u>PK(A)</u>, PK(B), thuộc tính của R). Cả hai đều đúng về mặt logic.`,
    },
    {
      q: 'Specialization person → employee, student (overlapping, partial). So sánh method 1 và method 2 khi chuyển sang bảng; với dữ liệu nào thì method 2 không đủ?',
      answer: `- **Method 1**: person(ID, name, street, city), employee(ID, salary), student(ID, tot_cred); không lặp; lấy thông tin đầy đủ employee cần join với person.
- **Method 2**: employee(ID, name, street, city, salary), student(ID, name, street, city, tot_cred); không join, nhưng người vừa là employee vừa là student bị lặp name/street/city.
- Vì là **partial**, một person không phải employee hay student (ví dụ khách) **không có chỗ** lưu trong method 2 → phải thêm bảng person (hoặc dùng method 1). Method 2 chỉ thật sự phù hợp khi specialization **disjoint và total**.`,
    },
    {
      q: 'Vẽ (dạng chữ) và giải thích aggregation cho bài toán: instructor hướng dẫn student làm project (proj_guide), và mỗi lần hướng dẫn có các evaluation. Vì sao không dùng ternary eval_for(instructor, student, project, evaluation)?',
      answer: `\`\`\`
+------------------------------------------+
| [instructor] -- <proj_guide> -- [student]|
|                      |                   |
|                  [project]               |
+------------------------------------------+
                  |
              <eval_for> ---- [evaluation]
\`\`\`
Hộp ngoài là aggregation (proj_guide xem như entity). Bảng: eval_for(<u>i_ID, s_ID, project_id, evaluation_id</u>), FK (i_ID, s_ID, project_id) → proj_guide.

Nếu dùng quan hệ 4 ngôi: mỗi tuple eval_for chứa lại (i, s, p) đã có trong proj_guide → **lặp thông tin**, và không biểu diễn được ràng buộc "chỉ đánh giá những bộ (i, s, p) có tồn tại trong proj_guide".`,
    },
    {
      q: 'Giải thích cách thay ternary R(A, B, C) bằng entity set E và ba binary relationship. Những vấn đề nào phát sinh?',
      answer: `Tạo E với thuộc tính định danh mới; với mỗi (a, b, c) ∈ R tạo e mới và thêm (e, a) vào R<sub>A</sub>, (e, b) vào R<sub>B</sub>, (e, c) vào R<sub>C</sub>. Vấn đề:
- Phải tạo thuộc tính định danh cho E.
- Phải dịch cả ràng buộc của R (ví dụ "mỗi (b, c) có tối đa một a") — không phải lúc nào cũng dịch được bằng cardinality của binary.
- Có những instance của E, R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub> không tương ứng với R nào (e chỉ nối với a) → cần total participation của E vào cả ba.`,
    },
    {
      q: 'Hãy chỉ ra lỗi trong thiết kế: entity takes có thuộc tính đơn `assignment_marks`; student có thuộc tính `dept_name` trong khi đã có relationship stud_dept. Sửa thế nào?',
      answer: `- \`assignment_marks\` single-valued chỉ lưu được một điểm cho mọi bài tập → dùng thuộc tính multivalued {assignment_marks(assignment_no, marks)} hoặc entity assignment + relationship marks(student, assignment) có thuộc tính marks.
- \`dept_name\` trong student là thuộc tính thừa (đã có stud_dept) → bỏ; khi chuyển sang bảng, dept_name sẽ xuất hiện lại trong student vì stud_dept là many-to-one và được gộp.`,
    },
    {
      q: 'Đọc ký hiệu crow\'s foot: `[department] ||----o< [instructor]`. Cardinality và participation là gì? Viết lại bằng `l..h` của sách.',
      answer: `Phía department "||" = đúng một: mỗi instructor thuộc **đúng một** department (total phía instructor). Phía instructor "o<" = không hoặc nhiều: một department có 0..nhiều instructor.

Ký hiệu sách: đường instructor — inst_dept ghi \`1..1\`, đường department — inst_dept ghi \`0..*\`. Bảng: instructor(..., dept_name **not null** → department).`,
    },
  ],

  exercises: [
    // ---------------- Strong entity, composite, multivalued, derived ----------------
    {
      id: '6.01', topic: 'strong entity', level: 1,
      prompt: 'Entity set `lecturer` có thuộc tính <u>ID</u> (khoá), `name` (bắt buộc), `salary`. Tạo bảng `lecturer(ID varchar(5), name varchar(20), salary numeric(8,2))` với primary key và not null phù hợp.',
      solution: `create table lecturer (
  ID      varchar(5) primary key,
  name    varchar(20) not null,
  salary  numeric(8,2)
);`,
      check: `select try_sql($$insert into lecturer values ('L1', 'Ann', 50000)$$)   as first_insert,
       try_sql($$insert into lecturer values ('L1', 'Bob', 60000)$$)   as duplicate_id,
       try_sql($$insert into lecturer values ('L2', null, 60000)$$)    as null_name,
       try_sql($$insert into lecturer values ('L3', 'Cid', null)$$)    as null_salary;`,
    },
    {
      id: '6.02', topic: 'composite attribute', level: 1,
      prompt: `Entity set \`applicant\`:
\`\`\`
applicant
  ID
  name (first_name, middle_initial, last_name)
  address (street (street_number, street_name, apt_number), city, state, zip)
\`\`\`
Tạo bảng \`applicant\` bằng cách **làm phẳng** các composite attribute (mọi cột kiểu varchar(20), ID là primary key).`,
      hint: 'Chỉ giữ các thuộc tính đơn ở mức lá; không có cột name, address, street.',
      solution: `create table applicant (
  ID              varchar(20) primary key,
  first_name      varchar(20),
  middle_initial  varchar(20),
  last_name       varchar(20),
  street_number   varchar(20),
  street_name     varchar(20),
  apt_number      varchar(20),
  city            varchar(20),
  state           varchar(20),
  zip             varchar(20)
);`,
      check: `select string_agg(column_name, ', ' order by column_name) as columns
from information_schema.columns where table_name = 'applicant';`,
    },
    {
      id: '6.03', topic: 'multivalued attribute', level: 2,
      prompt: 'instructor có thuộc tính multivalued `{phone_number}`. Tạo bảng `instructor_phone(ID varchar(5), phone_number varchar(15))`: một giảng viên có nhiều số, không lặp cùng một số, ID tham chiếu instructor và tự xoá khi giảng viên bị xoá.',
      solution: `create table instructor_phone (
  ID            varchar(5) references instructor on delete cascade,
  phone_number  varchar(15),
  primary key (ID, phone_number)
);`,
      check: `select try_sql($$insert into instructor_phone values ('83821', '555-1234')$$) as phone_1,
       try_sql($$insert into instructor_phone values ('83821', '555-9999')$$) as phone_2,
       try_sql($$insert into instructor_phone values ('83821', '555-1234')$$) as duplicate,
       try_sql($$insert into instructor_phone values ('00000', '555-0000')$$) as bad_instructor,
       try_sql($$insert into instructor_phone values ('83821', null)$$)       as null_phone,
       try_sql($$delete from instructor where ID = '83821'$$)                 as delete_instructor,
       sql_value($$select count(*) from instructor_phone$$)                   as phones_left;`,
    },
    {
      id: '6.04', topic: 'derived attribute', level: 2,
      prompt: 'Thuộc tính derived `num_advisees()` của instructor = số sinh viên mà giảng viên đó hướng dẫn (bảng advisor). Không lưu cột này; hãy tạo view `instructor_advisees(ID, name, num_advisees)` cho **mọi** instructor (kể cả người có 0 advisee).',
      hint: 'left outer join advisor on advisor.i_ID = instructor.ID; count(advisor.s_ID).',
      solution: `create view instructor_advisees (ID, name, num_advisees) as
  select i.ID, i.name, count(a.s_ID)
  from instructor i left outer join advisor a on a.i_ID = i.ID
  group by i.ID, i.name;`,
      check: `select * from instructor_advisees;`,
    },
    // ---------------- Weak entity ----------------
    {
      id: '6.05', topic: 'weak entity', level: 2,
      prompt: 'Weak entity set `course_assignment` phụ thuộc **course** qua identifying relationship; discriminator là `assign_no`, thêm thuộc tính `title`. Tạo bảng `course_assignment(course_id varchar(8), assign_no integer, title varchar(30))` với primary key đúng của weak entity, foreign key tới owner, và xoá theo owner.',
      hint: 'PK = PK(owner) ∪ discriminator; on delete cascade.',
      solution: `create table course_assignment (
  course_id  varchar(8) references course on delete cascade,
  assign_no  integer,
  title      varchar(30),
  primary key (course_id, assign_no)
);`,
      check: `select try_sql($$insert into course_assignment values ('CS-101', 1, 'Hello world')$$) as a1,
       try_sql($$insert into course_assignment values ('CS-347', 1, 'ER diagram')$$)  as same_no_other_course,
       try_sql($$insert into course_assignment values ('CS-101', 1, 'Again')$$)       as duplicate,
       try_sql($$insert into course_assignment values ('XX-000', 1, 'No owner')$$)    as no_owner,
       try_sql($$insert into course_assignment values ('CS-101', null, 'No disc')$$)  as null_discriminator,
       try_sql($$delete from course where course_id = 'CS-347'$$)                    as delete_owner,
       sql_value($$select count(*) from course_assignment$$)                         as rows_left;`,
    },
    // ---------------- Relationship sets ----------------
    {
      id: '6.06', topic: 'M:N + attribute', level: 2,
      prompt: 'Relationship set **many-to-many** `mentors` giữa instructor và student, có thuộc tính `start_date date`. Tạo bảng `mentors(i_ID, s_ID, start_date)` (kiểu varchar(5) cho ID) với primary key và các foreign key đúng.',
      solution: `create table mentors (
  i_ID        varchar(5) references instructor (ID),
  s_ID        varchar(5) references student (ID),
  start_date  date,
  primary key (i_ID, s_ID)
);`,
      check: `select try_sql($$insert into mentors values ('10101', '00128', '2024-01-10')$$) as m1,
       try_sql($$insert into mentors values ('10101', '12345', '2024-02-01')$$) as same_instructor,
       try_sql($$insert into mentors values ('45565', '00128', '2024-03-01')$$) as same_student,
       try_sql($$insert into mentors values ('10101', '00128', '2025-01-01')$$) as duplicate_pair,
       try_sql($$insert into mentors values ('10101', '99999', '2025-01-01')$$) as bad_student;`,
    },
    {
      id: '6.07', topic: 'many-to-one gộp', level: 2,
      prompt: 'Entity `laptop(serial_no, model)` và relationship **many-to-one** `assigned_to` từ laptop tới student (mỗi laptop giao cho tối đa một sinh viên, một sinh viên có thể giữ nhiều laptop; laptop có thể chưa giao). **Không tạo bảng riêng** cho relationship: tạo bảng `laptop(serial_no varchar(10), model varchar(20), owner_id varchar(5))`.',
      hint: 'owner_id là FK → student, cho phép null (partial).',
      solution: `create table laptop (
  serial_no  varchar(10) primary key,
  model      varchar(20),
  owner_id   varchar(5) references student (ID)
);`,
      check: `select try_sql($$insert into laptop values ('S1', 'XPS', '00128')$$)   as l1,
       try_sql($$insert into laptop values ('S2', 'Mac', '00128')$$)   as same_owner,
       try_sql($$insert into laptop values ('S3', 'ThinkPad', null)$$) as unassigned,
       try_sql($$insert into laptop values ('S1', 'Dup', '12345')$$)   as duplicate_serial,
       try_sql($$insert into laptop values ('S4', 'Bad', '99999')$$)   as bad_owner,
       (select count(*) from information_schema.tables where table_name = 'assigned_to') as extra_table;`,
    },
    {
      id: '6.08', topic: 'one-to-one', level: 2,
      prompt: 'Relationship **one-to-one** giữa `parking_permit` và instructor: mỗi permit cấp cho **đúng một** instructor, mỗi instructor có **tối đa một** permit. Tạo bảng `parking_permit(permit_no varchar(6), i_ID varchar(5), zone varchar(2))`.',
      hint: 'i_ID: not null (total phía permit) + unique (one-to-one) + FK.',
      solution: `create table parking_permit (
  permit_no  varchar(6) primary key,
  i_ID       varchar(5) not null unique references instructor (ID),
  zone       varchar(2)
);`,
      check: `select try_sql($$insert into parking_permit values ('P1', '10101', 'A')$$) as p1,
       try_sql($$insert into parking_permit values ('P2', '10101', 'B')$$) as second_permit_same_instructor,
       try_sql($$insert into parking_permit values ('P3', null, 'B')$$)    as no_instructor,
       try_sql($$insert into parking_permit values ('P4', '12121', 'B')$$) as other_instructor,
       try_sql($$insert into parking_permit values ('P5', '00000', 'B')$$) as bad_instructor;`,
    },
    {
      id: '6.09', topic: 'total participation', level: 2,
      prompt: 'Entity `textbook(isbn, title)` và relationship many-to-one `used_in` tới course, với **total participation** của textbook (mỗi sách phải dùng cho đúng một course). Tạo bảng `textbook(isbn varchar(13), title varchar(40), course_id varchar(8))` ép được cả cardinality lẫn total participation.',
      solution: `create table textbook (
  isbn       varchar(13) primary key,
  title      varchar(40),
  course_id  varchar(8) not null references course
);`,
      check: `select try_sql($$insert into textbook values ('978-1', 'DB Concepts', 'CS-347')$$) as t1,
       try_sql($$insert into textbook values ('978-2', 'Genetics', 'BIO-301')$$)    as t2,
       try_sql($$insert into textbook values ('978-3', 'Orphan', null)$$)          as no_course,
       try_sql($$insert into textbook values ('978-4', 'Ghost', 'XX-000')$$)       as bad_course;`,
    },
    {
      id: '6.10', topic: 'role / recursive', level: 2,
      prompt: 'Relationship `coreq` trên **cùng** entity set course với hai role `course_id` và `coreq_id` (môn phải học song song). Tạo bảng `coreq(course_id varchar(8), coreq_id varchar(8))`: cả hai là course hợp lệ, không lặp cặp, và một môn không thể là coreq của chính nó.',
      solution: `create table coreq (
  course_id  varchar(8) references course,
  coreq_id   varchar(8) references course,
  primary key (course_id, coreq_id),
  check (course_id <> coreq_id)
);`,
      check: `select try_sql($$insert into coreq values ('CS-315', 'CS-319')$$) as c1,
       try_sql($$insert into coreq values ('CS-319', 'CS-315')$$) as reverse_pair,
       try_sql($$insert into coreq values ('CS-315', 'CS-319')$$) as duplicate,
       try_sql($$insert into coreq values ('CS-315', 'CS-315')$$) as self,
       try_sql($$insert into coreq values ('CS-315', 'XX-000')$$) as bad_course;`,
    },
    {
      id: '6.11', topic: 'cardinality từ dữ liệu', level: 2,
      prompt: 'Trong bảng `advisor`, primary key là s_ID nên advisor là many-to-one từ student tới instructor. Kiểm tra trên dữ liệu: liệt kê `i_ID` và số advisee của các instructor hướng dẫn **nhiều hơn một** sinh viên (chứng tỏ phía instructor là "many").',
      solution: `select i_ID, count(*) as num_advisees
from advisor
group by i_ID
having count(*) > 1;`,
    },
    // ---------------- Specialization ----------------
    {
      id: '6.12', topic: 'specialization M1 (DDL)', level: 2,
      prompt: `Chuyển specialization person → {employee, student} theo **method 1**: tạo
- \`p_person(ID varchar(5) primary key, name varchar(20), street varchar(30), city varchar(20))\`
- \`p_employee(ID, salary numeric(8,2))\` và \`p_student(ID, tot_cred numeric(3,0))\`, trong đó ID của bảng con vừa là primary key vừa là foreign key tới p_person, xoá theo cha.`,
      solution: `create table p_person (
  ID      varchar(5) primary key,
  name    varchar(20),
  street  varchar(30),
  city    varchar(20)
);
create table p_employee (
  ID      varchar(5) primary key references p_person on delete cascade,
  salary  numeric(8,2)
);
create table p_student (
  ID        varchar(5) primary key references p_person on delete cascade,
  tot_cred  numeric(3,0)
);`,
      check: `select try_sql($$insert into p_person values ('X1', 'An', '1 A', 'Hue')$$) as person,
       try_sql($$insert into p_employee values ('X1', 50000)$$)              as employee,
       try_sql($$insert into p_student values ('X1', 30)$$)                  as also_student,
       try_sql($$insert into p_employee values ('X9', 1)$$)                  as employee_without_person,
       try_sql($$insert into p_employee values ('X1', 2)$$)                  as duplicate_employee,
       try_sql($$delete from p_person where ID = 'X1'$$)                     as delete_person,
       sql_value($$select count(*) from p_employee$$)                        as employees_left,
       sql_value($$select count(*) from p_student$$)                         as students_left;`,
    },
    {
      id: '6.13', topic: 'specialization M1 (query)', level: 1,
      prompt: 'Với các bảng method 1 có sẵn `er_person`, `er_employee`, `er_student`: liệt kê ID, name, city, salary của **mọi employee**. (Nhược điểm method 1: phải join để có đủ thuộc tính.)',
      solution: `select p.ID, p.name, p.city, e.salary
from er_person p join er_employee e on e.ID = p.ID;`,
    },
    {
      id: '6.14', topic: 'overlapping / partial', level: 2,
      prompt: 'Trên `er_person`, `er_employee`, `er_student`: trả về hai cột `ID, kind`, với kind là `both` cho người vừa là employee vừa là student, `none` cho người không thuộc entity con nào (partial specialization).',
      hint: 'Dùng exists / not exists hoặc left join + case.',
      solution: `select ID, 'both' as kind from er_person p
where exists (select 1 from er_employee e where e.ID = p.ID)
  and exists (select 1 from er_student s where s.ID = p.ID)
union
select ID, 'none' from er_person p
where not exists (select 1 from er_employee e where e.ID = p.ID)
  and not exists (select 1 from er_student s where s.ID = p.ID);`,
    },
    {
      id: '6.15', topic: 'specialization M2', level: 3,
      prompt: `Chuyển dữ liệu của \`er_person/er_employee/er_student\` sang **method 2**:
1. Tạo bảng \`m2_employee(ID, name, street, city, salary)\` và \`m2_student(ID, name, street, city, tot_credits)\` (cùng kiểu với bảng gốc, ID là primary key) và nạp dữ liệu từ các bảng er_.
2. Tạo view \`m2_person(ID, name, street, city)\` = hợp của hai bảng.
Hệ thống sẽ đếm số dòng mỗi bảng, số người bị **lặp** name/street/city ở cả hai bảng, và số người trong view.`,
      hint: 'insert into m2_employee select p.ID, name, street, city, salary from er_person p join er_employee ...; view dùng union (loại trùng).',
      solution: `create table m2_employee (
  ID varchar(5) primary key, name varchar(20), street varchar(30), city varchar(20), salary numeric(8,2)
);
create table m2_student (
  ID varchar(5) primary key, name varchar(20), street varchar(30), city varchar(20), tot_credits numeric(3,0)
);
insert into m2_employee select p.ID, p.name, p.street, p.city, e.salary from er_person p join er_employee e on e.ID = p.ID;
insert into m2_student select p.ID, p.name, p.street, p.city, s.tot_credits from er_person p join er_student s on s.ID = p.ID;
create view m2_person (ID, name, street, city) as
  select ID, name, street, city from m2_employee
  union
  select ID, name, street, city from m2_student;`,
      check: `select (select count(*) from m2_employee) as employees,
       (select count(*) from m2_student) as students,
       (select count(*) from m2_employee e join m2_student s on s.ID = e.ID) as duplicated_people,
       (select count(*) from m2_person) as people_in_view,
       (select count(*) from er_person) as people_total;`,
    },
    // ---------------- Aggregation, ternary ----------------
    {
      id: '6.16', topic: 'aggregation (DDL)', level: 3,
      prompt: 'Bảng `er_proj_guide(i_ID, s_ID, project_id)` (primary key cả ba cột) và `er_evaluation(evaluation_id, ...)` đã có. Tạo bảng `eval_for(i_ID varchar(5), s_ID varchar(5), project_id varchar(5), evaluation_id varchar(5))` biểu diễn relationship giữa **aggregation** proj_guide và evaluation.',
      hint: 'FK nhiều cột (i_ID, s_ID, project_id) → er_proj_guide; FK evaluation_id → er_evaluation.',
      solution: `create table eval_for (
  i_ID           varchar(5),
  s_ID           varchar(5),
  project_id     varchar(5),
  evaluation_id  varchar(5) references er_evaluation,
  primary key (i_ID, s_ID, project_id, evaluation_id),
  foreign key (i_ID, s_ID, project_id) references er_proj_guide
);`,
      check: `select try_sql($$insert into eval_for values ('10101', '00128', 'PJ3', 'EV1')$$) as guided_triple,
       try_sql($$insert into eval_for values ('10101', '00128', 'PJ2', 'EV1')$$) as not_guided,
       try_sql($$insert into eval_for values ('10101', '00128', 'PJ3', 'EVX')$$) as bad_evaluation,
       try_sql($$insert into eval_for values ('10101', '00128', 'PJ3', 'EV1')$$) as duplicate;`,
    },
    {
      id: '6.17', topic: 'aggregation (query)', level: 2,
      prompt: 'Với `er_proj_guide`, `er_project`, `er_eval_for`, `er_evaluation`: liệt kê mọi bộ hướng dẫn (i_ID, s_ID, project title) kèm grade của evaluation; bộ chưa được đánh giá vẫn xuất hiện với grade null.',
      solution: `select g.i_ID, g.s_ID, p.title, ev.grade
from er_proj_guide g
     join er_project p on p.project_id = g.project_id
     left join er_eval_for f on f.i_ID = g.i_ID and f.s_ID = g.s_ID and f.project_id = g.project_id
     left join er_evaluation ev on ev.evaluation_id = f.evaluation_id;`,
    },
    {
      id: '6.18', topic: 'ternary + arrow', level: 3,
      prompt: 'Ternary relationship `proj_guide_t(instructor, student, project)` có **một mũi tên tới instructor**: mỗi cặp (student, project) có tối đa một instructor hướng dẫn. Tạo bảng `proj_guide_t(i_ID varchar(5), s_ID varchar(5), project_id varchar(5))` với primary key phản ánh đúng ràng buộc đó (FK: i_ID → instructor, s_ID → student, project_id → er_project).',
      hint: 'Phía có mũi tên không nằm trong primary key.',
      solution: `create table proj_guide_t (
  i_ID        varchar(5) not null references instructor (ID),
  s_ID        varchar(5) references student (ID),
  project_id  varchar(5) references er_project,
  primary key (s_ID, project_id)
);`,
      check: `select try_sql($$insert into proj_guide_t values ('10101', '00128', 'PJ1')$$) as g1,
       try_sql($$insert into proj_guide_t values ('45565', '00128', 'PJ1')$$) as second_instructor_same_pair,
       try_sql($$insert into proj_guide_t values ('10101', '00128', 'PJ2')$$) as same_student_other_project,
       try_sql($$insert into proj_guide_t values ('10101', '12345', 'PJ1')$$) as other_student_same_project;`,
    },
    {
      id: '6.19', topic: 'ternary → binary', level: 3,
      prompt: 'Thay ternary proj_guide bằng entity set `guide_e` (thuộc tính định danh `e_id`) và ba relationship R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub> many-to-one, **total** từ phía E (gộp vào bảng E). Tạo bảng `guide_e(e_id integer, i_ID varchar(5), s_ID varchar(5), project_id varchar(5))` sao cho: mỗi e nối đúng một instructor, một student, một project, và không có hai e cho cùng bộ (i_ID, s_ID, project_id).',
      hint: 'not null cho cả ba FK (total participation của E), unique (i_ID, s_ID, project_id).',
      solution: `create table guide_e (
  e_id        integer primary key,
  i_ID        varchar(5) not null references instructor (ID),
  s_ID        varchar(5) not null references student (ID),
  project_id  varchar(5) not null references er_project,
  unique (i_ID, s_ID, project_id)
);`,
      check: `select try_sql($$insert into guide_e values (1, '10101', '00128', 'PJ1')$$) as e1,
       try_sql($$insert into guide_e values (2, '10101', '00128', 'PJ1')$$) as same_triple,
       try_sql($$insert into guide_e values (3, '10101', null, 'PJ1')$$)    as missing_student,
       try_sql($$insert into guide_e values (4, '45565', '00128', 'PJ1')$$) as other_instructor;`,
    },
    {
      id: '6.20', topic: 'reduction tổng hợp', level: 3,
      prompt: `Chuyển đoạn E-R sau thành bảng (kiểu: varchar(10) cho mọi khoá/chuỗi, numeric(10,2) cho tiền, date cho ngày):
\`\`\`
[hotel] hotel_id, name, {phone}
[room]  (weak, owner = hotel) room_no (discriminator), rate
[guest] guest_id, name
<stay>  many-to-many giữa guest và room, thuộc tính check_in
\`\`\`
Tạo các bảng \`hotel(hotel_id, name)\`, \`hotel_phone(hotel_id, phone)\`, \`room(hotel_id, room_no, rate)\`, \`guest(guest_id, name)\`, \`stay(guest_id, hotel_id, room_no, check_in)\` với đủ primary key, foreign key (room và hotel_phone xoá theo hotel). Một khách có thể ở cùng phòng nhiều lần ở các ngày check_in khác nhau.`,
      hint: 'stay: PK (guest_id, hotel_id, room_no, check_in); FK (hotel_id, room_no) → room.',
      solution: `create table hotel (
  hotel_id  varchar(10) primary key,
  name      varchar(10)
);
create table hotel_phone (
  hotel_id  varchar(10) references hotel on delete cascade,
  phone     varchar(10),
  primary key (hotel_id, phone)
);
create table room (
  hotel_id  varchar(10) references hotel on delete cascade,
  room_no   varchar(10),
  rate      numeric(10,2),
  primary key (hotel_id, room_no)
);
create table guest (
  guest_id  varchar(10) primary key,
  name      varchar(10)
);
create table stay (
  guest_id  varchar(10) references guest,
  hotel_id  varchar(10),
  room_no   varchar(10),
  check_in  date,
  primary key (guest_id, hotel_id, room_no, check_in),
  foreign key (hotel_id, room_no) references room
);`,
      check: `select try_sql($$insert into hotel values ('H1', 'Sea')$$)                      as hotel,
       try_sql($$insert into hotel_phone values ('H1', '111'), ('H1', '222')$$)     as two_phones,
       try_sql($$insert into room values ('H1', '101', 50), ('H1', '102', 60)$$)    as rooms,
       try_sql($$insert into room values ('H9', '101', 50)$$)                       as room_no_hotel,
       try_sql($$insert into guest values ('G1', 'An')$$)                           as guest,
       try_sql($$insert into stay values ('G1', 'H1', '101', '2025-01-01')$$)       as stay_1,
       try_sql($$insert into stay values ('G1', 'H1', '101', '2025-02-01')$$)       as stay_again,
       try_sql($$insert into stay values ('G1', 'H1', '999', '2025-03-01')$$)       as bad_room,
       try_sql($$delete from hotel where hotel_id = 'H1'$$)                          as delete_hotel_with_stays;`,
    },
  ],
};
