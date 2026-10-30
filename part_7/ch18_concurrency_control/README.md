# Chương 18 — Điều khiển đồng thời (Concurrency Control)

*Concurrency Control · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch18`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 1. Lock-based protocols
- Hai chế độ khoá: **S (shared)** — đọc; **X (exclusive)** — đọc và ghi. Ma trận tương thích: chỉ **S–S** tương thích.
- Transaction xin khoá qua **lock manager**; nếu khoá không tương thích với khoá đang được transaction khác giữ thì phải **chờ**.
- Chỉ khoá thôi chưa đủ: nhả khoá quá sớm vẫn cho schedule không serializable.
- **Lock manager** dùng **lock table** (hash theo tên item) với hàng đợi các yêu cầu: yêu cầu mới được cấp nếu tương thích với mọi khoá đã cấp *và* (để tránh starvation) mọi yêu cầu đang chờ trước nó.

### 2. Two-phase locking (2PL)
- **Growing phase**: chỉ xin khoá, không nhả. **Shrinking phase**: chỉ nhả, không xin thêm.
- **Lock point**: thời điểm transaction nhận khoá cuối cùng. 2PL đảm bảo **conflict serializability**, thứ tự serial = thứ tự lock point (PE 18.1: nếu T<sub>i</sub> → T<sub>j</sub> thì lock point của T<sub>i</sub> < của T<sub>j</sub>, chu trình sẽ cho mâu thuẫn).
- 2PL **không** tránh deadlock và **không** tránh cascading rollback.
- **Strict 2PL**: giữ mọi **X-lock** tới khi commit/abort ⇒ cascadeless (recoverable).
- **Rigorous 2PL**: giữ **mọi** khoá tới khi commit ⇒ thứ tự commit = thứ tự serializable (PE 18.3).
- **Lock conversion**: upgrade S → X (chỉ trong growing phase), downgrade X → S (chỉ trong shrinking phase).
- Tự động sinh lệnh khoá: read(Q) → xin lock-S(Q) nếu chưa có khoá; write(Q) → xin/upgrade lock-X(Q); nhả mọi khoá khi commit/abort.

### 3. Graph-based protocols — tree protocol
- Áp thứ tự bộ phận lên data item (cây). Chỉ dùng X-lock.
- Khoá đầu tiên có thể ở bất kỳ đâu; sau đó chỉ được khoá Q nếu đang giữ khoá **cha** của Q. Nhả khoá bất kỳ lúc nào; đã nhả item nào thì không khoá lại.
- Đảm bảo conflict serializability **và không deadlock**; nhả khoá sớm hơn 2PL. Nhược điểm: phải khoá cả các nút không cần (đường đi), không đảm bảo recoverable nếu không thêm điều kiện. Có schedule được tree protocol cho phép mà 2PL không, và ngược lại (PE 18.5).

### 4. Deadlock
- **Prevention**: khoá trước mọi item (hoặc theo thứ tự cố định); hoặc dùng timestamp:
  - **Wait-die** (non-preemptive): T<sub>i</sub> xin khoá do T<sub>j</sub> giữ: nếu T<sub>i</sub> **già hơn** (TS nhỏ hơn) thì **chờ**, ngược lại T<sub>i</sub> **chết** (rollback).
  - **Wound-wait** (preemptive): nếu T<sub>i</sub> già hơn thì **wound** T<sub>j</sub> (T<sub>j</sub> rollback), ngược lại T<sub>i</sub> chờ.
  - Transaction rollback giữ **timestamp cũ** khi restart ⇒ không starvation.
  - **Timeout**: chờ quá lâu thì rollback.
- **Detection**: **wait-for graph** (T<sub>i</sub> → T<sub>j</sub> nếu T<sub>i</sub> chờ khoá T<sub>j</sub> giữ). Deadlock ⇔ có chu trình. Định kỳ chạy thuật toán tìm chu trình.
- **Recovery**: chọn **victim** (chi phí rollback nhỏ nhất: đã chạy ít, giữ ít khoá, …), rollback toàn bộ hoặc một phần; tránh starvation bằng cách đếm số lần bị chọn.

### 5. Multiple granularity
- Cây độ mịn: database → area → file (relation) → record. Khoá một nút ngầm định khoá mọi con.
- Thêm **intention locks**: **IS**, **IX**, **SIX**. Ma trận tương thích:

| | IS | IX | S | SIX | X |
|---|---|---|---|---|---|
| IS | ✓ | ✓ | ✓ | ✓ | ✗ |
| IX | ✓ | ✓ | ✗ | ✗ | ✗ |
| S | ✓ | ✗ | ✓ | ✗ | ✗ |
| SIX | ✓ | ✗ | ✗ | ✗ | ✗ |
| X | ✗ | ✗ | ✗ | ✗ | ✗ |

- Khoá từ gốc xuống (cha phải có IS/IX tương ứng), nhả từ lá lên. **Lock escalation** khi quá nhiều khoá mịn. Ít khoá hơn khi truy cập nhiều item, nhiều khoá hơn khi truy cập một item (PE 18.9).
- Ngoài S, X còn có thể có chế độ khác, vd **increment (I)** tương thích với chính nó (PE 18.7).

### 6. Timestamp-ordering protocol
- Mỗi transaction có **TS(T<sub>i</sub>)** (đồng hồ hoặc bộ đếm). Mỗi item Q có **W-timestamp(Q)** và **R-timestamp(Q)** — TS lớn nhất của transaction đã ghi/đọc Q thành công.
- **read(Q)** của T<sub>i</sub>: nếu TS(T<sub>i</sub>) < W-timestamp(Q) → **rollback** T<sub>i</sub>; ngược lại thực hiện, R-timestamp(Q) := max(R-timestamp(Q), TS(T<sub>i</sub>)).
- **write(Q)** của T<sub>i</sub>: nếu TS(T<sub>i</sub>) < R-timestamp(Q) → rollback; nếu TS(T<sub>i</sub>) < W-timestamp(Q) → rollback; ngược lại thực hiện, W-timestamp(Q) := TS(T<sub>i</sub>).
- Đảm bảo conflict serializable (thứ tự TS), **không deadlock**, nhưng có thể **starvation**/livelock (PE 18.12) và schedule có thể không recoverable/cascadeless (cần thêm: ghi tất cả ở cuối, hoặc chờ commit, hoặc theo dõi dependency).
- **Thomas' write rule**: trường hợp write với TS(T<sub>i</sub>) < W-timestamp(Q) (nhưng ≥ R-timestamp) thì **bỏ qua** lệnh write (obsolete) thay vì rollback ⇒ cho một số schedule view serializable nhưng không conflict serializable.

### 7. Validation-based protocol (optimistic)
- Ba pha: **read** (ghi vào biến cục bộ), **validation**, **write** (áp vào CSDL). Mốc: StartTS, ValidationTS (dùng làm TS), FinishTS.
- T<sub>j</sub> qua validation nếu với mọi T<sub>i</sub> có TS(T<sub>i</sub>) < TS(T<sub>j</sub>): **FinishTS(T<sub>i</sub>) < StartTS(T<sub>j</sub>)**, hoặc **StartTS(T<sub>j</sub>) < FinishTS(T<sub>i</sub>) < ValidationTS(T<sub>j</sub>)** và write set của T<sub>i</sub> không giao read set của T<sub>j</sub>.
- Tốt khi xung đột hiếm; tốn công vô ích khi tranh chấp cao.

### 8. Multiversion schemes
- **Multiversion timestamp ordering**: mỗi Q có các phiên bản Q<sub>k</sub> (content, W-ts, R-ts). read(Q) của T<sub>i</sub> đọc phiên bản có **W-ts lớn nhất ≤ TS(T<sub>i</sub>)** — **đọc không bao giờ chờ/thất bại**. write(Q): nếu TS(T<sub>i</sub>) < R-ts của phiên bản đó → rollback; nếu bằng W-ts → ghi đè; ngược lại tạo phiên bản mới.
- **Multiversion 2PL**: transaction cập nhật dùng rigorous 2PL; read-only transaction đọc theo timestamp (ts-counter khi commit), không bao giờ chờ.
- Thu gom phiên bản cũ khi không transaction nào cần.

### 9. Snapshot isolation (SI)
- Mỗi transaction đọc **snapshot** các dữ liệu đã commit tại lúc bắt đầu; ghi vào bản riêng; khi commit kiểm tra xung đột ghi–ghi với transaction đồng thời:
  - **First-committer-wins**: T commit được nếu không transaction **đồng thời** nào (commit sau StartTS(T)) đã commit một ghi trên item T cũng ghi (PE 18.15).
  - **First-updater-wins**: kiểm tra ngay khi xin X-lock để ghi.
- Ưu: đọc không bao giờ chờ, đọc không chặn ghi. Nhược: **không serializable** — **write skew** (hai transaction đọc chung, ghi hai item khác nhau, vi phạm ràng buộc). Oracle "serializable" thực chất là SI; PostgreSQL ≥ 9.1 có **Serializable Snapshot Isolation** phát hiện thêm phụ thuộc rw. `select … for update` để đọc có khoá.

### 10. Insert, delete, predicate reads — phantom
- delete(Q) cần X-lock; insert(Q) cấp X-lock cho tuple mới.
- **Phantom**: T1 đọc theo vị từ (vd `salary between 60000 and 80000`), T2 chèn tuple thoả vị từ — không có tuple chung nhưng vẫn xung đột. Giải pháp: khoá cả **relation/dữ liệu về tập tuple**, **index locking** (khoá các leaf node của index chứa khoảng key), **next-key locking**, hoặc **predicate locking** (đắt). Phiên bản timestamp: coi index bucket là data item có timestamp (PE 18.13).

### 11. Weak levels of consistency trong thực tế
- **Degree-two consistency**: S-lock nhả bất kỳ lúc nào, X-lock theo 2PL. **Cursor stability**: giữ khoá trên tuple cursor đang trỏ tới.
- Read committed, repeatable read như Chương 17.

### 12. Concurrency trong index — B<sup>+</sup>-tree
- Không cần serializable trên cấu trúc index, chỉ cần đúng. **Crabbing protocol**: khoá nút con rồi mới nhả nút cha; khi chèn/xoá có thể giữ khoá trên đường từ nút không đầy (PE 18.14). **B-link tree**: nút có con trỏ sang anh em bên phải.
- **Latch-free** cấu trúc dữ liệu với compare-and-swap (CAS); vấn đề **ABA** (PE 18.16).

## 2. Trắc nghiệm (10 câu)

**Câu 1.** Trong 2PL, **lock point** là:

- A. Lúc transaction bắt đầu
- B. Lúc nhận khoá cuối cùng
- C. Lúc nhả khoá đầu tiên
- D. Lúc commit

<details><summary>Đáp án</summary>

**B** — Thứ tự serial tương đương là thứ tự lock point.

</details>

**Câu 2.** Biến thể nào của 2PL đảm bảo **cascadeless**?

- A. Basic 2PL
- B. Strict 2PL
- C. Tree protocol
- D. Conservative 2PL

<details><summary>Đáp án</summary>

**B** — Giữ X-lock tới commit ⇒ không ai đọc được dữ liệu chưa commit.

</details>

**Câu 3.** Wait-die: T<sub>i</sub> (TS = 10) xin khoá do T<sub>j</sub> (TS = 5) giữ. Kết quả:

- A. T<sub>i</sub> chờ
- B. T<sub>i</sub> rollback
- C. T<sub>j</sub> rollback
- D. Cấp khoá ngay

<details><summary>Đáp án</summary>

**B** — T<sub>i</sub> trẻ hơn (TS lớn hơn) nên "die".

</details>

**Câu 4.** Wound-wait: T<sub>i</sub> (TS = 5) xin khoá do T<sub>j</sub> (TS = 10) giữ. Kết quả:

- A. T<sub>i</sub> chờ
- B. T<sub>i</sub> rollback
- C. T<sub>j</sub> rollback (bị wound)
- D. Deadlock

<details><summary>Đáp án</summary>

**C** — Transaction già hơn "wound" transaction trẻ đang giữ khoá.

</details>

**Câu 5.** Timestamp ordering: TS(T) = 5, R-timestamp(Q) = 4, W-timestamp(Q) = 7. Lệnh write(Q) của T với **Thomas' write rule**:

- A. Thực hiện
- B. Rollback T
- C. Bỏ qua lệnh write
- D. Chờ

<details><summary>Đáp án</summary>

**C** — TS ≥ R-ts nhưng < W-ts: giá trị đã lỗi thời, bỏ qua.

</details>

**Câu 6.** Protocol nào **không bao giờ deadlock**?

- A. Strict 2PL
- B. Rigorous 2PL
- C. Tree protocol
- D. Multiversion 2PL (với transaction cập nhật)

<details><summary>Đáp án</summary>

**C** — Tree protocol (và timestamp ordering) không có deadlock; các biến thể 2PL vẫn có thể deadlock.

</details>

**Câu 7.** Intention lock **IX** trên một relation tương thích với khoá nào của transaction khác trên cùng relation?

- A. S
- B. SIX
- C. IS và IX
- D. X

<details><summary>Đáp án</summary>

**C** — IX tương thích với IS và IX; xung đột với S, SIX, X.

</details>

**Câu 8.** Trong multiversion timestamp ordering, read(Q) của T (TS = 8) với các phiên bản W-ts = 0, 5, 9 đọc phiên bản nào?

- A. W-ts = 0
- B. W-ts = 5
- C. W-ts = 9
- D. Rollback

<details><summary>Đáp án</summary>

**B** — Phiên bản có W-ts lớn nhất không vượt quá TS(T).

</details>

**Câu 9.** Snapshot isolation có thể sinh ra bất thường nào?

- A. Dirty read
- B. Lost update giữa hai transaction cùng ghi một item
- C. Write skew
- D. Đọc dữ liệu chưa commit

<details><summary>Đáp án</summary>

**C** — First-committer-wins chặn ghi–ghi trên cùng item, nhưng không chặn hai transaction ghi hai item khác nhau dựa trên snapshot chung.

</details>

**Câu 10.** Phantom phenomenon xảy ra khi:

- A. Hai transaction cùng ghi một tuple
- B. Một transaction đọc theo vị từ trong khi transaction khác chèn tuple thoả vị từ
- C. Transaction đọc dữ liệu chưa commit
- D. Deadlock giữa hai transaction

<details><summary>Đáp án</summary>

**B** — Xung đột trên vị từ, không trên tuple chung; xử lý bằng index locking hoặc predicate locking.

</details>

## 3. Câu hỏi tự luận (16 câu)

**Câu 1.** 

> **Exercise 18.1.** Show that the two-phase locking protocol guarantees conflict serializability, and that transactions can be serialized in the order of their lock points.

**PE 18.1.** Chứng minh 2PL đảm bảo conflict serializability và có thể serialize theo lock point.

<details><summary>Gợi ý đáp án</summary>

Giả sử phản chứng: một tập T<sub>0</sub>, …, T<sub>n−1</sub> tuân theo 2PL tạo ra schedule không conflict serializable. Khi đó precedence graph có chu trình, giả sử T<sub>0</sub> → T<sub>1</sub> → … → T<sub>n−1</sub> → T<sub>0</sub>.

Gọi α<sub>i</sub> là lock point của T<sub>i</sub> (lúc nhận khoá cuối cùng). Cạnh T<sub>i</sub> → T<sub>j</sub> nghĩa là có item Q mà T<sub>i</sub> truy cập (với chế độ xung đột) trước T<sub>j</sub>. T<sub>j</sub> chỉ nhận được khoá xung đột trên Q sau khi T<sub>i</sub> **nhả** khoá trên Q; theo 2PL, T<sub>i</sub> nhả khoá chỉ sau lock point của nó. Vậy α<sub>i</sub> < (lúc T<sub>i</sub> nhả Q) < (lúc T<sub>j</sub> khoá Q) ≤ α<sub>j</sub>.

Đi theo chu trình: α<sub>0</sub> < α<sub>1</sub> < … < α<sub>n−1</sub> < α<sub>0</sub> — mâu thuẫn. Vậy precedence graph không có chu trình ⇒ conflict serializable. Hơn nữa mọi cạnh đi từ lock point nhỏ sang lớn, nên **sắp transaction theo lock point là một topological sort** — chính là thứ tự serial tương đương. (Bài CH18.03 tính lock point từ một schedule có lệnh khoá.)

</details>

**Câu 2.** 

> **Exercise 18.2.** Consider these two transactions:
> 
> ```
> T34: read(A);
>      read(B);
>      if A = 0 then B := B + 1;
>      write(B).
> 
> T35: read(B);
>      read(A);
>      if B = 0 then A := A + 1;
>      write(A).
> ```
> 
> Insert lock and unlock instructions into T34 and T35 so that they follow the two-phase locking protocol. Can executing these transactions lead to a deadlock?

**PE 18.2.** Thêm lock/unlock cho T34, T35 theo 2PL. Có thể deadlock không?

<details><summary>Gợi ý đáp án</summary>

a.
```
T34: lock-S(A); read(A); lock-X(B); read(B);
     if A = 0 then B := B + 1; write(B);
     unlock(A); unlock(B).
T35: lock-S(B); read(B); lock-X(A); read(A);
     if B = 0 then A := A + 1; write(A);
     unlock(B); unlock(A).
```
Mỗi transaction xin hết khoá trước khi nhả khoá nào ⇒ 2PL.

b. **Có thể deadlock.** Schedule một phần:

| T34 | T35 |
|---|---|
| lock-S(A) | |
| | lock-S(B) |
| | read(B) |
| read(A) | |
| lock-X(B) — chờ T35 nhả S(B) | |
| | lock-X(A) — chờ T34 nhả S(A) |

Hai transaction chờ nhau: chu trình trong wait-for graph.

</details>

**Câu 3.** 

> **Exercise 18.3.** What advantage does rigorous two-phase locking offer? How does it compare with the other variants of two-phase locking?

**PE 18.3.** Lợi ích của rigorous 2PL? So với các dạng 2PL khác?

<details><summary>Gợi ý đáp án</summary>

- Rigorous 2PL giữ **mọi** khoá (S và X) tới khi commit/abort. Nó có mọi ưu điểm của **strict 2PL** (giữ X-lock tới commit ⇒ cascadeless, recoverable).
- Thêm: với hai transaction xung đột, **thứ tự commit chính là thứ tự serializable** — người dùng thấy kết quả như các transaction chạy theo đúng thứ tự chúng commit, điều nhiều hệ thống/ứng dụng mong đợi. Cài đặt cũng đơn giản (nhả hết khoá một lúc khi kết thúc).
- So sánh: **basic 2PL** cho concurrency cao nhất nhưng có thể cascading rollback; **strict** nhả S-lock sớm hơn nên concurrency cao hơn rigorous chút ít; rigorous giảm concurrency nhẹ (S-lock giữ lâu hơn). Đa số hệ thống thương mại dùng strict hoặc rigorous 2PL. Không biến thể nào tránh được deadlock.

</details>

**Câu 4.** 

> **Exercise 18.4.** A database is organized as a rooted tree. Suppose a dummy vertex is inserted between every pair of vertices. Show that following the tree protocol on the new tree yields better concurrency than following it on the original tree.

**PE 18.4.** Chèn nút giả giữa mọi cặp nút của cây: vì sao tree protocol trên cây mới cho concurrency tốt hơn?

<details><summary>Gợi ý đáp án</summary>

Xét A là cha của B, chèn nút giả D giữa A và B (A → D → B). Giả sử T2 đang khoá B; T1 đang khoá A và muốn khoá B; T3 muốn khoá A.
- **Cây gốc**: T1 muốn khoá B phải đang giữ khoá cha A, nên T1 **không nhả A** được cho tới khi có B ⇒ T3 phải chờ cả thời gian T1 chờ T2.
- **Cây mới**: T1 khoá D (cần giữ A, đang có), rồi **nhả A** ngay; T1 chờ B trong khi chỉ giữ D. T3 lấy được A và chạy tiếp song song.
Nút giả cho phép nhả khoá trên nút thật sớm hơn: transaction giữ nút giả "đại diện" cho cạnh đang đi xuống thay vì giữ nút cha. Ý tưởng này tổng quát thành khoá trên **cạnh** (edge locks — Buckley & Silberschatz, 1984).

</details>

**Câu 5.** 

> **Exercise 18.5.** Show with examples that some schedules are possible under the tree protocol but not under two-phase locking, and vice versa.

**PE 18.5.** Ví dụ schedule hợp lệ theo tree protocol mà không theo 2PL, và ngược lại.

<details><summary>Gợi ý đáp án</summary>

Cây: A là cha của B, B là cha của C (A → B → C).

**Hợp lệ theo tree protocol, không theo 2PL** (T1 nhả A rồi mới khoá C — vi phạm 2PL):

| T1 | T2 |
|---|---|
| lock(A) | |
| lock(B) | |
| unlock(A) | |
| | lock(A) |
| lock(C) | |
| unlock(B) | |
| | lock(B) |
| | unlock(A) |
| | unlock(B) |
| unlock(C) | |

**Hợp lệ theo 2PL, không theo tree protocol** (T1 khoá A và C mà không giữ B — C chỉ được khoá khi giữ cha B):

| T1 | T2 |
|---|---|
| lock(A) | |
| | lock(B) |
| lock(C) | |
| | unlock(B) |
| unlock(A) | |
| unlock(C) | |

</details>

**Câu 6.** 

> **Exercise 18.6.** In persistent programming languages locking is not explicit; instead, objects (or the pages holding them) must be locked when they are accessed. Most modern operating systems let a user set access protections (no access, read, write) on pages, and a memory access that violates the protection raises a protection violation (see, e.g., the Unix `mprotect` command). Describe how this access-protection mechanism can be used to implement page-level locking in a persistent programming language.

**PE 18.6.** Dùng cơ chế bảo vệ trang của hệ điều hành (mprotect) để cài khoá mức trang cho persistent programming language.

<details><summary>Gợi ý đáp án</summary>

- Ban đầu dùng `mprotect` **tắt quyền đọc và ghi** trên mọi trang của CSDL trong không gian địa chỉ tiến trình.
- Khi chương trình truy cập một đối tượng trên trang chưa có quyền, phần cứng sinh **protection violation**; handler của hệ thống:
  - truy cập đọc: xin **S-lock** trên trang từ lock manager (có thể chờ); khi được cấp, gọi `mprotect` bật **quyền đọc** cho trang, rồi cho lệnh chạy lại;
  - truy cập ghi: xin **X-lock** (hoặc nâng S → X), bật **quyền đọc + ghi**, chạy lại lệnh (có thể ghi log/bản cũ của trang lúc này).
- Các lần truy cập sau trên trang đó không gây lỗi nữa ⇒ không tốn chi phí kiểm tra mỗi lần truy cập.
- Khi commit/abort: nhả khoá và gọi `mprotect` thu hồi quyền trên các trang (theo strict 2PL).

</details>

**Câu 7.** 

> **Exercise 18.7.** A database system offers an atomic *increment* operation besides read and write. If V is the value of data item X, then
> 
> increment(X) by C
> 
> sets X to V + C in a single atomic step. The transaction does not learn the value of X unless it also executes read(X).
> 
> Increment operations lock the item in *increment mode*, using the compatibility matrix of Figure 18.25.
> 
> a. Show that if every transaction locks the data it accesses in the matching mode, two-phase locking guarantees serializability.
> 
> b. Show that adding increment-mode locks allows more concurrency.
> 
> *Figure 18.25 — Lock-compatibility matrix with increment mode* (true = compatible):
> 
> |   | S | X | I |
> |---|---|---|---|
> | S | true | false | false |
> | X | false | false | false |
> | I | false | false | true |

**PE 18.7.** Khoá chế độ increment (I): (a) 2PL vẫn đảm bảo serializability; (b) tăng concurrency.

<details><summary>Gợi ý đáp án</summary>

Ma trận (Figure 18.25): S–S và I–I tương thích, mọi cặp khác không.

a. Xem increment là một loại thao tác mới. Hai **increment** trên cùng item **giao hoán**: (V + C1) + C2 = (V + C2) + C1, và transaction không đọc giá trị nếu không read — nên chúng **không xung đột**, giống hai read. Increment xung đột với read (giá trị đọc phụ thuộc thứ tự) và write — đúng như ma trận: I không tương thích với S và X. Như vậy mọi cặp thao tác xung đột đều có chế độ khoá không tương thích, và lập luận lock point của PE 18.1 áp dụng y nguyên: thao tác xung đột được sắp theo thứ tự lock point ⇒ serializable.

b. Không có chế độ I, mỗi transaction muốn tăng giá trị phải đọc rồi ghi, tức cần **X-lock** — các transaction tăng cùng một bộ đếm (vd tổng tiền, số ghế đã bán) phải xếp hàng tuần tự. Với I-lock **tương thích với chính nó**, nhiều transaction giữ I-lock đồng thời và cùng tăng, giảm thời gian chờ khoá. Tổng quát: thêm ô "true" vào ma trận tương thích làm tăng concurrency và throughput. (Korth, *Locking Primitives in a Database System*, JACM 1983.)

</details>

**Câu 8.** 

> **Exercise 18.8.** In timestamp ordering, W-timestamp(Q) is the largest timestamp of any transaction that successfully executed write(Q). Suppose we instead defined it as the timestamp of the most recent transaction that successfully executed write(Q). Would this change in wording make a difference? Explain.

**PE 18.8.** W-timestamp(Q) là "TS lớn nhất đã ghi Q" hay "TS của transaction gần nhất đã ghi Q": có khác gì không?

<details><summary>Gợi ý đáp án</summary>

**Không khác.** Theo quy tắc write của timestamp ordering, write(Q) của T<sub>i</sub> chỉ thành công khi TS(T<sub>i</sub>) ≥ W-timestamp(Q) (và ≥ R-timestamp(Q)); ngược lại T<sub>i</sub> bị rollback. Vì vậy dãy timestamp của các lần ghi Q thành công là **không giảm** theo thời gian: transaction ghi Q gần đây nhất cũng là transaction có timestamp lớn nhất trong số những người đã ghi Q. (Với Thomas' write rule, lệnh ghi lỗi thời bị **bỏ qua** chứ không được thực hiện, nên kết luận vẫn đúng.)

</details>

**Câu 9.** 

> **Exercise 18.9.** Multiple-granularity locking may need more locks, or fewer locks, than an equivalent system with a single lock granularity. Give an example of each situation, and compare how much concurrency each allows.

**PE 18.9.** Multiple granularity cần nhiều khoá hơn / ít khoá hơn khi nào? So sánh concurrency.

<details><summary>Gợi ý đáp án</summary>

- **Ít khoá hơn**: transaction quét/cập nhật cả relation (hàng triệu tuple). Hệ một độ mịn (mức tuple) phải xin hàng triệu khoá; multiple granularity chỉ cần IX/IS trên database và S/X trên relation — vài khoá.
- **Nhiều khoá hơn**: transaction chỉ truy cập **một** tuple. Hệ một độ mịn chỉ cần 1 khoá; multiple granularity phải xin intention lock trên mọi tổ tiên (database IS, area IS, file IS) rồi S trên tuple — 4 khoá.
- **Concurrency**: khoá thô (cả relation) có overhead thấp nhưng chặn mọi transaction khác cần relation đó ⇒ concurrency thấp. Khoá mịn cho concurrency cao (transaction khác vẫn truy cập tuple khác) nhưng tốn khoá. Multiple granularity cho mỗi transaction chọn độ mịn phù hợp; intention lock giúp phát hiện xung đột giữa khoá thô và khoá mịn mà không phải duyệt hết các nút con.

</details>

**Câu 10.** 

> **Exercise 18.10.** For each protocol below, describe properties of practical applications that would make you recommend the protocol, and properties that would make you advise against it:
> 
> - Two-phase locking
> - Two-phase locking with multiple-granularity locking
> - The tree protocol
> - Timestamp ordering
> - Validation
> - Multiversion timestamp ordering
> - Multiversion two-phase locking

**PE 18.10.** Khi nào nên / không nên dùng: 2PL, 2PL + multiple granularity, tree protocol, timestamp ordering, validation, multiversion TO, multiversion 2PL?

<details><summary>Gợi ý đáp án</summary>

- **2PL**: nên cho ứng dụng đơn giản, một độ mịn khoá là đủ, xung đột vừa phải. Không nên nếu có transaction **read-only dài** (chặn/ bị chặn — multiversion tốt hơn) hoặc nếu phải tránh deadlock bằng mọi giá.
- **2PL + multiple granularity**: nên khi trộn lẫn transaction truy cập từng record và transaction truy cập cả relation (hoặc phần lớn). Nhược điểm như 2PL (deadlock), thêm overhead intention lock cho transaction nhỏ.
- **Tree protocol**: nên khi các ứng dụng truy cập dữ liệu theo một thứ tự bộ phận cố định (cấu trúc cây, index); **không deadlock**, nhả khoá sớm. Không nên khi phải khoá nhiều nút không cần thiết (truy cập hai lá xa nhau phải khoá cả đường đi), cần recoverability mà không muốn thêm điều kiện.
- **Timestamp ordering**: nên khi cần kết quả tương đương một thứ tự serial **cụ thể** (vd thứ tự đến); không deadlock. Không nên khi xung đột cao (rollback thay vì chờ, tốn công), cần recoverable (phải thêm overhead), có transaction read-only dài (starvation).
- **Validation**: nên khi xác suất xung đột **thấp** — overhead thấp, concurrency và thời gian đáp ứng tốt. Không nên khi tranh chấp cao: nhiều công việc bị huỷ ở pha validation.
- **Multiversion TO**: nên khi TO phù hợp và muốn **đọc không bao giờ chờ**; chịu chung nhược điểm của TO (rollback, không recoverable sẵn) và tốn bộ nhớ cho phiên bản.
- **Multiversion 2PL**: nên khi có nhiều transaction **read-only** — chúng luôn commit, không chờ, không tham gia deadlock; transaction cập nhật theo rigorous 2PL nên recoverable, xung đột giải quyết bằng chờ. Không nên khi ít xung đột và ít read-only: overhead lưu phiên bản không đáng, plain 2PL tốt hơn; deadlock vẫn có giữa transaction cập nhật.

</details>

**Câu 11.** 

> **Exercise 18.11.** Consider this way of running a transaction: first run it without acquiring any locks and without writing anything to the database (as in validation-based techniques), but — unlike validation — perform neither validation nor writes. Then run the transaction again under strict two-phase locking. Explain why this can perform better than simply using strict two-phase locking. (Hint: think about waits for disk I/O.)

**PE 18.11.** Chạy transaction một lượt không khoá, không ghi, rồi chạy lại bằng strict 2PL — vì sao có thể nhanh hơn chỉ dùng strict 2PL?

<details><summary>Gợi ý đáp án</summary>

Transaction chờ hai thứ: **disk I/O** (chủ yếu là đọc — ghi được buffer xử lý bất đồng bộ) và **chờ khoá**.
- Lượt 1 (không khoá, không ghi) gần như gánh **toàn bộ thời gian chờ đọc đĩa**: mọi khối cần đọc được nạp vào buffer.
- Lượt 2 (strict 2PL) chạy lại khi dữ liệu đã nằm trong bộ nhớ ⇒ gần như không có I/O khi **đang giữ khoá**, nên khoá được giữ trong thời gian ngắn hơn nhiều ⇒ ít chờ khoá, concurrency cao hơn.
- Đĩa cũng được tận dụng tốt hơn: ở strict 2PL thuần, transaction có thể chờ khoá trong khi đĩa rảnh dù nó còn khối cần đọc; với kỹ thuật này, việc đọc không bị khoá chặn.
- Có ích nhất khi transaction ít tính toán, phần lớn thời gian là I/O và chờ khoá (CSDL trên đĩa). Nếu transaction nặng tính toán thì lượt 1 là công phí; tối ưu: lưu kết quả lượt 1, ở lượt 2 khi khoá được item thì so sánh giá trị với giá trị đã dùng — nếu giống hết thì áp các cập nhật đã buffer thay vì chạy lại.

</details>

**Câu 12.** 

> **Exercise 18.12.** Under the timestamp-ordering protocol, take two transactions: one writes data items p and q, the other reads the same two items. Give a schedule in which the timestamp test for a write fails and forces the first transaction to restart, which in turn causes a cascading abort of the other transaction. Show how this can lead to starvation of both transactions. (A situation in which two or more processes keep acting but never finish because of their interaction with each other is called a *livelock*.)

**PE 18.12.** Timestamp ordering: schedule mà write thất bại khiến transaction ghi restart và kéo theo cascading abort của transaction đọc; vì sao có thể starvation (livelock)?

<details><summary>Gợi ý đáp án</summary>

T1 ghi p và q, T2 đọc p và q, TS(T1) < TS(T2):

| T1 | T2 |
|---|---|
| write(p) | |
| | read(p) |
| | read(q) |
| write(q) | |

- write(p): thành công, W-ts(p) = TS(T1). read(p), read(q) của T2: thành công, R-ts(q) = TS(T2).
- write(q) của T1: TS(T1) < R-timestamp(q) = TS(T2) ⇒ **thất bại, T1 rollback**.
- T2 đã đọc p do T1 ghi ⇒ **cascading abort** T2.
- Cả hai restart (với timestamp mới, T1 vẫn nhỏ hơn T2 nếu restart theo cùng thứ tự). Nếu kịch bản xen kẽ lặp lại y hệt mỗi lần, không transaction nào hoàn thành ⇒ **starvation của cả hai — livelock**.

Bài CH18.10 mô phỏng đúng schedule này (bảng `tx_to_ops`) bằng recursive CTE.

</details>

**Câu 13.** 

> **Exercise 18.13.** Design a timestamp-based protocol that avoids the phantom phenomenon.

**PE 18.13.** Thiết kế giao thức dựa trên timestamp tránh phantom.

<details><summary>Gợi ý đáp án</summary>

- Cách thô: coi cả relation (hoặc một "data item" đại diện thông tin về tập tuple của relation) là một item có R-/W-timestamp: đọc theo vị từ ⇒ read item đó; insert/delete ⇒ write item đó. Đúng nhưng concurrency thấp.
- Cách tinh (phỏng theo index locking): coi mỗi **bucket/leaf node của B<sup>+</sup>-tree index** là một data item có R-timestamp và W-timestamp, và **bắt buộc mọi truy cập đọc theo khoảng phải đi qua index**. Transaction T<sub>i</sub> đọc mọi tuple có key trong khoảng [l, h] thì phải "read" mọi leaf chứa khoảng đó (cập nhật R-ts). Mọi insert/delete tuple có key trong khoảng phải sửa một trong các leaf đó ⇒ là một "write" lên leaf, chịu kiểm tra timestamp ordering thông thường. Như vậy xung đột logic trên vị từ được chuyển thành xung đột trên index bucket, và phantom bị phát hiện (transaction vi phạm thứ tự bị rollback).

</details>

**Câu 14.** 

> **Exercise 18.14.** Suppose the tree protocol of Section 18.1.5 is used to control concurrent access to a B<sup>+</sup>-tree. Because an insert may cause a split that propagates up to the root, it seems an insert can release no lock until the whole operation is done. Under what circumstances can a lock be released earlier?

**PE 18.14.** Tree protocol trên B<sup>+</sup>-tree: khi chèn, lúc nào có thể nhả khoá sớm?

<details><summary>Gợi ý đáp án</summary>

Đi từ gốc xuống: nếu **nút con sắp đi xuống không đầy** thì một lần split ở dưới cũng sẽ dừng tại nút con đó, không lan lên trên ⇒ có thể **nhả khoá mọi tổ tiên** (trừ nút hiện tại), xin X-lock nút con, rồi nhả nút hiện tại và đi xuống. Nếu nút con **đầy**, giữ mọi khoá đang có (vì split có thể lan lên), xin X-lock nút con và đi xuống. Tới lá thì chèn. Kết quả: chỉ giữ khoá trên chuỗi nút **đầy** tính từ lá lên tới (và gồm) nút không đầy đầu tiên.

Tối ưu: dù nút con đầy, vẫn nhả khoá mọi nút trừ nút hiện tại; sau khi có X-lock nút con thì **split nút con ngay** (cha hiện tại còn chỗ vì đã đảm bảo trước đó), nhả cha, giữ đúng nửa cần đi xuống ⇒ mọi lúc chỉ giữ **tối đa hai khoá** (cha và con). (Đây là tree protocol Section 18.1.5, khác multiple granularity và B<sup>+</sup>-tree protocol riêng ở Section 18.10.2.)

</details>

**Câu 15.** 

> **Exercise 18.15.** Snapshot isolation includes a validation step which, before transaction T writes a data item, checks whether a transaction concurrent with T has already written that item.
> 
> a. A simple implementation gives every transaction a start timestamp and a commit timestamp, plus an *update set* (the set of data items it updated). Explain how to validate under the first-committer-wins scheme using the transaction timestamps and the update sets. You may assume validation and the other commit-processing steps run serially, one transaction at a time.
> 
> b. Now, instead of update sets, every data item carries a write timestamp. Explain how validation can be done as part of commit processing for first-committer-wins with this variant. Again assume validation and other commit steps run serially.
> 
> c. The first-updater-wins scheme can be implemented with timestamps as above, except that validation happens right after an exclusive lock is acquired rather than at commit time.
> 
> 1. Explain how write timestamps should be assigned to data items to implement first-updater-wins.
> 2. Show that, because of locking, repeating the validation at commit time would give the same result.
> 3. Explain why, in this case, validation and the other commit steps need not run serially.

**PE 18.15.** Validation của snapshot isolation: (a) first-committer-wins bằng timestamp + update set; (b) bằng W-timestamp trên item; (c) first-updater-wins.

<details><summary>Gợi ý đáp án</summary>

a. Mỗi T<sub>i</sub> có StartTS(T<sub>i</sub>), CommitTS(T<sub>i</sub>) và update_set(T<sub>i</sub>). Khi T<sub>i</sub> commit (validation chạy tuần tự), với mọi T<sub>k</sub> **đã commit** có CommitTS(T<sub>k</sub>) < CommitTS(T<sub>i</sub>), phải có một trong hai:
- CommitTS(T<sub>k</sub>) < StartTS(T<sub>i</sub>) — T<sub>k</sub> xong trước khi T<sub>i</sub> bắt đầu, không đồng thời; hoặc
- StartTS(T<sub>i</sub>) < CommitTS(T<sub>k</sub>) < CommitTS(T<sub>i</sub>) và update_set(T<sub>i</sub>) ∩ update_set(T<sub>k</sub>) = ∅.
Nếu không, T<sub>i</sub> abort. Chú ý chỉ so với transaction **đã commit thành công** — transaction bị abort không được tính (bài CH18.12 cho thấy T3 commit được vì T2 đã abort).

b. Mỗi item Q có W-timestamp(Q) = CommitTS của transaction cuối cùng đã commit một ghi lên Q. Khi T<sub>i</sub> commit: với mọi Q T<sub>i</sub> ghi, phải có **W-timestamp(Q) < StartTS(T<sub>i</sub>)**; nếu đúng thì commit và đặt W-timestamp(Q) := CommitTS(T<sub>i</sub>) cho mọi Q đã ghi; ngược lại abort.

c. First-updater-wins:
1. Khi T<sub>i</sub> xin được X-lock trên Q thì kiểm tra W-timestamp(Q) < StartTS(T<sub>i</sub>) (nếu sai thì abort ngay); W-timestamp(Q) được gán khi ghi — bằng timestamp lúc T<sub>i</sub> commit (hoặc thời điểm ghi, miễn là lớn hơn StartTS của mọi transaction đồng thời).
2. Validation thực hiện **sau khi có X-lock**, và X-lock giữ tới cuối transaction ⇒ không transaction nào khác ghi được Q từ lúc validation tới lúc commit, nên W-timestamp(Q) không đổi; validation lặp lại khi commit cho cùng kết quả.
3. Nhờ X-lock, tại mỗi thời điểm chỉ một transaction có thể validate/ghi trên một item ⇒ hai transaction không thể cùng validate trên cùng item, nên không cần tuần tự hoá toàn bộ pha validation + commit.

</details>

**Câu 16.** 

> **Exercise 18.16.** Consider the functions insert_latchfree() and delete_latchfree() of Figure 18.23.
> 
> a. Explain how the ABA problem can arise if a deleted node is inserted again.
> 
> b. Suppose a counter cnt is stored next to head, and DCAS((head, cnt), (oldhead, oldcnt), (newhead, newcnt)) performs an atomic compare-and-swap on the 128-bit pair (head, cnt). Rewrite insert_latchfree() and delete_latchfree() to use DCAS so that the ABA problem is avoided.
> 
> c. Most processors use only 48 of the 64 bits of an address to actually address memory. Explain how the remaining 16 bits can implement a counter when DCAS is not available.
> 
> *Figure 18.23 — Latch-free insert and delete on a linked list (CAS = atomic compare-and-swap):*
> 
> ```
> insert_latchfree(head, value) {
>   node = new node
>   node->value = value
>   repeat
>     oldhead = head
>     node->next = oldhead
>     result = CAS(head, oldhead, node)
>   until (result == success)
> }
> 
> delete_latchfree(head) {
>   /* not quite safe; see the exercise */
>   repeat
>     oldhead = head
>     newhead = oldhead->next
>     result = CAS(head, oldhead, newhead)
>   until (result == success)
> }
> ```

**PE 18.16.** Hàm latch-free insert/delete (Figure 18.23): (a) vấn đề ABA; (b) dùng DCAS với bộ đếm; (c) dùng 16 bit cao của con trỏ.

<details><summary>Gợi ý đáp án</summary>

a. Danh sách: head → n1 → n2 → n3. P1 chạy delete: đọc oldhead = n1, newhead = n2, nhưng **chưa** kịp CAS. P2 xoá n1, xoá n2, rồi **chèn lại n1** ở đầu (head → n1 → n3). P1 chạy CAS(head, n1, n2): head vẫn là n1 nên CAS **thành công** và đặt head = n2 — nhưng n2 đã bị xoá (rác) ⇒ danh sách hỏng. Giá trị A → B → A nên CAS không nhận ra thay đổi.

b. Lưu bộ đếm cnt cạnh head; mỗi lần sửa head thì tăng cnt; dùng DCAS trên cặp 128 bit:
```
atomic_read(head, cnt) {
  repeat
    oldhead = head; oldcnt = cnt
    result = DCAS((head, cnt), (oldhead, oldcnt), (oldhead, oldcnt))
  until (result == success)
  return (oldhead, oldcnt)
}
insert_latchfree(head, value) {
  node = new node; node->value = value
  repeat
    (oldhead, oldcnt) = atomic_read(head, cnt)
    node->next = oldhead
    result = DCAS((head, cnt), (oldhead, oldcnt), (node, oldcnt + 1))
  until (result == success)
}
delete_latchfree(head) {
  repeat
    (oldhead, oldcnt) = atomic_read(head, cnt)
    newhead = oldhead->next
    result = DCAS((head, cnt), (oldhead, oldcnt), (newhead, oldcnt + 1))
  until (result == success)
}
```
atomic_read đảm bảo đọc cặp (head, cnt) nhất quán. Trong kịch bản ABA, head lại là n1 nhưng cnt đã tăng ⇒ DCAS của P1 thất bại, P1 đọc lại.

c. CPU chỉ dùng 48 bit thấp của địa chỉ 64 bit (256 TB). Dùng **16 bit cao làm bộ đếm**: tách con trỏ và bộ đếm bằng phép AND với mặt nạ, ghép lại bằng AND/OR, rồi dùng **CAS 64 bit** thông thường trên cả giá trị. Vẫn có rủi ro nhỏ: bộ đếm quay vòng nếu có đúng 65 536 thao tác chen giữa lúc đọc head và lúc CAS.

</details>

## 4. Bài tập SQL (14 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH18.01 | lock compatibility | ★★☆ | Exercise 18.7. A database system offers an atomic *increment* operation besides read and write. If V is the value of data item X, then  increment(X) by C  sets X to V + C in a single atomic step. The transaction does not learn the value of X unless it also executes read(X).  Increment operations lock the item in *increment mode*, using the compatibility matrix of Figure 18.25.  a. Show that if every transaction locks the data it accesses in the matching mode, two-phase locking guarantees serializability.  b. Show that adding increment-mode locks allows more concurrency.  *Figure 18.25 — Lock-compatibility matrix with increment mode* (true = compatible):  \|   \| S \| X \| I \| \|---\|---\|---\|---\| \| S \| true \| false \| false \| \| X \| false \| false \| false \| \| I \| false \| false \| true \|<br>`tx_lock_req(req_id, item, txn, mode, status)` là bảng khoá của lock manager (mode S, X hoặc I); `tx_lock_compat(held, requested, ok)` là ma trận Figure 18.25. Với mỗi yêu cầu waiting, cho biết có cấp được ngay không (tương thích với mọi khoá held của transaction khác trên cùng item; bỏ qua thứ tự hàng đợi): `req_id, txn, item, mode, grantable`. |
| CH18.02 | two-phase check | ★★☆ | `tx_lock_sched(sched_id, step, txn, action, item)` lưu schedule có lệnh khoá (action: lock-S, lock-X, unlock, read, write, commit). Với mỗi (sched_id, txn), cho biết transaction có tuân theo 2PL không (không xin khoá nào sau lần unlock đầu tiên): `sched_id, txn, two_phase`. |
| CH18.03 | lock point | ★★☆ | Exercise 18.1. Show that the two-phase locking protocol guarantees conflict serializability, and that transactions can be serialized in the order of their lock points.<br>Với schedule `L1`, tính lock point (step của lệnh khoá cuối cùng) của mỗi transaction và trả về `txn, lock_point` sắp theo lock_point — đây là thứ tự serial tương đương theo PE 18.1. |
| CH18.04 | strict / rigorous 2PL | ★★★ | Exercise 18.3. What advantage does rigorous two-phase locking offer? How does it compare with the other variants of two-phase locking?<br>Với mỗi (sched_id, txn) trong `tx_lock_sched`, trả về `sched_id, txn, strict, rigorous`: strict — mọi unlock của item đã khoá X đều sau commit; rigorous — mọi unlock đều sau commit (transaction không unlock thì coi là đúng). |
| CH18.05 | deadlock detection | ★★★ | `tx_waits(graph, waiter, holder)` lưu các wait-for graph. Trả về các transaction đang bị deadlock (nằm trên một chu trình): `graph, txn`. |
| CH18.06 | deadlock victim | ★★★ | Trong mỗi wait-for graph, mỗi chu trình (thành phần liên thông mạnh có chu trình) chọn victim là transaction trẻ nhất (timestamp lớn nhất trong `tx_txn`). Trả về `graph, cycle_id, victim` với cycle_id là tên transaction nhỏ nhất (theo thứ tự chữ) của chu trình. |
| CH18.07 | wait-die / wound-wait | ★★☆ | `tx_conflict(req_id, requester, holder)`: requester xin khoá đang bị holder giữ; timestamp ở `tx_txn` (nhỏ = già). Trả về `req_id, wait_die, wound_wait` với giá trị `wait`, `rollback requester` hoặc `rollback holder`. |
| CH18.08 | timestamp ordering | ★★☆ | Exercise 18.8. In timestamp ordering, W-timestamp(Q) is the largest timestamp of any transaction that successfully executed write(Q). Suppose we instead defined it as the timestamp of the most recent transaction that successfully executed write(Q). Would this change in wording make a difference? Explain.<br>`tx_to_req(req_id, txn_ts, op, item, r_ts, w_ts)`: mỗi dòng là một yêu cầu độc lập — TS của transaction, thao tác R/W và R-/W-timestamp hiện tại của item. Trả về `req_id, basic_to, thomas`: quyết định của timestamp ordering cơ bản (`execute`/`rollback`) và khi dùng Thomas' write rule (`execute`/`rollback`/`ignore`). |
| CH18.09 | multiversion read | ★★☆ | Multiversion timestamp ordering: `tx_versions(item, w_ts, value)` là các phiên bản; `tx_mv_reads(req_id, txn_ts, item)` là các yêu cầu đọc. Trả về `req_id, value_read` — giá trị của phiên bản có W-timestamp lớn nhất ≤ TS của transaction. |
| CH18.10 | TO simulation | ★★★ | Exercise 18.12. Under the timestamp-ordering protocol, take two transactions: one writes data items p and q, the other reads the same two items. Give a schedule in which the timestamp test for a write fails and forces the first transaction to restart, which in turn causes a cascading abort of the other transaction. Show how this can lead to starvation of both transactions. (A situation in which two or more processes keep acting but never finish because of their interaction with each other is called a *livelock*.)<br>Mô phỏng timestamp ordering trên schedule `tx_to_ops(step, txn, ts, op, item)` (kịch bản PE 18.12). Ban đầu mọi R-/W-timestamp bằng 0. Xử lý lần lượt từng step: - read: TS < W-ts → `rollback`; ngược lại `execute` và R-ts := max(R-ts, TS); - write: TS < R-ts hoặc TS < W-ts → `rollback`; ngược lại `execute` và W-ts := TS; - transaction đã bị rollback thì các lệnh sau của nó là `skipped` (không restart, không cascading). Trả về `step, txn, op, item, outcome` sắp theo step. |
| CH18.11 | validation | ★★★ | `tx_val(txn, start_ts, val_ts, finish_ts, read_set, write_set)` (mảng text). Áp dụng validation test cho từng T[j] so với mọi T[i] có val_ts nhỏ hơn: FinishTS(T[i]) < StartTS(T[j]), hoặc StartTS(T[j]) < FinishTS(T[i]) < ValidationTS(T[j]) và write_set(T[i]) không giao read_set(T[j]). Trả về `txn, passes`. |
| CH18.12 | first-committer-wins | ★★★ | Exercise 18.15 (a). Snapshot isolation includes a validation step which, before transaction T writes a data item, checks whether a transaction concurrent with T has already written that item.  a. A simple implementation gives every transaction a start timestamp and a commit timestamp, plus an *update set* (the set of data items it updated). Explain how to validate under the first-committer-wins scheme using the transaction timestamps and the update sets. You may assume validation and the other commit-processing steps run serially, one transaction at a time.<br>`tx_si(txn, start_ts, commit_ts, write_set)`: các transaction xin commit theo thứ tự commit_ts. Theo first-committer-wins, T commit được nếu không transaction nào đã commit thành công có commit_ts > start_ts(T) và write set giao write set của T; ngược lại T abort (và không được tính cho các transaction sau). Trả về `txn, status` (`commit`/`abort`) sắp theo commit_ts. |
| CH18.13 | item W-timestamp | ★★★ | Exercise 18.15 (b). Snapshot isolation includes a validation step which, before transaction T writes a data item, checks whether a transaction concurrent with T has already written that item.  b. Now, instead of update sets, every data item carries a write timestamp. Explain how validation can be done as part of commit processing for first-committer-wins with this variant. Again assume validation and other commit steps run serially.<br>Theo cách cài đặt ở PE 18.15b, mỗi item giữ W-timestamp = commit_ts của transaction cuối cùng đã commit một ghi lên nó. Dùng kết quả first-committer-wins trên `tx_si` (như CH18.12), trả về `item, w_timestamp` cho mọi item từng được một transaction đã commit ghi. |
| CH18.14 | phantom | ★★☆ | Exercise 18.13. Design a timestamp-based protocol that avoids the phantom phenomenon.<br>`tx_pred(txn, lo, hi)`: mỗi transaction đọc instructor theo vị từ `salary between lo and hi`. `tx_ins(ins_id, txn, salary)`: các lệnh chèn instructor. Liệt kê các lệnh chèn tạo phantom cho một transaction đọc khác: `reader, inserter, ins_id, salary`. |
