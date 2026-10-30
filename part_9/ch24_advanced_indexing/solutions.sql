-- =====================================================================
-- CS4420 · Chương 24 — Kỹ thuật index nâng cao (Advanced Indexing Techniques)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CH24.01  [Bloom filter: false positive]  ★☆☆
-- Bloom filter có m = 10000 bit, đã chèn n = 1000 khoá. Trả về một dòng hai cột: `fp_rate` — xác suất false positive (1 − e−kn/m)k với k = 7, làm tròn 5 chữ số; và `k_opt` — số hàm băm tối ưu (m/n)·ln 2 làm tròn tới số nguyên.
-- Gợi ý: exp(), ln(), power(); round(x::numeric, 5).
select round(power(1 - exp(-7 * 1000.0 / 10000), 7)::numeric, 5) as fp_rate,
       round(10000.0 / 1000 * ln(2)) as k_opt;

-- @ex CH24.02  [Bloom filter: bật bit]  ★★☆
-- Bloom filter m = 40 bit, k = 3 hàm băm: h[i](x) = `abs(hashtext(x || '#' || i)) % 40` với i = 1, 2, 3. Chèn mọi từ trong `ai_word`. Trả về các vị trí bit được bật (cột `pos`, không trùng).
-- Gợi ý: ai_word cross join generate_series(1, 3).
select distinct abs(hashtext(word || '#' || i)) % 40 as pos
from ai_word cross join generate_series(1, 3) as i;

-- @ex CH24.03  [Bloom filter: tra cứu]  ★★☆
-- Dùng filter của CH24.02. Với mỗi từ trong `ai_probe`, trả về `word`, `maybe_present` (true nếu cả 3 bit của từ đều đã bật) và `actually_present` (từ có trong ai_word). Những dòng maybe_present = true mà actually_present = false là false positive (trên dữ liệu mẫu có hai dòng như vậy).
with bits as (
  select distinct abs(hashtext(word || '#' || i)) % 40 as pos
  from ai_word cross join generate_series(1, 3) as i)
select p.word,
       not exists (select 1 from generate_series(1, 3) as i
                   where abs(hashtext(p.word || '#' || i)) % 40 not in (select pos from bits)) as maybe_present,
       p.word in (select word from ai_word) as actually_present
from ai_probe p;

-- @ex CH24.04  [LSM tree: tra cứu]  ★★☆
-- LSM tree hai mức `ai_lsm_l0` (mới) và `ai_lsm_l1` (cũ); mỗi phiên bản có timestamp `ts`, tombstone có `is_delete = true`. Trả về giá trị hiện tại của mọi khoá còn sống: `k`, `val` (phiên bản có ts lớn nhất trên cả hai mức; khoá mà phiên bản mới nhất là tombstone thì không xuất hiện).
-- Gợi ý: union all hai mức, rồi distinct on (k) order by k, ts desc — hoặc row_number().
select k, val
from (select distinct on (k) k, val, is_delete
      from (select * from ai_lsm_l0 union all select * from ai_lsm_l1) as v
      order by k, ts desc) as latest
where not is_delete;

-- @ex CH24.05  [LSM tree: compaction]  ★★★
-- Mô phỏng merge L0 vào L1: tạo bảng `ai_lsm_merged(k, val, ts)` chứa đúng một phiên bản mới nhất của mỗi khoá còn sống (bỏ tombstone và mọi phiên bản cũ). Hệ thống đọc bảng theo k.
-- (Thứ tự dòng được chấm.)
create table ai_lsm_merged as
select k, val, ts
from (select distinct on (k) k, val, ts, is_delete
      from (select * from ai_lsm_l0 union all select * from ai_lsm_l1) as v
      order by k, ts desc) as latest
where not is_delete;

-- Câu truy vấn hệ thống dùng để chấm:
--   select k, val, ts from ai_lsm_merged order by k;

-- @ex CH24.06  [bitmap index]  ★★☆
-- Xây bitmap index trên `ai_customer.gender`: với mỗi giá trị gender, trả về `gender` và `bitmap` — chuỗi bit (kiểu `varbit`) dài 12, bit thứ i (từ trái) là 1 nếu khách có cust_id = i có gender đó. (Chưa xét cột deleted.)
-- Gợi ý: string_agg(case ... then '1' else '0' end, '' order by cust_id)::varbit
select g.gender,
       string_agg(case when c.gender = g.gender then '1' else '0' end, '' order by c.cust_id)::varbit as bitmap
from (select distinct gender from ai_customer) as g cross join ai_customer c
group by g.gender;

-- @ex CH24.07  [bitmap AND + count]  ★★☆
-- Trả lời "khách nữ có income_level = 2" bằng bitmap: tính bitmap của gender = 'F', bitmap của income_level = 2 và AND chúng. Trả về một dòng: `result_bitmap` (varbit) và `num_rows` (số bit 1 của kết quả).
-- Gợi ý: bit_count(varbit) đếm số bit 1.
with b as (
  select string_agg(case when gender = 'F' then '1' else '0' end, '' order by cust_id)::varbit as f,
         string_agg(case when income_level = 2 then '1' else '0' end, '' order by cust_id)::varbit as l2
  from ai_customer)
select f & l2 as result_bitmap, bit_count(f & l2) as num_rows
from b;

-- @ex CH24.08  [bitmap NOT + existence]  ★★★
-- Bản ghi có `deleted = true` coi như đã bị xoá. Tính "income_level khác 3" bằng bitmap: NOT bitmap(income_level = 3) AND existence bitmap (bit 1 nếu bản ghi chưa bị xoá). Trả về `naive_not` (chỉ NOT, chưa AND), `with_existence` và `num_rows` (số bit 1 của with_existence).
with b as (
  select string_agg(case when income_level = 3 then '1' else '0' end, '' order by cust_id)::varbit as l3,
         string_agg(case when deleted then '0' else '1' end, '' order by cust_id)::varbit as ex
  from ai_customer)
select ~l3 as naive_not, ~l3 & ex as with_existence, bit_count(~l3 & ex) as num_rows
from b;

-- @ex CH24.09  [nearest neighbor]  ★☆☆
-- Đề gốc: Exercise 24.4. Give an algorithm for searching an R-tree that efficiently finds the nearest neighbor of a given query point.
--
-- Ba địa điểm trong `ai_place` gần điểm (5, 5) nhất: `name`, `dist` (khoảng cách Euclid, làm tròn 3 chữ số), sắp theo khoảng cách tăng dần.
-- Gợi ý: Toán tử  giữa hai point; order by ... limit 3.
-- (Thứ tự dòng được chấm.)
select name, round((loc <-> point(5, 5))::numeric, 3) as dist
from ai_place
order by loc <-> point(5, 5)
limit 3;

-- @ex CH24.10  [region query]  ★☆☆
-- Region query: với mỗi vùng trong `ai_region`, liệt kê các địa điểm nằm trong vùng đó (kể cả trên biên): `region`, `place`.
-- Gợi ý: point <@ box.
select r.name as region, p.name as place
from ai_region r join ai_place p on p.loc <@ r.area;

-- @ex CH24.11  [MBR filter vs giao thật]  ★★★
-- Đề gốc: Exercise 24.3. Suppose line segments are to be stored in an R-tree. When a segment is not parallel to the axes, its bounding box can be large and contain a lot of empty area.
--
-- - Describe how such large bounding boxes affect the performance of queries asking for the line segments that intersect a given region.
-- - Briefly describe a technique that improves the performance of such queries, and give an example of its benefit. (Hint: segments can be split into smaller pieces.)
--
-- Spatial join theo hai bước như R-tree: bước lọc dùng MBR của đoạn thẳng (`box(seg[0], seg[1])`) giao vùng (`&&`), bước tinh kiểm tra đoạn thật sự giao vùng (`seg ?# area`). Với mọi cặp (vùng, đoạn) qua được bước lọc, trả về `region`, `seg_id`, `really_intersects`. Các dòng false là false hit do MBR lớn.
select r.name as region, s.seg_id, s.seg ?# r.area as really_intersects
from ai_region r join ai_segment s on box(s.seg[0], s.seg[1]) && r.area;

-- @ex CH24.12  [extendable hashing: bit]  ★☆☆
-- Đề gốc: Exercise 24.6. A file uses extendable hashing and holds records with these search-key values:
--
-- 2, 3, 5, 7, 11, 17, 19, 23, 29, 31
--
-- Show the extendable hash structure for this file when the hash function is h(x) = x mod 8 and each bucket can hold three records.
--
-- Với mỗi khoá trong `ai_hash_key` và h(x) = x mod 8, trả về `k`, `h` và `h_bits` — h viết dạng chuỗi nhị phân 3 bit (ví dụ 5 → '101').
-- Gợi ý: (x % 8)::bit(3)::text.
select k, k % 8 as h, ((k % 8)::bit(3))::text as h_bits
from ai_hash_key;

-- @ex CH24.13  [extendable hashing: global depth]  ★★★
-- Đề gốc: Exercise 24.6. A file uses extendable hashing and holds records with these search-key values:
--
-- 2, 3, 5, 7, 11, 17, 19, 23, 29, 31
--
-- Show the extendable hash structure for this file when the hash function is h(x) = x mod 8 and each bucket can hold three records.
--
-- Bucket chứa tối đa 3 bản ghi; extendable hashing dùng i bit đầu của h_bits (CH24.12). Với i = 1, 2, 3, trả về `i` và `max_bucket` — số khoá lớn nhất rơi vào cùng một tiền tố i bit. Từ đó thấy global depth nhỏ nhất là bao nhiêu.
select i, max(cnt) as max_bucket
from (select i, left(((k % 8)::bit(3))::text, i) as prefix, count(*) as cnt
      from ai_hash_key cross join generate_series(1, 3) as i
      group by i, prefix) as t
group by i;
