# Chương 17 — Giao tác (Transactions)

*Transactions · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch17`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 1. Khái niệm transaction
- **Transaction** là một đơn vị thực thi chương trình truy cập và có thể cập nhật nhiều data item. Ví dụ chuyển 50 từ A sang B:
`read(A); A := A − 50; write(A); read(B); B := B + 50; write(B)`.
- Hai vấn đề chính cần giải quyết: **lỗi** (phần cứng, hệ thống crash) và **thực thi đồng thời** nhiều transaction.
- Trong SQL: transaction bắt đầu ngầm định; kết thúc bằng `commit work` hoặc `rollback work`. PostgreSQL: `begin; … commit;` / `rollback;`, `savepoint s; rollback to savepoint s;`.

### 2. ACID
| Tính chất | Ý nghĩa | Ai đảm bảo |
|---|---|---|
| **Atomicity** | Hoặc mọi thao tác của transaction được phản ánh trong CSDL, hoặc không thao tác nào | Recovery system (log, undo) |
| **Consistency** | Chạy riêng lẻ một transaction trên CSDL nhất quán thì kết quả vẫn nhất quán (vd A + B không đổi) | Lập trình viên + ràng buộc toàn vẹn |
| **Isolation** | Mỗi transaction không "thấy" trạng thái trung gian của transaction khác đang chạy; kết quả như chạy tuần tự | Concurrency-control system |
| **Durability** | Sau khi commit thành công, thay đổi tồn tại kể cả khi hệ thống hỏng | Recovery system (log trên stable storage) |

### 3. Mô hình lưu trữ (storage)
- **Volatile** (RAM, cache): mất khi crash. **Non-volatile** (đĩa, flash): còn sau crash nhưng vẫn có thể hỏng.
- **Stable storage**: trừu tượng "không bao giờ mất", xấp xỉ bằng nhiều bản sao trên các thiết bị non-volatile độc lập (khác vị trí). Chỉ stable storage mới cho durability thật sự (PE 17.4).

### 4. Trạng thái của transaction
**active** → **partially committed** (đã chạy xong lệnh cuối) → **committed**; hoặc active/partially committed → **failed** → **aborted** (đã rollback, CSDL trở về như trước khi bắt đầu). Sau khi abort: **restart** (lỗi phần cứng/phần mềm không do logic) hoặc **kill** (lỗi logic bên trong).
**Observable external write** (in ra màn hình, phát tiền ATM) chỉ nên làm sau khi commit.

### 5. Schedule
- **Schedule**: thứ tự thời gian của các lệnh của một tập transaction, giữ nguyên thứ tự lệnh trong mỗi transaction. Transaction thành công kết thúc bằng commit, thất bại kết thúc bằng abort.
- **Serial schedule**: các transaction chạy lần lượt, không xen kẽ. n transaction có n! serial schedule. Serial luôn đúng (giữ consistency).
- **Concurrent schedule**: xen kẽ — cần kiểm tra có tương đương một serial schedule không.
- Lý do chạy đồng thời: tăng throughput và tận dụng CPU/đĩa, giảm thời gian chờ trung bình.

### 6. Conflict serializability
Hai lệnh I của T<sub>i</sub> và J của T<sub>j</sub> (i ≠ j) trên **cùng data item Q** **xung đột (conflict)** nếu ít nhất một trong hai là **write(Q)**:

| I \ J | read(Q) | write(Q) |
|---|---|---|
| read(Q) | không | conflict |
| write(Q) | conflict | conflict |

- Đổi chỗ hai lệnh liền kề **không xung đột** không làm đổi kết quả.
- S và S′ **conflict equivalent** nếu biến được S thành S′ bằng các lần đổi chỗ lệnh không xung đột.
- S **conflict serializable** nếu conflict equivalent với một serial schedule.

**Precedence graph**: đỉnh là transaction; cạnh T<sub>i</sub> → T<sub>j</sub> nếu có cặp lệnh xung đột mà lệnh của T<sub>i</sub> đứng trước. **S conflict serializable ⇔ precedence graph không có chu trình.** Thứ tự serial tương đương = một **topological sort** của đồ thị (PE 17.6). Phát hiện chu trình: O(n²) với DFS (hoặc O(n + e)).

Viết bằng SQL khi schedule lưu thành bảng `sched(step, txn, op, item)`:
```sql
select distinct a.txn as src, b.txn as dst
from sched a join sched b
  on a.item = b.item and a.step < b.step and a.txn <> b.txn
where 'W' in (a.op, b.op);
```
Có chu trình ⇔ bao đóng bắc cầu (recursive CTE) chứa cặp (T, T).

### 7. View serializability
S và S′ **view equivalent** nếu với mỗi data item Q:
1. Nếu T<sub>i</sub> đọc **giá trị ban đầu** của Q trong S thì cũng vậy trong S′.
2. Nếu T<sub>i</sub> đọc Q do T<sub>j</sub> ghi trong S (**reads-from**) thì cũng vậy trong S′.
3. Transaction ghi **lần cuối** (final write) Q trong S cũng ghi lần cuối trong S′.

- Mọi conflict-serializable schedule đều view serializable; ngược lại không đúng — schedule view serializable mà không conflict serializable luôn có **blind write** (ghi mà không đọc trước).
- Kiểm tra view serializability là **NP-complete**, nên thực tế dùng conflict serializability (PE 17.5).
- Có schedule cho kết quả như serial nhờ ngữ nghĩa phép toán (vd cùng cộng/trừ) nhưng không serializable theo cả hai định nghĩa — ta không phân tích ngữ nghĩa.

### 8. Recoverable và cascadeless
- **Recoverable**: nếu T<sub>j</sub> đọc data item do T<sub>i</sub> ghi trước đó thì **commit của T<sub>i</sub> phải đứng trước commit của T<sub>j</sub>**. Nếu không, T<sub>i</sub> abort sau khi T<sub>j</sub> đã commit → không thể rollback T<sub>j</sub>.
- **Cascading rollback**: một transaction abort kéo theo chuỗi transaction đã đọc dữ liệu của nó phải abort.
- **Cascadeless**: nếu T<sub>j</sub> đọc dữ liệu do T<sub>i</sub> ghi thì **commit của T<sub>i</sub> đứng trước lệnh read của T<sub>j</sub>**. Mọi cascadeless schedule đều recoverable. Muốn: serializable + recoverable, tốt nhất là cascadeless (PE 17.7).

### 9. Isolation levels trong SQL
| Mức | Cho phép |
|---|---|
| **serializable** | (mặc định chuẩn SQL) kết quả như một serial schedule |
| **repeatable read** | chỉ đọc dữ liệu đã commit; đọc lại cùng item cho cùng giá trị; vẫn có thể có phantom |
| **read committed** | chỉ đọc dữ liệu đã commit; đọc lại có thể khác |
| **read uncommitted** | đọc được cả dữ liệu chưa commit (dirty read) |

Không mức nào cho phép **dirty write** (ghi đè item mà transaction khác chưa commit đã ghi). PostgreSQL mặc định **read committed**; `set transaction isolation level serializable`. **Lost update** (PE 17.8) có thể xảy ra ở read committed, không xảy ra ở repeatable read (giữ S-lock tới cuối hoặc kiểm tra khi ghi).

### 10. Cài đặt isolation (giới thiệu, chi tiết ở Chương 18)
- **Locking**: khoá trên dữ liệu, two-phase locking (S và X).
- **Timestamps**: gán timestamp, phát hiện truy cập sai thứ tự.
- **Multiversion / snapshot isolation**: mỗi transaction đọc một snapshot đã commit tại lúc bắt đầu; không chặn đọc, nhưng có thể không serializable (write skew — PE 17.9, 17.10).

### 11. Transaction trong SQL — phantom
Xung đột có thể ở **vị từ** chứ không chỉ ở tuple: T1 `select … where dept_name = 'Physics'` và T2 `insert` một instructor Physics — dù không chạm tuple chung, kết quả phụ thuộc thứ tự (**phantom phenomenon**). Giải pháp ở Chương 18 (index locking, predicate locking).

## 2. Trắc nghiệm (10 câu)

**Câu 1.** Tính chất nào của ACID được đảm bảo chủ yếu bởi **concurrency-control system**?

- A. Atomicity
- B. Consistency
- C. Isolation
- D. Durability

<details><summary>Đáp án</summary>

**C** — Isolation (kết quả như chạy tuần tự) do concurrency control đảm bảo; atomicity và durability do recovery system.

</details>

**Câu 2.** Hai lệnh nào **không** xung đột?

- A. read(Q) của T1 và write(Q) của T2
- B. write(Q) của T1 và write(Q) của T2
- C. read(Q) của T1 và read(Q) của T2
- D. write(Q) của T1 và read(Q) của T2

<details><summary>Đáp án</summary>

**C** — Chỉ xung đột khi cùng item, khác transaction và ít nhất một lệnh là write.

</details>

**Câu 3.** Schedule là conflict serializable khi và chỉ khi:

- A. Precedence graph có chu trình
- B. Precedence graph không có chu trình
- C. Mọi transaction đều commit
- D. Không có blind write

<details><summary>Đáp án</summary>

**B** — Đồ thị không chu trình ⇒ topological sort cho thứ tự serial tương đương.

</details>

**Câu 4.** Vì sao thực tế dùng conflict serializability thay vì view serializability?

- A. View serializability không đúng
- B. Kiểm tra view serializability là NP-complete
- C. Conflict serializability cho phép nhiều schedule hơn
- D. SQL không hỗ trợ view

<details><summary>Đáp án</summary>

**B** — PE 17.5: các giao thức thực tế dựa trên conflict serializability vì nó kiểm tra được hiệu quả.

</details>

**Câu 5.** T2 đọc A do T1 ghi rồi T2 commit, sau đó T1 abort. Schedule này:

- A. Recoverable
- B. Không recoverable
- C. Cascadeless
- D. Serial

<details><summary>Đáp án</summary>

**B** — Recoverable đòi hỏi T1 commit trước T2 vì T2 đọc dữ liệu của T1.

</details>

**Câu 6.** Schedule cascadeless đòi hỏi:

- A. T<sub>i</sub> commit trước khi T<sub>j</sub> commit
- B. T<sub>i</sub> commit trước khi T<sub>j</sub> đọc dữ liệu T<sub>i</sub> ghi
- C. Không transaction nào abort
- D. Các transaction không xen kẽ

<details><summary>Đáp án</summary>

**B** — Chỉ đọc dữ liệu đã commit ⇒ abort không lan sang transaction khác.

</details>

**Câu 7.** Schedule view serializable nhưng không conflict serializable luôn chứa:

- A. Dirty read
- B. Blind write
- C. Deadlock
- D. Phantom

<details><summary>Đáp án</summary>

**B** — Blind write: ghi mà không đọc trước.

</details>

**Câu 8.** Mức isolation nào cho phép **dirty read**?

- A. serializable
- B. repeatable read
- C. read committed
- D. read uncommitted

<details><summary>Đáp án</summary>

**D** — Read uncommitted cho đọc dữ liệu chưa commit; không mức nào cho dirty write.

</details>

**Câu 9.** Lost update có thể xảy ra ở mức nào (theo cài đặt bằng khoá như PE 17.8)?

- A. Chỉ serializable
- B. read committed
- C. repeatable read
- D. Không mức nào

<details><summary>Đáp án</summary>

**B** — Read committed nhả S-lock ngay sau khi đọc nên transaction khác ghi chen vào được.

</details>

**Câu 10.** Durability thật sự cần loại storage nào?

- A. Volatile
- B. Non-volatile
- C. Stable
- D. Cache

<details><summary>Đáp án</summary>

**C** — PE 17.4: chỉ stable storage (nhiều bản sao độc lập) đảm bảo không mất dữ liệu.

</details>

## 3. Câu hỏi tự luận (11 câu)

**Câu 1.** 

> **Exercise 17.1.** Assume a database system that never fails. Does such a system still need a recovery manager?

**PE 17.1.** Hệ thống không bao giờ hỏng có cần recovery manager không?

<details><summary>Gợi ý đáp án</summary>

**Có.** Recovery manager không chỉ dùng khi hệ thống crash: nó còn phải **rollback các transaction bị abort** — do lỗi logic (vi phạm ràng buộc, chia cho 0), do người dùng yêu cầu `rollback`, hoặc do concurrency control (deadlock, timestamp test thất bại). Rollback cần log (old value) để khôi phục — chính là công việc của recovery manager. Ngoài ra nó còn hỗ trợ savepoint và rollback một phần.

</details>

**Câu 2.** 

> **Exercise 17.2.** Think of a file system such as the one in your favorite operating system.
> 
> a. Which steps are involved in creating a file, deleting a file, and writing data to a file?
> 
> b. Explain why atomicity and durability matter for creating files, deleting files, and writing data to files.

**PE 17.2.** File system: các bước khi tạo, xoá file và ghi dữ liệu; atomicity và durability liên quan thế nào?

<details><summary>Gợi ý đáp án</summary>

a. **Tạo file**: cấp vùng lưu trữ/khối, cấp inode (UNIX: số i-number, chèn entry vào i-list), ghi metadata (kích thước, quyền, thời gian), thêm entry tên → inode vào thư mục. **Xoá file**: bỏ entry khỏi thư mục, giảm link count, giải phóng inode và các khối dữ liệu (ngược lại với tạo). **Ghi dữ liệu**: tìm/cấp khối mới nếu cần, ghi nội dung, cập nhật inode (kích thước, con trỏ khối, thời gian).

b. Mỗi thao tác gồm nhiều bước ghi đĩa:
- **Atomicity**: nếu crash giữa chừng (vd đã cấp inode nhưng chưa ghi entry thư mục, hoặc đã xoá entry nhưng chưa giải phóng khối) thì sinh ra file "mồ côi", khối không dùng được nhưng không được giải phóng, hoặc thư mục trỏ tới inode rác. Với người cài đặt file system, các bước tạo/xoá phải nguyên tử (journaling file system dùng log giống CSDL).
- **Durability**: người dùng mong khi `write`/`close` (hoặc `fsync`) trả về thì dữ liệu còn sau crash; nếu dữ liệu chỉ nằm trong buffer cache thì có thể mất.
- Với người *dùng* file system, atomicity của nhiều lần ghi thường không được đảm bảo (file system không có transaction), chỉ có durability ở mức `fsync`.

</details>

**Câu 3.** 

> **Exercise 17.3.** Implementers of database systems have cared far more about the ACID properties than implementers of file systems. Why might that be so?

**PE 17.3.** Vì sao người cài đặt CSDL quan tâm ACID nhiều hơn người cài đặt file system?

<details><summary>Gợi ý đáp án</summary>

- CSDL thường chạy các công việc **quan trọng** mà kết quả phải nguyên tử và bền vững, ảnh hưởng thế giới thực lâu dài: chuyển tiền, đặt chỗ, đơn hàng. Một nửa giao dịch chuyển tiền hay mất một lần đặt chỗ là không chấp nhận được.
- CSDL có nhiều người dùng cập nhật **đồng thời** cùng dữ liệu có cấu trúc, nên isolation và consistency là bắt buộc.
- Đa số người dùng file system không sẵn sàng trả giá (thời gian, dung lượng đĩa cho log, độ phức tạp) để có ACID đầy đủ; ứng dụng nào cần thì tự xử lý hoặc dùng CSDL.

</details>

**Câu 4.** 

> **Exercise 17.4.** Which class or classes of storage can be used to guarantee durability? Why?

**PE 17.4.** Loại storage nào đảm bảo durability? Vì sao?

<details><summary>Gợi ý đáp án</summary>

Chỉ **stable storage** đảm bảo durability thật sự. Volatile storage (RAM) mất dữ liệu khi mất điện/crash. Non-volatile storage (đĩa, flash) sống sót qua crash nhưng vẫn có thể hỏng (head crash, hỏng controller, cháy nổ). Stable storage là một **trừu tượng**: được xấp xỉ bằng cách lưu **nhiều bản sao** trên các thiết bị non-volatile có lỗi **độc lập**, và **phân tán về vị trí địa lý** (RAID, bản sao từ xa), để xác suất một sự cố làm mất mọi bản sao gần như bằng 0. Log của recovery system phải ghi lên stable storage trước khi báo commit.

</details>

**Câu 5.** 

> **Exercise 17.5.** Every conflict-serializable schedule is also view serializable. Why, then, do we emphasize conflict serializability instead of view serializability?

**PE 17.5.** Mọi schedule conflict serializable đều view serializable. Vì sao lại nhấn mạnh conflict serializability?

<details><summary>Gợi ý đáp án</summary>

- Kiểm tra view serializability tổng quát là **NP-complete** — quá đắt để dùng trực tuyến. Conflict serializability kiểm tra được bằng phát hiện chu trình trên precedence graph (đa thức).
- Các giao thức concurrency control dùng trong thực tế (two-phase locking, timestamp ordering, validation) đều được chứng minh dựa trên conflict serializability; chúng chỉ sinh ra một **tập con** các schedule conflict serializable.
- Phần chênh lệch (view serializable nhưng không conflict serializable) chỉ gồm các schedule có **blind write**, hiếm gặp trong thực tế, nên mất đi không đáng kể. Chỉ một dạng rất hạn chế của view serializability (Thomas write rule) được dùng.

</details>

**Câu 6.** 

> **Exercise 17.6.** Look at the precedence graph of Figure 17.16. Is the schedule it corresponds to conflict serializable? Justify your answer.
> 
> *Figure 17.16 — Precedence graph for Practice Exercise 17.6* (nodes T1–T5, edges):
> 
> T1 → T2, T1 → T3, T1 → T4, T2 → T3, T2 → T4, T3 → T5, T4 → T5

**PE 17.6.** Precedence graph ở Figure 17.16 có tương ứng với schedule conflict serializable không?

<details><summary>Gợi ý đáp án</summary>

Các cạnh: T1→T2, T1→T3, T1→T4, T2→T3, T2→T4, T3→T5, T4→T5. Mọi cạnh đều đi "xuống" theo thứ tự T1, T2, {T3, T4}, T5, nên đồ thị **không có chu trình** ⇒ schedule **conflict serializable**. Một thứ tự serial tương đương là topological sort: **T1, T2, T3, T4, T5** (T1, T2, T4, T3, T5 cũng được vì giữa T3 và T4 không có cạnh). Bài CH17.07 tính thứ tự này bằng recursive CTE.

</details>

**Câu 7.** 

> **Exercise 17.7.** What is a cascadeless schedule? Why is it desirable for schedules to be cascadeless? Are there situations in which allowing noncascadeless schedules would be preferable? Explain.

**PE 17.7.** Cascadeless schedule là gì, vì sao mong muốn, khi nào nên chấp nhận noncascadeless?

<details><summary>Gợi ý đáp án</summary>

- **Định nghĩa**: với mọi cặp T<sub>i</sub>, T<sub>j</sub> mà T<sub>j</sub> đọc data item do T<sub>i</sub> ghi trước đó, **commit của T<sub>i</sub> xuất hiện trước lệnh read** đó của T<sub>j</sub>. Nói cách khác, transaction chỉ đọc dữ liệu đã commit.
- **Vì sao mong muốn**: khi một transaction abort, không transaction nào khác đã đọc dữ liệu của nó, nên **không có cascading rollback** — tránh phải huỷ một chuỗi công việc dài. Cascadeless cũng kéo theo recoverable.
- **Khi nào chấp nhận noncascadeless**: cascadeless làm giảm mức đồng thời (phải chờ commit mới đọc). Nếu abort **rất hiếm**, có thể chấp nhận rủi ro thỉnh thoảng phải cascading rollback để đổi lấy concurrency cao hơn (nhưng vẫn phải recoverable).

</details>

**Câu 8.** 

> **Exercise 17.8.** A *lost update* anomaly happens when a transaction T<sub>j</sub> reads a data item, another transaction T<sub>k</sub> then writes that item (possibly based on an earlier read), and afterwards T<sub>j</sub> writes the item. The update made by T<sub>k</sub> is lost, because T<sub>j</sub>'s update did not take into account the value T<sub>k</sub> wrote.
> 
> a. Give a schedule that exhibits the lost update anomaly.
> 
> b. Give a schedule showing that the lost update anomaly can occur under the **read committed** isolation level.
> 
> c. Explain why the lost update anomaly cannot occur under the **repeatable read** isolation level.

**PE 17.8.** Lost update: cho schedule minh hoạ; minh hoạ ở read committed; vì sao repeatable read không bị?

<details><summary>Gợi ý đáp án</summary>

a. Schedule có lost update:

| T1 | T2 |
|---|---|
| read(A) | |
| | read(A) |
| | write(A) |
| write(A) | |

T1 đọc A, T2 ghi A, rồi T1 ghi A dựa trên giá trị cũ → cập nhật của T2 bị mất. (Bảng `tx_sched` S2 là một ví dụ, bài CH17.10 tìm nó bằng SQL.)

b. Ở **read committed** cài bằng khoá (S-lock nhả ngay sau khi đọc, X-lock giữ tới commit):

| T1 | T2 |
|---|---|
| lock-S(A); read(A); unlock(A) | |
| | lock-X(A); read(A); write(A); commit; unlock(A) |
| lock-X(A); write(A); commit; unlock(A) | |

Mọi lần đọc đều đọc dữ liệu đã commit, nhưng giá trị T2 ghi vẫn bị T1 ghi đè.

c. Ở **repeatable read**, T1 đọc X thì giữ S-lock tới cuối transaction. T2 muốn ghi X phải có X-lock nên phải chờ T1 kết thúc ⇒ thứ tự buộc là T1 rồi T2, giá trị của T2 không bị mất. (Nếu T1 cũng muốn ghi thì hai bên chờ nhau → deadlock, một bên bị rollback — vẫn không có lost update.)

</details>

**Câu 9.** 

> **Exercise 17.9.** A bank's database system uses snapshot isolation. Describe a concrete scenario in which a nonserializable execution occurs and causes a problem for the bank.

**PE 17.9.** Ngân hàng dùng snapshot isolation: tình huống không serializable gây hại?

<details><summary>Gợi ý đáp án</summary>

Ràng buộc: tổng số dư tài khoản **checking + savings** của một khách không được âm. Khách có checking = 100, savings = 200.
- T1 rút 200 từ **checking**: đọc cả hai số dư trên snapshot (100 + 200 = 300), thấy rút 200 vẫn còn 100 ≥ 0 → ghi checking = −100.
- T2 chạy đồng thời rút 200 từ **savings**: đọc snapshot cũ (100 + 200), thấy hợp lệ → ghi savings = 0.
Hai transaction ghi **hai item khác nhau**, nên first-committer-wins không phát hiện xung đột; cả hai commit. Kết quả tổng = −100, vi phạm ràng buộc — không serial schedule nào cho kết quả này (**write skew**). Ngân hàng mất tiền. (Sửa: dùng serializable snapshot isolation hoặc `select … for update` để đọc có khoá.)

</details>

**Câu 10.** 

> **Exercise 17.10.** An airline's database system uses snapshot isolation. Describe a concrete scenario in which a nonserializable execution occurs, but the airline might accept it in exchange for better overall performance.

**PE 17.10.** Hãng bay dùng snapshot isolation: tình huống không serializable nhưng có thể chấp nhận vì hiệu năng?

<details><summary>Gợi ý đáp án</summary>

Hệ thống đặt vé trên web, chuyến bay còn **1 ghế**. Hai khách A và B đặt cùng lúc: T3 và T4 mỗi bên đếm số ghế đã đặt trên snapshot của mình, thấy còn 1, và **chèn** một bản ghi đặt chỗ mới. Hai transaction không cập nhật tuple chung nên snapshot isolation cho cả hai commit → **overbooking** 1 chỗ, không serializable.
Hãng bay có thể chấp nhận vì: thường có khách huỷ vé trước giờ bay; nếu vẫn thừa thì đổi một khách sang chuyến khác kèm bồi thường — hãng vốn đã chủ động overbook. Đổi lại, các transaction đọc (xem chuyến, xem ghế) **không bao giờ bị chặn** bởi transaction ghi, nên hệ thống chịu tải cao tốt hơn nhiều.

</details>

**Câu 11.** 

> **Exercise 17.11.** The definition of a schedule assumes that all operations can be totally ordered in time. Now consider a database system running on a machine with several processors, where an exact ordering between operations executed on different processors cannot always be determined; operations on any single data item, however, can still be totally ordered.
> 
> Does this cause any problem for the definition of conflict serializability? Explain.

**PE 17.11.** Hệ đa bộ xử lý không sắp được thứ tự tuyệt đối giữa các thao tác trên các bộ xử lý khác nhau, nhưng thao tác trên cùng một data item thì sắp được. Định nghĩa conflict serializability có bị ảnh hưởng không?

<details><summary>Gợi ý đáp án</summary>

**Không.** Conflict serializability chỉ dựa vào thứ tự giữa các **cặp lệnh xung đột**, mà hai lệnh xung đột luôn truy cập **cùng một data item** — thứ tự của chúng xác định được. Thứ tự giữa các lệnh trên **các item khác nhau** không bao giờ được dùng: chúng không xung đột và có thể đổi chỗ tuỳ ý. Ví dụ T1: read(A), write(B); T2: read(B): chỉ cần biết thứ tự read(B) so với write(B); read(A) và read(B) theo thứ tự nào cũng được. Vì vậy precedence graph vẫn xác định duy nhất và định nghĩa vẫn đúng.

</details>

## 4. Bài tập SQL (13 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH17.01 | commit | ★☆☆ | Viết một transaction chuyển 100 từ tài khoản `A-101` sang `A-102` (bảng `tx_account`) rồi commit. *(Bài này chạy trên CSDL mới, được dùng begin/commit.)* |
| CH17.02 | atomicity | ★★★ | Viết hàm PL/pgSQL `tx_transfer(src varchar, dst varchar, amt numeric) returns text` chuyển `amt` từ `src` sang `dst` trong `tx_account`: cộng vào dst trước, trừ src sau. Nếu việc trừ vi phạm `check (balance >= 0)` thì không được để lại thay đổi nào (kể cả phần đã cộng vào dst) và trả về `'FAILED'`; thành công trả về `'OK'`. Khi chấm, hệ thống gọi `tx_transfer('A-101', 'A-102', 100)` và `tx_transfer('A-102', 'A-301', 1000)` rồi đọc số dư. |
| CH17.03 | savepoint | ★★☆ | Trong một transaction: cộng 50 vào `A-201`; tạo `savepoint s1`; đặt số dư mọi tài khoản của `Bob` về 0; rollback về s1; cộng 25 vào `A-301`; commit. |
| CH17.04 | conflicting operations | ★★☆ | `tx_sched(sched_id, step, txn, op, item)` lưu các schedule (op: R, W, C = commit, A = abort). Liệt kê mọi cặp lệnh xung đột của schedule `S1`: `step1, step2, txn1, txn2, item` với step1 < step2. |
| CH17.05 | precedence graph | ★★☆ | Trả về các cạnh `src, dst` (không trùng) của precedence graph của schedule `S6`. |
| CH17.06 | cycle detection | ★★★ | Với mỗi schedule trong `tx_sched`, cho biết có conflict serializable không: `sched_id, conflict_serializable` (boolean). Dùng recursive CTE tìm chu trình trên precedence graph. |
| CH17.07 | topological order | ★★★ | Exercise 17.6. Look at the precedence graph of Figure 17.16. Is the schedule it corresponds to conflict serializable? Justify your answer.  *Figure 17.16 — Precedence graph for Practice Exercise 17.6* (nodes T1–T5, edges):  T1 → T2, T1 → T3, T1 → T4, T2 → T3, T2 → T4, T3 → T5, T4 → T5<br>`tx_pg_edge(graph, src, dst)` chứa precedence graph `F17.16` của Figure 17.16. Tính thứ tự serial tương đương: mỗi transaction cùng `level` = độ dài đường đi dài nhất từ một đỉnh không có cạnh vào. Trả về `txn, level`, sắp theo level rồi txn. |
| CH17.08 | reads-from | ★★☆ | Quan hệ reads-from của schedule `S4`: với mỗi lệnh R, trả về `step, reader, item, writer` — writer là transaction thực hiện lệnh W gần nhất trước đó trên cùng item, hoặc `initial` nếu chưa có ai ghi. |
| CH17.09 | recoverable / cascadeless | ★★★ | Exercise 17.7. What is a cascadeless schedule? Why is it desirable for schedules to be cascadeless? Are there situations in which allowing noncascadeless schedules would be preferable? Explain.<br>Với mỗi schedule, trả về `sched_id, recoverable, cascadeless` (boolean). Dùng quan hệ reads-from ở CH17.08 (bỏ trường hợp đọc giá trị ban đầu hoặc đọc chính dữ liệu mình ghi). Recoverable: reader đã commit thì writer phải commit trước reader. Cascadeless: writer phải commit trước lệnh read. |
| CH17.10 | lost update | ★★★ | Exercise 17.8 (a). A *lost update* anomaly happens when a transaction T[j] reads a data item, another transaction T[k] then writes that item (possibly based on an earlier read), and afterwards T[j] writes the item. The update made by T[k] is lost, because T[j]'s update did not take into account the value T[k] wrote.  a. Give a schedule that exhibits the lost update anomaly.<br>Tìm lost update trong schedule `S2`: T[j] đọc X, sau đó T[k] (khác T[j]) ghi X, sau đó T[j] ghi X. Trả về `lost_txn` (T[k], người bị mất cập nhật), `overwriting_txn` (T[j]), `item`. |
| CH17.11 | serial schedule | ★★☆ | Với mỗi schedule, cho biết có phải serial schedule không (mọi lệnh của mỗi transaction nằm liền nhau): `sched_id, is_serial`. |
| CH17.12 | final write | ★★☆ | Điều kiện thứ 3 của view equivalence dùng final write. Với mỗi schedule và mỗi item, trả về transaction ghi item đó lần cuối: `sched_id, item, final_writer`. |
| CH17.13 | cycle members | ★★★ | Trong `tx_pg_edge`, đồ thị `G2` có chu trình. Trả về các transaction nằm trên một chu trình (`txn`) — đó là các transaction không thể xếp vào thứ tự serial. |
