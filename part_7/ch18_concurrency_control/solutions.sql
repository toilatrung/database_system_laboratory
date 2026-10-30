-- =====================================================================
-- CS4420 · Chương 18 — Điều khiển đồng thời (Concurrency Control) (Concurrency Control)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- ĐÁP ÁN. Hãy tự làm trước khi xem!
-- Mỗi bài độc lập với nhau: chạy TỪNG bài (bôi đen rồi chạy). Chạy cả file một lần
-- sẽ thay đổi dữ liệu và tạo trùng tên object. Muốn về dữ liệu gốc: chạy lại lab/db/*.sql.

-- @ex CH18.01  [lock compatibility]  ★★☆
-- Đề gốc: Exercise 18.7. A database system offers an atomic *increment* operation besides read and write. If V is the value of data item X, then
--
-- increment(X) by C
--
-- sets X to V + C in a single atomic step. The transaction does not learn the value of X unless it also executes read(X).
--
-- Increment operations lock the item in *increment mode*, using the compatibility matrix of Figure 18.25.
--
-- a. Show that if every transaction locks the data it accesses in the matching mode, two-phase locking guarantees serializability.
--
-- b. Show that adding increment-mode locks allows more concurrency.
--
-- *Figure 18.25 — Lock-compatibility matrix with increment mode* (true = compatible):
--
-- |   | S | X | I |
-- |---|---|---|---|
-- | S | true | false | false |
-- | X | false | false | false |
-- | I | false | false | true |
--
-- `tx_lock_req(req_id, item, txn, mode, status)` là bảng khoá của lock manager (mode S, X hoặc I); `tx_lock_compat(held, requested, ok)` là ma trận Figure 18.25. Với mỗi yêu cầu waiting, cho biết có cấp được ngay không (tương thích với mọi khoá held của transaction khác trên cùng item; bỏ qua thứ tự hàng đợi): `req_id, txn, item, mode, grantable`.
select w.req_id, w.txn, w.item, w.mode,
       not exists (select 1
                   from tx_lock_req h
                        join tx_lock_compat c on c.held = h.mode and c.requested = w.mode
                   where h.item = w.item and h.status = 'held' and h.txn <> w.txn and not c.ok) as grantable
from tx_lock_req w
where w.status = 'waiting';

-- @ex CH18.02  [two-phase check]  ★★☆
-- `tx_lock_sched(sched_id, step, txn, action, item)` lưu schedule có lệnh khoá (action: lock-S, lock-X, unlock, read, write, commit). Với mỗi (sched_id, txn), cho biết transaction có tuân theo 2PL không (không xin khoá nào sau lần unlock đầu tiên): `sched_id, txn, two_phase`.
select sched_id, txn,
       coalesce(max(step) filter (where action like 'lock%')
                < min(step) filter (where action = 'unlock'), true) as two_phase
from tx_lock_sched
group by sched_id, txn;

-- @ex CH18.03  [lock point]  ★★☆
-- Đề gốc: Exercise 18.1. Show that the two-phase locking protocol guarantees conflict serializability, and that transactions can be serialized in the order of their lock points.
--
-- Với schedule `L1`, tính lock point (step của lệnh khoá cuối cùng) của mỗi transaction và trả về `txn, lock_point` sắp theo lock_point — đây là thứ tự serial tương đương theo PE 18.1.
-- (Thứ tự dòng được chấm.)
select txn, max(step) as lock_point
from tx_lock_sched
where sched_id = 'L1' and action like 'lock%'
group by txn
order by lock_point;

-- @ex CH18.04  [strict / rigorous 2PL]  ★★★
-- Đề gốc: Exercise 18.3. What advantage does rigorous two-phase locking offer? How does it compare with the other variants of two-phase locking?
--
-- Với mỗi (sched_id, txn) trong `tx_lock_sched`, trả về `sched_id, txn, strict, rigorous`: strict — mọi unlock của item đã khoá X đều sau commit; rigorous — mọi unlock đều sau commit (transaction không unlock thì coi là đúng).
select s.sched_id, s.txn,
       not exists (
         select 1
         from tx_lock_sched u
              join tx_lock_sched l on l.sched_id = u.sched_id and l.txn = u.txn and l.item = u.item
                                  and l.action = 'lock-X' and l.step < u.step
         where u.sched_id = s.sched_id and u.txn = s.txn and u.action = 'unlock'
           and u.step < (select c.step from tx_lock_sched c
                         where c.sched_id = s.sched_id and c.txn = s.txn and c.action = 'commit')) as strict,
       coalesce(min(s.step) filter (where s.action = 'unlock')
                > max(s.step) filter (where s.action = 'commit'), true) as rigorous
from tx_lock_sched s
group by s.sched_id, s.txn;

-- @ex CH18.05  [deadlock detection]  ★★★
-- `tx_waits(graph, waiter, holder)` lưu các wait-for graph. Trả về các transaction đang bị deadlock (nằm trên một chu trình): `graph, txn`.
with recursive r (graph, src, dst) as (
  select graph, waiter, holder from tx_waits
  union
  select r.graph, r.src, w.holder
  from r join tx_waits w on w.graph = r.graph and w.waiter = r.dst
)
select graph, src as txn from r where src = dst;

-- @ex CH18.06  [deadlock victim]  ★★★
-- Trong mỗi wait-for graph, mỗi chu trình (thành phần liên thông mạnh có chu trình) chọn victim là transaction trẻ nhất (timestamp lớn nhất trong `tx_txn`). Trả về `graph, cycle_id, victim` với cycle_id là tên transaction nhỏ nhất (theo thứ tự chữ) của chu trình.
-- Gợi ý: Hai transaction cùng chu trình ⇔ mỗi bên đến được bên kia.
with recursive r (graph, src, dst) as (
  select graph, waiter, holder from tx_waits
  union
  select r.graph, r.src, w.holder
  from r join tx_waits w on w.graph = r.graph and w.waiter = r.dst
), cyc as (
  select graph, src as txn from r where src = dst
), comp as (
  select c.graph, c.txn,
         (select min(c2.txn) from cyc c2
          where c2.graph = c.graph
            and exists (select 1 from r where r.graph = c.graph and r.src = c.txn and r.dst = c2.txn)
            and exists (select 1 from r where r.graph = c.graph and r.src = c2.txn and r.dst = c.txn)) as cycle_id
  from cyc c
)
select distinct on (comp.graph, comp.cycle_id) comp.graph, comp.cycle_id, comp.txn as victim
from comp join tx_txn t on t.txn = comp.txn
order by comp.graph, comp.cycle_id, t.ts desc;

-- @ex CH18.07  [wait-die / wound-wait]  ★★☆
-- `tx_conflict(req_id, requester, holder)`: requester xin khoá đang bị holder giữ; timestamp ở `tx_txn` (nhỏ = già). Trả về `req_id, wait_die, wound_wait` với giá trị `wait`, `rollback requester` hoặc `rollback holder`.
select c.req_id,
       case when r.ts < h.ts then 'wait' else 'rollback requester' end as wait_die,
       case when r.ts < h.ts then 'rollback holder' else 'wait' end as wound_wait
from tx_conflict c
     join tx_txn r on r.txn = c.requester
     join tx_txn h on h.txn = c.holder;

-- @ex CH18.08  [timestamp ordering]  ★★☆
-- Đề gốc: Exercise 18.8. In timestamp ordering, W-timestamp(Q) is the largest timestamp of any transaction that successfully executed write(Q). Suppose we instead defined it as the timestamp of the most recent transaction that successfully executed write(Q). Would this change in wording make a difference? Explain.
--
-- `tx_to_req(req_id, txn_ts, op, item, r_ts, w_ts)`: mỗi dòng là một yêu cầu độc lập — TS của transaction, thao tác R/W và R-/W-timestamp hiện tại của item. Trả về `req_id, basic_to, thomas`: quyết định của timestamp ordering cơ bản (`execute`/`rollback`) và khi dùng Thomas' write rule (`execute`/`rollback`/`ignore`).
select req_id,
       case when op = 'R' then case when txn_ts < w_ts then 'rollback' else 'execute' end
            when txn_ts < r_ts or txn_ts < w_ts then 'rollback'
            else 'execute' end as basic_to,
       case when op = 'R' then case when txn_ts < w_ts then 'rollback' else 'execute' end
            when txn_ts < r_ts then 'rollback'
            when txn_ts < w_ts then 'ignore'
            else 'execute' end as thomas
from tx_to_req;

-- @ex CH18.09  [multiversion read]  ★★☆
-- Multiversion timestamp ordering: `tx_versions(item, w_ts, value)` là các phiên bản; `tx_mv_reads(req_id, txn_ts, item)` là các yêu cầu đọc. Trả về `req_id, value_read` — giá trị của phiên bản có W-timestamp lớn nhất ≤ TS của transaction.
select r.req_id,
       (select v.value from tx_versions v
        where v.item = r.item and v.w_ts <= r.txn_ts
        order by v.w_ts desc limit 1) as value_read
from tx_mv_reads r;

-- @ex CH18.10  [TO simulation]  ★★★
-- Đề gốc: Exercise 18.12. Under the timestamp-ordering protocol, take two transactions: one writes data items p and q, the other reads the same two items. Give a schedule in which the timestamp test for a write fails and forces the first transaction to restart, which in turn causes a cascading abort of the other transaction. Show how this can lead to starvation of both transactions. (A situation in which two or more processes keep acting but never finish because of their interaction with each other is called a *livelock*.)
--
-- Mô phỏng timestamp ordering trên schedule `tx_to_ops(step, txn, ts, op, item)` (kịch bản PE 18.12). Ban đầu mọi R-/W-timestamp bằng 0. Xử lý lần lượt từng step:
-- - read: TS < W-ts → `rollback`; ngược lại `execute` và R-ts := max(R-ts, TS);
-- - write: TS < R-ts hoặc TS < W-ts → `rollback`; ngược lại `execute` và W-ts := TS;
-- - transaction đã bị rollback thì các lệnh sau của nó là `skipped` (không restart, không cascading).
-- Trả về `step, txn, op, item, outcome` sắp theo step.
-- Gợi ý: Recursive CTE, mỗi bước mang trạng thái: jsonb R-ts, jsonb W-ts, mảng transaction đã rollback.
-- (Thứ tự dòng được chấm.)
with recursive sim (step, rts, wts, aborted, outcome) as (
  select 0, '{}'::jsonb, '{}'::jsonb, '{}'::text[], null::text
  union all
  select o.step,
         case when o.txn = any (s.aborted) or o.op = 'W'
                or o.ts < coalesce((s.wts ->> o.item)::int, 0) then s.rts
              else s.rts || jsonb_build_object(o.item, greatest(o.ts, coalesce((s.rts ->> o.item)::int, 0))) end,
         case when o.txn = any (s.aborted) or o.op = 'R'
                or o.ts < coalesce((s.rts ->> o.item)::int, 0)
                or o.ts < coalesce((s.wts ->> o.item)::int, 0) then s.wts
              else s.wts || jsonb_build_object(o.item, o.ts) end,
         case when o.txn = any (s.aborted) then s.aborted
              when (o.op = 'R' and o.ts < coalesce((s.wts ->> o.item)::int, 0))
                or (o.op = 'W' and (o.ts < coalesce((s.rts ->> o.item)::int, 0)
                                    or o.ts < coalesce((s.wts ->> o.item)::int, 0))) then s.aborted || o.txn::text
              else s.aborted end,
         case when o.txn = any (s.aborted) then 'skipped'
              when (o.op = 'R' and o.ts < coalesce((s.wts ->> o.item)::int, 0))
                or (o.op = 'W' and (o.ts < coalesce((s.rts ->> o.item)::int, 0)
                                    or o.ts < coalesce((s.wts ->> o.item)::int, 0))) then 'rollback'
              else 'execute' end
  from sim s join tx_to_ops o on o.step = s.step + 1
)
select s.step, o.txn, o.op, o.item, s.outcome
from sim s join tx_to_ops o on o.step = s.step
order by s.step;

-- @ex CH18.11  [validation]  ★★★
-- `tx_val(txn, start_ts, val_ts, finish_ts, read_set, write_set)` (mảng text). Áp dụng validation test cho từng T[j] so với mọi T[i] có val_ts nhỏ hơn: FinishTS(T[i]) < StartTS(T[j]), hoặc StartTS(T[j]) < FinishTS(T[i]) < ValidationTS(T[j]) và write_set(T[i]) không giao read_set(T[j]). Trả về `txn, passes`.
-- Gợi ý: Toán tử && kiểm tra hai mảng có phần tử chung.
select j.txn,
       not exists (select 1 from tx_val i
                   where i.val_ts < j.val_ts
                     and not (i.finish_ts < j.start_ts
                              or (j.start_ts < i.finish_ts and i.finish_ts < j.val_ts
                                  and not (i.write_set && j.read_set)))) as passes
from tx_val j;

-- @ex CH18.12  [first-committer-wins]  ★★★
-- Đề gốc: Exercise 18.15 (a). Snapshot isolation includes a validation step which, before transaction T writes a data item, checks whether a transaction concurrent with T has already written that item.
--
-- a. A simple implementation gives every transaction a start timestamp and a commit timestamp, plus an *update set* (the set of data items it updated). Explain how to validate under the first-committer-wins scheme using the transaction timestamps and the update sets. You may assume validation and the other commit-processing steps run serially, one transaction at a time.
--
-- `tx_si(txn, start_ts, commit_ts, write_set)`: các transaction xin commit theo thứ tự commit_ts. Theo first-committer-wins, T commit được nếu không transaction nào đã commit thành công có commit_ts > start_ts(T) và write set giao write set của T; ngược lại T abort (và không được tính cho các transaction sau). Trả về `txn, status` (`commit`/`abort`) sắp theo commit_ts.
-- Gợi ý: Transaction bị abort không tính — cần xử lý tuần tự (recursive CTE mang theo danh sách đã commit).
-- (Thứ tự dòng được chấm.)
with recursive s (n, txn, committed, status) as (
  select 0, null::varchar, '{}'::text[], null::text
  union all
  select s.n + 1, t.txn,
         case when exists (select 1 from tx_si k
                           where k.txn = any (s.committed) and k.commit_ts > t.start_ts
                             and k.write_set && t.write_set)
              then s.committed else s.committed || t.txn::text end,
         case when exists (select 1 from tx_si k
                           where k.txn = any (s.committed) and k.commit_ts > t.start_ts
                             and k.write_set && t.write_set)
              then 'abort' else 'commit' end
  from s join lateral (select * from tx_si order by commit_ts offset s.n limit 1) t on true
)
select txn, status from s where n > 0 order by n;

-- @ex CH18.13  [item W-timestamp]  ★★★
-- Đề gốc: Exercise 18.15 (b). Snapshot isolation includes a validation step which, before transaction T writes a data item, checks whether a transaction concurrent with T has already written that item.
--
-- b. Now, instead of update sets, every data item carries a write timestamp. Explain how validation can be done as part of commit processing for first-committer-wins with this variant. Again assume validation and other commit steps run serially.
--
-- Theo cách cài đặt ở PE 18.15b, mỗi item giữ W-timestamp = commit_ts của transaction cuối cùng đã commit một ghi lên nó. Dùng kết quả first-committer-wins trên `tx_si` (như CH18.12), trả về `item, w_timestamp` cho mọi item từng được một transaction đã commit ghi.
with recursive s (n, txn, committed) as (
  select 0, null::varchar, '{}'::text[]
  union all
  select s.n + 1, t.txn,
         case when exists (select 1 from tx_si k
                           where k.txn = any (s.committed) and k.commit_ts > t.start_ts
                             and k.write_set && t.write_set)
              then s.committed else s.committed || t.txn::text end
  from s join lateral (select * from tx_si order by commit_ts offset s.n limit 1) t on true
), final as (
  select committed from s order by n desc limit 1
)
select item, max(t.commit_ts) as w_timestamp
from tx_si t cross join final f cross join lateral unnest(t.write_set) as item
where t.txn = any (f.committed)
group by item;

-- @ex CH18.14  [phantom]  ★★☆
-- Đề gốc: Exercise 18.13. Design a timestamp-based protocol that avoids the phantom phenomenon.
--
-- `tx_pred(txn, lo, hi)`: mỗi transaction đọc instructor theo vị từ `salary between lo and hi`. `tx_ins(ins_id, txn, salary)`: các lệnh chèn instructor. Liệt kê các lệnh chèn tạo phantom cho một transaction đọc khác: `reader, inserter, ins_id, salary`.
select p.txn as reader, i.txn as inserter, i.ins_id, i.salary
from tx_pred p join tx_ins i on i.salary between p.lo and p.hi and i.txn <> p.txn;
