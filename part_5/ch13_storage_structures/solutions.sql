-- =====================================================================
-- CS4420 · Chương 13 — Cấu trúc lưu trữ dữ liệu (Data Storage Structures)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CH13.01  [fixed-length records]  ★☆☆
-- Record instructor độ dài cố định 53 byte (5 + 20 + 20 + 8), record không được vắt qua hai block. Với các kích thước block 2048, 4096 và 8192 byte, trả về `block_bytes`, `records_per_block`, `wasted_bytes` (phần dư mỗi block), và `blocks_for_10000` = số block cần để lưu 10 000 record instructor.
select b as block_bytes,
       b / 53 as records_per_block,
       b - (b / 53) * 53 as wasted_bytes,
       ceil(10000.0 / (b / 53)) as blocks_for_10000
from (values (2048), (4096), (8192)) as t(b);

-- @ex CH13.02  [variable-length storage]  ★☆☆
-- Trong PostgreSQL varchar là kiểu độ dài thay đổi: giá trị ngắn được lưu bằng 1 byte header + nội dung. Với mỗi instructor trả về ID, name, `chars` = octet_length(name) và `stored_bytes` = `pg_column_size(name)`.
select ID, name, octet_length(name) as chars, pg_column_size(name) as stored_bytes
from instructor;

-- @ex CH13.03  [char vs varchar]  ★★☆
-- So sánh tổng số byte để lưu tên của mọi instructor nếu cột name là `char(20)` (độ dài cố định) và nếu là `varchar(20)`: trả về một dòng hai cột `as_char`, `as_varchar` (dùng `pg_column_size`).
select sum(pg_column_size(name::char(20))) as as_char,
       sum(pg_column_size(name::varchar(20))) as as_varchar
from instructor;

-- @ex CH13.04  [PE 13.2a free list insert]  ★★☆
-- Đề gốc: Exercise 13.2 (a). Show the structure of the file of Figure 13.4 after each of the following steps:
--
-- a. Insert (24556, Turnamian, Finance, 98000).
--
-- *Figure 13.4 — File of instructor records (Figure 13.1) after deleting records 1, 4, and 6.* Deleted slots form a free list: the header points to record 1, record 1 points to record 4, record 4 points to record 6, and record 6 ends the list.
--
-- | Slot | ID | name | dept_name | salary |
-- |---|---|---|---|---|
-- | header | → 1 | | | |
-- | record 0 | 10101 | Srinivasan | Comp. Sci. | 65000 |
-- | record 1 | → 4 | | | |
-- | record 2 | 15151 | Mozart | Music | 40000 |
-- | record 3 | 22222 | Einstein | Physics | 95000 |
-- | record 4 | → 6 | | | |
-- | record 5 | 33456 | Gold | Physics | 87000 |
-- | record 6 | (end) | | | |
-- | record 7 | 58583 | Califieri | History | 62000 |
-- | record 8 | 76543 | Singh | Finance | 80000 |
-- | record 9 | 76766 | Crick | Biology | 72000 |
-- | record 10 | 83821 | Brandt | Comp. Sci. | 92000 |
-- | record 11 | 98345 | Kim | Elec. Eng. | 80000 |
--
-- `st_file(slot, id, name, dept_name, salary, next_free)` là file của Figure 13.4: slot −1 là header; slot trống có id null và next_free trỏ tới slot trống kế tiếp. Viết lệnh insert (24556, Turnamian, Finance, 98000) đúng theo free list: ghi vào slot mà header trỏ tới (đặt next_free của slot đó thành null) và cho header trỏ sang slot trống kế tiếp. Không được viết cứng số slot. Hệ thống đọc lại toàn bộ st_file.
-- Gợi ý: Một câu `with old as (select ...), h as (update st_file set next_free = ... where slot = -1 returning 1) update st_file ... where slot = (select s from old);` — mọi phần của câu nhìn cùng một trạng thái ban đầu.
with old as (
  select h.next_free as s, f.next_free as nxt
  from st_file h join st_file f on f.slot = h.next_free
  where h.slot = -1),
hdr as (
  update st_file set next_free = (select nxt from old) where slot = -1 returning 1)
update st_file
set id = '24556', name = 'Turnamian', dept_name = 'Finance', salary = 98000, next_free = null
where slot = (select s from old);

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from st_file order by slot;

-- @ex CH13.05  [PE 13.2 insert, delete, insert]  ★★★
-- Đề gốc: Exercise 13.2. Show the structure of the file of Figure 13.4 after each of the following steps:
--
-- a. Insert (24556, Turnamian, Finance, 98000).
--
-- b. Delete record 2.
--
-- c. Insert (34556, Thompson, Music, 67000).
--
-- *Figure 13.4 — File of instructor records (Figure 13.1) after deleting records 1, 4, and 6.* Deleted slots form a free list: the header points to record 1, record 1 points to record 4, record 4 points to record 6, and record 6 ends the list.
--
-- | Slot | ID | name | dept_name | salary |
-- |---|---|---|---|---|
-- | header | → 1 | | | |
-- | record 0 | 10101 | Srinivasan | Comp. Sci. | 65000 |
-- | record 1 | → 4 | | | |
-- | record 2 | 15151 | Mozart | Music | 40000 |
-- | record 3 | 22222 | Einstein | Physics | 95000 |
-- | record 4 | → 6 | | | |
-- | record 5 | 33456 | Gold | Physics | 87000 |
-- | record 6 | (end) | | | |
-- | record 7 | 58583 | Califieri | History | 62000 |
-- | record 8 | 76543 | Singh | Finance | 80000 |
-- | record 9 | 76766 | Crick | Biology | 72000 |
-- | record 10 | 83821 | Brandt | Comp. Sci. | 92000 |
-- | record 11 | 98345 | Kim | Elec. Eng. | 80000 |
--
-- Thực hiện cả ba bước của PE 13.2 trên `st_file`, mỗi bước theo đúng quy tắc free list (insert lấy slot ở đầu free list; delete đẩy slot vừa trống lên đầu free list và xoá nội dung của nó): (a) insert (24556, Turnamian, Finance, 98000); (b) delete record ở slot 2; (c) insert (34556, Thompson, Music, 67000). Hệ thống đọc lại toàn bộ st_file.
-- Gợi ý: Delete slot k: next_free của k = next_free hiện tại của header; header trỏ tới k.
with old as (
  select h.next_free as s, f.next_free as nxt
  from st_file h join st_file f on f.slot = h.next_free where h.slot = -1),
hdr as (update st_file set next_free = (select nxt from old) where slot = -1 returning 1)
update st_file set id = '24556', name = 'Turnamian', dept_name = 'Finance', salary = 98000, next_free = null
where slot = (select s from old);

with h as (select next_free as s from st_file where slot = -1),
hdr as (update st_file set next_free = 2 where slot = -1 returning 1)
update st_file set id = null, name = null, dept_name = null, salary = null, next_free = (select s from h)
where slot = 2;

with old as (
  select h.next_free as s, f.next_free as nxt
  from st_file h join st_file f on f.slot = h.next_free where h.slot = -1),
hdr as (update st_file set next_free = (select nxt from old) where slot = -1 returning 1)
update st_file set id = '34556', name = 'Thompson', dept_name = 'Music', salary = 67000, next_free = null
where slot = (select s from old);

-- Câu truy vấn hệ thống dùng để chấm:
--   select * from st_file order by slot;

-- @ex CH13.06  [walk the free list]  ★★☆
-- Liệt kê các slot trống của `st_file` theo thứ tự trong free list, bắt đầu từ slot mà header trỏ tới: cột `pos` (1, 2, …) và `slot`.
-- Gợi ý: `with recursive` đi theo next_free.
-- (Thứ tự dòng được chấm.)
with recursive fl (pos, slot) as (
  select 1, next_free from st_file where slot = -1 and next_free is not null
  union all
  select fl.pos + 1, f.next_free
  from fl join st_file f on f.slot = fl.slot
  where f.next_free is not null)
select pos, slot from fl order by pos;

-- @ex CH13.07  [PE 13.4 2-bit free-space map]  ★★☆
-- Đề gốc: Exercise 13.4. Consider a free-space map kept as a bitmap with two bits per block of the file: the bits are 00 if the block is 0–30 percent full, 01 if 30–60 percent full, 10 if 60–90 percent full, and 11 if more than 90 percent full. Such bitmaps fit in memory even for very large files.
--
-- a. Give two benefits and one drawback of using two bits per block instead of one byte per block as described earlier in the chapter.
--
-- b. Explain how the bitmap is kept up to date when records are inserted and deleted.
--
-- c. Explain the advantage of the bitmap technique over free lists, both for searching for free space and for updating free-space information.
--
-- `st_block(block_no, used_bytes)` cho biết số byte đã dùng của mỗi block 8192 byte. Tính free-space map 2 bit của PE 13.4: `pct` = tỉ lệ đầy (%, làm tròn 1 chữ số) và `bits`: '00' nếu dưới 30%, '01' nếu từ 30% tới dưới 60%, '10' nếu từ 60% tới dưới 90%, '11' nếu từ 90% trở lên. Trả về block_no, pct, bits.
-- Gợi ý: So sánh trên giá trị chưa làm tròn: block 7 dùng 2457 byte = 29.99% → 00.
select block_no,
       round(100.0 * used_bytes / 8192, 1) as pct,
       case when 100.0 * used_bytes / 8192 < 30 then '00'
            when 100.0 * used_bytes / 8192 < 60 then '01'
            when 100.0 * used_bytes / 8192 < 90 then '10'
            else '11' end as bits
from st_block;

-- @ex CH13.08  [search with the bitmap]  ★★★
-- Đề gốc: Exercise 13.4. Consider a free-space map kept as a bitmap with two bits per block of the file: the bits are 00 if the block is 0–30 percent full, 01 if 30–60 percent full, 10 if 60–90 percent full, and 11 if more than 90 percent full. Such bitmaps fit in memory even for very large files.
--
-- a. Give two benefits and one drawback of using two bits per block instead of one byte per block as described earlier in the chapter.
--
-- b. Explain how the bitmap is kept up to date when records are inserted and deleted.
--
-- c. Explain the advantage of the bitmap technique over free lists, both for searching for free space and for updating free-space information.
--
-- Chỉ nhìn bitmap 2 bit (không biết used_bytes chính xác), những block nào chắc chắn còn ít nhất 3000 byte trống? Mã 00 bảo đảm còn ≥ 70% trống, 01 bảo đảm ≥ 40%, 10 bảo đảm ≥ 10%, 11 không bảo đảm gì. Trả về block_no và `guaranteed_free` (số byte trống tối thiểu được bảo đảm, lấy phần nguyên) của các block đó.
with m as (
  select block_no,
         case when 100.0 * used_bytes / 8192 < 30 then 0.70
              when 100.0 * used_bytes / 8192 < 60 then 0.40
              when 100.0 * used_bytes / 8192 < 90 then 0.10
              else 0 end as free_frac
  from st_block)
select block_no, floor(free_frac * 8192) as guaranteed_free
from m
where free_frac * 8192 >= 3000;

-- @ex CH13.09  [LRU simulation]  ★★★
-- `st_buffer_trace(seq, block_id)` là chuỗi yêu cầu block. Buffer có 3 frame, dùng LRU. Lần truy cập ở vị trí s là hit khi và chỉ khi block đó đã được truy cập trước, ở lần gần nhất p, và số block khác nhau được truy cập giữa p và s (không kể hai đầu) nhỏ hơn 3. Trả về seq, block_id, `hit` (boolean), sắp theo seq.
-- Gợi ý: Với mỗi s: p = max(seq) < s cùng block; đếm `count(distinct block_id)` trong (p, s).
-- (Thứ tự dòng được chấm.)
select t.seq, t.block_id,
       prev.p is not null
         and (select count(distinct m.block_id) from st_buffer_trace m
              where m.seq > prev.p and m.seq < t.seq) < 3 as hit
from st_buffer_trace t
cross join lateral (select max(seq) as p from st_buffer_trace x
                    where x.block_id = t.block_id and x.seq < t.seq) as prev
order by t.seq;

-- @ex CH13.10  [buffer size vs hits]  ★★★
-- Dùng cùng quy tắc LRU như CH13.09, đếm số hit trên st_buffer_trace với buffer 2, 3, 4 và 5 frame. Trả về `frames`, `hits`.
select k as frames,
       count(*) filter (where prev.p is not null
                        and (select count(distinct m.block_id) from st_buffer_trace m
                             where m.seq > prev.p and m.seq < t.seq) < k) as hits
from (values (2), (3), (4), (5)) as f(k)
cross join st_buffer_trace t
cross join lateral (select max(seq) as p from st_buffer_trace x
                    where x.block_id = t.block_id and x.seq < t.seq) as prev
group by k;

-- @ex CH13.11  [PE 13.6 partitioning]  ★★☆
-- Đề gốc: Exercise 13.6. Suppose your university has accumulated a very large number of *takes* records over many years. Explain how the *takes* relation could be partitioned and what benefits partitioning could bring. Also explain one possible drawback of the technique.
--
-- Tạo bảng `st_takes_part` có cùng các cột như takes (ID, course_id, sec_id, semester, year, grade), partition by range (year), với hai partition `st_takes_2017` (year từ 2017 tới trước 2018) và `st_takes_2018` (từ 2018 tới trước 2019). Chép mọi dòng của takes vào st_takes_part. Hệ thống đếm số dòng của mỗi partition.
create table st_takes_part (
  ID varchar(5), course_id varchar(8), sec_id varchar(8),
  semester varchar(6), year numeric(4,0), grade varchar(2)
) partition by range (year);
create table st_takes_2017 partition of st_takes_part for values from (2017) to (2018);
create table st_takes_2018 partition of st_takes_part for values from (2018) to (2019);
insert into st_takes_part select ID, course_id, sec_id, semester, year, grade from takes;

-- Câu truy vấn hệ thống dùng để chấm:
--   select tableoid::regclass::text as partition, count(*) as num_rows
--   from st_takes_part group by tableoid order by 1;

-- @ex CH13.12  [PE 13.3 multitable clustering]  ★★★
-- Đề gốc: Exercise 13.3. Consider the relations *section* and *takes*. Give an example instance of the two relations with three sections, each having five students. Then give a file structure for these relations that uses multitable clustering.
--
-- Sinh bố cục file multitable clustering của section và takes cho các section Fall 2017: mỗi record section, ngay sau là các record takes của nó. Cột: course_id, sec_id, `rec_type` ('section' hoặc 'takes'), `info` (với section: building || ' ' || room_number; với takes: ID). Sắp theo course_id, sec_id, section trước takes, rồi theo ID.
-- (Thứ tự dòng được chấm.)
select course_id, sec_id, rec_type, info
from (select course_id, sec_id, 'section' as rec_type, building || ' ' || room_number as info, 0 as k
      from section where semester = 'Fall' and year = 2017
      union all
      select course_id, sec_id, 'takes', ID, 1
      from takes where semester = 'Fall' and year = 2017) as f
order by course_id, sec_id, k, info;

-- @ex CH13.13  [row vs column store]  ★★☆
-- `st_column_spec(column_name, bytes)` là các cột của một bảng sales có 1 000 000 dòng. Truy vấn phân tích chỉ cần các cột sale_date, quantity, unit_price. Trả về một dòng: `row_store_mb` (row store phải đọc cả tuple), `column_store_mb` (chỉ đọc 3 cột), làm tròn 1 chữ số với 1 MB = 1 048 576 byte, và `ratio` = row_store / column_store làm tròn 1 chữ số.
select round(sum(bytes) * 1000000.0 / 1048576, 1) as row_store_mb,
       round(sum(bytes) filter (where column_name in ('sale_date', 'quantity', 'unit_price')) * 1000000.0 / 1048576, 1) as column_store_mb,
       round(sum(bytes)::numeric / sum(bytes) filter (where column_name in ('sale_date', 'quantity', 'unit_price')), 1) as ratio
from st_column_spec;

-- @ex CH13.14  [slotted page, ctid]  ★★☆
-- PostgreSQL định danh mỗi tuple bằng `ctid = (block, slot)` của slotted page. Tạo bảng `st_slot_demo(name varchar(10))`, chèn lần lượt 'a', 'b', 'c'; xoá 'b'; cập nhật 'c' thành 'c2'; chèn 'd'. Trả về name và `ctid::text` của các tuple còn lại, sắp theo name. (Quan sát: slot của 'b' không được dùng lại ngay, và update tạo một phiên bản tuple mới ở slot mới.)
-- (Bài này chạy trên một database mới — được dùng begin/commit/rollback.)
create table st_slot_demo (name varchar(10));
insert into st_slot_demo values ('a');
insert into st_slot_demo values ('b');
insert into st_slot_demo values ('c');
delete from st_slot_demo where name = 'b';
update st_slot_demo set name = 'c2' where name = 'c';
insert into st_slot_demo values ('d');
select name, ctid::text as ctid from st_slot_demo order by name;
