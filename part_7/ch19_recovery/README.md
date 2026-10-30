# Chương 19 — Phục hồi (Recovery System)

*Recovery System · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch19`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 1. Phân loại lỗi
- **Transaction failure**: lỗi logic (dữ liệu sai, vi phạm ràng buộc) hoặc lỗi hệ thống (deadlock, timestamp test) ⇒ transaction phải rollback.
- **System crash**: mất điện, lỗi phần mềm/hệ điều hành — mất nội dung **volatile storage**, đĩa còn nguyên (**fail-stop assumption**).
- **Disk failure**: hỏng một phần/toàn bộ đĩa ⇒ khôi phục từ bản sao lưu (archival dump) + log.
- Recovery algorithm gồm: (1) việc làm **trong lúc chạy bình thường** để có đủ thông tin; (2) việc làm **sau lỗi** để đưa CSDL về trạng thái đảm bảo atomicity, consistency, durability.

### 2. Storage và truyền dữ liệu
- Volatile, non-volatile, **stable storage** (nhiều bản sao; ghi khối an toàn: ghi bản 1, xong mới ghi bản 2; khi phục hồi so sánh hai bản).
- Khối vật lý trên đĩa, **buffer block** trong bộ nhớ: `input(B)`, `output(B)`. Transaction dùng `read(X)`, `write(X)` trên vùng làm việc riêng; output có thể xảy ra bất kỳ lúc nào (buffer manager quyết định).

### 3. Log-based recovery
- Log là dãy **log record** trên stable storage:
  - `<T_i start>`, `<T_i, X_j, V_1, V_2>` (ghi X<sub>j</sub>: old value V<sub>1</sub>, new value V<sub>2</sub>), `<T_i commit>`, `<T_i abort>`.
- **Immediate modification**: cập nhật có thể đến CSDL trước khi commit (cần undo). **Deferred modification**: chỉ áp sau commit (không cần undo/old value — PE 19.5).
- **Write-ahead logging (WAL)**: log record phải lên stable storage **trước** khi khối dữ liệu tương ứng được output; `<T commit>` lên stable storage thì T mới được coi là commit.
- Thứ tự ghi log và dữ liệu: log record tạo trước khi sửa CSDL.
- **undo(T<sub>i</sub>)**: khôi phục old value, đi **ngược** từ bản ghi cuối của T<sub>i</sub>; mỗi lần khôi phục ghi **redo-only (compensation) log record** `<T_i, X_j, V_1>`; xong thì ghi `<T_i abort>`.
- **redo(T<sub>i</sub>)**: đặt new value, đi **xuôi** từ bản ghi đầu tiên. Thứ tự quan trọng (PE 19.1): một item bị sửa nhiều lần thì undo xuôi sẽ cho giá trị sai.
- undo/redo phải **idempotent** (thực hiện nhiều lần vẫn đúng).
- Sau crash: transaction có `<start>` nhưng không có `<commit>` hay `<abort>` → **undo**; có `<commit>` hoặc `<abort>` → **redo** (với abort, redo cả các CLR — "repeating history").

### 4. Checkpoint
- Không có checkpoint thì phải duyệt cả log và redo nhiều transaction đã ghi xuống đĩa từ lâu.
- **Checkpoint**: (1) ghi mọi log record trong bộ nhớ ra stable storage; (2) ghi mọi buffer block đã sửa ra đĩa; (3) ghi `<checkpoint L>` với L là danh sách transaction **đang active**. Trong lúc checkpoint không cho cập nhật.
- Khi phục hồi chỉ cần xét các transaction trong L và các transaction bắt đầu sau checkpoint. Bản ghi trước checkpoint của transaction không thuộc L có thể xoá (PE 19.3). **Fuzzy checkpoint** cho phép cập nhật tiếp trong lúc ghi buffer.
- Tần suất (PE 19.2): checkpoint thường xuyên → phục hồi nhanh nhưng tốn hiệu năng lúc bình thường; không ảnh hưởng phục hồi sau **hỏng đĩa** (cần archival dump).

### 5. Recovery algorithm (Section 19.4)
- **Rollback bình thường** của T<sub>i</sub>: duyệt log ngược, mỗi `<T_i, X_j, V_1, V_2>` → ghi V<sub>1</sub> vào X<sub>j</sub>, ghi log `<T_i, X_j, V_1>`; gặp `<T_i start>` thì ghi `<T_i abort>` và dừng.
- **Phục hồi sau crash**:
  1. **Redo phase**: tìm `<checkpoint L>` cuối cùng, đặt **undo-list = L**. Duyệt **xuôi** từ checkpoint: redo mọi `<T, X, V_1, V_2>` và `<T, X, V>`; gặp `<T start>` thì thêm T vào undo-list; gặp `<T commit>` hoặc `<T abort>` thì bỏ T khỏi undo-list.
  2. **Undo phase**: duyệt **ngược** từ cuối log: gặp bản ghi update của T thuộc undo-list thì undo như rollback bình thường (ghi CLR); gặp `<T start>` với T thuộc undo-list thì ghi `<T abort>` và bỏ T khỏi undo-list; dừng khi undo-list rỗng.
- Phải ghi log cả hành động rollback; nếu không, transaction đã rollback bị undo lần nữa sau crash và có thể xoá mất cập nhật của transaction đã commit (PE 19.7).

### 6. Buffer management
- **Log buffer**: log record gom trong bộ nhớ rồi ghi ra khối; khi commit phải force log. Group commit.
- **WAL rule** khi output khối dữ liệu: mọi log record liên quan phải ra stable storage trước.
- **Force / no-force**: force = ghi mọi khối đã sửa khi commit (chậm); thường dùng **no-force** (cần redo).
- **Steal / no-steal**: steal = cho phép ghi khối chứa cập nhật chưa commit ra đĩa (cần undo); thường dùng **steal**.
- Khi output khối phải giữ **latch** để không ai sửa giữa chừng. Buffer của OS (double paging) gây khó.

### 7. Hỏng non-volatile storage
- **Archival dump** định kỳ toàn bộ CSDL lên thiết bị khác (đầu băng, cloud), kèm `<dump>` trong log. Phục hồi: nạp dump, redo log từ `<dump>`. **Fuzzy dump** cho phép cập nhật trong lúc dump.

### 8. Early lock release và logical undo
- Giải phóng khoá sớm (vd khoá B<sup>+</sup>-tree index) thì không thể undo vật lý (old value) vì dữ liệu đã bị transaction khác sửa ⇒ cần **logical undo** (vd undo của insert là delete).
- **Operation logging**: `<T_i, O_j, operation-begin>` … `<T_i, O_j, operation-end, U>` với U là thông tin logical undo. **Nested top action** / dummy CLR: thao tác không bao giờ undo (vd cấp phát vùng đĩa — PE 19.8).

### 9. ARIES
- Mỗi log record có **LSN**; mỗi trang có **PageLSN** (LSN của bản ghi cuối đã áp vào trang); mỗi record có **PrevLSN** (bản ghi trước của cùng transaction). **CLR** có **UndoNextLSN** — bản ghi tiếp theo cần undo, nhờ đó không undo lại những gì đã undo.
- **DirtyPageTable**: các trang đã sửa trong buffer mà chưa ghi ra đĩa, kèm **RecLSN** = LSN đầu tiên làm trang bẩn.
- **Checkpoint** (fuzzy): ghi DirtyPageTable và danh sách transaction active (kèm LastLSN), không ép ghi trang.
- Ba pha phục hồi:
  1. **Analysis**: từ checkpoint cuối, đọc xuôi; xây lại DirtyPageTable (trang gặp lần đầu → RecLSN = LSN đó), undo-list (transaction chưa kết thúc, LastLSN); **RedoLSN = min RecLSN**.
  2. **Redo** (repeating history): từ RedoLSN đọc xuôi; redo bản ghi update/CLR trừ khi trang không có trong DirtyPageTable, hoặc LSN < RecLSN của trang, hoặc PageLSN trên đĩa ≥ LSN.
  3. **Undo**: đi ngược theo PrevLSN của các transaction trong undo-list (với CLR thì nhảy theo UndoNextLSN), ghi CLR.
- Ưu điểm: phục hồi nhanh, hỗ trợ logical undo, fuzzy checkpoint, recovery độc lập từng trang, savepoint, lock mịn.

### 10. Remote backup
- Bản sao ở xa nhận log liên tục. Vấn đề: phát hiện lỗi, chuyển quyền (failover), thời gian phục hồi, thời gian commit (**one-safe**, **two-very-safe**, **two-safe**). Hot-spare: bản sao áp log ngay.

## 2. Trắc nghiệm (10 câu)

**Câu 1.** Sau crash, transaction có `<T start>` và `<T commit>` trong log phải được:

- A. Undo
- B. Redo
- C. Bỏ qua
- D. Abort

<details><summary>Đáp án</summary>

**B** — Đã commit thì cập nhật phải bền vững — redo.

</details>

**Câu 2.** Vì sao undo phải đi **ngược** log?

- A. Nhanh hơn
- B. Để item bị sửa nhiều lần trở về giá trị trước lần sửa đầu tiên
- C. Vì log được ghi ngược
- D. Để tránh deadlock

<details><summary>Đáp án</summary>

**B** — PE 19.1: undo xuôi để lại old value của lần sửa cuối, sai.

</details>

**Câu 3.** Write-ahead logging yêu cầu:

- A. Ghi khối dữ liệu trước log
- B. Log record ra stable storage trước khi khối dữ liệu tương ứng ra đĩa
- C. Ghi mọi khối khi commit
- D. Không ghi old value

<details><summary>Đáp án</summary>

**B** — Để luôn undo được những gì đã xuống đĩa.

</details>

**Câu 4.** Chính sách buffer **steal** đòi hỏi recovery có khả năng:

- A. Redo
- B. Undo
- C. Không cần gì
- D. Checkpoint liên tục

<details><summary>Đáp án</summary>

**B** — Khối chứa cập nhật chưa commit có thể ở trên đĩa nên phải undo được.

</details>

**Câu 5.** Chính sách **no-force** đòi hỏi:

- A. Redo
- B. Undo
- C. Shadow paging
- D. Không cần log

<details><summary>Đáp án</summary>

**A** — Khối của transaction đã commit có thể chưa ra đĩa — phải redo.

</details>

**Câu 6.** `<checkpoint {T2, T3}>` nghĩa là:

- A. T2, T3 đã commit
- B. T2, T3 đang active lúc checkpoint
- C. T2, T3 bị abort
- D. Chỉ T2, T3 cần redo

<details><summary>Đáp án</summary>

**B** — L là danh sách transaction active, khởi tạo undo-list khi phục hồi.

</details>

**Câu 7.** Trong ARIES, **RedoLSN** là:

- A. LSN của checkpoint
- B. RecLSN nhỏ nhất trong DirtyPageTable
- C. LSN lớn nhất của log
- D. PageLSN nhỏ nhất

<details><summary>Đáp án</summary>

**B** — Pha redo bắt đầu từ đó.

</details>

**Câu 8.** ARIES bỏ qua redo bản ghi LSN = 60 trên trang P nếu:

- A. P không bẩn trong buffer trước crash
- B. PageLSN trên đĩa của P ≥ 60
- C. Transaction đã commit
- D. LSN 60 là CLR

<details><summary>Đáp án</summary>

**B** — Cập nhật đã có trên đĩa (cũng bỏ nếu P không trong DirtyPageTable hoặc 60 < RecLSN).

</details>

**Câu 9.** **UndoNextLSN** của một CLR dùng để:

- A. Redo nhanh hơn
- B. Bỏ qua các bản ghi đã được undo khi undo tiếp
- C. Đánh dấu checkpoint
- D. Liên kết hai transaction

<details><summary>Đáp án</summary>

**B** — Không undo lại những gì đã undo trước crash.

</details>

**Câu 10.** Checkpoint **không** giúp phục hồi nhanh hơn trong trường hợp:

- A. System crash
- B. Mất điện
- C. Hỏng đĩa
- D. Lỗi hệ điều hành

<details><summary>Đáp án</summary>

**C** — PE 19.2: hỏng đĩa cần archival dump, vai trò tương tự checkpoint.

</details>

## 3. Câu hỏi tự luận (13 câu)

**Câu 1.** 

> **Exercise 19.1.** Explain why the log records of transactions on the undo-list must be processed in reverse order, while redo is done in the forward direction.

**PE 19.1.** Vì sao undo-list phải xử lý ngược còn redo đi xuôi?

<details><summary>Gợi ý đáp án</summary>

Giả sử một transaction trên undo-list sửa X từ 1 → 2 rồi 2 → 3: log có `<T, X, 1, 2>` rồi `<T, X, 2, 3>`.
- **Undo ngược**: áp old value 2 rồi 1 ⇒ X = **1** (đúng, giá trị trước khi T chạy). Undo xuôi: áp 1 rồi 2 ⇒ X = 2 (**sai**). Lý luận tương tự khi nhiều transaction trên undo-list cùng sửa một item.
- **Redo xuôi**: nếu T đã commit, áp new value 2 rồi 3 ⇒ X = **3** (đúng, giá trị cuối). Redo ngược: 3 rồi 2 ⇒ X = 2 (sai).
Bài CH19.06 tính cả hai kết quả trên log `LOG3`.

</details>

**Câu 2.** 

> **Exercise 19.2.** What is the purpose of the checkpoint mechanism? How often should checkpoints be taken? How does checkpoint frequency affect:
> 
> - system performance when no failure occurs?
> - the time needed to recover from a system crash?
> - the time needed to recover from a media (disk) failure?

**PE 19.2.** Mục đích checkpoint; tần suất ảnh hưởng hiệu năng, phục hồi sau crash, phục hồi sau hỏng đĩa thế nào?

<details><summary>Gợi ý đáp án</summary>

- **Mục đích**: không có checkpoint thì sau crash phải duyệt **toàn bộ** log và redo/undo mọi transaction. Với checkpoint, hầu hết bản ghi trước checkpoint được bỏ qua (dữ liệu của chúng đã ra đĩa). Ngoài ra checkpoint cho phép **xoá bớt log** khi stable storage gần đầy.
- **Hiệu năng khi không lỗi**: checkpoint tốn I/O (ghi mọi buffer bẩn) và tạm ngừng cập nhật ⇒ càng thường xuyên càng chậm.
- **Thời gian phục hồi sau crash**: càng thường xuyên thì phần log cần xử lý càng ngắn ⇒ phục hồi càng nhanh.
- **Hỏng đĩa**: checkpoint **không** giúp; phục hồi dùng **archival dump** (đóng vai trò tương tự checkpoint) + log.
- Chọn tần suất: nếu phục hồi nhanh quan trọng thì checkpoint thường xuyên; nếu không thì thưa hơn; nếu stable storage cho log ít thì buộc phải checkpoint thường xuyên.

</details>

**Câu 3.** 

> **Exercise 19.3.** Some database systems let the administrator choose between two kinds of logging: *normal logging*, used for recovery from system crashes, and *archival logging*, used for recovery from media (disk) failure. With the recovery algorithm of Section 19.4, when can a log record be deleted in each of these two cases?

**PE 19.3.** Normal logging và archival logging: khi nào xoá được log record (thuật toán Section 19.4)?

<details><summary>Gợi ý đáp án</summary>

**Normal logging** (phục hồi sau crash): không xoá được
- mọi bản ghi của transaction **active lúc checkpoint gần nhất** (có trong `<checkpoint L>`), và
- mọi bản ghi của transaction **bắt đầu sau** checkpoint gần nhất.
Mọi bản ghi khác xoá được; sau mỗi checkpoint lại có thêm bản ghi đủ điều kiện xoá. Thực tế không xoá lẻ (tạo lỗ hổng trong log) mà tìm một điểm trong log sao cho mọi bản ghi trước đó đều xoá được và xoá cả đoạn — log thường chia thành nhiều file, xoá file khi mọi bản ghi trong đó xoá được.

**Archival logging** (phục hồi sau hỏng đĩa): giữ mọi bản ghi cần để redo từ **archival dump gần nhất**: áp quy tắc như trên nhưng thay checkpoint bằng thời điểm dump. Dump thưa hơn checkpoint nhiều (phải ghi cả CSDL) nên phải giữ log lâu hơn.

</details>

**Câu 4.** 

> **Exercise 19.4.** Describe how to modify the recovery algorithm of Section 19.4 to support savepoints and rollback to a savepoint. (Savepoints are described in Section 19.9.3.)

**PE 19.4.** Sửa thuật toán Section 19.4 để có savepoint và rollback về savepoint.

<details><summary>Gợi ý đáp án</summary>

**Tạo savepoint** cho T<sub>i</sub>:
1. Ghi ra stable storage mọi log record của T<sub>i</sub> đang nằm trong bộ nhớ.
2. Ghi log record `<savepoint T_i>` (hoặc `<savepoint T_i, name>` nếu cho phép nhiều savepoint có tên).

**Rollback về savepoint**: duyệt log **ngược** từ bản ghi cuối của T<sub>i</sub>, undo từng `<T_i, X, V1, V2>` như rollback bình thường (ghi V1, ghi redo-only log record `<T_i, X, V1>`), dừng khi gặp `<savepoint T_i>` tương ứng. Transaction **không** abort mà chạy tiếp.
- Các CLR được sinh như thường lệ nên crash sau đó vẫn phục hồi đúng (redo lặp lại lịch sử, kể cả phần rollback một phần).
- Muốn rollback lại về cùng savepoint nhiều lần: sau khi rollback ghi một `<savepoint>` mới. Một khi đã undo vượt qua một savepoint thì không thể quay về savepoint đó nữa.
Bài CH19.13 làm savepoint thật trên PostgreSQL.

</details>

**Câu 5.** 

> **Exercise 19.5.** Assume the database uses the deferred-modification technique.
> 
> a. Is the old-value part of an update log record still needed? Why or why not?
> 
> b. Without old values in update log records, transaction undo is clearly impossible. How must the redo phase of recovery change as a consequence?
> 
> c. Deferred modification can be implemented by keeping updated data items in the transaction's local memory and reading items that were not updated directly from the database buffer. Suggest an efficient way to implement reading a data item so that a transaction sees its own updates.
> 
> d. What problem would this technique run into if transactions perform a large number of updates?

**PE 19.5.** Deferred modification: (a) còn cần old value? (b) redo phase sửa thế nào? (c) đọc item hiệu quả; (d) vấn đề khi nhiều cập nhật.

<details><summary>Gợi ý đáp án</summary>

a. **Không cần.** Cập nhật chỉ được áp vào CSDL sau khi commit. Transaction đã commit thì không bao giờ phải undo; transaction đang chạy lúc crash chưa sửa gì trên CSDL, giá trị cũ vẫn nằm nguyên trên đĩa.

b. Pha redo chỉ cần **redo các transaction đã commit** (áp new value theo thứ tự xuôi); **không cần duy trì undo-list** và không có pha undo, vì CSDL trên đĩa không chứa cập nhật của transaction chưa commit. (Bài CH19.09 tính giá trị sau phục hồi theo cách này.)

c. Mỗi transaction giữ một bảng băm (hash) item → giá trị đã cập nhật trong bộ nhớ cục bộ. `read(X)`: tra bảng cục bộ trước; nếu có thì trả về (transaction thấy cập nhật của chính mình); nếu không thì đọc từ database buffer (có thể chép vào vùng cục bộ).

d. Transaction cập nhật **rất nhiều** item có thể **hết bộ nhớ** để giữ các bản cục bộ (không thể steal ra đĩa vì chưa commit), và lúc commit phải áp một lượng lớn cập nhật.

</details>

**Câu 6.** 

> **Exercise 19.6.** The shadow-paging scheme requires copying the page table. Suppose the page table is stored as a B<sup>+</sup>-tree.
> 
> a. Suggest how the new copy and the shadow copy of the B<sup>+</sup>-tree can share as many nodes as possible, assuming updates touch only leaf entries and there are no insertions or deletions.
> 
> b. Even with this optimization, logging is much cheaper than shadow copying for transactions that make small updates. Explain why.

**PE 19.6.** Shadow paging với page table là B<sup>+</sup>-tree: (a) chia sẻ nút; (b) vì sao logging vẫn rẻ hơn cho cập nhật nhỏ.

<details><summary>Gợi ý đáp án</summary>

a. Ban đầu bản mới chỉ là **bản sao của nút gốc** trỏ tới các nút của shadow copy. Khi một entry ở lá bị sửa, **chép lá đó và mọi nút trên đường từ lá lên gốc** (copy-on-write) và sửa con trỏ trong các bản sao; mọi nút khác **dùng chung** giữa bản mới và shadow. Commit = đổi con trỏ gốc nguyên tử.

b. Với cập nhật nhỏ, shadow paging vẫn phải chép và ghi **nhiều trang**: trang dữ liệu mới, lá page table và mọi nút trên đường lên gốc — mỗi trang ở vị trí đĩa khác nhau (I/O ngẫu nhiên), và dữ liệu bị phân mảnh. Logging chỉ sinh **vài log record nhỏ**, nằm chung trong một/vài trang log; commit chỉ cần ghi vài trang log, và log của các commit liên tiếp nằm **liền nhau** trên đĩa (ghi tuần tự, ít di chuyển đầu đọc).

</details>

**Câu 7.** 

> **Exercise 19.7.** Suppose we (wrongly) change the recovery algorithm of Section 19.4 so that actions taken during transaction rollback are not logged. Then, when recovering from a system crash, transactions that were rolled back earlier would be put on the undo-list and rolled back a second time. Give an example showing how actions taken in the undo phase of recovery could leave the database in an incorrect state. (Hint: consider a data item updated by an aborted transaction and afterwards updated by a transaction that commits.)

**PE 19.7.** Nếu không ghi log các hành động rollback thì undo khi phục hồi có thể làm CSDL sai như thế nào?

<details><summary>Gợi ý đáp án</summary>

Log sinh ra bởi thuật toán (sai):
1. `<T1 start>`
2. `<T1, A, 1000, 900>`
3. `<T2 start>`
4. `<T2, A, 1000, 2000>`
5. `<T2 commit>`

Giữa bước 2 và 3, T1 đã rollback (A trở về 1000) nhưng không có log record nào phản ánh điều đó. Khi phục hồi: redo đặt A = 900 rồi 2000; T1 không có commit/abort nên vào **undo-list**; pha undo áp old value của bản ghi 2 ⇒ **A = 1000**. Cập nhật của T2 **đã commit** bị mất — vi phạm durability.

Log đúng:
1. `<T1 start>` 2. `<T1, A, 1000, 900>` 3. `<T1, A, 1000>` 4. `<T1 abort>` 5. `<T2 start>` 6. `<T2, A, 1000, 2000>` 7. `<T2 commit>`
T1 có `<abort>` nên không vào undo-list; redo cho A = 2000. Bài CH19.07 chạy cả hai log (`LOG4`, `LOG5`).

</details>

**Câu 8.** 

> **Exercise 19.8.** Disk space allocated to a file by a transaction should not be released even if that transaction rolls back. Explain why, and explain how ARIES makes sure such actions are not rolled back.

**PE 19.8.** Vì sao vùng đĩa cấp cho file không được giải phóng khi transaction rollback? ARIES làm thế nào?

<details><summary>Gợi ý đáp án</summary>

Khi T cấp một trang mới cho relation, các transaction khác có thể **đã lưu record vào chính trang đó** (sau khi khoá/latch cấp phát được nhả sớm). Nếu rollback T giải phóng trang, record của transaction khác bị mất/hỏng. Vì vậy việc cấp phát không được undo — T chỉ undo việc **chèn record của chính nó**.

ARIES dùng **nested top action**: thao tác "không bao giờ undo", coi như có undo action rỗng. Sau khi thao tác hoàn tất, ghi một **dummy CLR** có **UndoNextLSN** trỏ tới bản ghi **trước** thao tác đó. Khi rollback T, undo đi theo UndoNextLSN nên **nhảy qua** các log record của thao tác cấp phát.

</details>

**Câu 9.** 

> **Exercise 19.9.** A transaction deletes a record, and the space freed by the deletion is given to a record inserted by another transaction, before the first transaction commits.
> 
> a. What problem can occur if the first transaction must be rolled back?
> 
> b. Would this be a problem if page-level locking were used instead of tuple-level locking?
> 
> c. Suggest a solution that keeps tuple-level locking, by recording post-commit actions in special log records and executing them after commit. Your scheme must guarantee that these actions are performed exactly once.

**PE 19.9.** Vùng trống do T1 xoá record được cấp cho record T2 chèn trước khi T1 commit: (a) vấn đề khi T1 rollback; (b) có còn nếu khoá mức trang; (c) giải pháp post-commit action.

<details><summary>Gợi ý đáp án</summary>

a. Rollback T1 phải khôi phục tuple đã xoá. Nếu undo **vật lý** (chép lại old value vào vị trí cũ) thì sẽ **ghi đè** tuple mới của T2 và cấu trúc khối (slot directory) ⇒ hỏng dữ liệu. Phải undo **logic** (chèn lại tuple, có thể ở chỗ khác), làm recovery phức tạp hơn. Nếu T2 chèn tuple cùng **khoá chính** thì khi T1 rollback sẽ vi phạm ràng buộc khoá.

b. Với **khoá mức trang**, T2 không thể ghi vào trang mà T1 (chưa commit) đang khoá X, nên vùng trống không bị cấp cho T2 trước khi T1 commit ⇒ không có vấn đề (nhưng concurrency giảm).

c. **Hoãn việc giải phóng vùng trống tới sau commit**. Khi xoá, chỉ đánh dấu tuple đã xoá; record `<T commit>` ghi kèm danh sách **post-commit action** (giải phóng vùng nào). Sau commit, thực hiện các action đó như một transaction có log, rồi ghi `<T post-commit>` báo đã xong. Khi phục hồi: gặp commit có post-commit action mà **không** có record post-commit ⇒ rollback phần đã làm dở và **thực hiện lại** các action ở cuối phục hồi; có record post-commit ⇒ không làm lại. Vậy mỗi action được làm **đúng một lần**. Xung đột khoá chính: giữ **khoá mức key** tới khi T1 kết thúc để không ai dùng key đó.

</details>

**Câu 10.** 

> **Exercise 19.10.** Explain why recovering interactive transactions is harder than recovering batch transactions. Is there a simple way to handle the difficulty? (Hint: think of an ATM transaction that dispenses cash.)

**PE 19.10.** Vì sao phục hồi transaction tương tác khó hơn transaction batch? Cách đơn giản xử lý?

<details><summary>Gợi ý đáp án</summary>

Transaction tương tác có **output ra thế giới bên ngoài không thể thu hồi**: in vé, phát tiền ATM, gửi email, điều khiển máy móc. Nếu transaction abort hoặc hệ thống crash sau khi output đã xảy ra, rollback CSDL không lấy lại được tiền đã phát. Transaction batch thường không có output như vậy giữa chừng, nên chỉ cần rollback/chạy lại.

Cách xử lý: **dồn mọi output ra cuối, sau khi commit** (observable external writes chỉ làm sau commit). Nên làm output **nguyên tử** — ATM đếm đủ tiền rồi đưa ra một lần, không đưa từng tờ. Nếu không làm nguyên tử được, ghi **log vật lý của output** (log sự kiện, thậm chí video) để sau này phục hồi thủ công, vd ghi có lại tiền vào tài khoản khách.

</details>

**Câu 11.** 

> **Exercise 19.11.** Sometimes a transaction must be undone after it has committed, because it was executed by mistake — for example, a bank teller typed wrong input.
> 
> a. Give an example showing that undoing such a transaction with the normal undo mechanism could leave the database inconsistent.
> 
> b. One way out is to bring the whole database back to its state just before the erroneous transaction committed (*point-in-time recovery*); with this scheme, transactions that committed later are rolled back as well. Suggest a change to the recovery algorithm of Section 19.4 that implements point-in-time recovery using database dumps.
> 
> c. Later, correct transactions can be re-executed logically if their updates are available as SQL, but they cannot be re-executed using their log records. Why?

**PE 19.11.** Undo transaction đã commit do nhập sai: (a) vì sao undo thông thường gây sai; (b) point-in-time recovery bằng dump; (c) vì sao không chạy lại bằng log record được.

<details><summary>Gợi ý đáp án</summary>

a. Tài khoản A = 100. T1 gửi 10, T2 gửi 10, chạy lần lượt: log `<T1, A, 100, 110>`, `<T2, A, 110, 120>`, A = 120. Muốn huỷ **chỉ T1** bằng undo thông thường (ghi old value) ⇒ A = **100**: thực chất huỷ cả T2. Đúng ra A phải là 110 (undo logic: trừ đi 10). Bài CH19.10 tính hai con số này.

b. Gọi transaction sai là T<sub>e</sub>:
- Tìm **archival dump D gần nhất trước** `<T_e start>`; nạp lại CSDL từ D.
- **Redo** mọi log record từ D tới `<T_e commit>` (không gồm). Gọi S1 là tập transaction (khác T<sub>e</sub>) còn active tại thời điểm đó.
- **Rollback T<sub>e</sub> và S1** (undo như transaction chưa commit). CSDL ở trạng thái ngay trước khi T<sub>e</sub> commit.
- Nếu có thông tin redo logic: duyệt tiếp log sau `<T_e commit>`, gọi S2 là các transaction bắt đầu sau đó; **chạy lại logic** các transaction trong S1 và S2.

c. Log record là **vật lý**: chứa giá trị tuyệt đối tính trên trạng thái cũ. Sau khi đã bỏ T1, áp `<T2, A, 110, 120>` sẽ đặt A = 120 — tức lại cộng cả phần của T1. Chỉ chạy lại **câu SQL** (A := A + 10) trên trạng thái mới mới cho đúng 110.

</details>

**Câu 12.** 

> **Exercise 19.12.** The recovery techniques studied assume blocks are written to disk atomically. In reality a power failure can leave a block partially written: some sectors written, others not yet.
> 
> a. What problems can partial block writes cause?
> 
> b. Partial block writes can be detected with techniques similar to those used to validate sector reads. Explain how.
> 
> c. Explain how RAID 1 can be used to recover from a partially written block, restoring it to either its old value or its new value.

**PE 19.12.** Ghi khối không nguyên tử (partial block write): (a) vấn đề; (b) phát hiện; (c) dùng RAID 1 để phục hồi.

<details><summary>Gợi ý đáp án</summary>

a. Khối có thể chứa một phần dữ liệu mới, một phần cũ ⇒ **không nhất quán**: cấu trúc trang (header, slot directory) mâu thuẫn, record bị cắt đôi. Thuật toán phục hồi giả định khối hoặc cũ hoàn toàn hoặc mới hoàn toàn: redo/undo dựa trên PageLSN sai (PageLSN ở header có thể đã mới trong khi phần dữ liệu còn cũ ⇒ bỏ qua redo cần thiết). Nếu khối là log block thì log bị hỏng.

b. Ghi kèm **checksum** của cả khối (hoặc số phiên bản/LSN ở **cả đầu và cuối** khối, hoặc ở mỗi sector). Khi đọc, tính lại checksum hoặc so các bản sao số phiên bản; không khớp ⇒ khối đã bị ghi dở — giống cách đĩa dùng checksum để phát hiện sector đọc lỗi.

c. RAID 1 (mirroring) có hai bản. Ghi **tuần tự**: ghi xong bản 1 (và kiểm tra) rồi mới ghi bản 2. Khi phục hồi, với mỗi khối (hoặc chỉ các khối đang ghi dở, nếu ghi lại danh sách vào NVRAM): nếu một bản lỗi checksum thì chép bản còn tốt sang ⇒ khối nhận **giá trị cũ** (nếu bản 1 hỏng thì bản 2 còn cũ) hoặc **giá trị mới** (nếu bản 2 hỏng thì bản 1 đã mới). Nếu cả hai đều tốt nhưng khác nhau thì chép bản 1 sang bản 2 (hoặc ngược lại) để thống nhất. Đây chính là cách cài đặt stable storage.

</details>

**Câu 13.** 

> **Exercise 19.13.** Oracle uses undo log records to give transactions a snapshot view of the database under snapshot isolation. The snapshot seen by T<sub>i</sub> contains the updates of all transactions that had committed when T<sub>i</sub> started, plus T<sub>i</sub>'s own updates; updates of all other transactions are invisible to T<sub>i</sub>.
> 
> Describe a buffer-handling scheme that gives transactions a snapshot view of the pages in the buffer, including how the log is used to build the snapshot view. You may assume that each operation, and its undo action, affects only one page.

**PE 19.13.** Dùng undo log để tạo snapshot view của trang trong buffer (như Oracle).

<details><summary>Gợi ý đáp án</summary>

- Mỗi trang trong buffer có thể chứa cập nhật của các transaction **chưa commit** hoặc **commit sau** khi T<sub>i</sub> bắt đầu. Nếu trang không có cập nhật nào như vậy (mọi cập nhật trên trang thuộc transaction đã commit trước StartTS(T<sub>i</sub>), hoặc của chính T<sub>i</sub>) thì trả về **chính trang trong buffer**.
- Ngược lại, **chép trang** ra một bản tạm. Dùng các **undo log record** của trang (liên kết theo trang, mới nhất trước): đi ngược từ bản ghi mới nhất, áp **undo action** của mỗi thao tác thuộc transaction mà T<sub>i</sub> không được thấy (chưa commit, hoặc commit sau StartTS(T<sub>i</sub>)), dừng khi tới thao tác cũ hơn thời điểm T<sub>i</sub> bắt đầu. Các thao tác của chính T<sub>i</sub> giữ nguyên.
- Trả bản chép này làm **snapshot page** cho T<sub>i</sub>; có thể cache bản đó (kèm timestamp) để transaction khác cùng snapshot dùng lại. Giả định mỗi thao tác và undo của nó chỉ chạm một trang nên chỉ cần log của trang đó.

</details>

## 4. Bài tập SQL (14 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH19.01 | transaction status | ★☆☆ | `tx_log(log_id, lsn, txn, kind, item, old_val, new_val, active)` lưu các log (hệ thống crash ngay sau bản ghi cuối). Với `LOG1`, trả về `txn, status`: `committed`, `aborted` hoặc `incomplete`. |
| CH19.02 | values after recovery | ★★★ | Tính giá trị của mỗi item sau khi phục hồi `LOG1` bằng thuật toán Section 19.4: redo mọi bản ghi update/clr theo thứ tự, rồi undo (ngược) mọi update của transaction incomplete. Trả về `item, value`. Gợi ý quy tắc: nếu item có update của transaction incomplete thì giá trị cuối là old_val của update sớm nhất trong số đó; ngược lại là giá trị (new_val) của bản ghi update/clr cuối cùng. |
| CH19.03 | undo-list from checkpoint | ★★☆ | `LOG2` có bản ghi `checkpoint` (cột `active` = danh sách L). Theo pha redo của Section 19.4: undo-list khởi tạo bằng L của checkpoint cuối cùng, thêm transaction có `start` sau checkpoint, bỏ transaction có `commit`/`abort` sau checkpoint. Trả về undo-list (`txn`). |
| CH19.04 | redo phase | ★★☆ | Liệt kê các bản ghi được redo khi phục hồi `LOG2` (mọi `update` và `clr` sau checkpoint cuối cùng): `lsn, txn, kind, item`. |
| CH19.05 | undo phase log | ★★★ | Pha undo khi phục hồi `LOG2` duyệt log ngược và ghi thêm log: với mỗi update của transaction trong undo-list ghi CLR ``; khi gặp `start` của transaction đó ghi ``. Trả về các bản ghi được ghi thêm theo đúng thứ tự: `seq, txn, kind` (`clr`/`abort`), `item, value` (null với abort). |
| CH19.06 | undo order | ★★☆ | Exercise 19.1. Explain why the log records of transactions on the undo-list must be processed in reverse order, while redo is done in the forward direction.<br>`LOG3`: transaction incomplete T7 sửa X và Y nhiều lần. Với mỗi item trả về `item, correct_value` (undo ngược) và `wrong_value` (nếu undo xuôi, tức áp old_val theo thứ tự LSN tăng dần). |
| CH19.07 | logging rollback | ★★★ | Exercise 19.7. Suppose we (wrongly) change the recovery algorithm of Section 19.4 so that actions taken during transaction rollback are not logged. Then, when recovering from a system crash, transactions that were rolled back earlier would be put on the undo-list and rolled back a second time. Give an example showing how actions taken in the undo phase of recovery could leave the database in an incorrect state. (Hint: consider a data item updated by an aborted transaction and afterwards updated by a transaction that commits.)<br>`LOG4` là log của thuật toán sửa sai ở PE 19.7 (rollback của T1 không ghi log); `LOG5` là log đúng (có CLR và abort). Áp cùng quy tắc phục hồi như CH19.02 cho cả hai log và trả về `log_id, item, value`. |
| CH19.08 | log truncation | ★★☆ | Exercise 19.3. Some database systems let the administrator choose between two kinds of logging: *normal logging*, used for recovery from system crashes, and *archival logging*, used for recovery from media (disk) failure. With the recovery algorithm of Section 19.4, when can a log record be deleted in each of these two cases?<br>Theo PE 19.3, với `LOG2`, bản ghi của transaction không active lúc checkpoint cuối và đã kết thúc trước checkpoint thì xoá được. Trả về các `lsn` của `LOG2` có thể xoá (mọi bản ghi của những transaction đó). |
| CH19.09 | deferred modification | ★★☆ | Exercise 19.5 (b). Assume the database uses the deferred-modification technique.  b. Without old values in update log records, transaction undo is clearly impossible. How must the redo phase of recovery change as a consequence?<br>Giả sử `LOG1` được sinh với deferred modification: CSDL trên đĩa (`tx_disk(item, val)`) chỉ chứa giá trị ban đầu, chỉ cập nhật của transaction đã commit được áp khi phục hồi. Trả về giá trị sau phục hồi của mọi item trong `tx_disk`: `item, value`. |
| CH19.10 | undo committed txn | ★★☆ | Exercise 19.11 (a). Sometimes a transaction must be undone after it has committed, because it was executed by mistake — for example, a bank teller typed wrong input.  a. Give an example showing that undoing such a transaction with the normal undo mechanism could leave the database inconsistent.<br>`tx_bank_log(lsn, txn, item, old_val, new_val)`: T1 rồi T2 cùng gửi 10 vào A (đều đã commit). Muốn huỷ chỉ T1. Trả về một dòng `normal_undo` (A sau khi undo T1 bằng old value như bình thường) và `logical_undo` (A hiện tại trừ đi khoản T1 đã cộng). |
| CH19.11 | ARIES analysis | ★★★ | ARIES: `tx_aries_log(lsn, prev_lsn, txn, kind, page_id, undo_next_lsn)`, checkpoint ở LSN 50 ghi DirtyPageTable `tx_aries_chk_dpt(page_id, rec_lsn)`. Pha analysis đọc xuôi từ checkpoint: trang nào được update/clr mà chưa có trong DirtyPageTable thì thêm với RecLSN = LSN đó. Trả về DirtyPageTable sau analysis: `page_id, rec_lsn`. |
| CH19.12 | ARIES redo | ★★★ | Tiếp CH19.11. RedoLSN = RecLSN nhỏ nhất. Pha redo đọc xuôi từ RedoLSN và redo bản ghi update/clr trừ khi: trang không có trong DirtyPageTable, hoặc LSN < RecLSN của trang, hoặc PageLSN trên đĩa (`tx_aries_page`) ≥ LSN. Trả về các bản ghi được redo: `lsn, txn, page_id`. |
| CH19.13 | ARIES undo | ★★★ | Pha undo của ARIES: transaction chưa kết thúc (không có `commit`/`end`) là loser. Bắt đầu từ bản ghi cuối của mỗi loser, đi lùi theo `prev_lsn` (với CLR thì nhảy theo `undo_next_lsn`). Trả về các bản ghi update bị undo, theo thứ tự undo (LSN giảm dần): `lsn, txn, page_id`. |
| CH19.14 | savepoint | ★★☆ | Exercise 19.4. Describe how to modify the recovery algorithm of Section 19.4 to support savepoints and rollback to a savepoint. (Savepoints are described in Section 19.9.3.)<br>Savepoint thật trên PostgreSQL: trong một transaction, cộng 100 vào `A-101`; `savepoint s1`; trừ 300 khỏi `A-102`; `savepoint s2`; xoá tài khoản `A-301`; rollback về s1; cộng 1 vào `A-201`; commit. |
