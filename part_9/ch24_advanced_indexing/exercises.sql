-- =====================================================================
-- CS4420 · Chương 24 — Kỹ thuật index nâng cao (Advanced Indexing Techniques)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch24
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CH24.01  [Bloom filter: false positive]  ★☆☆
-- Bloom filter có m = 10000 bit, đã chèn n = 1000 khoá. Trả về một dòng hai cột: `fp_rate` — xác suất false positive (1 − e−kn/m)k với k = 7, làm tròn 5 chữ số; và `k_opt` — số hàm băm tối ưu (m/n)·ln 2 làm tròn tới số nguyên.
-- Gợi ý: exp(), ln(), power(); round(x::numeric, 5).




-- @ex CH24.02  [Bloom filter: bật bit]  ★★☆
-- Bloom filter m = 40 bit, k = 3 hàm băm: h[i](x) = `abs(hashtext(x || '#' || i)) % 40` với i = 1, 2, 3. Chèn mọi từ trong `ai_word`. Trả về các vị trí bit được bật (cột `pos`, không trùng).
-- Gợi ý: ai_word cross join generate_series(1, 3).




-- @ex CH24.03  [Bloom filter: tra cứu]  ★★☆
-- Dùng filter của CH24.02. Với mỗi từ trong `ai_probe`, trả về `word`, `maybe_present` (true nếu cả 3 bit của từ đều đã bật) và `actually_present` (từ có trong ai_word). Những dòng maybe_present = true mà actually_present = false là false positive (trên dữ liệu mẫu có hai dòng như vậy).




-- @ex CH24.04  [LSM tree: tra cứu]  ★★☆
-- LSM tree hai mức `ai_lsm_l0` (mới) và `ai_lsm_l1` (cũ); mỗi phiên bản có timestamp `ts`, tombstone có `is_delete = true`. Trả về giá trị hiện tại của mọi khoá còn sống: `k`, `val` (phiên bản có ts lớn nhất trên cả hai mức; khoá mà phiên bản mới nhất là tombstone thì không xuất hiện).
-- Gợi ý: union all hai mức, rồi distinct on (k) order by k, ts desc — hoặc row_number().




-- @ex CH24.05  [LSM tree: compaction]  ★★★
-- Mô phỏng merge L0 vào L1: tạo bảng `ai_lsm_merged(k, val, ts)` chứa đúng một phiên bản mới nhất của mỗi khoá còn sống (bỏ tombstone và mọi phiên bản cũ). Hệ thống đọc bảng theo k.
-- (Thứ tự dòng được chấm.)




-- @ex CH24.06  [bitmap index]  ★★☆
-- Xây bitmap index trên `ai_customer.gender`: với mỗi giá trị gender, trả về `gender` và `bitmap` — chuỗi bit (kiểu `varbit`) dài 12, bit thứ i (từ trái) là 1 nếu khách có cust_id = i có gender đó. (Chưa xét cột deleted.)
-- Gợi ý: string_agg(case ... then '1' else '0' end, '' order by cust_id)::varbit




-- @ex CH24.07  [bitmap AND + count]  ★★☆
-- Trả lời "khách nữ có income_level = 2" bằng bitmap: tính bitmap của gender = 'F', bitmap của income_level = 2 và AND chúng. Trả về một dòng: `result_bitmap` (varbit) và `num_rows` (số bit 1 của kết quả).
-- Gợi ý: bit_count(varbit) đếm số bit 1.




-- @ex CH24.08  [bitmap NOT + existence]  ★★★
-- Bản ghi có `deleted = true` coi như đã bị xoá. Tính "income_level khác 3" bằng bitmap: NOT bitmap(income_level = 3) AND existence bitmap (bit 1 nếu bản ghi chưa bị xoá). Trả về `naive_not` (chỉ NOT, chưa AND), `with_existence` và `num_rows` (số bit 1 của with_existence).




-- @ex CH24.09  [nearest neighbor]  ★☆☆
-- Đề gốc: Exercise 24.4. Give an algorithm for searching an R-tree that efficiently finds the nearest neighbor of a given query point.
--
-- Ba địa điểm trong `ai_place` gần điểm (5, 5) nhất: `name`, `dist` (khoảng cách Euclid, làm tròn 3 chữ số), sắp theo khoảng cách tăng dần.
-- Gợi ý: Toán tử  giữa hai point; order by ... limit 3.
-- (Thứ tự dòng được chấm.)




-- @ex CH24.10  [region query]  ★☆☆
-- Region query: với mỗi vùng trong `ai_region`, liệt kê các địa điểm nằm trong vùng đó (kể cả trên biên): `region`, `place`.
-- Gợi ý: point <@ box.




-- @ex CH24.11  [MBR filter vs giao thật]  ★★★
-- Đề gốc: Exercise 24.3. Suppose line segments are to be stored in an R-tree. When a segment is not parallel to the axes, its bounding box can be large and contain a lot of empty area.
--
-- - Describe how such large bounding boxes affect the performance of queries asking for the line segments that intersect a given region.
-- - Briefly describe a technique that improves the performance of such queries, and give an example of its benefit. (Hint: segments can be split into smaller pieces.)
--
-- Spatial join theo hai bước như R-tree: bước lọc dùng MBR của đoạn thẳng (`box(seg[0], seg[1])`) giao vùng (`&&`), bước tinh kiểm tra đoạn thật sự giao vùng (`seg ?# area`). Với mọi cặp (vùng, đoạn) qua được bước lọc, trả về `region`, `seg_id`, `really_intersects`. Các dòng false là false hit do MBR lớn.




-- @ex CH24.12  [extendable hashing: bit]  ★☆☆
-- Đề gốc: Exercise 24.6. A file uses extendable hashing and holds records with these search-key values:
--
-- 2, 3, 5, 7, 11, 17, 19, 23, 29, 31
--
-- Show the extendable hash structure for this file when the hash function is h(x) = x mod 8 and each bucket can hold three records.
--
-- Với mỗi khoá trong `ai_hash_key` và h(x) = x mod 8, trả về `k`, `h` và `h_bits` — h viết dạng chuỗi nhị phân 3 bit (ví dụ 5 → '101').
-- Gợi ý: (x % 8)::bit(3)::text.




-- @ex CH24.13  [extendable hashing: global depth]  ★★★
-- Đề gốc: Exercise 24.6. A file uses extendable hashing and holds records with these search-key values:
--
-- 2, 3, 5, 7, 11, 17, 19, 23, 29, 31
--
-- Show the extendable hash structure for this file when the hash function is h(x) = x mod 8 and each bucket can hold three records.
--
-- Bucket chứa tối đa 3 bản ghi; extendable hashing dùng i bit đầu của h_bits (CH24.12). Với i = 1, 2, 3, trả về `i` và `max_bucket` — số khoá lớn nhất rơi vào cùng một tiền tố i bit. Từ đó thấy global depth nhỏ nhất là bao nhiêu.


