-- =====================================================================
-- CS4420 · Chương 21 — Lưu trữ song song và phân tán (Parallel and Distributed Storage)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CH21.01  [round-robin]  ★☆☆
-- Bảng `pd_order(order_id, customer, amount, order_date)`. Chia các đơn hàng lên 4 node theo round-robin theo thứ tự order_id: đơn thứ nhất về node 0, thứ hai node 1, …, thứ năm lại về node 0. Trả về `node` và số đơn hàng `num_orders` của mỗi node, sắp theo node.
-- Gợi ý: (row_number() over (order by order_id) − 1) % 4.
-- (Thứ tự dòng được chấm.)
select node, count(*) as num_orders
from (select (row_number() over (order by order_id) - 1) % 4 as node from pd_order) t
group by node
order by node;

-- @ex CH21.02  [hash partitioning]  ★☆☆
-- Chia `pd_order` lên 4 node bằng hash partitioning trên `order_id`, với hàm hash `abs(hashtext(order_id::text)) % 4`. Trả về `node`, `num_orders`, sắp theo node.
-- (Thứ tự dòng được chấm.)
select abs(hashtext(order_id::text)) % 4 as node, count(*) as num_orders
from pd_order
group by 1
order by 1;

-- @ex CH21.03  [attribute-value skew]  ★★☆
-- Giờ hash partitioning trên `customer` (hàm `abs(hashtext(customer)) % 4`). Trả về `node`, `num_orders` và `customers` (danh sách khách ở node đó, nối bằng `, ` theo thứ tự tên), chỉ gồm các node có dữ liệu, sắp theo node. Vì sao lệch nhiều hơn CH21.02?
-- Gợi ý: string_agg(distinct customer, ', ' order by customer).
-- (Thứ tự dòng được chấm.)
select abs(hashtext(customer)) % 4 as node, count(*) as num_orders,
       string_agg(distinct customer, ', ' order by customer) as customers
from pd_order
group by 1
order by 1;

-- @ex CH21.04  [range partitioning]  ★☆☆
-- Chia `pd_order` theo range partitioning trên `amount` với partitioning vector [200, 500, 1000]: amount < 200 → node 0; 200 ≤ amount < 500 → node 1; 500 ≤ amount < 1000 → node 2; ≥ 1000 → node 3. Trả về node, num_orders, sắp theo node.
-- Gợi ý: width_bucket(amount, array[200, 500, 1000]) trả về đúng số node.
-- (Thứ tự dòng được chấm.)
select width_bucket(amount, array[200, 500, 1000]) as node, count(*) as num_orders
from pd_order
group by 1
order by 1;

-- @ex CH21.05  [skew của range partitioning]  ★★☆
-- Với cách chia của CH21.04, trả về một dòng: `max_node` (số tuple của node đông nhất), `avg_node` (số tuple trung bình mỗi node, tính trên 4 node) và `skew` = max_node / avg_node làm tròn 2.
select max(cnt) as max_node, avg(cnt) as avg_node, round(max(cnt) / avg(cnt), 2) as skew
from (select width_bucket(amount, array[200, 500, 1000]) as node, count(*) as cnt
      from pd_order group by 1) t;

-- @ex CH21.06  [truy vấn khoảng]  ★★☆
-- Đề gốc: Exercise 21.1. For a range selection on a range-partitioned attribute, it may happen that only one disk has to be accessed. Describe the advantages and disadvantages of this property.
--
-- Truy vấn `select * from pd_order where amount between 250 and 450`. Trả về một dòng hai cột: `range_nodes` — số node phải đọc với range partitioning của CH21.04 (các node có khoảng giá trị giao với [250, 450]), và `rr_nodes` — số node chứa ít nhất một tuple thoả điều kiện với round-robin của CH21.01 (với round-robin hệ thống không biết trước nên phải đọc cả 4 node; ở đây chỉ đếm node thực sự có kết quả).
select (select count(distinct width_bucket(v, array[200, 500, 1000])) from generate_series(250, 450) v) as range_nodes,
       (select count(distinct node)
        from (select (row_number() over (order by order_id) - 1) % 4 as node, amount from pd_order) t
        where amount between 250 and 450) as rr_nodes;

-- @ex CH21.07  [vector từ histogram]  ★★★
-- Đề gốc: Exercise 21.2 (a). Recall that histograms are used to build load-balanced range partitions.
--
-- a. A histogram covers values 1 to 100, split into the 10 ranges 1–10, 11–20, …, 91–100, whose frequencies are, in order, 15, 5, 20, 10, 10, 5, 5, 20, 5, and 5. Give a load-balanced range-partitioning function that splits the values into five partitions.
--
-- Bảng `pd_hist(lo, hi, freq)` là histogram của PE 21.2a. Tính vector range partitioning cân bằng cho 5 partition: với k = 1..4, mục tiêu là tuple thứ k·N/5 (N = tổng freq); tìm bucket chứa nó (tổng cộng dồn trước bucket < mục tiêu ≤ tổng cộng dồn tới hết bucket), và điểm cắt = `lo + (mục tiêu − cộng dồn trước bucket) / freq · (hi − lo + 1)`. Trả về `k` và `cut` (kiểu integer), sắp theo k.
-- Gợi ý: sum(freq) over (order by lo) cho cộng dồn; generate_series(1, 4) cho k.
-- (Thứ tự dòng được chấm.)
with h as (
  select lo, hi, freq, sum(freq) over (order by lo) as cum from pd_hist
), t as (
  select k, k * (select sum(freq) from pd_hist) / 5 as target from generate_series(1, 4) k
)
select t.k, (h.lo + (t.target - (h.cum - h.freq)) * (h.hi - h.lo + 1) / h.freq)::integer as cut
from t join h on h.cum - h.freq < t.target and t.target <= h.cum
order by t.k;

-- @ex CH21.08  [partition by range (PostgreSQL)]  ★★☆
-- Dùng declarative partitioning của PostgreSQL. Tạo bảng `pd_order_r(order_id integer, customer varchar(10), amount integer, order_date date)` partition by range (amount) với bốn partition đúng vector của CH21.04:
-- - `pd_order_r0`: từ minvalue đến 200
-- - `pd_order_r1`: [200, 500)
-- - `pd_order_r2`: [500, 1000)
-- - `pd_order_r3`: từ 1000 đến maxvalue
--
-- Rồi chép toàn bộ `pd_order` vào `pd_order_r`. Hệ thống đếm số tuple trong từng partition (`tableoid::regclass`).
create table pd_order_r (order_id integer, customer varchar(10), amount integer, order_date date)
  partition by range (amount);
create table pd_order_r0 partition of pd_order_r for values from (minvalue) to (200);
create table pd_order_r1 partition of pd_order_r for values from (200) to (500);
create table pd_order_r2 partition of pd_order_r for values from (500) to (1000);
create table pd_order_r3 partition of pd_order_r for values from (1000) to (maxvalue);
insert into pd_order_r select * from pd_order;

-- Câu truy vấn hệ thống dùng để chấm:
--   select tableoid::regclass::text as partition, count(*) as num_orders
--   from pd_order_r group by 1 order by 1;

-- @ex CH21.09  [partition by hash (PostgreSQL)]  ★★☆
-- Tạo `pd_order_h` (cùng cột như `pd_order`) partition by hash (order_id) với 4 partition `pd_order_h0` … `pd_order_h3` (modulus 4, remainder 0 … 3), rồi chép toàn bộ `pd_order` vào. Hệ thống đếm số tuple mỗi partition và thử chèn `(25, 'An', 10, '2024-07-01')` vào bảng cha.
create table pd_order_h (order_id integer, customer varchar(10), amount integer, order_date date)
  partition by hash (order_id);
create table pd_order_h0 partition of pd_order_h for values with (modulus 4, remainder 0);
create table pd_order_h1 partition of pd_order_h for values with (modulus 4, remainder 1);
create table pd_order_h2 partition of pd_order_h for values with (modulus 4, remainder 2);
create table pd_order_h3 partition of pd_order_h for values with (modulus 4, remainder 3);
insert into pd_order_h select * from pd_order;

-- Câu truy vấn hệ thống dùng để chấm:
--   select try_sql($$insert into pd_order_h values (25, 'An', 10, '2024-07-01')$$) as insert_new;
--   select tableoid::regclass::text as partition, count(*) as num_orders
--   from pd_order_h group by 1 order by 1;

-- @ex CH21.10  [replica khi node hỏng]  ★★☆
-- Đề gốc: Exercise 21.6 (a). Parallel database systems keep replicas of every data item (or partition) on more than one node.
--
-- a. Why is it better to spread the copies of the data items assigned to a node over several other nodes, rather than keeping all of those copies on the same node (or set of nodes)?
--
-- Bảng `pd_replica(item, node, role, backup_rank)`: mỗi item có một `primary` và hai `backup` (backup_rank 1, 2). Node N2 hỏng. Với mỗi item có primary ở N2, backup có thứ hạng nhỏ nhất còn sống lên làm primary. Trả về mỗi node còn sống (`node`) và số item nó nhận thêm làm primary (`taken_over`), chỉ các node nhận ít nhất một, sắp theo node.
-- (Thứ tự dòng được chấm.)
select r.node, count(*) as taken_over
from pd_replica r
where r.role = 'backup' and r.node <> 'N2'
  and r.item in (select item from pd_replica where role = 'primary' and node = 'N2')
  and r.backup_rank = (select min(b.backup_rank) from pd_replica b
                       where b.item = r.item and b.role = 'backup' and b.node <> 'N2')
group by r.node
order by r.node;

-- @ex CH21.11  [master đã đổi]  ★★☆
-- Đề gốc: Exercise 21.8. To send a request to the master replica of a data item, a node must know which replica is currently the master for that item.
--
-- a. Suppose that after a node determines which node is the master replica of a data item, but before its request arrives there, mastership changes and another node becomes the master. How can this situation be handled?
--
-- b. The master replica can be chosen per partition, but some systems support a per-record master: the records of a partition (or tablet) are replicated on a set of nodes, and each record’s master may be any node of that set, independently of the masters of other records. Give two benefits of tracking the master per record.
--
-- c. Suggest how the master replica of every record can be tracked when there is a very large number of records.
--
-- Bảng `pd_master_epoch(item, epoch, node)`: mỗi lần master của một record đổi thì epoch tăng; master hiện tại là node có epoch lớn nhất. `pd_route(req, item, sent_to)` là các request đã gửi. Trả về req, item, sent_to, `current_master` và `redirect` (boolean: request gửi nhầm node, phải chuyển hướng). Sắp theo req.
-- (Thứ tự dòng được chấm.)
select r.req, r.item, r.sent_to, m.node as current_master, r.sent_to <> m.node as redirect
from pd_route r
join pd_master_epoch m on m.item = r.item
 and m.epoch = (select max(epoch) from pd_master_epoch where item = r.item)
order by r.req;
