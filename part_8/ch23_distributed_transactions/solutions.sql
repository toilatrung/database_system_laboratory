-- =====================================================================
-- CS4420 · Chương 23 — Xử lý giao dịch song song và phân tán (Parallel and Distributed Transaction Processing)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CH23.01  [2PC: quyết định của coordinator]  ★☆☆
-- Bảng `pd_2pc_log(txn, site, seq, rec)` chứa log của coordinator (site `C`) và các participant. Với mỗi giao dịch, trả về txn và `decision`: `commit` nếu coordinator đã ghi commit, `abort` nếu coordinator đã ghi abort, ngược lại `undecided`. Sắp theo txn.
-- (Thứ tự dòng được chấm.)
select txn,
       case when bool_or(site = 'C' and rec = 'commit') then 'commit'
            when bool_or(site = 'C' and rec = 'abort') then 'abort'
            else 'undecided' end as decision
from pd_2pc_log
group by txn
order by txn;

-- @ex CH23.02  [2PC: phục hồi participant]  ★★☆
-- Bảng `pd_2pc_part(txn, site)` liệt kê participant của mỗi giao dịch. Mỗi participant phục hồi chỉ dựa vào log của chính nó: có commit → `redo`; có abort hoặc no → `undo`; chỉ có ready → `ask`; không có record nào của txn → `undo`. Trả về txn, site, `action`, sắp theo txn, site.
-- (Thứ tự dòng được chấm.)
select p.txn, p.site,
       case when bool_or(l.rec = 'commit') then 'redo'
            when bool_or(l.rec in ('abort', 'no')) then 'undo'
            when bool_or(l.rec = 'ready') then 'ask'
            else 'undo' end as action
from pd_2pc_part p
left join pd_2pc_log l on l.txn = p.txn and l.site = p.site
group by p.txn, p.site
order by p.txn, p.site;

-- @ex CH23.03  [2PC: blocking]  ★★☆
-- Coordinator `C` vừa hỏng. Các participant còn sống trao đổi log với nhau. Với mỗi giao dịch, quyết định: `commit` nếu có participant nào có commit; `abort` nếu có participant có abort/no hoặc có participant chưa ghi ready; nếu mọi participant đều chỉ có ready → `blocked` (phải chờ C). Trả về txn, `outcome`, sắp theo txn.
-- (Thứ tự dòng được chấm.)
with s as (
  select p.txn, p.site,
         bool_or(l.rec = 'commit') as has_commit,
         bool_or(l.rec in ('abort', 'no')) as has_abort,
         coalesce(bool_or(l.rec = 'ready'), false) as has_ready
  from pd_2pc_part p left join pd_2pc_log l on l.txn = p.txn and l.site = p.site
  group by p.txn, p.site
)
select txn,
       case when bool_or(has_commit) then 'commit'
            when bool_or(has_abort) or not bool_and(has_ready) then 'abort'
            else 'blocked' end as outcome
from s
group by txn
order by txn;

-- @ex CH23.04  [quorum consensus]  ★☆☆
-- Bảng `pd_quorum(cfg, n, r, w)`. Một cấu hình hợp lệ khi `r + w > n` (đọc luôn giao với lần ghi gần nhất) và `2w > n` (hai lần ghi không thể cùng lúc). Trả về cfg, `read_sees_write` (boolean r + w > n), `writes_conflict` (boolean 2w > n), `valid` (cả hai), sắp theo cfg.
-- (Thứ tự dòng được chấm.)
select cfg, r + w > n as read_sees_write, 2 * w > n as writes_conflict, (r + w > n and 2 * w > n) as valid
from pd_quorum
order by cfg;

-- @ex CH23.05  [đọc quorum: version lớn nhất]  ★★☆
-- Bảng `pd_copy(item, node, version, val)` là các bản sao; `pd_read_req(req, item, node)` cho biết mỗi lần đọc quorum hỏi những node nào. Lần đọc trả về giá trị có version lớn nhất trong các node được hỏi. Trả về req, item, `version`, `val`, sắp theo req.
-- (Thứ tự dòng được chấm.)
select distinct on (q.req) q.req, q.item, c.version, c.val
from pd_read_req q join pd_copy c on c.item = q.item and c.node = q.node
order by q.req, c.version desc;

-- @ex CH23.06  [global wait-for graph]  ★★☆
-- Đề gốc: Exercise 23.8. Consider the following deadlock-detection algorithm. When transaction T[i] at site S[1] requests a resource from T[j] at site S[3], a request message with timestamp n is sent. The edge (T[i], T[j], n) is inserted into the local wait-for graph of S[1]. The edge (T[i], T[j], n) is inserted into the local wait-for graph of S[3] only if T[j] has received the request message and cannot grant the requested resource immediately. A request from T[i] to T[j] at the same site is handled in the usual way, and no timestamp is attached to the edge (T[i], T[j]). A central coordinator starts the detection algorithm by sending an initiating message to every site.
--
-- When a site receives this message, it sends its local wait-for graph to the coordinator. Such a graph holds all the local information the site has about the state of the real graph; it reflects an instantaneous state of that site but is not synchronized with any other site.
--
-- After the controller has received a reply from every site, it builds a graph as follows:
--
-- - The graph has a vertex for every transaction in the system.
-- - The graph has an edge (T[i], T[j]) if and only if either there is an edge (T[i], T[j]) in one of the wait-for graphs, or an edge (T[i], T[j], n) (for some n) appears in more than one wait-for graph.
--
-- Show that if the constructed graph contains a cycle, the system is in a deadlock state, and that if it contains no cycle, the system was not in a deadlock state when the algorithm started.
--
-- Bảng `pd_wfg(site, waiter, holder, ts)` là các local wait-for graph (ts null = cạnh cục bộ; ts khác null = cạnh liên site gắn timestamp của request). Theo PE 23.8, đồ thị toàn cục gồm cạnh (waiter, holder) nếu: có một cạnh cục bộ như vậy, hoặc cạnh liên site (waiter, holder, ts) xuất hiện ở hơn một site. Trả về các cạnh (waiter, holder) của đồ thị toàn cục, không trùng, sắp theo waiter, holder.
-- (Thứ tự dòng được chấm.)
select waiter, holder from pd_wfg where ts is null
union
select waiter, holder from pd_wfg where ts is not null
group by waiter, holder, ts having count(distinct site) > 1
order by waiter, holder;

-- @ex CH23.07  [phát hiện deadlock]  ★★★
-- Đề gốc: Exercise 23.8. Consider the following deadlock-detection algorithm. When transaction T[i] at site S[1] requests a resource from T[j] at site S[3], a request message with timestamp n is sent. The edge (T[i], T[j], n) is inserted into the local wait-for graph of S[1]. The edge (T[i], T[j], n) is inserted into the local wait-for graph of S[3] only if T[j] has received the request message and cannot grant the requested resource immediately. A request from T[i] to T[j] at the same site is handled in the usual way, and no timestamp is attached to the edge (T[i], T[j]). A central coordinator starts the detection algorithm by sending an initiating message to every site.
--
-- When a site receives this message, it sends its local wait-for graph to the coordinator. Such a graph holds all the local information the site has about the state of the real graph; it reflects an instantaneous state of that site but is not synchronized with any other site.
--
-- After the controller has received a reply from every site, it builds a graph as follows:
--
-- - The graph has a vertex for every transaction in the system.
-- - The graph has an edge (T[i], T[j]) if and only if either there is an edge (T[i], T[j]) in one of the wait-for graphs, or an edge (T[i], T[j], n) (for some n) appears in more than one wait-for graph.
--
-- Show that if the constructed graph contains a cycle, the system is in a deadlock state, and that if it contains no cycle, the system was not in a deadlock state when the algorithm started.
--
-- Dùng đồ thị toàn cục của CH23.06, tìm các giao dịch nằm trên một chu trình (deadlock). Trả về cột `txn`, sắp theo txn. Gợi ý: recursive CTE tìm mọi cặp (x, y) mà y đến được từ x; x nằm trên chu trình nếu x đến được chính nó.
-- (Thứ tự dòng được chấm.)
with recursive g as (
  select waiter, holder from pd_wfg where ts is null
  union
  select waiter, holder from pd_wfg where ts is not null
  group by waiter, holder, ts having count(distinct site) > 1
), reach(src, dst) as (
  select waiter, holder from g
  union
  select r.src, g.holder from reach r join g on g.waiter = r.dst
)
select src as txn from reach where src = dst order by src;

-- @ex CH23.08  [Lamport timestamp]  ★★★
-- Bảng `pd_event(proc, seq, kind, msg)`: các sự kiện của từng tiến trình theo thứ tự seq; sự kiện `recv` nhận message do sự kiện `send` có cùng `msg` gửi. Lamport timestamp: L(e) = 1 + max(L của sự kiện liền trước trên cùng tiến trình, L của sự kiện send tương ứng nếu e là recv), với max của tập rỗng = 0. Trả về proc, seq, `lamport`, sắp theo proc, seq.
-- Gợi ý: L(e) bằng số sự kiện trên đường happened-before dài nhất kết thúc tại e. Recursive CTE đi theo các cạnh (sự kiện trước → sự kiện sau), rồi lấy max độ dài.
-- (Thứ tự dòng được chấm.)
with recursive edge(fp, fs, tp, ts) as (
  select proc, seq - 1, proc, seq from pd_event where seq > 1
  union all
  select s.proc, s.seq, r.proc, r.seq
  from pd_event s join pd_event r on r.msg = s.msg and s.kind = 'send' and r.kind = 'recv'
), path(proc, seq, len) as (
  select proc, seq, 1 from pd_event
  union all
  select e.tp, e.ts, p.len + 1 from path p join edge e on e.fp = p.proc and e.fs = p.seq
)
select proc, seq, max(len) as lamport
from path
group by proc, seq
order by proc, seq;

-- @ex CH23.09  [persistent messaging: sequence number]  ★★☆
-- Đề gốc: Exercise 23.5. The persistent-messaging scheme of this chapter relies on timestamps. Its drawback is that received messages can be discarded only once they are too old, so a large number of received messages may have to be remembered. Propose an alternative scheme based on sequence numbers instead of timestamps that can discard messages sooner.
--
-- Bảng `pd_msg_in(sender, seq, arrival)`: các message nhận được từ mỗi site gửi (sequence number bắt đầu từ 1). Theo PE 23.5, site nhận chỉ ack/lưu message seq = k nếu đã có mọi message 1 … k − 1. Với mỗi sender, trả về `acked_upto` = số k lớn nhất mà mọi message 1 … k đều đã nhận (0 nếu chưa có message 1). Sắp theo sender.
-- Gợi ý: k thoả khi số message có seq ≤ k bằng k.
-- (Thứ tự dòng được chấm.)
select s.sender,
       coalesce((select max(m.seq) from pd_msg_in m
                 where m.sender = s.sender
                   and (select count(*) from pd_msg_in x where x.sender = m.sender and x.seq <= m.seq) = m.seq), 0) as acked_upto
from (select distinct sender from pd_msg_in) s
order by s.sender;

-- @ex CH23.10  [lazy replication: đọc dữ liệu cũ]  ★★★
-- Đề gốc: Exercise 23.7. Give an example in which lazy replication leads to an inconsistent database state, even though updates obtain an exclusive lock on the primary (master) copy, when data are read from a node other than the master.
--
-- `pd_primary_hist(version, t_commit, balance)` là các phiên bản đã commit ở primary; `pd_replica_apply(node, version, t_apply)` cho biết replica áp dụng phiên bản lúc nào; `pd_replica_read(read_id, node, t)` là các lần đọc ở replica. Một lần đọc thấy balance của phiên bản lớn nhất mà replica đã áp dụng tại thời điểm ≤ t; balance đúng là phiên bản lớn nhất primary đã commit tại thời điểm ≤ t. Trả về read_id, node, `seen`, `primary_balance`, `stale` (boolean), sắp theo read_id.
-- (Thứ tự dòng được chấm.)
select r.read_id, r.node,
       (select h.balance from pd_replica_apply a join pd_primary_hist h on h.version = a.version
        where a.node = r.node and a.t_apply <= r.t order by a.version desc limit 1) as seen,
       (select h.balance from pd_primary_hist h where h.t_commit <= r.t order by h.version desc limit 1) as primary_balance,
       (select max(a.version) from pd_replica_apply a where a.node = r.node and a.t_apply <= r.t)
         < (select max(h.version) from pd_primary_hist h where h.t_commit <= r.t) as stale
from pd_replica_read r
order by r.read_id;

-- @ex CH23.11  [chain replication]  ★★☆
-- Đề gốc: Exercise 23.9. Consider the chain-replication protocol of Section 23.4.3.2, a variant of the primary-copy protocol.
--
-- a. If locking is used for concurrency control, what is the earliest moment at which a process may release an exclusive lock after updating a data item?
--
-- b. Each data item could have its own chain, but give two reasons why it is better to define a chain at a coarser level, for example per partition or tablet.
--
-- c. How can consensus protocols be used to make sure that the chain is uniquely determined at every point in time?
--
-- Bảng `pd_chain(item, pos, node, version)`: chain của mỗi item, pos 1 là head, pos lớn nhất là tail; version là phiên bản mới nhất node đó đã áp dụng. Một lần ghi chỉ coi là commit khi tail đã áp dụng. Với mỗi item, trả về `head_version`, `committed_version` (version ở tail), `in_flight` (= head_version − committed_version), sắp theo item.
-- (Thứ tự dòng được chấm.)
select c.item,
       max(c.version) filter (where c.pos = 1) as head_version,
       max(c.version) filter (where c.pos = t.max_pos) as committed_version,
       max(c.version) filter (where c.pos = 1) - max(c.version) filter (where c.pos = t.max_pos) as in_flight
from pd_chain c
join (select item, max(pos) as max_pos from pd_chain group by item) t on t.item = c.item
group by c.item
order by c.item;

-- @ex CH23.12  [lease]  ★★☆
-- Đề gốc: Exercise 23.10. With the primary-copy replication scheme, if the primary becomes disconnected from the rest of the system, a new node may be elected primary. The old primary may not notice that it was disconnected, and may later reconnect without knowing that a new primary exists.
--
-- a. What problems can occur if the old primary does not realize that a new primary has taken over?
--
-- b. How can leases be used to avoid these problems?
--
-- c. Would such a situation — a participant node is disconnected and then reconnected without realizing it was disconnected — cause any problem for the majority or quorum protocols?
--
-- Bảng `pd_lease(node, lease_start, lease_end)` (lease có hiệu lực trong [lease_start, lease_end)) và `pd_serve(req, node, t)` (các request mà node đã phục vụ với tư cách primary lúc t). Tìm các request vi phạm: node không giữ lease nào còn hiệu lực tại t. Trả về req, node, t, sắp theo req.
-- (Thứ tự dòng được chấm.)
select s.req, s.node, s.t
from pd_serve s
where not exists (select * from pd_lease l
                  where l.node = s.node and l.lease_start <= s.t and s.t < l.lease_end)
order by s.req;

-- @ex CH23.13  [federated: precedence graph]  ★★★
-- Đề gốc: Exercise 23.11 (b). Consider a federated database system in which at most one global transaction is guaranteed to be active at any time, and every local site guarantees local serializability.
--
-- b. Show with an example that a nonserializable global schedule can still occur under these assumptions.
--
-- Bảng `pd_sched(step, site, txn, op, item)` là schedule của PE 23.11b. Hai thao tác xung đột nếu cùng site, cùng item, khác giao dịch và ít nhất một là write; thao tác xảy ra trước (step nhỏ hơn) tạo cạnh `from_txn → to_txn`. Trả về các cạnh (from_txn, to_txn, site) không trùng, sắp theo site, from_txn. Có chu trình không?
-- (Thứ tự dòng được chấm.)
select distinct a.txn as from_txn, b.txn as to_txn, a.site
from pd_sched a join pd_sched b
  on a.site = b.site and a.item = b.item and a.txn <> b.txn and a.step < b.step
 and (a.op = 'write' or b.op = 'write')
order by a.site, a.txn;
