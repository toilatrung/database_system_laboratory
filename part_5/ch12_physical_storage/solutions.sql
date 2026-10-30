-- =====================================================================
-- CS4420 · Chương 12 — Hệ thống lưu trữ vật lý (Physical Storage Systems)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CH12.01  [access time]  ★☆☆
-- Với mỗi ổ đĩa từ (`kind = 'HDD'`) trong `st_disk`: disk_id, `latency_ms` = rotational latency trung bình, `access_ms` = avg_seek_ms + latency_ms. Làm tròn 2 chữ số.
-- Gợi ý: Latency trung bình là nửa vòng quay: 0.5 × 60000 / rpm.
select disk_id,
       round(0.5 * 60000 / rpm, 2) as latency_ms,
       round(avg_seek_ms + 0.5 * 60000 / rpm, 2) as access_ms
from st_disk
where kind = 'HDD';

-- @ex CH12.02  [IOPS]  ★★☆
-- Ước lượng số lần đọc block 4 KB ngẫu nhiên mỗi giây (`iops`, lấy phần nguyên) của mọi thiết bị trong st_disk. Thời gian một lần đọc = avg_seek_ms + latency (0 với SSD) + thời gian truyền 4 KB (coi 1 MB = 1024 KB). Trả về disk_id, `read_ms` (làm tròn 4 chữ số), iops; sắp theo iops giảm dần.
-- Gợi ý: Thời gian truyền (ms) = 4 / 1024 / transfer_mb_s × 1000. `coalesce(0.5 * 60000 / rpm, 0)`.
-- (Thứ tự dòng được chấm.)
select disk_id,
       round(t, 4) as read_ms,
       floor(1000 / t) as iops
from (select disk_id,
             avg_seek_ms + coalesce(0.5 * 60000 / rpm, 0) + 4.0 / 1024 / transfer_mb_s * 1000 as t
      from st_disk) as d
order by iops desc;

-- @ex CH12.03  [sequential vs random]  ★★☆
-- Đọc một file 10 GB (1 GB = 1024 MB, 1 MB = 1024 KB) trên mỗi thiết bị: `seq_s` = đọc tuần tự (chỉ tính thời gian truyền), `random_s` = đọc thành các block 4 KB ngẫu nhiên (mỗi block tốn một lần access đầy đủ như CH12.02). Trả về disk_id, seq_s và random_s làm tròn 1 chữ số, và `ratio` = random_s / seq_s làm tròn 0 chữ số.
select disk_id,
       round(seq, 1) as seq_s,
       round(rnd, 1) as random_s,
       round(rnd / seq, 0) as ratio
from (select disk_id,
             10 * 1024 / transfer_mb_s as seq,
             (10 * 1024 * 1024 / 4) * (avg_seek_ms + coalesce(0.5 * 60000 / rpm, 0) + 4.0 / 1024 / transfer_mb_s * 1000) / 1000 as rnd
      from st_disk) as d;

-- @ex CH12.04  [RAID capacity]  ★☆☆
-- Với mỗi mảng trong `st_raid_array`: array_id, raid_level, `raw_gb` (tổng dung lượng các đĩa) và `usable_gb` — RAID 0: n·c, RAID 1: n·c/2, RAID 5: (n−1)·c, RAID 6: (n−2)·c, với c = capacity_gb của loại đĩa dùng trong mảng.
select a.array_id, a.raid_level,
       a.num_disks * d.capacity_gb as raw_gb,
       case a.raid_level
         when 0 then a.num_disks * d.capacity_gb
         when 1 then a.num_disks * d.capacity_gb / 2
         when 5 then (a.num_disks - 1) * d.capacity_gb
         when 6 then (a.num_disks - 2) * d.capacity_gb
       end as usable_gb
from st_raid_array a join st_disk d on d.disk_id = a.disk_id;

-- @ex CH12.05  [MTTF of many disks]  ★☆☆
-- Với mỗi mảng RAID: array_id và thời gian trung bình tới khi một đĩa nào đó trong mảng hỏng: `hours_to_first_failure` = MTTF của đĩa / num_disks (phần nguyên) và `days` (làm tròn 1 chữ số).
select a.array_id,
       floor(d.mttf_hours::numeric / a.num_disks) as hours_to_first_failure,
       round(d.mttf_hours::numeric / a.num_disks / 24, 1) as days
from st_raid_array a join st_disk d on d.disk_id = a.disk_id;

-- @ex CH12.06  [mean time to data loss]  ★★☆
-- Với các mảng RAID 1 (mỗi cặp đĩa mirror): array_id và mean time to data loss của một cặp theo công thức MTTF² / (2 × MTTR), tính bằng năm (8760 giờ/năm), làm tròn tới hàng đơn vị (`years`).
-- Gợi ý: Ép kiểu numeric trước khi bình phương để không tràn integer.
select a.array_id,
       round(power(d.mttf_hours::numeric, 2) / (2 * a.mttr_hours) / 8760, 0) as years
from st_raid_array a join st_disk d on d.disk_id = a.disk_id
where a.raid_level = 1;

-- @ex CH12.07  [PE 12.3b flash table]  ★★☆
-- Đề gốc: Exercise 12.3 (b). Flash storage:
--
-- b. A flash storage system holds 64 gigabytes and uses a 4096-byte page. If each page has a 32-bit address and the table is stored as an array, how large is the flash translation table?
--
-- Với mỗi thiết bị trong `st_flash`: device, `pages` = số page (1 GB = 2³⁰ byte) và `table_mb` = kích thước flash translation table dạng mảng, mỗi phần tử address_bits bit (1 MB = 2²⁰ byte). Dòng F64 phải ra 64 MB như lời giải PE 12.3b.
select device,
       capacity_gb::bigint * 1073741824 / page_bytes as pages,
       capacity_gb::bigint * 1073741824 / page_bytes * address_bits / 8 / 1048576 as table_mb
from st_flash;

-- @ex CH12.08  [PE 12.3c run mapping]  ★★☆
-- Đề gốc: Exercise 12.3 (c). Flash storage:
--
-- c. Suggest how to shrink the translation table when long ranges of consecutive logical page numbers are very often mapped to consecutive physical page numbers.
--
-- Với thiết bị F64, giả sử mỗi dải p page logic liên tiếp được ánh xạ tới p page vật lý liên tiếp nên chỉ cần lưu một phần tử cho mỗi dải. Trả về p và `table_kb` (kích thước bảng, KB = 1024 byte) cho p ∈ {1, 8, 64, 512}.
-- Gợi ý: `generate_series` hoặc `values (1), (8), (64), (512)`.
select p,
       f.capacity_gb::bigint * 1073741824 / f.page_bytes / p * f.address_bits / 8 / 1024 as table_kb
from st_flash f, (values (1), (8), (64), (512)) as r(p)
where f.device = 'F64';

-- @ex CH12.09  [PE 12.4 parity placement]  ★★★
-- Đề gốc: Exercise 12.4. Data and parity blocks are arranged on four disks as shown in Figure 12.4. The B[i] are data blocks and the P[i] are parity blocks; parity block P[i] is the parity block for data blocks B[4i−3] to B[4i]. What problem, if any, can this arrangement cause?
--
-- *Figure 12.4 — Block arrangement for Exercise 12.4* (each column is a disk, rows go down the disk):
--
-- | Disk 1 | Disk 2 | Disk 3 | Disk 4 |
-- |---|---|---|---|
-- | B1 | B2 | B3 | B4 |
-- | P1 | B5 | B6 | B7 |
-- | B8 | P2 | B9 | B10 |
-- | … | … | … | … |
--
-- `st_raid_layout(disk_no, stripe, label)` chứa bố trí của PE 12.4 (mở rộng thêm vài stripe). Parity P[i] bảo vệ B[4i−3] … B[4i]. Tìm mọi cặp (parity, data_block, disk_no) mà block dữ liệu nằm cùng đĩa với parity bảo vệ nó.
-- Gợi ý: Lấy số sau ký tự đầu: `substr(label, 2)::int`. Block B[k] thuộc parity i khi 4i − 3 ≤ k ≤ 4i.
select p.label as parity, b.label as data_block, p.disk_no
from st_raid_layout p join st_raid_layout b on b.disk_no = p.disk_no
where p.label like 'P%' and b.label like 'B%'
  and substr(b.label, 2)::int between 4 * substr(p.label, 2)::int - 3 and 4 * substr(p.label, 2)::int;

-- @ex CH12.10  [cost per GB]  ★☆☆
-- Xếp hạng thiết bị theo giá mỗi GB: disk_id, kind, `usd_per_gb` (làm tròn 4 chữ số), sắp tăng dần theo usd_per_gb.
-- (Thứ tự dòng được chấm.)
select disk_id, kind, round(price_usd / capacity_gb, 4) as usd_per_gb
from st_disk
order by usd_per_gb;

-- @ex CH12.11  [RAID write penalty]  ★★★
-- Ứng dụng tạo 1000 lần ghi block nhỏ ngẫu nhiên mỗi giây lên từng mảng. Số I/O vật lý cho mỗi lần ghi logic: RAID 0 → 1, RAID 1 → 2, RAID 5 → 4, RAID 6 → 6. Trả về array_id, raid_level, `physical_iops` và `per_disk_iops` (= physical_iops / num_disks, làm tròn 1 chữ số).
select array_id, raid_level,
       1000 * f as physical_iops,
       round(1000.0 * f / num_disks, 1) as per_disk_iops
from (select array_id, raid_level, num_disks,
             case raid_level when 0 then 1 when 1 then 2 when 5 then 4 when 6 then 6 end as f
      from st_raid_array) as a;
