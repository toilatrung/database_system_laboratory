# Chương 5 — SQL nâng cao

*Advanced SQL · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch5`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 1. Truy cập SQL từ ngôn ngữ lập trình
Lý do: SQL không đủ sức biểu diễn mọi tính toán, và không làm được các việc *non-declarative* (in báo cáo, tương tác người dùng, GUI).
Hai cách: **API** (JDBC, ODBC, Python DB-API…) hoặc **embedded SQL** (tiền xử lý lúc biên dịch thành lời gọi hàm).

**JDBC** — mô hình: mở *connection* → tạo *statement* → thực thi & lấy kết quả → xử lý *exception*.
```java
try (Connection conn = DriverManager.getConnection(url, userid, passwd);
     Statement stmt = conn.createStatement()) {
    stmt.executeUpdate("insert into instructor values ('77987','Kim','Physics',98000)");
    ResultSet rset = stmt.executeQuery(
        "select dept_name, avg(salary) from instructor group by dept_name");
    while (rset.next())
        System.out.println(rset.getString("dept_name") + " " + rset.getFloat(2));
} catch (SQLException sqle) { System.out.println("SQLException : " + sqle); }
```
- `rs.getString("dept_name")` ≡ `rs.getString(1)` nếu là cột đầu; null: `rs.getInt("a"); if (rs.wasNull()) ...`
- **PreparedStatement** với `?` + `setString/setInt` — **luôn** dùng khi nhận input từ người dùng; **không bao giờ** ghép chuỗi.
- **SQL injection**: nhập `X' or 'Y' = 'Y` → `where name = 'X' or 'Y' = 'Y'` trả về mọi dòng; hoặc `X'; update instructor set salary = salary + 10000; --`.
- **Metadata**: `ResultSetMetaData` (getColumnCount, getColumnName, getColumnTypeName), `DatabaseMetaData` (getColumns, getTables, getPrimaryKeys) → viết code tổng quát không cần biết trước schema.
- **Transaction**: mặc định *auto-commit* mỗi câu; `conn.setAutoCommit(false)` rồi `conn.commit()` / `conn.rollback()`.
- `CallableStatement`: `{? = call f(?)}`, `{call p(?,?)}`; large objects: `getBlob()`, `getClob()`.
- **SQLJ**: embedded SQL trong Java — kiểm tra lỗi lúc biên dịch. **ODBC**: chuẩn API cho C, GUI, spreadsheet.

**Embedded SQL**: `EXEC SQL <statement>;` · host variable có dấu `:` (`:credit_amount`), khai báo trong `BEGIN/END DECLARE SECTION`.
Cursor: `declare c cursor for <query>` → `open c` (thực thi, lưu kết quả tạm) → `fetch c into :si, :sn` (lặp) → `SQLSTATE = '02000'` là hết dữ liệu → `close c`.
Cập nhật qua cursor: `declare c cursor for ... for update` rồi `update instructor set salary = salary + 1000 where current of c`.

### 2. Functions & Procedures
Lưu **business logic** trong DB. Cú pháp chuẩn SQL vs PostgreSQL (PL/pgSQL):

| Chuẩn SQL (slide) | PostgreSQL |
|---|---|
| `create function f(...) returns integer begin ... end` | `create function f(...) returns integer language plpgsql as $$ begin ... end $$;` |
| `declare d_count integer;` | `declare d_count integer;` (đặt **trước** begin) |
| `select count(*) into d_count ...` | giống |
| `returns table (...)` + `return table (select ...)` | `returns table (...) language sql as $$ select ... $$` |
| `select * from table(instructor_of('Music'))` | `select * from instructor_of('Music')` |
| `create procedure p(in a ..., out b ...)` | giống, gọi bằng `call p(...)` |
| `for r as select ... do ... end for` | `for r in select ... loop ... end loop;` |
| `set n = n + 1` | `n := n + 1;` |

Các cấu trúc khác: `while ... do`, `repeat ... until`, `if ... then ... elseif ... else ... end if`, `case`, `signal` / `raise exception`.
**External language routines** (C, Java…): nhanh hơn nhưng rủi ro → chạy trong **sandbox** (ngôn ngữ an toàn như Java) hoặc **process riêng** (giao tiếp IPC) — cả hai đều tốn chi phí.

### 3. Triggers
Câu lệnh được hệ thống **tự động thực thi** khi DB thay đổi. Thiết kế trigger = (1) điều kiện kích hoạt, (2) hành động.
```sql
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
```
PostgreSQL: viết **trigger function** `returns trigger` (dùng `new`, `old`) rồi `create trigger ... after update of grade on takes for each row when (...) execute function f();`
- **Row-level** (`for each row`) vs **statement-level** (`for each statement` + `referencing old table / new table` = *transition tables*).
- **before** trigger có thể sửa `new` trước khi ghi (ví dụ đổi grade '' thành null).
- **Khi không nên dùng**: duy trì dữ liệu tổng hợp (→ materialized view), replication (→ built-in), có thể dùng encapsulation (method cập nhật). Rủi ro: chạy ngoài ý muốn khi load backup/replicate, lỗi trigger làm hỏng transaction quan trọng, **cascading** triggers.

### 4. Recursive queries
```sql
with recursive rec_prereq(course_id, prereq_id) as (
    select course_id, prereq_id from prereq          -- base query
  union
    select rec_prereq.course_id, prereq.prereq_id    -- recursive query
    from rec_prereq, prereq
    where rec_prereq.prereq_id = prereq.course_id
)
select * from rec_prereq;
```
= **transitive closure** của prereq. Tính bằng **fixed-point iteration**: lặp tới khi không thêm tuple mới. Truy vấn không đệ quy chỉ join được một số mức cố định. Recursive view phải **monotonic** (không dùng not exists/except/aggregate trên chính nó).

### 5. Ranking
```sql
select ID, rank() over (order by GPA desc nulls last) as s_rank
from student_grades order by s_rank;
```
- `rank()` để lại khoảng trống (1, 1, 3); `dense_rank()` không (1, 1, 2).
- `partition by dept_name` — xếp hạng trong từng nhóm → top-n mỗi nhóm.
- `percent_rank()`, `cume_dist()`, `row_number()` (không xác định khi có trùng), `ntile(n)` (chia n bucket đều).
- Ranking thực hiện **sau** group by. Cần `order by` ngoài cùng để kết quả được sắp.

### 6. Windowing
```sql
select date, avg(value) over (order by date rows between 1 preceding and 1 following)
from sales;
```
`rows unbounded preceding`, `rows between unbounded preceding and current row`, `range between 10 preceding and current row`, `range between interval '10' day preceding and current row`. Có thể kết hợp `partition by` (ví dụ số dư tài khoản sau mỗi giao dịch).

### 7. OLAP
- **Measure attributes** (đo được, aggregate được: quantity) vs **dimension attributes** (item_name, color, size).
- **Cross-tab / pivot table**: giá trị một dimension làm header dòng, một dimension làm header cột. **Data cube**: tổng quát hoá n chiều.
- Biểu diễn quan hệ: dùng giá trị `all` (SQL dùng **null**) cho dòng tổng.
- `group by cube(a, b, c)` → **2ⁿ** grouping: mọi tập con. `group by rollup(a, b, c)` → các **prefix**: (a,b,c), (a,b), (a), ().
- `rollup(a), rollup(b, c)` → tích Descartes các grouping.
- `grouping(a)` = 1 nếu null ở đó là null "all". `decode(grouping(a), 1, 'all', a)` (Oracle) ~ `case when grouping(a) = 1 then 'all' else a end`.
- Thao tác: **pivoting**, **slicing** (cố định 1 dimension), **dicing** (cố định nhiều), **rollup** (mịn → thô), **drill down** (thô → mịn).
- Cài đặt: **MOLAP** (mảng đa chiều trong bộ nhớ), **ROLAP** (chỉ dùng relational DB), **HOLAP** (lai). Chỉ cần precompute một số aggregate; aggregate (item, color) tính được từ (item, color, size) — trừ aggregate *non-decomposable* như median.

## 2. Trắc nghiệm (15 câu)

**Câu 1.** Vì sao phải luôn dùng PreparedStatement khi nhận input từ người dùng?

- A. Vì nhanh hơn Statement
- B. Để chống SQL injection và xử lý đúng ký tự đặc biệt (D'Souza)
- C. Vì Statement không hỗ trợ insert
- D. Vì JDBC bắt buộc

<details><summary>Đáp án</summary>

**B** — Tham số được truyền riêng, không bao giờ bị hiểu thành một phần câu SQL.

</details>

**Câu 2.** Người dùng nhập `X' or 'Y' = 'Y` vào câu `"select * from instructor where name = '" + name + "'"`. Kết quả?

- A. Không trả về gì
- B. Trả về instructor tên X
- C. Trả về MỌI instructor
- D. Lỗi cú pháp

<details><summary>Đáp án</summary>

**C** — Câu trở thành where name = 'X' or 'Y' = 'Y' — luôn đúng.

</details>

**Câu 3.** Mặc định JDBC xử lý transaction thế nào?

- A. Mỗi câu SQL là một transaction tự commit
- B. Mọi câu nằm chung 1 transaction
- C. Phải gọi begin
- D. Không hỗ trợ transaction

<details><summary>Đáp án</summary>

**A** — Auto-commit bật mặc định; dùng setAutoCommit(false) cho transaction nhiều câu.

</details>

**Câu 4.** Trong embedded SQL, `SQLSTATE = '02000'` nghĩa là?

- A. Lỗi kết nối
- B. Không còn tuple để fetch
- C. Vi phạm khoá chính
- D. Transaction bị rollback

<details><summary>Đáp án</summary>

**B** — No data — cursor đã hết kết quả.

</details>

**Câu 5.** Host variable trong embedded SQL được viết thế nào?

- A. $credit_amount
- B. :credit_amount
- C. @credit_amount
- D. ?credit_amount

<details><summary>Đáp án</summary>

**B** — Dấu hai chấm phân biệt biến host với tên trong SQL.

</details>

**Câu 6.** Trigger statement-level dùng gì để tham chiếu các dòng bị ảnh hưởng?

- A. new row / old row
- B. transition tables: referencing new table / old table
- C. cursor
- D. không tham chiếu được

<details><summary>Đáp án</summary>

**B** — Row-level dùng new/old row; statement-level dùng transition tables.

</details>

**Câu 7.** Tình huống nào KHÔNG nên dùng trigger theo slide?

- A. Kiểm tra ràng buộc phức tạp
- B. Duy trì dữ liệu tổng hợp như tổng lương mỗi khoa
- C. Ghi log thay đổi
- D. Chuẩn hoá giá trị trước khi insert

<details><summary>Đáp án</summary>

**B** — Nên dùng materialized view có sẵn trong DBMS.

</details>

**Câu 8.** GPA: 4.0, 4.0, 3.9. rank() và dense_rank() của sinh viên 3.9 lần lượt là?

- A. 2 và 2
- B. 3 và 2
- C. 3 và 3
- D. 2 và 3

<details><summary>Đáp án</summary>

**B** — rank để lại khoảng trống, dense_rank thì không.

</details>

**Câu 9.** `group by cube(item_name, color, size)` tạo ra bao nhiêu grouping?

- A. 3
- B. 4
- C. 6
- D. 8

<details><summary>Đáp án</summary>

**D** — 2³ = 8 tập con.

</details>

**Câu 10.** `group by rollup(item_name, color, size)` tạo ra bao nhiêu grouping?

- A. 3
- B. 4
- C. 7
- D. 8

<details><summary>Đáp án</summary>

**B** — Các prefix: (i,c,s), (i,c), (i), () → 4.

</details>

**Câu 11.** `grouping(color)` trả về 1 khi nào?

- A. color có giá trị null thật trong dữ liệu
- B. null ở cột color đại diện cho "all"
- C. color là khoá
- D. Luôn trả về 1 với cube

<details><summary>Đáp án</summary>

**B** — Dùng để phân biệt null "all" với null thật.

</details>

**Câu 12.** Đi từ doanh số theo (item, color, size) lên doanh số theo item gọi là?

- A. Drill down
- B. Rollup
- C. Slicing
- D. Pivoting

<details><summary>Đáp án</summary>

**B** — Rollup: mịn → thô. Drill down ngược lại.

</details>

**Câu 13.** Hệ OLAP chỉ dùng tính năng của relational DB gọi là?

- A. MOLAP
- B. ROLAP
- C. HOLAP
- D. NoSQL

<details><summary>Đáp án</summary>

**B** — Relational OLAP.

</details>

**Câu 14.** Aggregate nào KHÔNG tính được từ aggregate mịn hơn (non-decomposable)?

- A. sum
- B. count
- C. max
- D. median

<details><summary>Đáp án</summary>

**D** — Không thể suy median tổng từ median từng nhóm con.

</details>

**Câu 15.** Vì sao cần recursive query cho "mọi môn tiên quyết trực tiếp hoặc gián tiếp"?

- A. Vì SQL không có join
- B. Truy vấn không đệ quy chỉ join được một số mức cố định, trong khi số mức phụ thuộc dữ liệu
- C. Để chạy nhanh hơn
- D. Vì prereq có khoá chính phức hợp

<details><summary>Đáp án</summary>

**B** — Luôn có thể tạo dữ liệu có nhiều mức hơn số join cố định.

</details>

## 3. Câu hỏi tự luận (6 câu)

**Câu 1.** Viết đoạn Java (JDBC) dùng PreparedStatement để chèn instructor (88877, Perry, Finance, 125000), rồi chèn tiếp 88878 chỉ bằng cách đổi tham số thứ nhất.

<details><summary>Gợi ý đáp án</summary>

```java
PreparedStatement pStmt = conn.prepareStatement(
    "insert into instructor values(?,?,?,?)");
pStmt.setString(1, "88877");
pStmt.setString(2, "Perry");
pStmt.setString(3, "Finance");
pStmt.setInt(4, 125000);
pStmt.executeUpdate();
pStmt.setString(1, "88878");   // các tham số còn lại giữ nguyên
pStmt.executeUpdate();
```

</details>

**Câu 2.** Viết đoạn JDBC chuyển 10000 budget từ Finance sang History thành một transaction an toàn.

<details><summary>Gợi ý đáp án</summary>

```java
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
```

</details>

**Câu 3.** Viết đoạn embedded SQL (C) in ra ID, name của sinh viên có tot_cred > :credit_amount bằng cursor.

<details><summary>Gợi ý đáp án</summary>

```c
EXEC SQL BEGIN DECLARE SECTION;
  int credit_amount; char si[6]; char sn[21];
EXEC SQL END DECLARE SECTION;

EXEC SQL declare c cursor for
  select ID, name from student where tot_cred > :credit_amount;
EXEC SQL open c;
for (;;) {
  EXEC SQL fetch c into :si, :sn;
  if (strcmp(SQLSTATE, "02000") == 0) break;   /* hết dữ liệu */
  printf("%s %s\n", si, sn);
}
EXEC SQL close c;
```

</details>

**Câu 4.** ResultSetMetaData và DatabaseMetaData hữu ích ở đâu?

<details><summary>Gợi ý đáp án</summary>

Khi viết chương trình **tổng quát** không biết trước schema: ví dụ công cụ hiển thị kết quả của câu truy vấn bất kỳ (lấy số cột, tên & kiểu cột), công cụ quản trị liệt kê bảng/cột/khoá chính (như pgAdmin, DBeaver), sinh form nhập liệu tự động.

</details>

**Câu 5.** Liệt kê các grouping mà `group by rollup(item_name), rollup(color, size)` tạo ra.

<details><summary>Gợi ý đáp án</summary>

{(item_name), ()} × {(color, size), (color), ()} = (item_name, color, size), (item_name, color), (item_name), (color, size), (color), () — 6 grouping.

</details>

**Câu 6.** Mô tả quá trình fixed-point khi tính rec_prereq nếu prereq = {(C3, C2), (C2, C1)}.

<details><summary>Gợi ý đáp án</summary>

Vòng 0: rec = ∅. Vòng 1 (base): rec = {(C3,C2), (C2,C1)}. Vòng 2: join rec với prereq: (C3,C2) ⋈ (C2,C1) → thêm (C3,C1). Vòng 3: không có tuple mới → **fixed point**, dừng. Kết quả {(C3,C2), (C2,C1), (C3,C1)}.

</details>

## 4. Bài tập SQL (30 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| 5.01 | function | ★★☆ | Tạo function `dept_count(dname varchar(20)) returns integer` (PL/pgSQL) trả về số instructor của khoa. Sau đó dùng nó tìm dept_name, budget của các khoa có hơn 2 instructor. |
| 5.02 | table function | ★★☆ | Tạo table function `instructor_of(dname varchar(20))` trả về bảng (ID, name, dept_name, salary) gồm instructor của khoa dname. |
| 5.03 | procedure | ★★☆ | Tạo procedure `dept_count_proc(in dname varchar(20), out d_count integer)`. Gọi thử bằng `call dept_count_proc('Physics', null);` |
| 5.04 | for loop | ★★☆ | Tạo function `building_budget(bldg varchar(15)) returns numeric` tính tổng budget các khoa đặt ở toà nhà bldg bằng vòng lặp for (không dùng sum). |
| 5.05 | if / elsif | ★☆☆ | Tạo function `salary_level(sal numeric) returns varchar` trả về `'high'` nếu sal ≥ 90000, `'medium'` nếu sal ≥ 70000, ngược lại `'low'`. |
| 5.06 | procedure + update | ★★☆ | Tạo procedure `give_raise(dname varchar(20), pct numeric)` tăng lương pct% cho instructor khoa dname. Gọi `call give_raise('Comp. Sci.', 10);` |
| 5.07 | row trigger | ★★★ | Cài trigger `credits_earned` như slide bằng PostgreSQL: khi grade của takes được update từ F hoặc null sang điểm qua (khác F, không null) thì cộng credits của môn vào tot_cred của sinh viên. Hệ thống sẽ thử: Tanaka BIO-301 null → B (cộng 4), rồi B → A (không cộng), Levy CS-101 Fall F → B (cộng 4). |
| 5.08 | before trigger | ★★☆ | Tạo trigger before insert or update trên takes: nếu grade là chuỗi rỗng `''` hoặc chỉ toàn khoảng trắng thì đổi thành null. |
| 5.09 | audit trigger | ★★☆ | Tạo bảng `salary_audit(ID varchar(5), old_salary numeric(8,2), new_salary numeric(8,2))` và trigger ghi lại mỗi lần salary của instructor thay đổi (chỉ khi giá trị thực sự khác). |
| 5.10 | statement trigger | ★★★ | Tạo bảng `update_log(table_name text, num_rows integer)` và một trigger statement-level (`for each statement`) dùng transition table (`referencing new table as ...`) để ghi số dòng bị update mỗi khi chạy update trên instructor. |
| 5.11 | with recursive | ★★☆ | Dùng with recursive trên emp_super: tìm tất cả supervisor (trực tiếp và gián tiếp) của `Bob`. |
| 5.12 | transitive closure | ★★☆ | Trước tiên thêm 2 dòng prereq `('CS-319', 'CS-190')` và `('BIO-399', 'BIO-301')` để có chuỗi nhiều mức. Sau đó tính rec_prereq(course_id, prereq_id) — transitive closure của prereq. |
| 5.13 | recursion + depth | ★★★ | Tìm mọi cấp dưới (trực tiếp và gián tiếp) của `Mary` cùng cấp độ (`level`: cấp dưới trực tiếp = 1, cấp dưới của họ = 2, …). Trả về person, level. |
| 5.14 | rank | ★☆☆ | Xếp hạng sinh viên theo GPA giảm dần từ `student_grades`, sinh viên GPA null xếp cuối. Trả về ID, GPA, s_rank. |
| 5.15 | dense_rank | ★☆☆ | Như 5.14 (bỏ qua sinh viên GPA null) nhưng trả về cả `rank()` và `dense_rank()` để so sánh: ID, GPA, r, dr. |
| 5.16 | rank without window | ★★★ | Tính hạng như 5.15 (cột r) không dùng window function: hạng = 1 + số sinh viên có GPA cao hơn. Bỏ qua GPA null. Trả về ID, s_rank. |
| 5.17 | partition by | ★★☆ | Xếp hạng sinh viên trong từng khoa theo GPA giảm dần (`dept_grades`, bỏ GPA null). Trả về ID, dept_name, dept_rank. |
| 5.18 | top-n per group | ★★★ | Sinh viên có GPA cao nhất mỗi khoa (nếu bằng nhau lấy hết). Trả về dept_name, ID, GPA. |
| 5.19 | ntile | ★★☆ | Chia sinh viên (GPA không null) thành 4 nhóm (quartile) theo GPA giảm dần. Trả về ID, GPA, quartile. *(Lưu ý: ntile với giá trị trùng có thể không xác định — ở đây hãy thêm ID vào order by để cố định: `order by GPA desc, ID`.)* |
| 5.20 | percent_rank / cume_dist | ★★☆ | Với sinh viên có GPA: ID, GPA, `percent_rank()` và `cume_dist()` theo GPA tăng dần. |
| 5.21 | moving average | ★★☆ | Từ `daily_sales`: với mỗi ngày, trung bình value của ngày trước, ngày đó và ngày sau (`moving_avg`). Sắp theo sale_date. |
| 5.22 | running total | ★★☆ | Từ `account_txn`: số dư của mỗi tài khoản sau mỗi giao dịch (`balance`). Trả về account_number, date_time, value, balance, sắp theo account_number, date_time. |
| 5.23 | range window | ★★★ | Từ `daily_sales`: với mỗi ngày, tổng value trong 3 ngày gần nhất tính cả ngày đó (`range between interval '2 day' preceding and current row`). Sắp theo sale_date. |
| 5.24 | cross-tab data | ★☆☆ | Tổng quantity theo (item_name, color) từ bảng `sales`. |
| 5.25 | pivot | ★★☆ | Tạo cross-tab: mỗi dòng là một item_name, các cột `dark`, `pastel`, `white`, `total` là tổng quantity. Sắp theo item_name. |
| 5.26 | cube | ★★☆ | Dùng cube(item_name, color): tổng quantity cho mọi tổ hợp, kể cả dòng tổng. Trả về item_name, color, total. |
| 5.27 | grouping() | ★★★ | Như 5.26 nhưng thay null "all" bằng chữ `'all'` (dùng `grouping()` + case, tương đương `decode` trong slide). |
| 5.28 | rollup | ★★☆ | Dùng rollup(item_name, color, clothes_size): tổng quantity. Trả về item_name, color, clothes_size, total. |
| 5.29 | rollup + hierarchy | ★★☆ | Kết hợp `sales` với `itemcategory`, dùng rollup(category, item_name) để có tổng theo từng item, từng category và tổng chung. Trả về category, item_name, total. |
| 5.30 | multiple rollups | ★★★ | `group by rollup(item_name), rollup(color, clothes_size)` sinh ra bao nhiêu dòng kết quả trên bảng sales? Viết truy vấn đếm (1 cột, 1 dòng). |
