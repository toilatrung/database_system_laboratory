export default {
  number: 2,
  slug: 'ch2_relational_model',
  title: 'Intro to Relational Model',
  titleVi: 'Mô hình quan hệ & Đại số quan hệ',

  summary: `
### 1. Cấu trúc
- **Relation** = bảng; **tuple** = dòng; **attribute** = cột.
- **Domain**: tập giá trị hợp lệ của một attribute. Giá trị phải **atomic** (không chia nhỏ được).
- **null**: thuộc mọi domain, nghĩa là "unknown"/"không tồn tại" → gây phức tạp cho nhiều phép toán.
- Relation là **tập hợp** → thứ tự các tuple **không quan trọng**.
- **Database schema** = cấu trúc logic, ví dụ \`instructor(ID, name, dept_name, salary)\`; **database instance** = snapshot dữ liệu tại một thời điểm.

### 2. Keys (K ⊆ R)
| Khái niệm | Định nghĩa | Ví dụ với instructor |
|---|---|---|
| **Superkey** | Giá trị của K đủ xác định duy nhất một tuple | {ID}, {ID, name} |
| **Candidate key** | Superkey **tối thiểu** (bỏ bớt thuộc tính nào cũng không còn là superkey) | {ID} |
| **Primary key** | Candidate key được chọn làm khoá chính | ID |
| **Foreign key** | Giá trị ở relation này phải xuất hiện ở relation kia | instructor.dept_name → department |

Foreign key: **referencing relation** (instructor) tham chiếu tới **referenced relation** (department).

### 3. Relational query languages
"Pure" languages có sức mạnh tương đương: **relational algebra**, **tuple relational calculus**, **domain relational calculus**.

### 4. Relational algebra — 6 phép cơ bản
| Phép | Ký hiệu | Ý nghĩa | SQL tương ứng |
|---|---|---|---|
| select | σ<sub>p</sub>(r) | lọc tuple thoả predicate p (∧, ∨, ¬, =, ≠, <, ≤, >, ≥) | \`where\` |
| project | Π<sub>A1,…,Ak</sub>(r) | giữ lại một số cột, **loại trùng** | \`select distinct\` |
| union | r ∪ s | hợp (cần cùng arity & domain tương thích) | \`union\` |
| set difference | r − s | có trong r mà không có trong s | \`except\` |
| Cartesian product | r × s | ghép mọi cặp tuple | \`from r, s\` |
| rename | ρ<sub>x</sub>(E), ρ<sub>x(A1..An)</sub>(E) | đặt tên cho kết quả | \`as\` |

Phép mở rộng:
- **Set intersection**: r ∩ s (\`intersect\`) = r − (r − s).
- **Join**: r ⋈<sub>θ</sub> s = σ<sub>θ</sub>(r × s).
- **Assignment**: temp ← E, giúp viết truy vấn như một chương trình tuần tự.
- **Aggregation**: <sub>G</sub>𝒢<sub>F(A)</sub>(r), F ∈ {avg, min, max, sum, count}; G là thuộc tính group by.

### 5. Equivalent queries
Hai biểu thức **equivalent** nếu cho cùng kết quả trên **mọi** database, ví dụ:
- σ<sub>p1 ∧ p2</sub>(r) ≡ σ<sub>p1</sub>(σ<sub>p2</sub>(r))
- σ<sub>dept='Physics'</sub>(instructor ⋈ teaches) ≡ σ<sub>dept='Physics'</sub>(instructor) ⋈ teaches (đẩy selection xuống trước join → nhanh hơn).
`,

  quiz: [
    {
      q: 'Relation r có schema R(A, B, C). {A} là candidate key. Khẳng định nào ĐÚNG?',
      options: ['{A, B} là candidate key', '{A, B} là superkey', '{B} chắc chắn là superkey', '{A, B, C} không phải superkey'],
      answer: 1,
      explain: 'Mọi tập chứa một superkey đều là superkey, nhưng {A,B} không tối thiểu nên không phải candidate key.',
    },
    {
      q: 'Trong instructor(ID, name, dept_name, salary), dept_name là foreign key tham chiếu department. Relation nào là referencing relation?',
      options: ['department', 'instructor', 'Cả hai', 'Không có'],
      answer: 1,
      explain: 'instructor chứa foreign key nên là referencing; department là referenced.',
    },
    {
      q: 'Phép nào KHÔNG thuộc 6 phép cơ bản của relational algebra?',
      options: ['Select σ', 'Rename ρ', 'Set intersection ∩', 'Cartesian product ×'],
      answer: 2,
      explain: '∩ có thể biểu diễn bằng phép trừ: r ∩ s = r − (r − s).',
    },
    {
      q: 'Kết quả của Π<sub>dept_name</sub>(instructor) có bao nhiêu tuple với dữ liệu mẫu (12 instructor, 7 khoa, mỗi khoa đều có giảng viên)?',
      options: ['12', '7', '1', 'Không xác định'],
      answer: 1,
      explain: 'Project loại bỏ dòng trùng vì relation là tập hợp.',
    },
    {
      q: 'Điều kiện để r ∪ s hợp lệ là gì?',
      options: [
        'r và s có cùng tên thuộc tính',
        'r và s có cùng arity và domain các cột tương thích',
        'r và s có cùng số tuple',
        'r và s có chung primary key',
      ],
      answer: 1,
      explain: 'Cần cùng số cột và cột thứ i của hai bên cùng loại giá trị.',
    },
    {
      q: '|r| = 12 tuple, |s| = 15 tuple. |r × s| = ?',
      options: ['27', '180', '12', '15'],
      answer: 1,
      explain: 'Cartesian product ghép mọi cặp: 12 × 15 = 180.',
    },
    {
      q: 'r ⋈<sub>θ</sub> s được định nghĩa bằng?',
      options: ['σ<sub>θ</sub>(r × s)', 'Π<sub>θ</sub>(r × s)', 'r × σ<sub>θ</sub>(s)', 'σ<sub>θ</sub>(r) ∪ σ<sub>θ</sub>(s)'],
      answer: 0,
      explain: 'Join = Cartesian product rồi select theo điều kiện θ.',
    },
    {
      q: 'Vì sao primary key không nên là thuộc tính có thể null hoặc hay thay đổi?',
      options: [
        'Vì DBMS không cho phép index trên cột đó',
        'Vì key dùng để xác định tuple duy nhất và được foreign key khác tham chiếu',
        'Vì null chiếm nhiều bộ nhớ',
        'Không có lý do gì',
      ],
      answer: 1,
      explain: 'Khoá thay đổi thì mọi foreign key tham chiếu tới nó phải sửa theo; null thì không xác định được tuple.',
    },
    {
      q: 'σ<sub>dept_name="Physics" ∧ salary>90000</sub>(instructor) và σ<sub>dept_name="Physics"</sub>(σ<sub>salary>90000</sub>(instructor)) là hai biểu thức…',
      options: ['Identical', 'Equivalent', 'Khác nhau về kết quả', 'Một trong hai không hợp lệ'],
      answer: 1,
      explain: 'Không giống hệt nhau về cách viết nhưng luôn cho cùng kết quả → equivalent.',
    },
    {
      q: 'Kết quả của <sub>dept_name</sub>𝒢<sub>avg(salary)</sub>(instructor) có bao nhiêu tuple trên dữ liệu mẫu?',
      options: ['1', '7', '12', '84'],
      answer: 1,
      explain: 'Một tuple cho mỗi nhóm dept_name — có 7 khoa đều có giảng viên.',
    },
  ],

  questions: [
    {
      q: 'Cho student(ID, name, dept_name, tot_cred) và takes(ID, course_id, sec_id, semester, year, grade). Liệt kê các superkey và candidate key của takes. Primary key nên là gì?',
      answer: `Một sinh viên có thể học lại cùng một môn ở học kỳ khác, nên cần cả 5 thuộc tính:
- Candidate key: **{ID, course_id, sec_id, semester, year}** → chọn làm primary key.
- Superkey: candidate key đó và mọi tập chứa nó, ví dụ {ID, course_id, sec_id, semester, year, grade}.
- {ID, course_id} **không** là superkey vì Levy (45678) học CS-101 hai lần.`,
    },
    {
      q: 'Viết biểu thức relational algebra: tên các instructor khoa Physics có lương > 90 000.',
      answer: `Π<sub>name</sub>(σ<sub>dept_name="Physics" ∧ salary>90000</sub>(instructor))  → kết quả: Einstein.`,
    },
    {
      q: 'Viết biểu thức relational algebra: các course_id được dạy ở Fall 2017 nhưng KHÔNG được dạy ở Spring 2018.',
      answer: `Π<sub>course_id</sub>(σ<sub>semester="Fall" ∧ year=2017</sub>(section)) − Π<sub>course_id</sub>(σ<sub>semester="Spring" ∧ year=2018</sub>(section))
→ CS-347, PHY-101.`,
    },
    {
      q: 'Viết biểu thức relational algebra (dùng join): tên instructor và course_id các môn họ dạy, chỉ với instructor khoa Comp. Sci. Viết 2 cách tương đương, cách nào hiệu quả hơn?',
      answer: `Cách 1: Π<sub>name, course_id</sub>(σ<sub>dept_name="Comp. Sci."</sub>(instructor ⋈<sub>instructor.ID=teaches.ID</sub> teaches))
Cách 2: Π<sub>name, course_id</sub>(σ<sub>dept_name="Comp. Sci."</sub>(instructor) ⋈<sub>instructor.ID=teaches.ID</sub> teaches)
Cách 2 thường hiệu quả hơn vì lọc bớt instructor **trước** khi join (selection pushdown).`,
    },
    {
      q: 'Dùng rename và Cartesian product: tìm lương lớn nhất của instructor **mà không dùng hàm max**.',
      answer: `Lấy các mức lương **không** phải lớn nhất (có ai đó lương cao hơn) rồi trừ đi:
Π<sub>salary</sub>(instructor) − Π<sub>instructor.salary</sub>(σ<sub>instructor.salary < d.salary</sub>(instructor × ρ<sub>d</sub>(instructor)))
→ 95000.`,
    },
    {
      q: 'Dùng assignment: tìm ID những instructor khoa Physics HOẶC Music.',
      answer: `Physics ← σ<sub>dept_name="Physics"</sub>(instructor)
Music ← σ<sub>dept_name="Music"</sub>(instructor)
Π<sub>ID</sub>(Physics ∪ Music)`,
    },
    {
      q: 'Viết biểu thức aggregation: số section mở trong năm 2018; và lương trung bình theo từng khoa.',
      answer: `𝒢<sub>count(course_id)</sub>(σ<sub>year=2018</sub>(section))
<sub>dept_name</sub>𝒢<sub>avg(salary)</sub>(instructor)`,
    },
  ],

  exercises: [
    {
      id: '2.01',
      topic: 'σ select',
      level: 1,
      prompt: 'Viết SQL tương đương với σ<sub>dept_name="Physics"</sub>(instructor).',
      hint: 'σ ứng với mệnh đề where; lấy mọi cột.',
      solution: `select * from instructor where dept_name = 'Physics';`,
    },
    {
      id: '2.02',
      topic: 'σ select',
      level: 1,
      prompt: 'σ<sub>dept_name="Physics" ∧ salary>90000</sub>(instructor)',
      hint: '∧ là and.',
      solution: `select * from instructor where dept_name = 'Physics' and salary > 90000;`,
    },
    {
      id: '2.03',
      topic: 'σ select',
      level: 1,
      prompt: 'σ<sub>dept_name=building</sub>(department) — khoa có tên trùng với tên toà nhà (so sánh 2 thuộc tính).',
      hint: 'Kết quả có thể rỗng — vẫn đúng!',
      solution: `select * from department where dept_name = building;`,
    },
    {
      id: '2.04',
      topic: 'Π project',
      level: 1,
      prompt: 'Π<sub>ID, name, salary</sub>(instructor). Nhớ rằng project trong relational algebra loại bỏ dòng trùng.',
      hint: 'select distinct ...',
      solution: `select distinct ID, name, salary from instructor;`,
    },
    {
      id: '2.05',
      topic: 'composition',
      level: 1,
      prompt: 'Π<sub>name</sub>(σ<sub>dept_name="Physics"</sub>(instructor))',
      solution: `select distinct name from instructor where dept_name = 'Physics';`,
    },
    {
      id: '2.06',
      topic: '× product',
      level: 2,
      prompt: 'Đếm số tuple của instructor × teaches (trả về 1 cột, 1 dòng).',
      hint: 'from instructor, teaches; dùng count(*).',
      solution: `select count(*) from instructor, teaches;`,
    },
    {
      id: '2.07',
      topic: '⋈ join',
      level: 2,
      prompt: 'σ<sub>instructor.ID = teaches.ID</sub>(instructor × teaches) — trả về tất cả cột của cả hai bảng.',
      hint: 'Cartesian product + điều kiện where.',
      solution: `select * from instructor, teaches where instructor.ID = teaches.ID;`,
    },
    {
      id: '2.08',
      topic: '∪ union',
      level: 2,
      prompt: 'Π<sub>course_id</sub>(σ<sub>semester="Fall" ∧ year=2017</sub>(section)) ∪ Π<sub>course_id</sub>(σ<sub>semester="Spring" ∧ year=2018</sub>(section))',
      solution: `select course_id from section where semester = 'Fall' and year = 2017
union
select course_id from section where semester = 'Spring' and year = 2018;`,
    },
    {
      id: '2.09',
      topic: '∩ intersection',
      level: 2,
      prompt: 'Các course_id được dạy ở **cả** Fall 2017 **và** Spring 2018.',
      solution: `select course_id from section where semester = 'Fall' and year = 2017
intersect
select course_id from section where semester = 'Spring' and year = 2018;`,
    },
    {
      id: '2.10',
      topic: '− difference',
      level: 2,
      prompt: 'Các course_id dạy ở Fall 2017 nhưng **không** dạy ở Spring 2018.',
      solution: `select course_id from section where semester = 'Fall' and year = 2017
except
select course_id from section where semester = 'Spring' and year = 2018;`,
    },
    {
      id: '2.11',
      topic: 'ρ rename',
      level: 3,
      prompt: 'Không dùng max: tìm lương cao nhất bằng cách lấy tất cả mức lương trừ đi các mức lương nhỏ hơn một mức lương khác (xem câu hỏi tự luận cùng chương).',
      hint: 'instructor × ρ_d(instructor) ⇒ from instructor, instructor as d',
      solution: `select salary from instructor
except
select instructor.salary
from instructor, instructor as d
where instructor.salary < d.salary;`,
    },
    {
      id: '2.12',
      topic: '𝒢 aggregation',
      level: 2,
      prompt: '<sub>dept_name</sub>𝒢<sub>avg(salary)</sub>(instructor) — trả về dept_name và lương trung bình.',
      solution: `select dept_name, avg(salary) from instructor group by dept_name;`,
    },
    {
      id: '2.13',
      topic: '𝒢 aggregation',
      level: 2,
      prompt: '𝒢<sub>count(course_id)</sub>(σ<sub>year=2018</sub>(section)) — số section trong năm 2018.',
      solution: `select count(course_id) from section where year = 2018;`,
    },
    {
      id: '2.14',
      topic: 'keys',
      level: 3,
      prompt: 'Kiểm tra bằng dữ liệu: {ID, course_id} có phải superkey của takes không? Liệt kê các cặp (ID, course_id) xuất hiện **nhiều hơn 1 lần** trong takes, kèm số lần.',
      hint: 'group by ID, course_id having count(*) > 1',
      solution: `select ID, course_id, count(*)
from takes
group by ID, course_id
having count(*) > 1;`,
    },
  ],
};
