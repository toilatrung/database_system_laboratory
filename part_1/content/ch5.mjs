export default {
  number: 5,
  slug: 'ch5_advanced_sql',
  title: 'Advanced SQL',
  titleVi: 'SQL nâng cao',

  summary: `
### 1. Truy cập SQL từ ngôn ngữ lập trình
Lý do: SQL không đủ sức biểu diễn mọi tính toán, và không làm được các việc *non-declarative* (in báo cáo, tương tác người dùng, GUI).
Hai cách: **API** (JDBC, ODBC, Python DB-API…) hoặc **embedded SQL** (tiền xử lý lúc biên dịch thành lời gọi hàm).

**JDBC** — mô hình: mở *connection* → tạo *statement* → thực thi & lấy kết quả → xử lý *exception*.
\`\`\`java
try (Connection conn = DriverManager.getConnection(url, userid, passwd);
     Statement stmt = conn.createStatement()) {
    stmt.executeUpdate("insert into instructor values ('77987','Kim','Physics',98000)");
    ResultSet rset = stmt.executeQuery(
        "select dept_name, avg(salary) from instructor group by dept_name");
    while (rset.next())
        System.out.println(rset.getString("dept_name") + " " + rset.getFloat(2));
} catch (SQLException sqle) { System.out.println("SQLException : " + sqle); }
\`\`\`
- \`rs.getString("dept_name")\` ≡ \`rs.getString(1)\` nếu là cột đầu; null: \`rs.getInt("a"); if (rs.wasNull()) ...\`
- **PreparedStatement** với \`?\` + \`setString/setInt\` — **luôn** dùng khi nhận input từ người dùng; **không bao giờ** ghép chuỗi.
- **SQL injection**: nhập \`X' or 'Y' = 'Y\` → \`where name = 'X' or 'Y' = 'Y'\` trả về mọi dòng; hoặc \`X'; update instructor set salary = salary + 10000; --\`.
- **Metadata**: \`ResultSetMetaData\` (getColumnCount, getColumnName, getColumnTypeName), \`DatabaseMetaData\` (getColumns, getTables, getPrimaryKeys) → viết code tổng quát không cần biết trước schema.
- **Transaction**: mặc định *auto-commit* mỗi câu; \`conn.setAutoCommit(false)\` rồi \`conn.commit()\` / \`conn.rollback()\`.
- \`CallableStatement\`: \`{? = call f(?)}\`, \`{call p(?,?)}\`; large objects: \`getBlob()\`, \`getClob()\`.
- **SQLJ**: embedded SQL trong Java — kiểm tra lỗi lúc biên dịch. **ODBC**: chuẩn API cho C, GUI, spreadsheet.

**Embedded SQL**: \`EXEC SQL <statement>;\` · host variable có dấu \`:\` (\`:credit_amount\`), khai báo trong \`BEGIN/END DECLARE SECTION\`.
Cursor: \`declare c cursor for <query>\` → \`open c\` (thực thi, lưu kết quả tạm) → \`fetch c into :si, :sn\` (lặp) → \`SQLSTATE = '02000'\` là hết dữ liệu → \`close c\`.
Cập nhật qua cursor: \`declare c cursor for ... for update\` rồi \`update instructor set salary = salary + 1000 where current of c\`.

### 2. Functions & Procedures
Lưu **business logic** trong DB. Cú pháp chuẩn SQL vs PostgreSQL (PL/pgSQL):

| Chuẩn SQL (slide) | PostgreSQL |
|---|---|
| \`create function f(...) returns integer begin ... end\` | \`create function f(...) returns integer language plpgsql as $$ begin ... end $$;\` |
| \`declare d_count integer;\` | \`declare d_count integer;\` (đặt **trước** begin) |
| \`select count(*) into d_count ...\` | giống |
| \`returns table (...)\` + \`return table (select ...)\` | \`returns table (...) language sql as $$ select ... $$\` |
| \`select * from table(instructor_of('Music'))\` | \`select * from instructor_of('Music')\` |
| \`create procedure p(in a ..., out b ...)\` | giống, gọi bằng \`call p(...)\` |
| \`for r as select ... do ... end for\` | \`for r in select ... loop ... end loop;\` |
| \`set n = n + 1\` | \`n := n + 1;\` |

Các cấu trúc khác: \`while ... do\`, \`repeat ... until\`, \`if ... then ... elseif ... else ... end if\`, \`case\`, \`signal\` / \`raise exception\`.
**External language routines** (C, Java…): nhanh hơn nhưng rủi ro → chạy trong **sandbox** (ngôn ngữ an toàn như Java) hoặc **process riêng** (giao tiếp IPC) — cả hai đều tốn chi phí.

### 3. Triggers
Câu lệnh được hệ thống **tự động thực thi** khi DB thay đổi. Thiết kế trigger = (1) điều kiện kích hoạt, (2) hành động.
\`\`\`sql
-- Chuẩn SQL (slide)
create trigger credits_earned after update of takes on (grade)
referencing new row as nrow referencing old row as orow
for each row
when nrow.grade <> 'F' and nrow.grade is not null
     and (orow.grade = 'F' or orow.grade is null)
begin atomic
  update student set tot_cred = tot_cred +
    (select credits from course where course.course_id = nrow.course_id)
  where student.id = nrow.id;
end;
\`\`\`
PostgreSQL: viết **trigger function** \`returns trigger\` (dùng \`new\`, \`old\`) rồi \`create trigger ... after update of grade on takes for each row when (...) execute function f();\`
- **Row-level** (\`for each row\`) vs **statement-level** (\`for each statement\` + \`referencing old table / new table\` = *transition tables*).
- **before** trigger có thể sửa \`new\` trước khi ghi (ví dụ đổi grade '' thành null).
- **Khi không nên dùng**: duy trì dữ liệu tổng hợp (→ materialized view), replication (→ built-in), có thể dùng encapsulation (method cập nhật). Rủi ro: chạy ngoài ý muốn khi load backup/replicate, lỗi trigger làm hỏng transaction quan trọng, **cascading** triggers.

### 4. Recursive queries
\`\`\`sql
with recursive rec_prereq(course_id, prereq_id) as (
    select course_id, prereq_id from prereq          -- base query
  union
    select rec_prereq.course_id, prereq.prereq_id    -- recursive query
    from rec_prereq, prereq
    where rec_prereq.prereq_id = prereq.course_id
)
select * from rec_prereq;
\`\`\`
= **transitive closure** của prereq. Tính bằng **fixed-point iteration**: lặp tới khi không thêm tuple mới. Truy vấn không đệ quy chỉ join được một số mức cố định. Recursive view phải **monotonic** (không dùng not exists/except/aggregate trên chính nó).

### 5. Ranking
\`\`\`sql
select ID, rank() over (order by GPA desc nulls last) as s_rank
from student_grades order by s_rank;
\`\`\`
- \`rank()\` để lại khoảng trống (1, 1, 3); \`dense_rank()\` không (1, 1, 2).
- \`partition by dept_name\` — xếp hạng trong từng nhóm → top-n mỗi nhóm.
- \`percent_rank()\`, \`cume_dist()\`, \`row_number()\` (không xác định khi có trùng), \`ntile(n)\` (chia n bucket đều).
- Ranking thực hiện **sau** group by. Cần \`order by\` ngoài cùng để kết quả được sắp.

### 6. Windowing
\`\`\`sql
select date, avg(value) over (order by date rows between 1 preceding and 1 following)
from sales;
\`\`\`
\`rows unbounded preceding\`, \`rows between unbounded preceding and current row\`, \`range between 10 preceding and current row\`, \`range between interval '10' day preceding and current row\`. Có thể kết hợp \`partition by\` (ví dụ số dư tài khoản sau mỗi giao dịch).

### 7. OLAP
- **Measure attributes** (đo được, aggregate được: quantity) vs **dimension attributes** (item_name, color, size).
- **Cross-tab / pivot table**: giá trị một dimension làm header dòng, một dimension làm header cột. **Data cube**: tổng quát hoá n chiều.
- Biểu diễn quan hệ: dùng giá trị \`all\` (SQL dùng **null**) cho dòng tổng.
- \`group by cube(a, b, c)\` → **2ⁿ** grouping: mọi tập con. \`group by rollup(a, b, c)\` → các **prefix**: (a,b,c), (a,b), (a), ().
- \`rollup(a), rollup(b, c)\` → tích Descartes các grouping.
- \`grouping(a)\` = 1 nếu null ở đó là null "all". \`decode(grouping(a), 1, 'all', a)\` (Oracle) ~ \`case when grouping(a) = 1 then 'all' else a end\`.
- Thao tác: **pivoting**, **slicing** (cố định 1 dimension), **dicing** (cố định nhiều), **rollup** (mịn → thô), **drill down** (thô → mịn).
- Cài đặt: **MOLAP** (mảng đa chiều trong bộ nhớ), **ROLAP** (chỉ dùng relational DB), **HOLAP** (lai). Chỉ cần precompute một số aggregate; aggregate (item, color) tính được từ (item, color, size) — trừ aggregate *non-decomposable* như median.
`,

  quiz: [
    {
      q: 'Vì sao phải luôn dùng PreparedStatement khi nhận input từ người dùng?',
      options: ['Vì nhanh hơn Statement', 'Để chống SQL injection và xử lý đúng ký tự đặc biệt (D\'Souza)', 'Vì Statement không hỗ trợ insert', 'Vì JDBC bắt buộc'],
      answer: 1,
      explain: 'Tham số được truyền riêng, không bao giờ bị hiểu thành một phần câu SQL.',
    },
    {
      q: 'Người dùng nhập `X\' or \'Y\' = \'Y` vào câu `"select * from instructor where name = \'" + name + "\'"`. Kết quả?',
      options: ['Không trả về gì', 'Trả về instructor tên X', 'Trả về MỌI instructor', 'Lỗi cú pháp'],
      answer: 2,
      explain: "Câu trở thành where name = 'X' or 'Y' = 'Y' — luôn đúng.",
    },
    {
      q: 'Mặc định JDBC xử lý transaction thế nào?',
      options: ['Mỗi câu SQL là một transaction tự commit', 'Mọi câu nằm chung 1 transaction', 'Phải gọi begin', 'Không hỗ trợ transaction'],
      answer: 0,
      explain: 'Auto-commit bật mặc định; dùng setAutoCommit(false) cho transaction nhiều câu.',
    },
    {
      q: 'Trong embedded SQL, `SQLSTATE = \'02000\'` nghĩa là?',
      options: ['Lỗi kết nối', 'Không còn tuple để fetch', 'Vi phạm khoá chính', 'Transaction bị rollback'],
      answer: 1,
      explain: 'No data — cursor đã hết kết quả.',
    },
    {
      q: 'Host variable trong embedded SQL được viết thế nào?',
      options: ['$credit_amount', ':credit_amount', '@credit_amount', '?credit_amount'],
      answer: 1,
      explain: 'Dấu hai chấm phân biệt biến host với tên trong SQL.',
    },
    {
      q: 'Trigger statement-level dùng gì để tham chiếu các dòng bị ảnh hưởng?',
      options: ['new row / old row', 'transition tables: referencing new table / old table', 'cursor', 'không tham chiếu được'],
      answer: 1,
      explain: 'Row-level dùng new/old row; statement-level dùng transition tables.',
    },
    {
      q: 'Tình huống nào KHÔNG nên dùng trigger theo slide?',
      options: ['Kiểm tra ràng buộc phức tạp', 'Duy trì dữ liệu tổng hợp như tổng lương mỗi khoa', 'Ghi log thay đổi', 'Chuẩn hoá giá trị trước khi insert'],
      answer: 1,
      explain: 'Nên dùng materialized view có sẵn trong DBMS.',
    },
    {
      q: 'GPA: 4.0, 4.0, 3.9. rank() và dense_rank() của sinh viên 3.9 lần lượt là?',
      options: ['2 và 2', '3 và 2', '3 và 3', '2 và 3'],
      answer: 1,
      explain: 'rank để lại khoảng trống, dense_rank thì không.',
    },
    {
      q: '`group by cube(item_name, color, size)` tạo ra bao nhiêu grouping?',
      options: ['3', '4', '6', '8'],
      answer: 3,
      explain: '2³ = 8 tập con.',
    },
    {
      q: '`group by rollup(item_name, color, size)` tạo ra bao nhiêu grouping?',
      options: ['3', '4', '7', '8'],
      answer: 1,
      explain: 'Các prefix: (i,c,s), (i,c), (i), () → 4.',
    },
    {
      q: '`grouping(color)` trả về 1 khi nào?',
      options: ['color có giá trị null thật trong dữ liệu', 'null ở cột color đại diện cho "all"', 'color là khoá', 'Luôn trả về 1 với cube'],
      answer: 1,
      explain: 'Dùng để phân biệt null "all" với null thật.',
    },
    {
      q: 'Đi từ doanh số theo (item, color, size) lên doanh số theo item gọi là?',
      options: ['Drill down', 'Rollup', 'Slicing', 'Pivoting'],
      answer: 1,
      explain: 'Rollup: mịn → thô. Drill down ngược lại.',
    },
    {
      q: 'Hệ OLAP chỉ dùng tính năng của relational DB gọi là?',
      options: ['MOLAP', 'ROLAP', 'HOLAP', 'NoSQL'],
      answer: 1,
      explain: 'Relational OLAP.',
    },
    {
      q: 'Aggregate nào KHÔNG tính được từ aggregate mịn hơn (non-decomposable)?',
      options: ['sum', 'count', 'max', 'median'],
      answer: 3,
      explain: 'Không thể suy median tổng từ median từng nhóm con.',
    },
    {
      q: 'Vì sao cần recursive query cho "mọi môn tiên quyết trực tiếp hoặc gián tiếp"?',
      options: [
        'Vì SQL không có join',
        'Truy vấn không đệ quy chỉ join được một số mức cố định, trong khi số mức phụ thuộc dữ liệu',
        'Để chạy nhanh hơn',
        'Vì prereq có khoá chính phức hợp',
      ],
      answer: 1,
      explain: 'Luôn có thể tạo dữ liệu có nhiều mức hơn số join cố định.',
    },
  ],

  questions: [
    {
      q: 'Viết đoạn Java (JDBC) dùng PreparedStatement để chèn instructor (88877, Perry, Finance, 125000), rồi chèn tiếp 88878 chỉ bằng cách đổi tham số thứ nhất.',
      answer: `\`\`\`java
PreparedStatement pStmt = conn.prepareStatement(
    "insert into instructor values(?,?,?,?)");
pStmt.setString(1, "88877");
pStmt.setString(2, "Perry");
pStmt.setString(3, "Finance");
pStmt.setInt(4, 125000);
pStmt.executeUpdate();
pStmt.setString(1, "88878");   // các tham số còn lại giữ nguyên
pStmt.executeUpdate();
\`\`\``,
    },
    {
      q: 'Viết đoạn JDBC chuyển 10000 budget từ Finance sang History thành một transaction an toàn.',
      answer: `\`\`\`java
conn.setAutoCommit(false);
try (PreparedStatement p = conn.prepareStatement(
        "update department set budget = budget + ? where dept_name = ?")) {
    p.setInt(1, -10000); p.setString(2, "Finance"); p.executeUpdate();
    p.setInt(1,  10000); p.setString(2, "History"); p.executeUpdate();
    conn.commit();
} catch (SQLException e) {
    conn.rollback();
} finally {
    conn.setAutoCommit(true);
}
\`\`\``,
    },
    {
      q: 'Viết đoạn embedded SQL (C) in ra ID, name của sinh viên có tot_cred > :credit_amount bằng cursor.',
      answer: `\`\`\`c
EXEC SQL BEGIN DECLARE SECTION;
  int credit_amount; char si[6]; char sn[21];
EXEC SQL END DECLARE SECTION;

EXEC SQL declare c cursor for
  select ID, name from student where tot_cred > :credit_amount;
EXEC SQL open c;
for (;;) {
  EXEC SQL fetch c into :si, :sn;
  if (strcmp(SQLSTATE, "02000") == 0) break;   /* hết dữ liệu */
  printf("%s %s\\n", si, sn);
}
EXEC SQL close c;
\`\`\``,
    },
    {
      q: 'ResultSetMetaData và DatabaseMetaData hữu ích ở đâu?',
      answer: `Khi viết chương trình **tổng quát** không biết trước schema: ví dụ công cụ hiển thị kết quả của câu truy vấn bất kỳ (lấy số cột, tên & kiểu cột), công cụ quản trị liệt kê bảng/cột/khoá chính (như pgAdmin, DBeaver), sinh form nhập liệu tự động.`,
    },
    {
      q: 'Liệt kê các grouping mà `group by rollup(item_name), rollup(color, size)` tạo ra.',
      answer: `{(item_name), ()} × {(color, size), (color), ()} = (item_name, color, size), (item_name, color), (item_name), (color, size), (color), () — 6 grouping.`,
    },
    {
      q: 'Mô tả quá trình fixed-point khi tính rec_prereq nếu prereq = {(C3, C2), (C2, C1)}.',
      answer: `Vòng 0: rec = ∅. Vòng 1 (base): rec = {(C3,C2), (C2,C1)}. Vòng 2: join rec với prereq: (C3,C2) ⋈ (C2,C1) → thêm (C3,C1). Vòng 3: không có tuple mới → **fixed point**, dừng. Kết quả {(C3,C2), (C2,C1), (C3,C1)}.`,
    },
  ],

  exercises: [
    // ---------------- Functions & procedures ----------------
    {
      id: '5.01', topic: 'function', level: 2,
      prompt: 'Tạo function `dept_count(dname varchar(20)) returns integer` (PL/pgSQL) trả về số instructor của khoa. Sau đó dùng nó tìm dept_name, budget của các khoa có **hơn 2** instructor.',
      hint: 'Đặt tên tham số là dname (không phải dept_name) để khỏi nhầm với tên cột.',
      solution: `create function dept_count(dname varchar(20))
returns integer
language plpgsql as $$
declare
  d_count integer;
begin
  select count(*) into d_count
  from instructor
  where instructor.dept_name = dname;
  return d_count;
end $$;

select dept_name, budget
from department
where dept_count(dept_name) > 2;`,
      check: `select dept_name, dept_count(dept_name) from department;`,
    },
    {
      id: '5.02', topic: 'table function', level: 2,
      prompt: 'Tạo **table function** `instructor_of(dname varchar(20))` trả về bảng (ID, name, dept_name, salary) gồm instructor của khoa dname.',
      hint: "returns table (...) language sql as $$ select ... $$; dùng: select * from instructor_of('Music')",
      solution: `create function instructor_of(dname varchar(20))
returns table (ID varchar(5), name varchar(20), dept_name varchar(20), salary numeric(8,2))
language sql as $$
  select ID, name, dept_name, salary
  from instructor
  where instructor.dept_name = dname;
$$;`,
      check: `select * from instructor_of('Comp. Sci.');`,
    },
    {
      id: '5.03', topic: 'procedure', level: 2,
      prompt: 'Tạo **procedure** `dept_count_proc(in dname varchar(20), out d_count integer)`. Gọi thử bằng `call dept_count_proc(\'Physics\', null);`',
      solution: `create procedure dept_count_proc(in dname varchar(20), out d_count integer)
language plpgsql as $$
begin
  select count(*) into d_count
  from instructor
  where instructor.dept_name = dname;
end $$;`,
      check: `call dept_count_proc('Comp. Sci.', null);`,
    },
    {
      id: '5.04', topic: 'for loop', level: 2,
      prompt: 'Tạo function `building_budget(bldg varchar(15)) returns numeric` tính **tổng budget** các khoa đặt ở toà nhà bldg bằng vòng lặp **for** (không dùng sum).',
      solution: `create function building_budget(bldg varchar(15))
returns numeric
language plpgsql as $$
declare
  n numeric := 0;
  r record;
begin
  for r in select budget from department where building = bldg loop
    n := n + r.budget;
  end loop;
  return n;
end $$;`,
      check: `select building, building_budget(building) from (select distinct building from department) as b;`,
    },
    {
      id: '5.05', topic: 'if / elsif', level: 1,
      prompt: "Tạo function `salary_level(sal numeric) returns varchar` trả về `'high'` nếu sal ≥ 90000, `'medium'` nếu sal ≥ 70000, ngược lại `'low'`.",
      solution: `create function salary_level(sal numeric)
returns varchar
language plpgsql as $$
begin
  if sal >= 90000 then
    return 'high';
  elsif sal >= 70000 then
    return 'medium';
  else
    return 'low';
  end if;
end $$;`,
      check: `select ID, salary_level(salary) from instructor;`,
    },
    {
      id: '5.06', topic: 'procedure + update', level: 2,
      prompt: 'Tạo procedure `give_raise(dname varchar(20), pct numeric)` tăng lương pct% cho instructor khoa dname. Gọi `call give_raise(\'Comp. Sci.\', 10);`',
      solution: `create procedure give_raise(dname varchar(20), pct numeric)
language plpgsql as $$
begin
  update instructor
  set salary = salary * (1 + pct / 100)
  where dept_name = dname;
end $$;

call give_raise('Comp. Sci.', 10);`,
      check: `select ID, salary from instructor order by ID;`,
    },
    // ---------------- Triggers ----------------
    {
      id: '5.07', topic: 'row trigger', level: 3,
      prompt: `Cài trigger \`credits_earned\` như slide bằng PostgreSQL: khi grade của takes được update từ **F hoặc null** sang **điểm qua** (khác F, không null) thì cộng credits của môn vào tot_cred của sinh viên.
Hệ thống sẽ thử: Tanaka BIO-301 null → B (cộng 4), rồi B → A (không cộng), Levy CS-101 Fall F → B (cộng 4).`,
      hint: 'create function ... returns trigger (dùng new, old) + create trigger ... after update of grade on takes for each row when (...) execute function ...',
      solution: `create function credits_earned_fn() returns trigger
language plpgsql as $$
begin
  update student
  set tot_cred = tot_cred + (select credits from course
                             where course.course_id = new.course_id)
  where student.ID = new.ID;
  return new;
end $$;

create trigger credits_earned
after update of grade on takes
for each row
when (new.grade <> 'F' and new.grade is not null
      and (old.grade = 'F' or old.grade is null))
execute function credits_earned_fn();`,
      check: `update takes set grade = 'B' where ID = '98988' and course_id = 'BIO-301';
update takes set grade = 'A' where ID = '98988' and course_id = 'BIO-301';
update takes set grade = 'B' where ID = '45678' and course_id = 'CS-101' and semester = 'Fall';
select ID, tot_cred from student where ID in ('98988', '45678');`,
    },
    {
      id: '5.08', topic: 'before trigger', level: 2,
      prompt: "Tạo trigger **before insert or update** trên takes: nếu grade là chuỗi rỗng `''` hoặc chỉ toàn khoảng trắng thì đổi thành **null**.",
      solution: `create function setnull_fn() returns trigger
language plpgsql as $$
begin
  if trim(new.grade) = '' then
    new.grade := null;
  end if;
  return new;
end $$;

create trigger setnull_trigger
before insert or update on takes
for each row
execute function setnull_fn();`,
      check: `insert into takes values ('70557', 'PHY-101', '1', 'Fall', 2017, '');
update takes set grade = ' ' where ID = '00128' and course_id = 'CS-347';
select ID, course_id, grade from takes where ID in ('70557', '00128');`,
    },
    {
      id: '5.09', topic: 'audit trigger', level: 2,
      prompt: 'Tạo bảng `salary_audit(ID varchar(5), old_salary numeric(8,2), new_salary numeric(8,2))` và trigger ghi lại mỗi lần **salary** của instructor thay đổi (chỉ khi giá trị thực sự khác).',
      hint: 'when (old.salary is distinct from new.salary)',
      solution: `create table salary_audit (
  ID         varchar(5),
  old_salary numeric(8,2),
  new_salary numeric(8,2)
);

create function salary_audit_fn() returns trigger
language plpgsql as $$
begin
  insert into salary_audit values (new.ID, old.salary, new.salary);
  return new;
end $$;

create trigger salary_audit_trigger
after update of salary on instructor
for each row
when (old.salary is distinct from new.salary)
execute function salary_audit_fn();`,
      check: `update instructor set salary = salary + 1000 where dept_name = 'History';
update instructor set salary = salary where dept_name = 'Music';
select * from salary_audit;`,
    },
    {
      id: '5.10', topic: 'statement trigger', level: 3,
      prompt: 'Tạo bảng `update_log(table_name text, num_rows integer)` và một trigger **statement-level** (`for each statement`) dùng **transition table** (`referencing new table as ...`) để ghi số dòng bị update mỗi khi chạy update trên instructor.',
      solution: `create table update_log (table_name text, num_rows integer);

create function log_update_fn() returns trigger
language plpgsql as $$
begin
  insert into update_log select 'instructor', count(*) from new_rows;
  return null;
end $$;

create trigger log_instructor_update
after update on instructor
referencing new table as new_rows
for each statement
execute function log_update_fn();`,
      check: `update instructor set salary = salary * 1.01 where dept_name = 'Comp. Sci.';
update instructor set salary = salary * 1.01 where dept_name = 'Nowhere';
select * from update_log;`,
    },
    // ---------------- Recursive queries ----------------
    {
      id: '5.11', topic: 'with recursive', level: 2,
      prompt: 'Dùng **with recursive** trên emp_super: tìm **tất cả** supervisor (trực tiếp và gián tiếp) của `Bob`.',
      solution: `with recursive sup(person, supervisor) as (
    select person, supervisor from emp_super
  union
    select sup.person, emp_super.supervisor
    from sup, emp_super
    where sup.supervisor = emp_super.person
)
select supervisor from sup where person = 'Bob';`,
    },
    {
      id: '5.12', topic: 'transitive closure', level: 2,
      prompt: "Trước tiên thêm 2 dòng prereq `('CS-319', 'CS-190')` và `('BIO-399', 'BIO-301')` để có chuỗi nhiều mức. Sau đó tính **rec_prereq(course_id, prereq_id)** — transitive closure của prereq.",
      solution: `insert into prereq values ('CS-319', 'CS-190'), ('BIO-399', 'BIO-301');

with recursive rec_prereq(course_id, prereq_id) as (
    select course_id, prereq_id from prereq
  union
    select rec_prereq.course_id, prereq.prereq_id
    from rec_prereq, prereq
    where rec_prereq.prereq_id = prereq.course_id
)
select * from rec_prereq;`,
    },
    {
      id: '5.13', topic: 'recursion + depth', level: 3,
      prompt: 'Tìm mọi cấp dưới (trực tiếp và gián tiếp) của `Mary` cùng **cấp độ** (`level`: cấp dưới trực tiếp = 1, cấp dưới của họ = 2, …). Trả về person, level.',
      solution: `with recursive sub(person, level) as (
    select person, 1 from emp_super where supervisor = 'Mary'
  union all
    select e.person, sub.level + 1
    from emp_super e, sub
    where e.supervisor = sub.person
)
select person, level from sub;`,
    },
    // ---------------- Ranking ----------------
    {
      id: '5.14', topic: 'rank', level: 1,
      prompt: 'Xếp hạng sinh viên theo GPA giảm dần từ `student_grades`, sinh viên GPA null xếp **cuối**. Trả về ID, GPA, s_rank.',
      solution: `select ID, GPA, rank() over (order by GPA desc nulls last) as s_rank
from student_grades
order by s_rank;`,
    },
    {
      id: '5.15', topic: 'dense_rank', level: 1,
      prompt: 'Như 5.14 (bỏ qua sinh viên GPA null) nhưng trả về cả `rank()` và `dense_rank()` để so sánh: ID, GPA, r, dr.',
      solution: `select ID, GPA,
       rank()       over (order by GPA desc) as r,
       dense_rank() over (order by GPA desc) as dr
from student_grades
where GPA is not null;`,
    },
    {
      id: '5.16', topic: 'rank without window', level: 3,
      prompt: 'Tính hạng như 5.15 (cột r) **không dùng** window function: hạng = 1 + số sinh viên có GPA cao hơn. Bỏ qua GPA null. Trả về ID, s_rank.',
      solution: `select ID, (1 + (select count(*)
                 from student_grades B
                 where B.GPA > A.GPA)) as s_rank
from student_grades A
where A.GPA is not null
order by s_rank;`,
    },
    {
      id: '5.17', topic: 'partition by', level: 2,
      prompt: 'Xếp hạng sinh viên **trong từng khoa** theo GPA giảm dần (`dept_grades`, bỏ GPA null). Trả về ID, dept_name, dept_rank.',
      solution: `select ID, dept_name,
       rank() over (partition by dept_name order by GPA desc) as dept_rank
from dept_grades
where GPA is not null
order by dept_name, dept_rank;`,
    },
    {
      id: '5.18', topic: 'top-n per group', level: 3,
      prompt: 'Sinh viên có GPA **cao nhất mỗi khoa** (nếu bằng nhau lấy hết). Trả về dept_name, ID, GPA.',
      solution: `select dept_name, ID, GPA
from (select dept_name, ID, GPA,
             rank() over (partition by dept_name order by GPA desc) as r
      from dept_grades
      where GPA is not null) as t
where r = 1;`,
    },
    {
      id: '5.19', topic: 'ntile', level: 2,
      prompt: 'Chia sinh viên (GPA không null) thành **4 nhóm** (quartile) theo GPA giảm dần. Trả về ID, GPA, quartile. *(Lưu ý: ntile với giá trị trùng có thể không xác định — ở đây hãy thêm ID vào order by để cố định: `order by GPA desc, ID`.)*',
      solution: `select ID, GPA, ntile(4) over (order by GPA desc, ID) as quartile
from student_grades
where GPA is not null;`,
    },
    {
      id: '5.20', topic: 'percent_rank / cume_dist', level: 2,
      prompt: 'Với sinh viên có GPA: ID, GPA, `percent_rank()` và `cume_dist()` theo GPA **tăng dần**.',
      solution: `select ID, GPA,
       percent_rank() over (order by GPA) as pr,
       cume_dist()    over (order by GPA) as cd
from student_grades
where GPA is not null;`,
    },
    // ---------------- Windowing ----------------
    {
      id: '5.21', topic: 'moving average', level: 2,
      prompt: 'Từ `daily_sales`: với mỗi ngày, trung bình value của **ngày trước, ngày đó và ngày sau** (`moving_avg`). Sắp theo sale_date.',
      solution: `select sale_date,
       avg(value) over (order by sale_date
                        rows between 1 preceding and 1 following) as moving_avg
from daily_sales
order by sale_date;`,
      ordered: true,
    },
    {
      id: '5.22', topic: 'running total', level: 2,
      prompt: 'Từ `account_txn`: **số dư** của mỗi tài khoản sau mỗi giao dịch (`balance`). Trả về account_number, date_time, value, balance, sắp theo account_number, date_time.',
      solution: `select account_number, date_time, value,
       sum(value) over (partition by account_number
                        order by date_time
                        rows unbounded preceding) as balance
from account_txn
order by account_number, date_time;`,
      ordered: true,
    },
    {
      id: '5.23', topic: 'range window', level: 3,
      prompt: "Từ `daily_sales`: với mỗi ngày, tổng value trong **3 ngày gần nhất** tính cả ngày đó (`range between interval '2 day' preceding and current row`). Sắp theo sale_date.",
      solution: `select sale_date,
       sum(value) over (order by sale_date
                        range between interval '2 day' preceding and current row) as last_3_days
from daily_sales
order by sale_date;`,
      ordered: true,
    },
    // ---------------- OLAP ----------------
    {
      id: '5.24', topic: 'cross-tab data', level: 1,
      prompt: 'Tổng quantity theo (item_name, color) từ bảng `sales`.',
      solution: `select item_name, color, sum(quantity)
from sales
group by item_name, color;`,
    },
    {
      id: '5.25', topic: 'pivot', level: 2,
      prompt: 'Tạo **cross-tab**: mỗi dòng là một item_name, các cột `dark`, `pastel`, `white`, `total` là tổng quantity. Sắp theo item_name.',
      hint: "sum(quantity) filter (where color = 'dark') — hoặc sum(case when color = 'dark' then quantity else 0 end)",
      solution: `select item_name,
       sum(quantity) filter (where color = 'dark')   as dark,
       sum(quantity) filter (where color = 'pastel') as pastel,
       sum(quantity) filter (where color = 'white')  as white,
       sum(quantity)                                 as total
from sales
group by item_name
order by item_name;`,
      ordered: true,
    },
    {
      id: '5.26', topic: 'cube', level: 2,
      prompt: 'Dùng **cube(item_name, color)**: tổng quantity cho mọi tổ hợp, kể cả dòng tổng. Trả về item_name, color, total.',
      solution: `select item_name, color, sum(quantity) as total
from sales
group by cube(item_name, color);`,
    },
    {
      id: '5.27', topic: 'grouping()', level: 3,
      prompt: "Như 5.26 nhưng thay null \"all\" bằng chữ `'all'` (dùng `grouping()` + case, tương đương `decode` trong slide).",
      solution: `select case when grouping(item_name) = 1 then 'all' else item_name end as item_name,
       case when grouping(color) = 1 then 'all' else color end as color,
       sum(quantity) as total
from sales
group by cube(item_name, color);`,
    },
    {
      id: '5.28', topic: 'rollup', level: 2,
      prompt: 'Dùng **rollup(item_name, color, clothes_size)**: tổng quantity. Trả về item_name, color, clothes_size, total.',
      solution: `select item_name, color, clothes_size, sum(quantity) as total
from sales
group by rollup(item_name, color, clothes_size);`,
    },
    {
      id: '5.29', topic: 'rollup + hierarchy', level: 2,
      prompt: 'Kết hợp `sales` với `itemcategory`, dùng **rollup(category, item_name)** để có tổng theo từng item, từng category và tổng chung. Trả về category, item_name, total.',
      solution: `select category, itemcategory.item_name, sum(quantity) as total
from sales, itemcategory
where sales.item_name = itemcategory.item_name
group by rollup(category, itemcategory.item_name);`,
    },
    {
      id: '5.30', topic: 'multiple rollups', level: 3,
      prompt: '`group by rollup(item_name), rollup(color, clothes_size)` sinh ra **bao nhiêu dòng** kết quả trên bảng sales? Viết truy vấn đếm (1 cột, 1 dòng).',
      solution: `select count(*)
from (select item_name, color, clothes_size, sum(quantity)
      from sales
      group by rollup(item_name), rollup(color, clothes_size)) as t;`,
    },
  ],
};
