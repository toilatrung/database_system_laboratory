// Chương 5 — Accessing SQL from a programming language.
// Bản Node.js tương đương các ví dụ JDBC trong slide, chạy được ngay:
//   npm run demo
// (PGlite là PostgreSQL chạy trong process; với server PostgreSQL thật thì
//  thay bằng thư viện `pg` — API gần như giống hệt.)
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const title = s => console.log(`\n=== ${s} ${'='.repeat(Math.max(0, 66 - s.length))}`);

// 1. "Open a connection" ----------------------------------------------------
title('1. Kết nối & chạy truy vấn (Connection / Statement / ResultSet)');
const conn = new PGlite();
for (const f of ['university_schema.sql', 'university_data.sql']) {
  await conn.exec(readFileSync(path.join(ROOT, 'db', f), 'utf8'));
}
const rset = await conn.query('select dept_name, avg(salary) as avg_salary from instructor group by dept_name order by dept_name');
for (const row of rset.rows) {                       // while (rset.next())
  console.log(`${row.dept_name.padEnd(12)} ${Number(row.avg_salary).toFixed(2)}`);
}

// 2. Prepared statement -------------------------------------------------------
title('2. Prepared statement — tham số ?, ở PostgreSQL viết $1, $2, ...');
const insert = 'insert into instructor values ($1, $2, $3, $4)';
await conn.query(insert, ['88877', 'Perry', 'Finance', 125000]);
await conn.query(insert, ['88878', "D'Souza", 'Finance', 125000]);   // dấu nháy không gây lỗi
const finance = await conn.query("select ID, name from instructor where dept_name = $1 order by ID", ['Finance']);
console.table(finance.rows);

// 3. SQL injection ------------------------------------------------------------
title('3. SQL injection — ghép chuỗi vs. tham số');
const userInput = "X' or 'Y' = 'Y";
const unsafeSql = "select ID, name from instructor where name = '" + userInput + "'";
console.log('Câu SQL ghép chuỗi:', unsafeSql);
const unsafe = await conn.query(unsafeSql);
console.log(`→ KHÔNG an toàn: trả về ${unsafe.rows.length} dòng (toàn bộ bảng!)`);
const safe = await conn.query('select ID, name from instructor where name = $1', [userInput]);
console.log(`→ Prepared statement: trả về ${safe.rows.length} dòng (input chỉ là một giá trị chuỗi)`);

const evilInput = "X'; update instructor set salary = salary + 10000; --";
const countRich = async () => (await conn.query('select count(*) as n from instructor where salary > 100000')).rows[0].n;
const before = await countRich();
await conn.exec("select ID, name from instructor where name = '" + evilInput + "'");
console.log(`Input "${evilInput}"`);
console.log(`→ được ghép vào câu lệnh nên chạy thêm một câu UPDATE! Số người lương > 100000: ${before} → ${await countRich()}`);

// 4. Null values ----------------------------------------------------------------
title('4. Giá trị null (tương đương rs.wasNull())');
const grades = await conn.query("select ID, course_id, grade from takes where ID = '98988'");
for (const r of grades.rows) {
  console.log(`${r.id} ${r.course_id}: ${r.grade === null ? 'Got null value' : r.grade}`);
}

// 5. Transactions ----------------------------------------------------------------
title('5. Transaction — setAutoCommit(false) / commit() / rollback()');
const budget = async () => (await conn.query("select dept_name, budget from department where dept_name in ('Finance', 'History') order by 1")).rows;
console.log('Trước:', await budget());
try {
  await conn.transaction(async tx => {                // tương đương setAutoCommit(false)
    await tx.query("update department set budget = budget + 200000 where dept_name = 'History'");
    await tx.query("update department set budget = budget - 200000 where dept_name = 'Finance'"); // vi phạm check (budget > 0)
  });                                                  // commit() nếu không lỗi
} catch (e) {
  console.log('Lỗi →', e.message, '→ rollback(): cả hai câu update đều bị huỷ');
}
console.log('Sau :', await budget());

// 6. Metadata ----------------------------------------------------------------------
title('6. Metadata — ResultSetMetaData & DatabaseMetaData');
const res = await conn.query('select * from department');
for (const f of res.fields) console.log(`cột ${f.name.padEnd(10)} type oid ${f.dataTypeID}`);   // getColumnName / getColumnTypeName
const tables = await conn.query("select table_name from information_schema.tables where table_schema = 'public' order by 1");
console.log('getTables():', tables.rows.map(r => r.table_name).join(', '));
const pk = await conn.query(`
  select k.column_name, k.ordinal_position as key_seq
  from information_schema.table_constraints t
  join information_schema.key_column_usage k on k.constraint_name = t.constraint_name
  where t.table_name = 'takes' and t.constraint_type = 'PRIMARY KEY'
  order by k.ordinal_position`);
console.log('getPrimaryKeys("takes"):', pk.rows.map(r => `${r.key_seq}:${r.column_name}`).join(', '));

await conn.close();
