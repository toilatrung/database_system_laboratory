export default {
  number: 3,
  slug: 'ch3_intro_sql',
  title: 'Introduction to SQL',
  titleVi: 'Nhập môn SQL',

  summary: `
### 1. Các phần của SQL
DML · DDL (schema, integrity, view) · transaction control · embedded/dynamic SQL · authorization.

### 2. DDL & kiểu dữ liệu
\`char(n)\`, \`varchar(n)\`, \`int\`, \`smallint\`, \`numeric(p,d)\` (p chữ số, d chữ số sau dấu phẩy — numeric(3,1) lưu được 44.5 nhưng không lưu được 444.5), \`real\`, \`double precision\`, \`float(n)\`.

\`\`\`sql
create table instructor (
  ID        char(5),
  name      varchar(20) not null,
  dept_name varchar(20),
  salary    numeric(8,2),
  primary key (ID),
  foreign key (dept_name) references department);
\`\`\`
- \`insert into r values (...)\`, \`delete from r\` (xoá dữ liệu, giữ bảng), \`drop table r\` (xoá cả bảng).
- \`alter table r add A D\` (dòng cũ nhận null), \`alter table r drop A\`.

### 3. Cấu trúc truy vấn cơ bản
\`\`\`sql
select A1, ..., An      -- Π (project) — KHÔNG tự loại trùng
from   r1, ..., rm      -- × (Cartesian product)
where  P                -- σ (select)
\`\`\`
- \`distinct\` loại trùng; \`all\` giữ trùng (mặc định); \`*\` mọi cột; có thể dùng biểu thức \`salary/12 as monthly_salary\`.
- Logic: \`and\`, \`or\`, \`not\`; so sánh \`< <= > >= = <>\`; \`between ... and ...\` (bao gồm 2 đầu); tuple comparison \`(a, b) = (x, y)\`.
- **Rename**: \`instructor as T\` (từ khoá as có thể bỏ) — cần cho **self join**.
- **String**: \`like\` với \`%\` (chuỗi bất kỳ) và \`_\` (đúng 1 ký tự); \`escape '\\'\`; phân biệt hoa thường; \`||\` nối chuỗi, \`upper\`, \`lower\`, \`length\`, \`substring\`.
- \`order by A [asc|desc], B ...\`

### 4. Set operations
\`union\`, \`intersect\`, \`except\` — **tự loại trùng**; thêm \`all\` để giữ trùng (\`union all\`…).

### 5. Null
- Phép toán số học với null → null.
- So sánh với null → **unknown**. Dùng \`is null\` / \`is not null\`.
- Logic 3 giá trị: true **and** unknown = unknown; false **and** unknown = false; true **or** unknown = true; false **or** unknown = unknown; **not** unknown = unknown.
- where coi unknown như **false**.
- Aggregate bỏ qua null (trừ \`count(*)\`).

### 6. Aggregate functions
\`avg\`, \`min\`, \`max\`, \`sum\`, \`count\` · \`count(distinct ID)\` · \`count(*)\`.
- Thuộc tính trong select **không nằm trong aggregate** phải có trong \`group by\`.
- \`where\` lọc **trước** khi nhóm; \`having\` lọc **sau** khi nhóm.

### 7. Nested subqueries
| Cấu trúc | Ý nghĩa |
|---|---|
| \`A in (subquery)\` / \`not in\` | set membership |
| \`A > some (subquery)\` | lớn hơn **ít nhất một** giá trị (= some ≡ in, nhưng ≠ some ≢ not in) |
| \`A > all (subquery)\` | lớn hơn **mọi** giá trị (≠ all ≡ not in, nhưng = all ≢ in) |
| \`exists (subquery)\` / \`not exists\` | subquery khác rỗng / rỗng |
| \`unique (subquery)\` | không có tuple trùng — *PostgreSQL không hỗ trợ*, thay bằng \`group by ... having count(*) <= 1\` |
| subquery trong \`from\` | phải đặt alias trong PostgreSQL: \`(select ...) as t\` |
| \`with name(cols) as (...)\` | bảng tạm chỉ dùng trong một câu truy vấn |
| scalar subquery | subquery trả về **đúng 1 giá trị**, dùng ở select/where |

**Correlated subquery**: subquery dùng biến (correlation name) của truy vấn ngoài, ví dụ \`where S.ID = T.ID\`.

"Sinh viên học **tất cả** môn khoa Biology" ⇒ \`not exists (X except Y)\` vì X − Y = ∅ ⇔ X ⊆ Y.

### 8. Modification
- \`delete from r where P\` — điều kiện được tính **trước** rồi mới xoá (avg không bị tính lại giữa chừng).
- \`insert into r [ (cols) ] values (...)\` hoặc \`insert into r select ...\` (select được tính xong trước khi chèn).
- \`update r set A = ... where P\`; thứ tự các update quan trọng → dùng \`case when ... then ... else ... end\`.
- Update dùng scalar subquery: \`update student S set tot_cred = (select ... where S.ID = takes.ID)\`.
`,

  quiz: [
    {
      q: '`select dept_name from instructor` trả về bao nhiêu dòng trên dữ liệu mẫu (12 instructor)?',
      options: ['7', '12', '1', 'Lỗi cú pháp'],
      answer: 1,
      explain: 'SQL giữ dòng trùng theo mặc định (multiset). Cần distinct mới còn 7.',
    },
    {
      q: 'Pattern nào khớp với MỌI chuỗi có ÍT NHẤT 3 ký tự?',
      options: ["'___'", "'___%'", "'_%'", "'%_%'"],
      answer: 1,
      explain: "'___' khớp ĐÚNG 3 ký tự; '___%' là 3 ký tự bất kỳ rồi thêm chuỗi tuỳ ý (có thể rỗng) → ít nhất 3.",
    },
    {
      q: 'Giá trị của `(5 < null) or (1 = 1)`?',
      options: ['true', 'false', 'unknown', 'null'],
      answer: 0,
      explain: 'unknown or true = true.',
    },
    {
      q: 'Giá trị của `(null = null)`?',
      options: ['true', 'false', 'unknown', 'Lỗi'],
      answer: 2,
      explain: 'Mọi so sánh với null (trừ is null / is not null) đều là unknown.',
    },
    {
      q: 'Câu nào sai cú pháp/ngữ nghĩa?',
      options: [
        'select dept_name, avg(salary) from instructor group by dept_name',
        'select dept_name, ID, avg(salary) from instructor group by dept_name',
        'select count(*) from course',
        'select avg(salary) from instructor where dept_name = \'Physics\'',
      ],
      answer: 1,
      explain: 'ID không nằm trong aggregate và không có trong group by.',
    },
    {
      q: 'Điểm khác nhau giữa where và having?',
      options: [
        'Không khác nhau',
        'where lọc tuple trước khi nhóm, having lọc nhóm sau khi nhóm',
        'having lọc trước, where lọc sau',
        'having chỉ dùng được với order by',
      ],
      answer: 1,
      explain: 'Predicate trong having được áp dụng sau khi hình thành nhóm.',
    },
    {
      q: '`(5 < some {0, 5, 6})` = ?',
      options: ['true', 'false', 'unknown', 'Lỗi'],
      answer: 0,
      explain: '5 < 6 nên tồn tại một phần tử thoả.',
    },
    {
      q: '`(5 < all {6, 10})` và `(5 = all {4, 5})` lần lượt là?',
      options: ['true, true', 'true, false', 'false, true', 'false, false'],
      answer: 1,
      explain: '5 < 6 và 5 < 10 → true; 5 ≠ 4 → false.',
    },
    {
      q: 'Cặp nào TƯƠNG ĐƯƠNG?',
      options: ['= some ≡ in', '≠ some ≡ not in', '= all ≡ in', 'not exists ≡ in'],
      answer: 0,
      explain: '= some ≡ in và ≠ all ≡ not in; còn ≠ some ≢ not in và = all ≢ in.',
    },
    {
      q: 'Nếu bảng instructor rỗng, `select count(*), sum(salary) from instructor` trả về?',
      options: ['0 dòng', '1 dòng: (0, 0)', '1 dòng: (0, null)', '1 dòng: (null, null)'],
      answer: 2,
      explain: 'count trên tập rỗng = 0; các aggregate khác trên tập rỗng = null.',
    },
    {
      q: '`delete from instructor where salary < (select avg(salary) from instructor)` — SQL xử lý thế nào?',
      options: [
        'Tính lại avg sau mỗi dòng bị xoá',
        'Tính avg một lần, tìm tất cả dòng cần xoá, rồi mới xoá',
        'Báo lỗi vì subquery cùng bảng',
        'Chỉ xoá dòng đầu tiên',
      ],
      answer: 1,
      explain: 'Để kết quả không phụ thuộc thứ tự xử lý.',
    },
    {
      q: 'Hai câu update tăng 3% cho lương > 100000 và 5% cho phần còn lại. Thứ tự nào đúng?',
      options: [
        'Câu 5% (salary <= 100000) chạy trước',
        'Câu 3% (salary > 100000) chạy trước',
        'Thứ tự không quan trọng',
        'Phải chạy song song',
      ],
      answer: 1,
      explain: 'Nếu tăng 5% trước, người 99 000 lên 103 950 rồi lại bị tăng thêm 3%. Tốt nhất dùng case.',
    },
    {
      q: '`union` khác `union all` thế nào?',
      options: ['union all loại trùng', 'union loại trùng, union all giữ trùng', 'Không khác', 'union all chỉ dùng cho 2 bảng giống hệt nhau'],
      answer: 1,
      explain: 'Các phép set mặc định loại trùng.',
    },
    {
      q: 'Scalar subquery trả về 2 dòng thì sao?',
      options: ['Lấy dòng đầu tiên', 'Trả về null', 'Runtime error', 'Tự động dùng in'],
      answer: 2,
      explain: 'Scalar subquery phải trả về đúng một giá trị.',
    },
  ],

  questions: [
    {
      q: 'Giải thích vì sao truy vấn "sinh viên đã học TẤT CẢ các môn của khoa Biology" không viết được bằng `= all` mà phải dùng `not exists (... except ...)`.',
      answer: `Ta cần kiểm tra **quan hệ bao hàm tập hợp**: tập môn Biology ⊆ tập môn sinh viên đã học.
\`= all\` so sánh **một giá trị** với mọi phần tử của tập — không so sánh được tập với tập.
X ⊆ Y ⇔ X − Y = ∅ ⇔ \`not exists (X except Y)\`.`,
    },
    {
      q: 'Hãy dự đoán kết quả của `select name from instructor where salary > 70000 or salary <= 70000` nếu có một instructor có salary = null. Người đó có xuất hiện không? Vì sao?',
      answer: `Không. Với null: (null > 70000) = unknown, (null <= 70000) = unknown, unknown or unknown = unknown → where coi là false.`,
    },
    {
      q: 'PostgreSQL không hỗ trợ `unique (subquery)`. Viết lại truy vấn "các môn được mở nhiều nhất một lần trong năm 2017" theo 2 cách khác.',
      answer: `\`\`\`sql
-- Cách 1: not exists hai section khác nhau
select T.course_id from course T
where not exists (select 1 from section R1, section R2
                  where R1.course_id = T.course_id and R2.course_id = T.course_id
                    and R1.year = 2017 and R2.year = 2017
                    and (R1.sec_id, R1.semester) <> (R2.sec_id, R2.semester));
-- Cách 2: đếm
select T.course_id from course T
where (select count(*) from section R
       where R.course_id = T.course_id and R.year = 2017) <= 1;
\`\`\``,
    },
    {
      q: 'Phân biệt `delete from student` và `drop table student`.',
      answer: `\`delete from student\` xoá **mọi tuple** nhưng giữ lại bảng (schema). \`drop table student\` xoá cả dữ liệu lẫn schema — bảng không còn tồn tại.`,
    },
  ],

  exercises: [
    // ---------------- Basic select ----------------
    {
      id: '3.01', topic: 'select', level: 1,
      prompt: 'Tìm tên của tất cả instructor.',
      solution: `select name from instructor;`,
    },
    {
      id: '3.02', topic: 'distinct', level: 1,
      prompt: 'Tìm tên các khoa (dept_name) có giảng viên, **không lặp lại**.',
      solution: `select distinct dept_name from instructor;`,
    },
    {
      id: '3.03', topic: 'arithmetic', level: 1,
      prompt: 'Liệt kê ID, name và **lương tháng** (salary / 12) của mỗi instructor, đặt tên cột là `monthly_salary`.',
      solution: `select ID, name, salary / 12 as monthly_salary from instructor;`,
    },
    {
      id: '3.04', topic: 'where', level: 1,
      prompt: 'Tên các instructor khoa `Comp. Sci.` có lương lớn hơn 70000.',
      solution: `select name from instructor where dept_name = 'Comp. Sci.' and salary > 70000;`,
    },
    {
      id: '3.05', topic: 'between', level: 1,
      prompt: 'Tên các instructor có lương từ 90000 đến 100000 (bao gồm cả hai đầu).',
      solution: `select name from instructor where salary between 90000 and 100000;`,
    },
    {
      id: '3.06', topic: 'order by', level: 1,
      prompt: 'Liệt kê dept_name, name, salary của instructor, sắp xếp theo dept_name **tăng dần**, trong cùng khoa thì salary **giảm dần**.',
      solution: `select dept_name, name, salary from instructor order by dept_name asc, salary desc;`,
      ordered: true,
    },
    {
      id: '3.07', topic: 'like', level: 1,
      prompt: 'Tìm title của các course có chứa chuỗi `Intro` ở **đầu** tên.',
      hint: "Pattern 'Intro%'",
      solution: `select title from course where title like 'Intro%';`,
    },
    {
      id: '3.08', topic: 'like', level: 2,
      prompt: 'Tìm tên instructor có **đúng 5 ký tự** và chứa chữ `i`.',
      hint: "Kết hợp '_____' và '%i%'.",
      solution: `select name from instructor where name like '_____' and name like '%i%';`,
    },
    {
      id: '3.09', topic: 'string functions', level: 2,
      prompt: 'Với mỗi course, trả về một cột duy nhất dạng `CS-101: Intro. to Computer Science` (course_id, dấu hai chấm, khoảng trắng, title), đặt tên `label`.',
      hint: 'Toán tử nối chuỗi ||',
      solution: `select course_id || ': ' || title as label from course;`,
    },
    // ---------------- Multiple relations ----------------
    {
      id: '3.10', topic: 'from (join)', level: 1,
      prompt: 'Tên instructor và course_id của các môn họ đã dạy.',
      solution: `select name, course_id from instructor, teaches where instructor.ID = teaches.ID;`,
    },
    {
      id: '3.11', topic: 'from (join)', level: 2,
      prompt: 'Tên instructor khoa `Comp. Sci.` và **title** các môn họ đã dạy (không lặp lại).',
      hint: 'Cần 3 bảng: instructor, teaches, course.',
      solution: `select distinct name, title
from instructor, teaches, course
where instructor.ID = teaches.ID
  and teaches.course_id = course.course_id
  and instructor.dept_name = 'Comp. Sci.';`,
    },
    {
      id: '3.12', topic: 'rename', level: 2,
      prompt: 'Tên (không lặp) các instructor có lương **cao hơn ít nhất một** instructor khoa `Comp. Sci.` — dùng rename `T`, `S` (không dùng some).',
      solution: `select distinct T.name
from instructor as T, instructor as S
where T.salary > S.salary and S.dept_name = 'Comp. Sci.';`,
    },
    {
      id: '3.13', topic: 'self join', level: 2,
      prompt: 'Bảng `emp_super(person, supervisor)`: tìm supervisor của supervisor của `Bob`.',
      solution: `select s2.supervisor
from emp_super s1, emp_super s2
where s1.person = 'Bob' and s1.supervisor = s2.person;`,
    },
    {
      id: '3.14', topic: 'tuple comparison', level: 2,
      prompt: 'Dùng **tuple comparison** `(a, b) = (x, y)`: tìm name, course_id của instructor khoa `Comp. Sci.` cùng các môn họ dạy.',
      solution: `select name, course_id
from instructor, teaches
where (instructor.ID, dept_name) = (teaches.ID, 'Comp. Sci.');`,
    },
    // ---------------- Set operations ----------------
    {
      id: '3.15', topic: 'union', level: 1,
      prompt: 'Các course_id mở ở Fall 2017 **hoặc** Spring 2018.',
      solution: `(select course_id from section where semester = 'Fall' and year = 2017)
union
(select course_id from section where semester = 'Spring' and year = 2018);`,
    },
    {
      id: '3.16', topic: 'union all', level: 2,
      prompt: 'Như câu trên nhưng **giữ lại dòng trùng** (một môn mở ở cả hai kỳ xuất hiện 2 lần; môn có 2 section trong một kỳ cũng xuất hiện 2 lần).',
      solution: `(select course_id from section where semester = 'Fall' and year = 2017)
union all
(select course_id from section where semester = 'Spring' and year = 2018);`,
    },
    {
      id: '3.17', topic: 'except', level: 2,
      prompt: 'ID của các sinh viên **chưa từng** học môn nào (dùng except).',
      solution: `select ID from student
except
select ID from takes;`,
    },
    // ---------------- Null ----------------
    {
      id: '3.18', topic: 'null', level: 1,
      prompt: 'Tìm ID, course_id của các bản ghi takes **chưa có điểm** (grade là null).',
      solution: `select ID, course_id from takes where grade is null;`,
    },
    {
      id: '3.19', topic: 'null', level: 2,
      prompt: 'Đếm số bản ghi takes **có điểm** và **khác F**. Lưu ý null: `grade <> \'F\'` với grade null cho kết quả gì?',
      hint: "grade <> 'F' với null → unknown → bị loại. Thử tự kiểm chứng!",
      solution: `select count(*) from takes where grade <> 'F';`,
    },
    // ---------------- Aggregates ----------------
    {
      id: '3.20', topic: 'aggregate', level: 1,
      prompt: 'Lương trung bình của instructor khoa `Comp. Sci.`',
      solution: `select avg(salary) from instructor where dept_name = 'Comp. Sci.';`,
    },
    {
      id: '3.21', topic: 'count distinct', level: 1,
      prompt: 'Số instructor (khác nhau) dạy ít nhất một môn trong học kỳ Spring 2018.',
      solution: `select count(distinct ID) from teaches where semester = 'Spring' and year = 2018;`,
    },
    {
      id: '3.22', topic: 'group by', level: 1,
      prompt: 'Với mỗi khoa: dept_name và lương trung bình (`avg_salary`).',
      solution: `select dept_name, avg(salary) as avg_salary from instructor group by dept_name;`,
    },
    {
      id: '3.23', topic: 'having', level: 2,
      prompt: 'dept_name và lương trung bình của các khoa có lương trung bình **> 42000**.',
      solution: `select dept_name, avg(salary) as avg_salary
from instructor
group by dept_name
having avg(salary) > 42000;`,
    },
    {
      id: '3.24', topic: 'group by', level: 2,
      prompt: 'Với mỗi section (course_id, sec_id, semester, year) có sinh viên học: số sinh viên đăng ký.',
      solution: `select course_id, sec_id, semester, year, count(ID) as enrollment
from takes
group by course_id, sec_id, semester, year;`,
    },
    {
      id: '3.25', topic: 'group by + join', level: 2,
      prompt: 'Với mỗi sinh viên **có học môn**: ID, name và **tổng số tín chỉ** của các môn đã học (tính cả môn trượt), sắp theo ID.',
      solution: `select student.ID, name, sum(credits) as total
from student, takes, course
where student.ID = takes.ID and takes.course_id = course.course_id
group by student.ID, name
order by student.ID;`,
      ordered: true,
    },
    {
      id: '3.26', topic: 'having', level: 3,
      prompt: 'Với mỗi khoa có **ít nhất 2 instructor**: dept_name, số instructor, lương lớn nhất. Chỉ tính instructor có lương > 50000.',
      hint: 'where lọc lương trước, having lọc nhóm sau.',
      solution: `select dept_name, count(*) as num, max(salary) as max_salary
from instructor
where salary > 50000
group by dept_name
having count(*) >= 2;`,
    },
    // ---------------- Nested subqueries ----------------
    {
      id: '3.27', topic: 'in', level: 2,
      prompt: 'Dùng **in**: các course_id (không lặp) mở ở Fall 2017 **và** Spring 2018.',
      solution: `select distinct course_id
from section
where semester = 'Fall' and year = 2017
  and course_id in (select course_id from section
                    where semester = 'Spring' and year = 2018);`,
    },
    {
      id: '3.28', topic: 'not in', level: 2,
      prompt: 'Dùng **not in**: các course_id mở ở Fall 2017 nhưng **không** mở ở Spring 2018.',
      solution: `select distinct course_id
from section
where semester = 'Fall' and year = 2017
  and course_id not in (select course_id from section
                        where semester = 'Spring' and year = 2018);`,
    },
    {
      id: '3.29', topic: 'in (tuple)', level: 2,
      prompt: 'Đếm số sinh viên (khác nhau) đã học các section do instructor `10101` dạy — dùng `(course_id, sec_id, semester, year) in (...)`.',
      solution: `select count(distinct ID)
from takes
where (course_id, sec_id, semester, year) in
      (select course_id, sec_id, semester, year
       from teaches
       where teaches.ID = '10101');`,
    },
    {
      id: '3.30', topic: 'some', level: 2,
      prompt: 'Dùng **> some**: tên instructor có lương lớn hơn lương của **ít nhất một** instructor khoa `Biology`.',
      solution: `select name
from instructor
where salary > some (select salary from instructor where dept_name = 'Biology');`,
    },
    {
      id: '3.31', topic: 'all', level: 2,
      prompt: 'Dùng **> all**: tên instructor có lương lớn hơn lương của **tất cả** instructor khoa `Finance`.',
      solution: `select name
from instructor
where salary > all (select salary from instructor where dept_name = 'Finance');`,
    },
    {
      id: '3.32', topic: 'all', level: 3,
      prompt: 'Tìm (các) khoa có lương trung bình **cao nhất** — dùng `>= all`.',
      solution: `select dept_name
from instructor
group by dept_name
having avg(salary) >= all (select avg(salary) from instructor group by dept_name);`,
    },
    {
      id: '3.33', topic: 'exists', level: 2,
      prompt: 'Dùng **exists** (correlated subquery): các course_id mở ở Fall 2017 và Spring 2018.',
      solution: `select course_id
from section as S
where semester = 'Fall' and year = 2017
  and exists (select *
              from section as T
              where semester = 'Spring' and year = 2018
                and S.course_id = T.course_id);`,
    },
    {
      id: '3.34', topic: 'not exists', level: 3,
      prompt: 'ID và name của các sinh viên đã học **tất cả** các môn của khoa `Biology` *đã từng mở lớp* (course_id xuất hiện trong section). Dùng `not exists (... except ...)`.',
      hint: 'X = các môn Biology có trong section; Y = các môn sinh viên S đã học. X ⊆ Y.',
      solution: `select S.ID, S.name
from student as S
where not exists ((select course_id from course
                   where dept_name = 'Biology'
                     and course_id in (select course_id from section))
                  except
                  (select T.course_id from takes as T where S.ID = T.ID));`,
    },
    {
      id: '3.35', topic: 'not exists', level: 3,
      prompt: 'ID và name các sinh viên đã học **tất cả** các môn khoa `Biology` (kể cả môn chưa mở — đúng như slide). Kết quả rỗng có hợp lý không?',
      solution: `select distinct S.ID, S.name
from student as S
where not exists ((select course_id from course where dept_name = 'Biology')
                  except
                  (select T.course_id from takes as T where S.ID = T.ID));`,
    },
    {
      id: '3.36', topic: '"unique"', level: 3,
      prompt: 'Các course_id được mở **nhiều nhất một lần** trong năm 2017 (gồm cả môn không mở lần nào). PostgreSQL không có `unique (subquery)` — hãy dùng scalar subquery đếm.',
      solution: `select T.course_id
from course as T
where (select count(*) from section as R
       where T.course_id = R.course_id and R.year = 2017) <= 1;`,
    },
    {
      id: '3.37', topic: 'from subquery', level: 2,
      prompt: 'Không dùng having: dept_name và avg_salary của các khoa có lương trung bình > 42000 (subquery trong from).',
      solution: `select dept_name, avg_salary
from (select dept_name, avg(salary) as avg_salary
      from instructor
      group by dept_name) as dept_avg
where avg_salary > 42000;`,
    },
    {
      id: '3.38', topic: 'with', level: 2,
      prompt: 'Dùng **with**: tìm dept_name của (các) khoa có budget lớn nhất.',
      solution: `with max_budget (value) as
  (select max(budget) from department)
select department.dept_name
from department, max_budget
where department.budget = max_budget.value;`,
    },
    {
      id: '3.39', topic: 'with', level: 3,
      prompt: 'Dùng **with** 2 bảng tạm: các khoa có **tổng lương** lớn hơn **trung bình của tổng lương** các khoa.',
      solution: `with dept_total (dept_name, value) as
  (select dept_name, sum(salary) from instructor group by dept_name),
dept_total_avg (value) as
  (select avg(value) from dept_total)
select dept_name
from dept_total, dept_total_avg
where dept_total.value > dept_total_avg.value;`,
    },
    {
      id: '3.40', topic: 'scalar subquery', level: 2,
      prompt: 'Liệt kê **mọi** khoa cùng số instructor của khoa đó (`num_instructors`) — dùng scalar subquery trong select.',
      solution: `select dept_name,
       (select count(*) from instructor
        where department.dept_name = instructor.dept_name) as num_instructors
from department;`,
    },
    // ---------------- Modification ----------------
    {
      id: '3.41', topic: 'insert', level: 1,
      prompt: "Thêm môn `CS-437`, title `Database Systems`, khoa `Comp. Sci.`, 4 tín chỉ. (Hệ thống sẽ kiểm tra bảng course sau khi chạy.)",
      solution: `insert into course values ('CS-437', 'Database Systems', 'Comp. Sci.', 4);`,
      check: `select * from course order by course_id;`,
    },
    {
      id: '3.42', topic: 'insert null', level: 1,
      prompt: 'Thêm sinh viên `3003`, tên `Green`, khoa `Finance`, tot_cred **null** — chỉ liệt kê các cột cần thiết.',
      solution: `insert into student (ID, name, dept_name) values ('3003', 'Green', 'Finance');`,
      check: `select * from student order by ID;`,
    },
    {
      id: '3.43', topic: 'insert ... select', level: 2,
      prompt: 'Biến mọi sinh viên khoa `Comp. Sci.` có **tot_cred > 100** thành instructor cùng khoa với lương 30000 (insert … select).',
      solution: `insert into instructor
select ID, name, dept_name, 30000
from student
where dept_name = 'Comp. Sci.' and tot_cred > 100;`,
      check: `select * from instructor order by ID;`,
    },
    {
      id: '3.44', topic: 'delete', level: 2,
      prompt: 'Xoá mọi instructor thuộc các khoa đặt ở toà nhà `Watson`.',
      solution: `delete from instructor
where dept_name in (select dept_name from department where building = 'Watson');`,
      check: `select * from instructor order by ID;`,
    },
    {
      id: '3.45', topic: 'delete', level: 2,
      prompt: 'Xoá mọi instructor có lương **thấp hơn lương trung bình** của tất cả instructor.',
      solution: `delete from instructor
where salary < (select avg(salary) from instructor);`,
      check: `select * from instructor order by ID;`,
    },
    {
      id: '3.46', topic: 'update', level: 1,
      prompt: 'Tăng 5% lương cho các instructor có lương **dưới 70000**.',
      solution: `update instructor set salary = salary * 1.05 where salary < 70000;`,
      check: `select ID, salary from instructor order by ID;`,
    },
    {
      id: '3.47', topic: 'update case', level: 2,
      prompt: 'Dùng **một** câu update với `case`: lương > 90000 tăng 3%, còn lại tăng 5%.',
      solution: `update instructor
set salary = case
               when salary <= 90000 then salary * 1.05
               else salary * 1.03
             end;`,
      check: `select ID, salary from instructor order by ID;`,
    },
    {
      id: '3.48', topic: 'update scalar subquery', level: 3,
      prompt: 'Tính lại `tot_cred` cho **mọi** sinh viên = tổng credits các môn đã **qua** (grade khác F và khác null). Sinh viên chưa qua môn nào thì tot_cred = **0** (không phải null).',
      hint: 'coalesce(sum(credits), 0) hoặc case when sum(credits) is not null then ... else 0 end',
      solution: `update student S
set tot_cred = (select coalesce(sum(credits), 0)
                from takes, course
                where takes.course_id = course.course_id
                  and S.ID = takes.ID
                  and takes.grade <> 'F'
                  and takes.grade is not null);`,
      check: `select ID, tot_cred from student order by ID;`,
    },
    {
      id: '3.49', topic: 'alter table', level: 2,
      prompt: 'Thêm cột `email varchar(50)` vào bảng student. Sau đó gán email `zhang@uni.edu` cho sinh viên `00128`.',
      solution: `alter table student add email varchar(50);
update student set email = 'zhang@uni.edu' where ID = '00128';`,
      check: `select ID, email from student order by ID;`,
    },
    {
      id: '3.50', topic: 'create table', level: 2,
      prompt: 'Tạo bảng `club(club_id char(4), name varchar(30) not null, dept_name varchar(20))` với primary key club_id và foreign key dept_name tham chiếu department. Thêm câu lạc bộ `C001`, `Robotics Club`, `Comp. Sci.`.',
      solution: `create table club (
  club_id   char(4),
  name      varchar(30) not null,
  dept_name varchar(20),
  primary key (club_id),
  foreign key (dept_name) references department);
insert into club values ('C001', 'Robotics Club', 'Comp. Sci.');`,
      check: `select c.column_name, c.data_type, c.is_nullable,
       (select count(*) from information_schema.table_constraints tc
        where tc.table_name = 'club' and tc.constraint_type in ('PRIMARY KEY', 'FOREIGN KEY')) as key_constraints,
       (select count(*) from club) as num_rows
from information_schema.columns c
where c.table_name = 'club'
order by c.ordinal_position;`,
    },
  ],
};
