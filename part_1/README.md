# CS4420 · Practice Part 1 — Chương 1 → 5

Bộ luyện tập cho **Database System Concepts (7th Ed.)**, chương 1–5: lý thuyết tóm tắt, trắc nghiệm, câu hỏi tự luận và **131 bài tập SQL tự chấm** chạy trên **PostgreSQL thật** với University database của sách — không cần cài đặt server.

| Chương | Nội dung | Trắc nghiệm | Tự luận | Bài SQL |
|---|---|---|---|---|
| [1. Introduction](ch1_introduction/README.md) | Vì sao cần DBMS, data model, schema/instance, DDL/DML, kiến trúc engine, người dùng & DBA | 15 | 6 | 3 |
| [2. Relational Model](ch2_relational_model/README.md) | Keys, schema diagram, relational algebra (σ π ∪ − × ρ ⋈ ∩ 𝒢) | 10 | 7 | 14 |
| [3. Intro to SQL](ch3_intro_sql/README.md) | DDL, select-from-where, string, order by, set ops, null, aggregate, group by/having, nested subqueries, with, insert/delete/update | 14 | 4 | 50 |
| [4. Intermediate SQL](ch4_intermediate_sql/README.md) | Join/outer join, view & materialized view, transaction, integrity constraints, date/time, domain, index, authorization (grant/revoke/role) | 13 | 6 | 34 |
| [5. Advanced SQL](ch5_advanced_sql/README.md) | JDBC/embedded SQL, SQL injection, function/procedure, trigger, recursive query, ranking, windowing, OLAP (cube/rollup) | 15 | 6 | 30 |

## Bắt đầu nhanh

### Cách 1 — Practice Lab trong trình duyệt (khuyên dùng)
Mở **[`playground.html`](playground.html)** bằng Chrome/Edge/Firefox (double-click là được).

- Lần đầu cần Internet để tải PostgreSQL bản WebAssembly (~16 MB, từ cdn.jsdelivr.net); các lần sau trình duyệt dùng cache.
- Mỗi chương có: **Tóm tắt kiến thức → Trắc nghiệm (chấm điểm) → Tự luận (có gợi ý đáp án) → Bài tập SQL**.
- Bài tập: <kbd>Ctrl</kbd>+<kbd>Enter</kbd> chạy, <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd> kiểm tra. Có nút *Kết quả mong đợi* và *Xem đáp án*.
- **SQL tự do (sandbox)** để thử nghiệm thoải mái; **Lược đồ CSDL** để tra cứu bảng/cột.
- Tiến độ và code được lưu trong trình duyệt.

Nếu trình duyệt chặn trang mở trực tiếp từ ổ đĩa, chạy server cục bộ (thư mục [`lab/`](../lab) ở gốc repo chứa công cụ dùng chung cho mọi part) rồi vào http://localhost:4420:
```bash
cd ../lab
npm install      # lần đầu
npm run serve
```

### Cách 2 — Làm bài trong file `.sql` và chấm bằng terminal
Mỗi chương có `my_answers.sql` (bản để bạn viết), `exercises.sql` (đề gốc) và `solutions.sql` (đáp án). Viết câu trả lời ngay dưới dòng `-- @ex ...`, sau đó chấm (trong thư mục `lab/`):
```bash
npm run grade -- ch3
```
```
  ✓  3.01 [select]
  ✗  3.02 [distinct] — Số dòng khác nhau: mong đợi 7 dòng, bạn trả về 12 dòng.
  ✗  3.06 [order by] — Đúng các dòng nhưng SAI THỨ TỰ — kiểm tra lại order by.
Đúng: 1   Sai: 2   Chưa làm: 47
```
(Mở VS Code ở thư mục gốc repo để vừa viết SQL vừa chạy lệnh trong `lab/`. Lần đầu trên máy khác: `cd lab && npm install`.)

### Cách 3 — SQL shell trên terminal
```bash
npm run sql              # trong lab/; nạp bảng của mọi part — chỉ Part 1: npm run sql -- --part 1
```
Gõ câu SQL kết thúc bằng `;`. Lệnh: `\d` (liệt kê bảng), `\d instructor`, `\reset` (nạp lại dữ liệu), `\q`. Chạy cả một file: `npm run sql -- path/to/file.sql`.

### Cách 4 — PostgreSQL / pgAdmin / DBeaver thật
Tạo database `university` rồi chạy lần lượt `lab/db/university_schema.sql`, `lab/db/university_data.sql`, `lab/db/extra_tables.sql`. Mọi đáp án đều là PostgreSQL chuẩn (12+).

### Demo chương 5 (JDBC, prepared statement, SQL injection, transaction, metadata)
```bash
npm run demo             # trong lab/
```
Bản Java/Python tương ứng (cần server PostgreSQL): [`ch5_advanced_sql/app/`](ch5_advanced_sql/app).

## Lộ trình gợi ý

| Buổi | Nội dung | Mục tiêu |
|---|---|---|
| 1 | Chương 1 + 2 | Trắc nghiệm ≥ 80%, viết được biểu thức đại số quan hệ, làm 2.01–2.14 |
| 2 | Chương 3 (3.01–3.26) | select, join kiểu `from r, s`, set ops, null, aggregate |
| 3 | Chương 3 (3.27–3.50) | subquery (in/some/all/exists), with, scalar subquery, modification |
| 4 | Chương 4 | outer join, view, transaction, constraint, authorization |
| 5 | Chương 5 | function/procedure/trigger, with recursive, rank/window, cube/rollup |
| Ôn thi | Làm lại các bài ★★★ và câu sai | Tự giải thích vì sao đáp án đúng |

Mức độ: ★☆☆ cơ bản · ★★☆ trung bình · ★★★ nâng cao.

## Cách chấm bài
- Kết quả của bạn được so với kết quả của đáp án: **cùng số cột, cùng giá trị**; tên cột không quan trọng; thứ tự dòng chỉ được chấm khi đề yêu cầu (`order by`). Số được so sánh theo giá trị (`65000.00` = `65000`).
- Bài **query**: chấm bảng kết quả của câu `select` cuối cùng.
- Bài **check** (create/insert/update/delete/trigger/grant…): sau khi chạy code của bạn, hệ thống chạy một câu truy vấn kiểm tra (xem trong `solutions.sql` hoặc nút *Kết quả mong đợi*). Vì vậy hãy dùng **đúng tên** bảng/view/function mà đề yêu cầu.
- Mọi bài chạy trong một transaction rồi `rollback` → dữ liệu gốc không bao giờ bị thay đổi. Bài **fresh** (transaction, deferred constraint) chạy trên database mới và được dùng `begin/commit/rollback`.
- Hàm tiện ích có sẵn: `try_sql('...')` trả về `'ok'` hoặc mã lỗi SQLSTATE (23505 unique, 23503 foreign key, 23514 check, 23502 not null, 42501 permission denied…); `sql_value('...')` trả về giá trị đầu tiên của một truy vấn.

## Slide (chuẩn SQL) vs PostgreSQL
Slide dùng cú pháp chuẩn SQL; PostgreSQL khác ở vài chỗ:

| Slide | PostgreSQL |
|---|---|
| `unique (subquery)` | không hỗ trợ → `(select count(*) ...) <= 1` |
| `create assertion` | không hỗ trợ → dùng trigger |
| `check (... in (select ...))` | không cho subquery trong check → trigger / foreign key |
| `create type Dollars as numeric(12,2) final` | `create domain dollars as numeric(12,2)` |
| `select * from table(instructor_of('Music'))` | `select * from instructor_of('Music')` |
| function `begin ... end` | `language plpgsql as $$ declare ... begin ... end $$` |
| `for r as select ... do ... end for` | `for r in select ... loop ... end loop` |
| trigger `referencing new row as nrow ... begin atomic ... end` | trigger function `returns trigger` dùng `new`/`old` + `create trigger ... execute function f()` |
| `decode(grouping(a), 1, 'all', a)` (Oracle) | `case when grouping(a) = 1 then 'all' else a end` |
| `grant ... to Amit` (user) | `create role amit; grant ... to amit` |
| `rank() over (order by GPA desc nulls last)` | giống |
| JDBC `?` | `pg`/PGlite dùng `$1, $2, ...` |

## Dữ liệu
- **University database** (11 bảng) giống hệt dữ liệu mẫu trong slide: `classroom, department, course, instructor, section, teaches, student, takes, advisor, time_slot, prereq`.
- **Bảng phụ** (`lab/db/extra_tables.sql`): `emp_super` (self join, recursion), `grade_points`, `student_grades`, `dept_grades` (ranking), `sales`, `itemcategory` (OLAP), `daily_sales`, `account_txn` (windowing).

## Cấu trúc thư mục
```
part_1/
├── playground.html          Practice Lab (được sinh ra — đừng sửa tay)
├── README.md
├── part.mjs                 cấu hình part (tiêu đề, danh sách chương, file dữ liệu)
├── ch1_introduction/        README.md (tóm tắt, trắc nghiệm, tự luận) · exercises.sql · solutions.sql · my_answers.sql
├── ch2_relational_model/
├── ch3_intro_sql/
├── ch4_intermediate_sql/
├── ch5_advanced_sql/        ... + app/ (demo JDBC/Python/Node)
└── content/ch1..ch5.mjs     NGUỒN của toàn bộ nội dung
lab/                         dùng chung cho mọi part: db/ (schema + dữ liệu), tools/ (build, chấm bài, SQL shell, server)
```

## Thêm / sửa bài tập
1. Sửa `content/chN.mjs` (mỗi bài: `id`, `topic`, `level`, `prompt`, `hint`, `solution`, tuỳ chọn `check`, `ordered`, `fresh`).
2. Trong `lab/`: `npm run verify -- --part 1` — kiểm tra mọi đáp án chạy được.
3. Trong `lab/`: `npm run build` — sinh lại `playground.html`, README và các file `.sql` của chương. **`my_answers.sql` không bao giờ bị ghi đè.**
