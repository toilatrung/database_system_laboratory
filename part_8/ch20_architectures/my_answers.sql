-- =====================================================================
-- CS4420 · Chương 20 — Kiến trúc hệ CSDL (Database-System Architectures)
-- Dialect: PostgreSQL. Database: xem lab/db/*.sql
-- =====================================================================

-- Viết câu trả lời ngay dưới mỗi đề (giữ nguyên dòng "-- @ex ...").
-- Chấm tự động (trong thư mục lab/):   npm run grade -- ch20
-- Bài tự chấm chạy trong một transaction rồi rollback, nên dữ liệu gốc không đổi.
-- Bài có "check" (DDL, insert, update...) được chấm bằng một câu truy vấn kiểm tra sau khi chạy.

-- @ex CH20.01  [speedup]  ★☆☆
-- Bảng `pd_run(workload, nodes, data_gb, seconds)`. Với workload `Q1` (dữ liệu cố định 100 GB), tính cho mỗi số node: `nodes`, `speedup` = thời gian với 1 node chia thời gian với `nodes` node, và `efficiency` = speedup / nodes. Làm tròn speedup và efficiency 2 chữ số. Sắp theo nodes.
-- Gợi ý: Lấy thời gian 1 node bằng subquery; round(x, 2).
-- (Thứ tự dòng được chấm.)




-- @ex CH20.02  [linear / sublinear / superlinear]  ★★☆
-- Với các workload `Q1` và `Q3` (cùng dữ liệu, tăng node), phân loại mỗi lần chạy có `nodes > 1`: `superlinear` nếu speedup > nodes, `linear` nếu speedup = nodes, ngược lại `sublinear` (speedup tính như CH20.01, không làm tròn). Trả về workload, nodes, `kind`, sắp theo workload, nodes.
-- (Thứ tự dòng được chấm.)




-- @ex CH20.03  [scaleup]  ★☆☆
-- Workload `Q2` tăng dữ liệu tỉ lệ với số node (10 GB mỗi node). Tính `scaleup` = thời gian của lần chạy 1 node chia thời gian của lần chạy `nodes` node, làm tròn 3 chữ số. Trả về nodes, data_gb, scaleup, sắp theo nodes. Scaleup tuyến tính thì giá trị là bao nhiêu?
-- (Thứ tự dòng được chấm.)




-- @ex CH20.04  [Amdahl]  ★☆☆
-- Đề gốc: Exercise 20.5. A transaction is written in C with embedded SQL; about 80 percent of its running time is spent in SQL code and the other 20 percent in C code. If parallelism is applied only to the SQL code, how much speedup can one hope for? Explain.
--
-- Bảng `pd_amdahl(task, p, n)`: p là phần song song hoá được, n là số bộ xử lý. Tính speedup theo Amdahl `1 / ((1 − p) + p / n)` cho mỗi task, làm tròn 3 chữ số (cột `speedup`). Task `PE20.5` là PE 20.5 với n rất lớn.




-- @ex CH20.05  [Amdahl: giới hạn]  ★★☆
-- Với mỗi task trong `pd_amdahl`, trả về `max_speedup` = giới hạn của speedup khi n → ∞ (làm tròn 2 chữ số) và `pct_of_max` = speedup thật với n của task chia max_speedup, nhân 100, làm tròn 1 chữ số.




-- @ex CH20.06  [skew]  ★★☆
-- Bảng `pd_job_task(job, node, seconds)`. Một job song song chỉ xong khi node chậm nhất xong. Với mỗi job, trả về `job_time` (thời gian job), `avg_time` (thời gian trung bình các node, làm tròn 2) và `skew` = job_time / avg_time (làm tròn 2). Sắp theo job.
-- (Thứ tự dòng được chấm.)




-- @ex CH20.07  [kiến trúc song song]  ★☆☆
-- Bảng `pd_system(name, shared_memory, shared_disk)`. Phân loại mỗi hệ: `shared memory` nếu dùng chung bộ nhớ, `shared disk` nếu chỉ dùng chung đĩa, `shared nothing` nếu không dùng chung gì. Trả về name, `architecture`.




-- @ex CH20.08  [NUMA]  ★★☆
-- Đề gốc: Exercise 20.7. On a shared-memory architecture, why can the time needed to access a memory location depend on which location is accessed?
--
-- Bảng `pd_proc(proc, home_node)` và `pd_mem_access(proc, mem_node, ns)` (độ trễ đo được). Với mỗi bộ xử lý, trả về `local_ns` (độ trễ tới bộ nhớ node của chính nó), `remote_ns` (trung bình độ trễ tới các node khác) và `ratio` = remote_ns / local_ns làm tròn 2. Sắp theo proc.
-- (Thứ tự dòng được chấm.)




-- @ex CH20.09  [superlinear speedup]  ★★☆
-- Đề gốc: Exercise 20.9. Some database operations, such as joins, run much faster when the data (for example, one of the relations being joined) fits in memory than when it does not. Show how this explains *superlinear speedup*, in which an application obtains a speedup larger than the increase in resources given to it.
--
-- Workload `Q3` là một join 64 GB; mỗi node có 16 GB RAM. Với mỗi lần chạy của Q3, trả về nodes, `gb_per_node` (data_gb / nodes, kiểu numeric, làm tròn 1), `fits_in_memory` (boolean: gb_per_node ≤ 16) và `speedup` (làm tròn 2). Sắp theo nodes. Speedup vượt số node bắt đầu từ lúc nào?
-- (Thứ tự dòng được chấm.)


