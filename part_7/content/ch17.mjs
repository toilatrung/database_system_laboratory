export default {
  number: 17,
  slug: 'ch17_transactions',
  title: 'Transactions',
  titleVi: 'Giao tác (Transactions)',

  summary: `
### 1. Khái niệm transaction
- **Transaction** là một đơn vị thực thi chương trình truy cập và có thể cập nhật nhiều data item. Ví dụ chuyển 50 từ A sang B:
\`read(A); A := A − 50; write(A); read(B); B := B + 50; write(B)\`.
- Hai vấn đề chính cần giải quyết: **lỗi** (phần cứng, hệ thống crash) và **thực thi đồng thời** nhiều transaction.
- Trong SQL: transaction bắt đầu ngầm định; kết thúc bằng \`commit work\` hoặc \`rollback work\`. PostgreSQL: \`begin; … commit;\` / \`rollback;\`, \`savepoint s; rollback to savepoint s;\`.

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

| I \\ J | read(Q) | write(Q) |
|---|---|---|
| read(Q) | không | conflict |
| write(Q) | conflict | conflict |

- Đổi chỗ hai lệnh liền kề **không xung đột** không làm đổi kết quả.
- S và S′ **conflict equivalent** nếu biến được S thành S′ bằng các lần đổi chỗ lệnh không xung đột.
- S **conflict serializable** nếu conflict equivalent với một serial schedule.

**Precedence graph**: đỉnh là transaction; cạnh T<sub>i</sub> → T<sub>j</sub> nếu có cặp lệnh xung đột mà lệnh của T<sub>i</sub> đứng trước. **S conflict serializable ⇔ precedence graph không có chu trình.** Thứ tự serial tương đương = một **topological sort** của đồ thị (PE 17.6). Phát hiện chu trình: O(n²) với DFS (hoặc O(n + e)).

Viết bằng SQL khi schedule lưu thành bảng \`sched(step, txn, op, item)\`:
\`\`\`sql
select distinct a.txn as src, b.txn as dst
from sched a join sched b
  on a.item = b.item and a.step < b.step and a.txn <> b.txn
where 'W' in (a.op, b.op);
\`\`\`
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

Không mức nào cho phép **dirty write** (ghi đè item mà transaction khác chưa commit đã ghi). PostgreSQL mặc định **read committed**; \`set transaction isolation level serializable\`. **Lost update** (PE 17.8) có thể xảy ra ở read committed, không xảy ra ở repeatable read (giữ S-lock tới cuối hoặc kiểm tra khi ghi).

### 10. Cài đặt isolation (giới thiệu, chi tiết ở Chương 18)
- **Locking**: khoá trên dữ liệu, two-phase locking (S và X).
- **Timestamps**: gán timestamp, phát hiện truy cập sai thứ tự.
- **Multiversion / snapshot isolation**: mỗi transaction đọc một snapshot đã commit tại lúc bắt đầu; không chặn đọc, nhưng có thể không serializable (write skew — PE 17.9, 17.10).

### 11. Transaction trong SQL — phantom
Xung đột có thể ở **vị từ** chứ không chỉ ở tuple: T1 \`select … where dept_name = 'Physics'\` và T2 \`insert\` một instructor Physics — dù không chạm tuple chung, kết quả phụ thuộc thứ tự (**phantom phenomenon**). Giải pháp ở Chương 18 (index locking, predicate locking).
`,

  quiz: [
    {
      q: 'Tính chất nào của ACID được đảm bảo chủ yếu bởi **concurrency-control system**?',
      options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
      answer: 2,
      explain: 'Isolation (kết quả như chạy tuần tự) do concurrency control đảm bảo; atomicity và durability do recovery system.',
    },
    {
      q: 'Hai lệnh nào **không** xung đột?',
      options: ['read(Q) của T1 và write(Q) của T2', 'write(Q) của T1 và write(Q) của T2', 'read(Q) của T1 và read(Q) của T2', 'write(Q) của T1 và read(Q) của T2'],
      answer: 2,
      explain: 'Chỉ xung đột khi cùng item, khác transaction và ít nhất một lệnh là write.',
    },
    {
      q: 'Schedule là conflict serializable khi và chỉ khi:',
      options: ['Precedence graph có chu trình', 'Precedence graph không có chu trình', 'Mọi transaction đều commit', 'Không có blind write'],
      answer: 1,
      explain: 'Đồ thị không chu trình ⇒ topological sort cho thứ tự serial tương đương.',
    },
    {
      q: 'Vì sao thực tế dùng conflict serializability thay vì view serializability?',
      options: ['View serializability không đúng', 'Kiểm tra view serializability là NP-complete', 'Conflict serializability cho phép nhiều schedule hơn', 'SQL không hỗ trợ view'],
      answer: 1,
      explain: 'PE 17.5: các giao thức thực tế dựa trên conflict serializability vì nó kiểm tra được hiệu quả.',
    },
    {
      q: 'T2 đọc A do T1 ghi rồi T2 commit, sau đó T1 abort. Schedule này:',
      options: ['Recoverable', 'Không recoverable', 'Cascadeless', 'Serial'],
      answer: 1,
      explain: 'Recoverable đòi hỏi T1 commit trước T2 vì T2 đọc dữ liệu của T1.',
    },
    {
      q: 'Schedule cascadeless đòi hỏi:',
      options: ['T<sub>i</sub> commit trước khi T<sub>j</sub> commit', 'T<sub>i</sub> commit trước khi T<sub>j</sub> đọc dữ liệu T<sub>i</sub> ghi', 'Không transaction nào abort', 'Các transaction không xen kẽ'],
      answer: 1,
      explain: 'Chỉ đọc dữ liệu đã commit ⇒ abort không lan sang transaction khác.',
    },
    {
      q: 'Schedule view serializable nhưng không conflict serializable luôn chứa:',
      options: ['Dirty read', 'Blind write', 'Deadlock', 'Phantom'],
      answer: 1,
      explain: 'Blind write: ghi mà không đọc trước.',
    },
    {
      q: 'Mức isolation nào cho phép **dirty read**?',
      options: ['serializable', 'repeatable read', 'read committed', 'read uncommitted'],
      answer: 3,
      explain: 'Read uncommitted cho đọc dữ liệu chưa commit; không mức nào cho dirty write.',
    },
    {
      q: 'Lost update có thể xảy ra ở mức nào (theo cài đặt bằng khoá như PE 17.8)?',
      options: ['Chỉ serializable', 'read committed', 'repeatable read', 'Không mức nào'],
      answer: 1,
      explain: 'Read committed nhả S-lock ngay sau khi đọc nên transaction khác ghi chen vào được.',
    },
    {
      q: 'Durability thật sự cần loại storage nào?',
      options: ['Volatile', 'Non-volatile', 'Stable', 'Cache'],
      answer: 2,
      explain: 'PE 17.4: chỉ stable storage (nhiều bản sao độc lập) đảm bảo không mất dữ liệu.',
    },
  ],

  questions: [
    {
      pe: '17.1',
      q: '**PE 17.1.** Hệ thống không bao giờ hỏng có cần recovery manager không?',
      answer: `**Có.** Recovery manager không chỉ dùng khi hệ thống crash: nó còn phải **rollback các transaction bị abort** — do lỗi logic (vi phạm ràng buộc, chia cho 0), do người dùng yêu cầu \`rollback\`, hoặc do concurrency control (deadlock, timestamp test thất bại). Rollback cần log (old value) để khôi phục — chính là công việc của recovery manager. Ngoài ra nó còn hỗ trợ savepoint và rollback một phần.`,
    },
    {
      pe: '17.2',
      q: '**PE 17.2.** File system: các bước khi tạo, xoá file và ghi dữ liệu; atomicity và durability liên quan thế nào?',
      answer: `a. **Tạo file**: cấp vùng lưu trữ/khối, cấp inode (UNIX: số i-number, chèn entry vào i-list), ghi metadata (kích thước, quyền, thời gian), thêm entry tên → inode vào thư mục. **Xoá file**: bỏ entry khỏi thư mục, giảm link count, giải phóng inode và các khối dữ liệu (ngược lại với tạo). **Ghi dữ liệu**: tìm/cấp khối mới nếu cần, ghi nội dung, cập nhật inode (kích thước, con trỏ khối, thời gian).

b. Mỗi thao tác gồm nhiều bước ghi đĩa:
- **Atomicity**: nếu crash giữa chừng (vd đã cấp inode nhưng chưa ghi entry thư mục, hoặc đã xoá entry nhưng chưa giải phóng khối) thì sinh ra file "mồ côi", khối không dùng được nhưng không được giải phóng, hoặc thư mục trỏ tới inode rác. Với người cài đặt file system, các bước tạo/xoá phải nguyên tử (journaling file system dùng log giống CSDL).
- **Durability**: người dùng mong khi \`write\`/\`close\` (hoặc \`fsync\`) trả về thì dữ liệu còn sau crash; nếu dữ liệu chỉ nằm trong buffer cache thì có thể mất.
- Với người *dùng* file system, atomicity của nhiều lần ghi thường không được đảm bảo (file system không có transaction), chỉ có durability ở mức \`fsync\`.`,
    },
    {
      pe: '17.3',
      q: '**PE 17.3.** Vì sao người cài đặt CSDL quan tâm ACID nhiều hơn người cài đặt file system?',
      answer: `- CSDL thường chạy các công việc **quan trọng** mà kết quả phải nguyên tử và bền vững, ảnh hưởng thế giới thực lâu dài: chuyển tiền, đặt chỗ, đơn hàng. Một nửa giao dịch chuyển tiền hay mất một lần đặt chỗ là không chấp nhận được.
- CSDL có nhiều người dùng cập nhật **đồng thời** cùng dữ liệu có cấu trúc, nên isolation và consistency là bắt buộc.
- Đa số người dùng file system không sẵn sàng trả giá (thời gian, dung lượng đĩa cho log, độ phức tạp) để có ACID đầy đủ; ứng dụng nào cần thì tự xử lý hoặc dùng CSDL.`,
    },
    {
      pe: '17.4',
      q: '**PE 17.4.** Loại storage nào đảm bảo durability? Vì sao?',
      answer: `Chỉ **stable storage** đảm bảo durability thật sự. Volatile storage (RAM) mất dữ liệu khi mất điện/crash. Non-volatile storage (đĩa, flash) sống sót qua crash nhưng vẫn có thể hỏng (head crash, hỏng controller, cháy nổ). Stable storage là một **trừu tượng**: được xấp xỉ bằng cách lưu **nhiều bản sao** trên các thiết bị non-volatile có lỗi **độc lập**, và **phân tán về vị trí địa lý** (RAID, bản sao từ xa), để xác suất một sự cố làm mất mọi bản sao gần như bằng 0. Log của recovery system phải ghi lên stable storage trước khi báo commit.`,
    },
    {
      pe: '17.5',
      q: '**PE 17.5.** Mọi schedule conflict serializable đều view serializable. Vì sao lại nhấn mạnh conflict serializability?',
      answer: `- Kiểm tra view serializability tổng quát là **NP-complete** — quá đắt để dùng trực tuyến. Conflict serializability kiểm tra được bằng phát hiện chu trình trên precedence graph (đa thức).
- Các giao thức concurrency control dùng trong thực tế (two-phase locking, timestamp ordering, validation) đều được chứng minh dựa trên conflict serializability; chúng chỉ sinh ra một **tập con** các schedule conflict serializable.
- Phần chênh lệch (view serializable nhưng không conflict serializable) chỉ gồm các schedule có **blind write**, hiếm gặp trong thực tế, nên mất đi không đáng kể. Chỉ một dạng rất hạn chế của view serializability (Thomas write rule) được dùng.`,
    },
    {
      pe: '17.6',
      q: '**PE 17.6.** Precedence graph ở Figure 17.16 có tương ứng với schedule conflict serializable không?',
      answer: `Các cạnh: T1→T2, T1→T3, T1→T4, T2→T3, T2→T4, T3→T5, T4→T5. Mọi cạnh đều đi "xuống" theo thứ tự T1, T2, {T3, T4}, T5, nên đồ thị **không có chu trình** ⇒ schedule **conflict serializable**. Một thứ tự serial tương đương là topological sort: **T1, T2, T3, T4, T5** (T1, T2, T4, T3, T5 cũng được vì giữa T3 và T4 không có cạnh). Bài CH17.07 tính thứ tự này bằng recursive CTE.`,
    },
    {
      pe: '17.7',
      q: '**PE 17.7.** Cascadeless schedule là gì, vì sao mong muốn, khi nào nên chấp nhận noncascadeless?',
      answer: `- **Định nghĩa**: với mọi cặp T<sub>i</sub>, T<sub>j</sub> mà T<sub>j</sub> đọc data item do T<sub>i</sub> ghi trước đó, **commit của T<sub>i</sub> xuất hiện trước lệnh read** đó của T<sub>j</sub>. Nói cách khác, transaction chỉ đọc dữ liệu đã commit.
- **Vì sao mong muốn**: khi một transaction abort, không transaction nào khác đã đọc dữ liệu của nó, nên **không có cascading rollback** — tránh phải huỷ một chuỗi công việc dài. Cascadeless cũng kéo theo recoverable.
- **Khi nào chấp nhận noncascadeless**: cascadeless làm giảm mức đồng thời (phải chờ commit mới đọc). Nếu abort **rất hiếm**, có thể chấp nhận rủi ro thỉnh thoảng phải cascading rollback để đổi lấy concurrency cao hơn (nhưng vẫn phải recoverable).`,
    },
    {
      pe: '17.8',
      q: '**PE 17.8.** Lost update: cho schedule minh hoạ; minh hoạ ở read committed; vì sao repeatable read không bị?',
      answer: `a. Schedule có lost update:

| T1 | T2 |
|---|---|
| read(A) | |
| | read(A) |
| | write(A) |
| write(A) | |

T1 đọc A, T2 ghi A, rồi T1 ghi A dựa trên giá trị cũ → cập nhật của T2 bị mất. (Bảng \`tx_sched\` S2 là một ví dụ, bài CH17.10 tìm nó bằng SQL.)

b. Ở **read committed** cài bằng khoá (S-lock nhả ngay sau khi đọc, X-lock giữ tới commit):

| T1 | T2 |
|---|---|
| lock-S(A); read(A); unlock(A) | |
| | lock-X(A); read(A); write(A); commit; unlock(A) |
| lock-X(A); write(A); commit; unlock(A) | |

Mọi lần đọc đều đọc dữ liệu đã commit, nhưng giá trị T2 ghi vẫn bị T1 ghi đè.

c. Ở **repeatable read**, T1 đọc X thì giữ S-lock tới cuối transaction. T2 muốn ghi X phải có X-lock nên phải chờ T1 kết thúc ⇒ thứ tự buộc là T1 rồi T2, giá trị của T2 không bị mất. (Nếu T1 cũng muốn ghi thì hai bên chờ nhau → deadlock, một bên bị rollback — vẫn không có lost update.)`,
    },
    {
      pe: '17.9',
      q: '**PE 17.9.** Ngân hàng dùng snapshot isolation: tình huống không serializable gây hại?',
      answer: `Ràng buộc: tổng số dư tài khoản **checking + savings** của một khách không được âm. Khách có checking = 100, savings = 200.
- T1 rút 200 từ **checking**: đọc cả hai số dư trên snapshot (100 + 200 = 300), thấy rút 200 vẫn còn 100 ≥ 0 → ghi checking = −100.
- T2 chạy đồng thời rút 200 từ **savings**: đọc snapshot cũ (100 + 200), thấy hợp lệ → ghi savings = 0.
Hai transaction ghi **hai item khác nhau**, nên first-committer-wins không phát hiện xung đột; cả hai commit. Kết quả tổng = −100, vi phạm ràng buộc — không serial schedule nào cho kết quả này (**write skew**). Ngân hàng mất tiền. (Sửa: dùng serializable snapshot isolation hoặc \`select … for update\` để đọc có khoá.)`,
    },
    {
      pe: '17.10',
      q: '**PE 17.10.** Hãng bay dùng snapshot isolation: tình huống không serializable nhưng có thể chấp nhận vì hiệu năng?',
      answer: `Hệ thống đặt vé trên web, chuyến bay còn **1 ghế**. Hai khách A và B đặt cùng lúc: T3 và T4 mỗi bên đếm số ghế đã đặt trên snapshot của mình, thấy còn 1, và **chèn** một bản ghi đặt chỗ mới. Hai transaction không cập nhật tuple chung nên snapshot isolation cho cả hai commit → **overbooking** 1 chỗ, không serializable.
Hãng bay có thể chấp nhận vì: thường có khách huỷ vé trước giờ bay; nếu vẫn thừa thì đổi một khách sang chuyến khác kèm bồi thường — hãng vốn đã chủ động overbook. Đổi lại, các transaction đọc (xem chuyến, xem ghế) **không bao giờ bị chặn** bởi transaction ghi, nên hệ thống chịu tải cao tốt hơn nhiều.`,
    },
    {
      pe: '17.11',
      q: '**PE 17.11.** Hệ đa bộ xử lý không sắp được thứ tự tuyệt đối giữa các thao tác trên các bộ xử lý khác nhau, nhưng thao tác trên cùng một data item thì sắp được. Định nghĩa conflict serializability có bị ảnh hưởng không?',
      answer: `**Không.** Conflict serializability chỉ dựa vào thứ tự giữa các **cặp lệnh xung đột**, mà hai lệnh xung đột luôn truy cập **cùng một data item** — thứ tự của chúng xác định được. Thứ tự giữa các lệnh trên **các item khác nhau** không bao giờ được dùng: chúng không xung đột và có thể đổi chỗ tuỳ ý. Ví dụ T1: read(A), write(B); T2: read(B): chỉ cần biết thứ tự read(B) so với write(B); read(A) và read(B) theo thứ tự nào cũng được. Vì vậy precedence graph vẫn xác định duy nhất và định nghĩa vẫn đúng.`,
    },
  ],

  exercises: [
    // ---------------- Transaction thật (CSDL mới) ----------------
    {
      id: 'CH17.01', topic: 'commit', level: 1, fresh: true,
      prompt: 'Viết **một transaction** chuyển 100 từ tài khoản `A-101` sang `A-102` (bảng `tx_account`) rồi **commit**. *(Bài này chạy trên CSDL mới, được dùng begin/commit.)*',
      solution: `begin;
update tx_account set balance = balance - 100 where acc_id = 'A-101';
update tx_account set balance = balance + 100 where acc_id = 'A-102';
commit;`,
      check: `select acc_id, balance from tx_account order by acc_id;`,
    },
    {
      id: 'CH17.02', topic: 'atomicity', level: 3,
      prompt: `Viết hàm PL/pgSQL \`tx_transfer(src varchar, dst varchar, amt numeric) returns text\` chuyển \`amt\` từ \`src\` sang \`dst\` trong \`tx_account\`: **cộng vào dst trước, trừ src sau**. Nếu việc trừ vi phạm \`check (balance >= 0)\` thì **không được để lại thay đổi nào** (kể cả phần đã cộng vào dst) và trả về \`'FAILED'\`; thành công trả về \`'OK'\`.
Khi chấm, hệ thống gọi \`tx_transfer('A-101', 'A-102', 100)\` và \`tx_transfer('A-102', 'A-301', 1000)\` rồi đọc số dư.`,
      hint: 'Khối begin … exception when check_violation then … end trong PL/pgSQL là một subtransaction: lỗi trong khối làm huỷ mọi thay đổi của khối.',
      solution: `create function tx_transfer(src varchar, dst varchar, amt numeric) returns text as $$
begin
  update tx_account set balance = balance + amt where acc_id = dst;
  update tx_account set balance = balance - amt where acc_id = src;
  return 'OK';
exception when check_violation then
  return 'FAILED';
end;
$$ language plpgsql;`,
      check: `select tx_transfer('A-101', 'A-102', 100) as first_call,
       tx_transfer('A-102', 'A-301', 1000) as second_call,
       sql_value($$select string_agg(acc_id || '=' || balance, ', ' order by acc_id) from tx_account$$) as balances;`,
    },
    {
      id: 'CH17.03', topic: 'savepoint', level: 2, fresh: true,
      prompt: 'Trong một transaction: cộng 50 vào `A-201`; tạo `savepoint s1`; đặt số dư mọi tài khoản của `Bob` về 0; **rollback về s1**; cộng 25 vào `A-301`; commit.',
      solution: `begin;
update tx_account set balance = balance + 50 where acc_id = 'A-201';
savepoint s1;
update tx_account set balance = 0 where owner = 'Bob';
rollback to savepoint s1;
update tx_account set balance = balance + 25 where acc_id = 'A-301';
commit;`,
      check: `select acc_id, balance from tx_account order by acc_id;`,
    },
    // ---------------- Phân tích schedule ----------------
    {
      id: 'CH17.04', topic: 'conflicting operations', level: 2,
      prompt: '`tx_sched(sched_id, step, txn, op, item)` lưu các schedule (op: R, W, C = commit, A = abort). Liệt kê mọi **cặp lệnh xung đột** của schedule `S1`: `step1, step2, txn1, txn2, item` với step1 < step2.',
      hint: 'Cùng item, khác transaction, ít nhất một W; bỏ C/A.',
      solution: `select a.step as step1, b.step as step2, a.txn as txn1, b.txn as txn2, a.item
from tx_sched a
     join tx_sched b on b.sched_id = a.sched_id and b.item = a.item
                    and a.step < b.step and a.txn <> b.txn
where a.sched_id = 'S1' and 'W' in (a.op, b.op);`,
    },
    {
      id: 'CH17.05', topic: 'precedence graph', level: 2,
      prompt: 'Trả về các cạnh `src, dst` (không trùng) của **precedence graph** của schedule `S6`.',
      solution: `select distinct a.txn as src, b.txn as dst
from tx_sched a
     join tx_sched b on b.sched_id = a.sched_id and b.item = a.item
                    and a.step < b.step and a.txn <> b.txn
where a.sched_id = 'S6' and 'W' in (a.op, b.op);`,
    },
    {
      id: 'CH17.06', topic: 'cycle detection', level: 3,
      prompt: 'Với **mỗi** schedule trong `tx_sched`, cho biết có **conflict serializable** không: `sched_id, conflict_serializable` (boolean). Dùng recursive CTE tìm chu trình trên precedence graph.',
      hint: 'Tính bao đóng bắc cầu reach(src, dst); có chu trình ⇔ tồn tại reach(T, T).',
      solution: `with recursive e as (
  select distinct a.sched_id, a.txn as src, b.txn as dst
  from tx_sched a
       join tx_sched b on b.sched_id = a.sched_id and b.item = a.item
                      and a.step < b.step and a.txn <> b.txn
  where 'W' in (a.op, b.op)
), reach (sched_id, src, dst) as (
  select sched_id, src, dst from e
  union
  select r.sched_id, r.src, e.dst
  from reach r join e on e.sched_id = r.sched_id and e.src = r.dst
)
select s.sched_id,
       not exists (select 1 from reach r where r.sched_id = s.sched_id and r.src = r.dst) as conflict_serializable
from (select distinct sched_id from tx_sched) s;`,
    },
    {
      id: 'CH17.07', topic: 'topological order', level: 3, pe: '17.6',
      prompt: '`tx_pg_edge(graph, src, dst)` chứa precedence graph `F17.16` của Figure 17.16. Tính **thứ tự serial tương đương**: mỗi transaction cùng `level` = độ dài đường đi **dài nhất** từ một đỉnh không có cạnh vào. Trả về `txn, level`, **sắp theo level rồi txn**.',
      solution: `with recursive lvl (txn, level) as (
  select g.src, 0 from tx_pg_edge g
  where g.graph = 'F17.16'
    and not exists (select 1 from tx_pg_edge h where h.graph = g.graph and h.dst = g.src)
  union
  select e.dst, l.level + 1
  from lvl l join tx_pg_edge e on e.graph = 'F17.16' and e.src = l.txn
)
select txn, max(level) as level
from lvl
group by txn
order by level, txn;`,
      ordered: true,
    },
    {
      id: 'CH17.08', topic: 'reads-from', level: 2,
      prompt: 'Quan hệ **reads-from** của schedule `S4`: với mỗi lệnh R, trả về `step, reader, item, writer` — writer là transaction thực hiện **lệnh W gần nhất trước đó** trên cùng item, hoặc `initial` nếu chưa có ai ghi.',
      solution: `select r.step, r.txn as reader, r.item,
       coalesce((select w.txn from tx_sched w
                 where w.sched_id = r.sched_id and w.item = r.item and w.op = 'W' and w.step < r.step
                 order by w.step desc limit 1), 'initial') as writer
from tx_sched r
where r.sched_id = 'S4' and r.op = 'R';`,
    },
    {
      id: 'CH17.09', topic: 'recoverable / cascadeless', level: 3, pe: '17.7',
      prompt: 'Với mỗi schedule, trả về `sched_id, recoverable, cascadeless` (boolean). Dùng quan hệ reads-from ở CH17.08 (bỏ trường hợp đọc giá trị ban đầu hoặc đọc chính dữ liệu mình ghi). **Recoverable**: reader đã commit thì writer phải commit trước reader. **Cascadeless**: writer phải commit trước lệnh read.',
      solution: `with rf as (
  select r.sched_id, r.step as read_step, r.txn as reader,
         (select w.txn from tx_sched w
          where w.sched_id = r.sched_id and w.item = r.item and w.op = 'W' and w.step < r.step
          order by w.step desc limit 1) as writer
  from tx_sched r
  where r.op = 'R'
), d as (
  select rf.*,
         (select step from tx_sched c where c.sched_id = rf.sched_id and c.txn = rf.writer and c.op = 'C') as writer_commit,
         (select step from tx_sched c where c.sched_id = rf.sched_id and c.txn = rf.reader and c.op = 'C') as reader_commit
  from rf
  where writer is not null and writer <> reader
)
select s.sched_id,
       not exists (select 1 from d where d.sched_id = s.sched_id and d.reader_commit is not null
                     and (d.writer_commit is null or d.writer_commit > d.reader_commit)) as recoverable,
       not exists (select 1 from d where d.sched_id = s.sched_id
                     and (d.writer_commit is null or d.writer_commit > d.read_step)) as cascadeless
from (select distinct sched_id from tx_sched) s;`,
    },
    {
      id: 'CH17.10', topic: 'lost update', level: 3, pe: '17.8a',
      prompt: 'Tìm **lost update** trong schedule `S2`: T<sub>j</sub> đọc X, sau đó T<sub>k</sub> (khác T<sub>j</sub>) ghi X, sau đó T<sub>j</sub> ghi X. Trả về `lost_txn` (T<sub>k</sub>, người bị mất cập nhật), `overwriting_txn` (T<sub>j</sub>), `item`.',
      solution: `select distinct k.txn as lost_txn, j.txn as overwriting_txn, r.item
from tx_sched r
     join tx_sched k on k.sched_id = r.sched_id and k.item = r.item and k.op = 'W'
                    and k.txn <> r.txn and k.step > r.step
     join tx_sched j on j.sched_id = r.sched_id and j.txn = r.txn and j.item = r.item
                    and j.op = 'W' and j.step > k.step
where r.sched_id = 'S2' and r.op = 'R';`,
    },
    {
      id: 'CH17.11', topic: 'serial schedule', level: 2,
      prompt: 'Với mỗi schedule, cho biết có phải **serial schedule** không (mọi lệnh của mỗi transaction nằm liền nhau): `sched_id, is_serial`.',
      hint: 'step − row_number() over (partition by sched_id, txn order by step) không đổi trên một đoạn liền nhau.',
      solution: `select sched_id, bool_and(groups = 1) as is_serial
from (select sched_id, txn, count(distinct grp) as groups
      from (select sched_id, txn,
                   step - row_number() over (partition by sched_id, txn order by step) as grp
            from tx_sched) x
      group by sched_id, txn) y
group by sched_id;`,
    },
    {
      id: 'CH17.12', topic: 'final write', level: 2,
      prompt: 'Điều kiện thứ 3 của view equivalence dùng **final write**. Với mỗi schedule và mỗi item, trả về transaction ghi item đó **lần cuối**: `sched_id, item, final_writer`.',
      solution: `select distinct on (sched_id, item) sched_id, item, txn as final_writer
from tx_sched
where op = 'W'
order by sched_id, item, step desc;`,
    },
    {
      id: 'CH17.13', topic: 'cycle members', level: 3,
      prompt: 'Trong `tx_pg_edge`, đồ thị `G2` có chu trình. Trả về các transaction **nằm trên một chu trình** (`txn`) — đó là các transaction không thể xếp vào thứ tự serial.',
      solution: `with recursive reach (src, dst) as (
  select src, dst from tx_pg_edge where graph = 'G2'
  union
  select r.src, e.dst from reach r join tx_pg_edge e on e.graph = 'G2' and e.src = r.dst
)
select src as txn from reach where src = dst;`,
    },
  ],
};
