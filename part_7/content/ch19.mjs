export default {
  number: 19,
  slug: 'ch19_recovery',
  title: 'Recovery System',
  titleVi: 'Phục hồi (Recovery System)',

  summary: `
### 1. Phân loại lỗi
- **Transaction failure**: lỗi logic (dữ liệu sai, vi phạm ràng buộc) hoặc lỗi hệ thống (deadlock, timestamp test) ⇒ transaction phải rollback.
- **System crash**: mất điện, lỗi phần mềm/hệ điều hành — mất nội dung **volatile storage**, đĩa còn nguyên (**fail-stop assumption**).
- **Disk failure**: hỏng một phần/toàn bộ đĩa ⇒ khôi phục từ bản sao lưu (archival dump) + log.
- Recovery algorithm gồm: (1) việc làm **trong lúc chạy bình thường** để có đủ thông tin; (2) việc làm **sau lỗi** để đưa CSDL về trạng thái đảm bảo atomicity, consistency, durability.

### 2. Storage và truyền dữ liệu
- Volatile, non-volatile, **stable storage** (nhiều bản sao; ghi khối an toàn: ghi bản 1, xong mới ghi bản 2; khi phục hồi so sánh hai bản).
- Khối vật lý trên đĩa, **buffer block** trong bộ nhớ: \`input(B)\`, \`output(B)\`. Transaction dùng \`read(X)\`, \`write(X)\` trên vùng làm việc riêng; output có thể xảy ra bất kỳ lúc nào (buffer manager quyết định).

### 3. Log-based recovery
- Log là dãy **log record** trên stable storage:
  - \`<T_i start>\`, \`<T_i, X_j, V_1, V_2>\` (ghi X<sub>j</sub>: old value V<sub>1</sub>, new value V<sub>2</sub>), \`<T_i commit>\`, \`<T_i abort>\`.
- **Immediate modification**: cập nhật có thể đến CSDL trước khi commit (cần undo). **Deferred modification**: chỉ áp sau commit (không cần undo/old value — PE 19.5).
- **Write-ahead logging (WAL)**: log record phải lên stable storage **trước** khi khối dữ liệu tương ứng được output; \`<T commit>\` lên stable storage thì T mới được coi là commit.
- Thứ tự ghi log và dữ liệu: log record tạo trước khi sửa CSDL.
- **undo(T<sub>i</sub>)**: khôi phục old value, đi **ngược** từ bản ghi cuối của T<sub>i</sub>; mỗi lần khôi phục ghi **redo-only (compensation) log record** \`<T_i, X_j, V_1>\`; xong thì ghi \`<T_i abort>\`.
- **redo(T<sub>i</sub>)**: đặt new value, đi **xuôi** từ bản ghi đầu tiên. Thứ tự quan trọng (PE 19.1): một item bị sửa nhiều lần thì undo xuôi sẽ cho giá trị sai.
- undo/redo phải **idempotent** (thực hiện nhiều lần vẫn đúng).
- Sau crash: transaction có \`<start>\` nhưng không có \`<commit>\` hay \`<abort>\` → **undo**; có \`<commit>\` hoặc \`<abort>\` → **redo** (với abort, redo cả các CLR — "repeating history").

### 4. Checkpoint
- Không có checkpoint thì phải duyệt cả log và redo nhiều transaction đã ghi xuống đĩa từ lâu.
- **Checkpoint**: (1) ghi mọi log record trong bộ nhớ ra stable storage; (2) ghi mọi buffer block đã sửa ra đĩa; (3) ghi \`<checkpoint L>\` với L là danh sách transaction **đang active**. Trong lúc checkpoint không cho cập nhật.
- Khi phục hồi chỉ cần xét các transaction trong L và các transaction bắt đầu sau checkpoint. Bản ghi trước checkpoint của transaction không thuộc L có thể xoá (PE 19.3). **Fuzzy checkpoint** cho phép cập nhật tiếp trong lúc ghi buffer.
- Tần suất (PE 19.2): checkpoint thường xuyên → phục hồi nhanh nhưng tốn hiệu năng lúc bình thường; không ảnh hưởng phục hồi sau **hỏng đĩa** (cần archival dump).

### 5. Recovery algorithm (Section 19.4)
- **Rollback bình thường** của T<sub>i</sub>: duyệt log ngược, mỗi \`<T_i, X_j, V_1, V_2>\` → ghi V<sub>1</sub> vào X<sub>j</sub>, ghi log \`<T_i, X_j, V_1>\`; gặp \`<T_i start>\` thì ghi \`<T_i abort>\` và dừng.
- **Phục hồi sau crash**:
  1. **Redo phase**: tìm \`<checkpoint L>\` cuối cùng, đặt **undo-list = L**. Duyệt **xuôi** từ checkpoint: redo mọi \`<T, X, V_1, V_2>\` và \`<T, X, V>\`; gặp \`<T start>\` thì thêm T vào undo-list; gặp \`<T commit>\` hoặc \`<T abort>\` thì bỏ T khỏi undo-list.
  2. **Undo phase**: duyệt **ngược** từ cuối log: gặp bản ghi update của T thuộc undo-list thì undo như rollback bình thường (ghi CLR); gặp \`<T start>\` với T thuộc undo-list thì ghi \`<T abort>\` và bỏ T khỏi undo-list; dừng khi undo-list rỗng.
- Phải ghi log cả hành động rollback; nếu không, transaction đã rollback bị undo lần nữa sau crash và có thể xoá mất cập nhật của transaction đã commit (PE 19.7).

### 6. Buffer management
- **Log buffer**: log record gom trong bộ nhớ rồi ghi ra khối; khi commit phải force log. Group commit.
- **WAL rule** khi output khối dữ liệu: mọi log record liên quan phải ra stable storage trước.
- **Force / no-force**: force = ghi mọi khối đã sửa khi commit (chậm); thường dùng **no-force** (cần redo).
- **Steal / no-steal**: steal = cho phép ghi khối chứa cập nhật chưa commit ra đĩa (cần undo); thường dùng **steal**.
- Khi output khối phải giữ **latch** để không ai sửa giữa chừng. Buffer của OS (double paging) gây khó.

### 7. Hỏng non-volatile storage
- **Archival dump** định kỳ toàn bộ CSDL lên thiết bị khác (đầu băng, cloud), kèm \`<dump>\` trong log. Phục hồi: nạp dump, redo log từ \`<dump>\`. **Fuzzy dump** cho phép cập nhật trong lúc dump.

### 8. Early lock release và logical undo
- Giải phóng khoá sớm (vd khoá B<sup>+</sup>-tree index) thì không thể undo vật lý (old value) vì dữ liệu đã bị transaction khác sửa ⇒ cần **logical undo** (vd undo của insert là delete).
- **Operation logging**: \`<T_i, O_j, operation-begin>\` … \`<T_i, O_j, operation-end, U>\` với U là thông tin logical undo. **Nested top action** / dummy CLR: thao tác không bao giờ undo (vd cấp phát vùng đĩa — PE 19.8).

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
`,

  quiz: [
    {
      q: 'Sau crash, transaction có `<T start>` và `<T commit>` trong log phải được:',
      options: ['Undo', 'Redo', 'Bỏ qua', 'Abort'],
      answer: 1,
      explain: 'Đã commit thì cập nhật phải bền vững — redo.',
    },
    {
      q: 'Vì sao undo phải đi **ngược** log?',
      options: ['Nhanh hơn', 'Để item bị sửa nhiều lần trở về giá trị trước lần sửa đầu tiên', 'Vì log được ghi ngược', 'Để tránh deadlock'],
      answer: 1,
      explain: 'PE 19.1: undo xuôi để lại old value của lần sửa cuối, sai.',
    },
    {
      q: 'Write-ahead logging yêu cầu:',
      options: ['Ghi khối dữ liệu trước log', 'Log record ra stable storage trước khi khối dữ liệu tương ứng ra đĩa', 'Ghi mọi khối khi commit', 'Không ghi old value'],
      answer: 1,
      explain: 'Để luôn undo được những gì đã xuống đĩa.',
    },
    {
      q: 'Chính sách buffer **steal** đòi hỏi recovery có khả năng:',
      options: ['Redo', 'Undo', 'Không cần gì', 'Checkpoint liên tục'],
      answer: 1,
      explain: 'Khối chứa cập nhật chưa commit có thể ở trên đĩa nên phải undo được.',
    },
    {
      q: 'Chính sách **no-force** đòi hỏi:',
      options: ['Redo', 'Undo', 'Shadow paging', 'Không cần log'],
      answer: 0,
      explain: 'Khối của transaction đã commit có thể chưa ra đĩa — phải redo.',
    },
    {
      q: '`<checkpoint {T2, T3}>` nghĩa là:',
      options: ['T2, T3 đã commit', 'T2, T3 đang active lúc checkpoint', 'T2, T3 bị abort', 'Chỉ T2, T3 cần redo'],
      answer: 1,
      explain: 'L là danh sách transaction active, khởi tạo undo-list khi phục hồi.',
    },
    {
      q: 'Trong ARIES, **RedoLSN** là:',
      options: ['LSN của checkpoint', 'RecLSN nhỏ nhất trong DirtyPageTable', 'LSN lớn nhất của log', 'PageLSN nhỏ nhất'],
      answer: 1,
      explain: 'Pha redo bắt đầu từ đó.',
    },
    {
      q: 'ARIES bỏ qua redo bản ghi LSN = 60 trên trang P nếu:',
      options: ['P không bẩn trong buffer trước crash', 'PageLSN trên đĩa của P ≥ 60', 'Transaction đã commit', 'LSN 60 là CLR'],
      answer: 1,
      explain: 'Cập nhật đã có trên đĩa (cũng bỏ nếu P không trong DirtyPageTable hoặc 60 < RecLSN).',
    },
    {
      q: '**UndoNextLSN** của một CLR dùng để:',
      options: ['Redo nhanh hơn', 'Bỏ qua các bản ghi đã được undo khi undo tiếp', 'Đánh dấu checkpoint', 'Liên kết hai transaction'],
      answer: 1,
      explain: 'Không undo lại những gì đã undo trước crash.',
    },
    {
      q: 'Checkpoint **không** giúp phục hồi nhanh hơn trong trường hợp:',
      options: ['System crash', 'Mất điện', 'Hỏng đĩa', 'Lỗi hệ điều hành'],
      answer: 2,
      explain: 'PE 19.2: hỏng đĩa cần archival dump, vai trò tương tự checkpoint.',
    },
  ],

  questions: [
    {
      pe: '19.1',
      q: '**PE 19.1.** Vì sao undo-list phải xử lý ngược còn redo đi xuôi?',
      answer: `Giả sử một transaction trên undo-list sửa X từ 1 → 2 rồi 2 → 3: log có \`<T, X, 1, 2>\` rồi \`<T, X, 2, 3>\`.
- **Undo ngược**: áp old value 2 rồi 1 ⇒ X = **1** (đúng, giá trị trước khi T chạy). Undo xuôi: áp 1 rồi 2 ⇒ X = 2 (**sai**). Lý luận tương tự khi nhiều transaction trên undo-list cùng sửa một item.
- **Redo xuôi**: nếu T đã commit, áp new value 2 rồi 3 ⇒ X = **3** (đúng, giá trị cuối). Redo ngược: 3 rồi 2 ⇒ X = 2 (sai).
Bài CH19.06 tính cả hai kết quả trên log \`LOG3\`.`,
    },
    {
      pe: '19.2',
      q: '**PE 19.2.** Mục đích checkpoint; tần suất ảnh hưởng hiệu năng, phục hồi sau crash, phục hồi sau hỏng đĩa thế nào?',
      answer: `- **Mục đích**: không có checkpoint thì sau crash phải duyệt **toàn bộ** log và redo/undo mọi transaction. Với checkpoint, hầu hết bản ghi trước checkpoint được bỏ qua (dữ liệu của chúng đã ra đĩa). Ngoài ra checkpoint cho phép **xoá bớt log** khi stable storage gần đầy.
- **Hiệu năng khi không lỗi**: checkpoint tốn I/O (ghi mọi buffer bẩn) và tạm ngừng cập nhật ⇒ càng thường xuyên càng chậm.
- **Thời gian phục hồi sau crash**: càng thường xuyên thì phần log cần xử lý càng ngắn ⇒ phục hồi càng nhanh.
- **Hỏng đĩa**: checkpoint **không** giúp; phục hồi dùng **archival dump** (đóng vai trò tương tự checkpoint) + log.
- Chọn tần suất: nếu phục hồi nhanh quan trọng thì checkpoint thường xuyên; nếu không thì thưa hơn; nếu stable storage cho log ít thì buộc phải checkpoint thường xuyên.`,
    },
    {
      pe: '19.3',
      q: '**PE 19.3.** Normal logging và archival logging: khi nào xoá được log record (thuật toán Section 19.4)?',
      answer: `**Normal logging** (phục hồi sau crash): không xoá được
- mọi bản ghi của transaction **active lúc checkpoint gần nhất** (có trong \`<checkpoint L>\`), và
- mọi bản ghi của transaction **bắt đầu sau** checkpoint gần nhất.
Mọi bản ghi khác xoá được; sau mỗi checkpoint lại có thêm bản ghi đủ điều kiện xoá. Thực tế không xoá lẻ (tạo lỗ hổng trong log) mà tìm một điểm trong log sao cho mọi bản ghi trước đó đều xoá được và xoá cả đoạn — log thường chia thành nhiều file, xoá file khi mọi bản ghi trong đó xoá được.

**Archival logging** (phục hồi sau hỏng đĩa): giữ mọi bản ghi cần để redo từ **archival dump gần nhất**: áp quy tắc như trên nhưng thay checkpoint bằng thời điểm dump. Dump thưa hơn checkpoint nhiều (phải ghi cả CSDL) nên phải giữ log lâu hơn.`,
    },
    {
      pe: '19.4',
      q: '**PE 19.4.** Sửa thuật toán Section 19.4 để có savepoint và rollback về savepoint.',
      answer: `**Tạo savepoint** cho T<sub>i</sub>:
1. Ghi ra stable storage mọi log record của T<sub>i</sub> đang nằm trong bộ nhớ.
2. Ghi log record \`<savepoint T_i>\` (hoặc \`<savepoint T_i, name>\` nếu cho phép nhiều savepoint có tên).

**Rollback về savepoint**: duyệt log **ngược** từ bản ghi cuối của T<sub>i</sub>, undo từng \`<T_i, X, V1, V2>\` như rollback bình thường (ghi V1, ghi redo-only log record \`<T_i, X, V1>\`), dừng khi gặp \`<savepoint T_i>\` tương ứng. Transaction **không** abort mà chạy tiếp.
- Các CLR được sinh như thường lệ nên crash sau đó vẫn phục hồi đúng (redo lặp lại lịch sử, kể cả phần rollback một phần).
- Muốn rollback lại về cùng savepoint nhiều lần: sau khi rollback ghi một \`<savepoint>\` mới. Một khi đã undo vượt qua một savepoint thì không thể quay về savepoint đó nữa.
Bài CH19.13 làm savepoint thật trên PostgreSQL.`,
    },
    {
      pe: '19.5',
      q: '**PE 19.5.** Deferred modification: (a) còn cần old value? (b) redo phase sửa thế nào? (c) đọc item hiệu quả; (d) vấn đề khi nhiều cập nhật.',
      answer: `a. **Không cần.** Cập nhật chỉ được áp vào CSDL sau khi commit. Transaction đã commit thì không bao giờ phải undo; transaction đang chạy lúc crash chưa sửa gì trên CSDL, giá trị cũ vẫn nằm nguyên trên đĩa.

b. Pha redo chỉ cần **redo các transaction đã commit** (áp new value theo thứ tự xuôi); **không cần duy trì undo-list** và không có pha undo, vì CSDL trên đĩa không chứa cập nhật của transaction chưa commit. (Bài CH19.09 tính giá trị sau phục hồi theo cách này.)

c. Mỗi transaction giữ một bảng băm (hash) item → giá trị đã cập nhật trong bộ nhớ cục bộ. \`read(X)\`: tra bảng cục bộ trước; nếu có thì trả về (transaction thấy cập nhật của chính mình); nếu không thì đọc từ database buffer (có thể chép vào vùng cục bộ).

d. Transaction cập nhật **rất nhiều** item có thể **hết bộ nhớ** để giữ các bản cục bộ (không thể steal ra đĩa vì chưa commit), và lúc commit phải áp một lượng lớn cập nhật.`,
    },
    {
      pe: '19.6',
      q: '**PE 19.6.** Shadow paging với page table là B<sup>+</sup>-tree: (a) chia sẻ nút; (b) vì sao logging vẫn rẻ hơn cho cập nhật nhỏ.',
      answer: `a. Ban đầu bản mới chỉ là **bản sao của nút gốc** trỏ tới các nút của shadow copy. Khi một entry ở lá bị sửa, **chép lá đó và mọi nút trên đường từ lá lên gốc** (copy-on-write) và sửa con trỏ trong các bản sao; mọi nút khác **dùng chung** giữa bản mới và shadow. Commit = đổi con trỏ gốc nguyên tử.

b. Với cập nhật nhỏ, shadow paging vẫn phải chép và ghi **nhiều trang**: trang dữ liệu mới, lá page table và mọi nút trên đường lên gốc — mỗi trang ở vị trí đĩa khác nhau (I/O ngẫu nhiên), và dữ liệu bị phân mảnh. Logging chỉ sinh **vài log record nhỏ**, nằm chung trong một/vài trang log; commit chỉ cần ghi vài trang log, và log của các commit liên tiếp nằm **liền nhau** trên đĩa (ghi tuần tự, ít di chuyển đầu đọc).`,
    },
    {
      pe: '19.7',
      q: '**PE 19.7.** Nếu không ghi log các hành động rollback thì undo khi phục hồi có thể làm CSDL sai như thế nào?',
      answer: `Log sinh ra bởi thuật toán (sai):
1. \`<T1 start>\`
2. \`<T1, A, 1000, 900>\`
3. \`<T2 start>\`
4. \`<T2, A, 1000, 2000>\`
5. \`<T2 commit>\`

Giữa bước 2 và 3, T1 đã rollback (A trở về 1000) nhưng không có log record nào phản ánh điều đó. Khi phục hồi: redo đặt A = 900 rồi 2000; T1 không có commit/abort nên vào **undo-list**; pha undo áp old value của bản ghi 2 ⇒ **A = 1000**. Cập nhật của T2 **đã commit** bị mất — vi phạm durability.

Log đúng:
1. \`<T1 start>\` 2. \`<T1, A, 1000, 900>\` 3. \`<T1, A, 1000>\` 4. \`<T1 abort>\` 5. \`<T2 start>\` 6. \`<T2, A, 1000, 2000>\` 7. \`<T2 commit>\`
T1 có \`<abort>\` nên không vào undo-list; redo cho A = 2000. Bài CH19.07 chạy cả hai log (\`LOG4\`, \`LOG5\`).`,
    },
    {
      pe: '19.8',
      q: '**PE 19.8.** Vì sao vùng đĩa cấp cho file không được giải phóng khi transaction rollback? ARIES làm thế nào?',
      answer: `Khi T cấp một trang mới cho relation, các transaction khác có thể **đã lưu record vào chính trang đó** (sau khi khoá/latch cấp phát được nhả sớm). Nếu rollback T giải phóng trang, record của transaction khác bị mất/hỏng. Vì vậy việc cấp phát không được undo — T chỉ undo việc **chèn record của chính nó**.

ARIES dùng **nested top action**: thao tác "không bao giờ undo", coi như có undo action rỗng. Sau khi thao tác hoàn tất, ghi một **dummy CLR** có **UndoNextLSN** trỏ tới bản ghi **trước** thao tác đó. Khi rollback T, undo đi theo UndoNextLSN nên **nhảy qua** các log record của thao tác cấp phát.`,
    },
    {
      pe: '19.9',
      q: '**PE 19.9.** Vùng trống do T1 xoá record được cấp cho record T2 chèn trước khi T1 commit: (a) vấn đề khi T1 rollback; (b) có còn nếu khoá mức trang; (c) giải pháp post-commit action.',
      answer: `a. Rollback T1 phải khôi phục tuple đã xoá. Nếu undo **vật lý** (chép lại old value vào vị trí cũ) thì sẽ **ghi đè** tuple mới của T2 và cấu trúc khối (slot directory) ⇒ hỏng dữ liệu. Phải undo **logic** (chèn lại tuple, có thể ở chỗ khác), làm recovery phức tạp hơn. Nếu T2 chèn tuple cùng **khoá chính** thì khi T1 rollback sẽ vi phạm ràng buộc khoá.

b. Với **khoá mức trang**, T2 không thể ghi vào trang mà T1 (chưa commit) đang khoá X, nên vùng trống không bị cấp cho T2 trước khi T1 commit ⇒ không có vấn đề (nhưng concurrency giảm).

c. **Hoãn việc giải phóng vùng trống tới sau commit**. Khi xoá, chỉ đánh dấu tuple đã xoá; record \`<T commit>\` ghi kèm danh sách **post-commit action** (giải phóng vùng nào). Sau commit, thực hiện các action đó như một transaction có log, rồi ghi \`<T post-commit>\` báo đã xong. Khi phục hồi: gặp commit có post-commit action mà **không** có record post-commit ⇒ rollback phần đã làm dở và **thực hiện lại** các action ở cuối phục hồi; có record post-commit ⇒ không làm lại. Vậy mỗi action được làm **đúng một lần**. Xung đột khoá chính: giữ **khoá mức key** tới khi T1 kết thúc để không ai dùng key đó.`,
    },
    {
      pe: '19.10',
      q: '**PE 19.10.** Vì sao phục hồi transaction tương tác khó hơn transaction batch? Cách đơn giản xử lý?',
      answer: `Transaction tương tác có **output ra thế giới bên ngoài không thể thu hồi**: in vé, phát tiền ATM, gửi email, điều khiển máy móc. Nếu transaction abort hoặc hệ thống crash sau khi output đã xảy ra, rollback CSDL không lấy lại được tiền đã phát. Transaction batch thường không có output như vậy giữa chừng, nên chỉ cần rollback/chạy lại.

Cách xử lý: **dồn mọi output ra cuối, sau khi commit** (observable external writes chỉ làm sau commit). Nên làm output **nguyên tử** — ATM đếm đủ tiền rồi đưa ra một lần, không đưa từng tờ. Nếu không làm nguyên tử được, ghi **log vật lý của output** (log sự kiện, thậm chí video) để sau này phục hồi thủ công, vd ghi có lại tiền vào tài khoản khách.`,
    },
    {
      pe: '19.11',
      q: '**PE 19.11.** Undo transaction đã commit do nhập sai: (a) vì sao undo thông thường gây sai; (b) point-in-time recovery bằng dump; (c) vì sao không chạy lại bằng log record được.',
      answer: `a. Tài khoản A = 100. T1 gửi 10, T2 gửi 10, chạy lần lượt: log \`<T1, A, 100, 110>\`, \`<T2, A, 110, 120>\`, A = 120. Muốn huỷ **chỉ T1** bằng undo thông thường (ghi old value) ⇒ A = **100**: thực chất huỷ cả T2. Đúng ra A phải là 110 (undo logic: trừ đi 10). Bài CH19.10 tính hai con số này.

b. Gọi transaction sai là T<sub>e</sub>:
- Tìm **archival dump D gần nhất trước** \`<T_e start>\`; nạp lại CSDL từ D.
- **Redo** mọi log record từ D tới \`<T_e commit>\` (không gồm). Gọi S1 là tập transaction (khác T<sub>e</sub>) còn active tại thời điểm đó.
- **Rollback T<sub>e</sub> và S1** (undo như transaction chưa commit). CSDL ở trạng thái ngay trước khi T<sub>e</sub> commit.
- Nếu có thông tin redo logic: duyệt tiếp log sau \`<T_e commit>\`, gọi S2 là các transaction bắt đầu sau đó; **chạy lại logic** các transaction trong S1 và S2.

c. Log record là **vật lý**: chứa giá trị tuyệt đối tính trên trạng thái cũ. Sau khi đã bỏ T1, áp \`<T2, A, 110, 120>\` sẽ đặt A = 120 — tức lại cộng cả phần của T1. Chỉ chạy lại **câu SQL** (A := A + 10) trên trạng thái mới mới cho đúng 110.`,
    },
    {
      pe: '19.12',
      q: '**PE 19.12.** Ghi khối không nguyên tử (partial block write): (a) vấn đề; (b) phát hiện; (c) dùng RAID 1 để phục hồi.',
      answer: `a. Khối có thể chứa một phần dữ liệu mới, một phần cũ ⇒ **không nhất quán**: cấu trúc trang (header, slot directory) mâu thuẫn, record bị cắt đôi. Thuật toán phục hồi giả định khối hoặc cũ hoàn toàn hoặc mới hoàn toàn: redo/undo dựa trên PageLSN sai (PageLSN ở header có thể đã mới trong khi phần dữ liệu còn cũ ⇒ bỏ qua redo cần thiết). Nếu khối là log block thì log bị hỏng.

b. Ghi kèm **checksum** của cả khối (hoặc số phiên bản/LSN ở **cả đầu và cuối** khối, hoặc ở mỗi sector). Khi đọc, tính lại checksum hoặc so các bản sao số phiên bản; không khớp ⇒ khối đã bị ghi dở — giống cách đĩa dùng checksum để phát hiện sector đọc lỗi.

c. RAID 1 (mirroring) có hai bản. Ghi **tuần tự**: ghi xong bản 1 (và kiểm tra) rồi mới ghi bản 2. Khi phục hồi, với mỗi khối (hoặc chỉ các khối đang ghi dở, nếu ghi lại danh sách vào NVRAM): nếu một bản lỗi checksum thì chép bản còn tốt sang ⇒ khối nhận **giá trị cũ** (nếu bản 1 hỏng thì bản 2 còn cũ) hoặc **giá trị mới** (nếu bản 2 hỏng thì bản 1 đã mới). Nếu cả hai đều tốt nhưng khác nhau thì chép bản 1 sang bản 2 (hoặc ngược lại) để thống nhất. Đây chính là cách cài đặt stable storage.`,
    },
    {
      pe: '19.13',
      q: '**PE 19.13.** Dùng undo log để tạo snapshot view của trang trong buffer (như Oracle).',
      answer: `- Mỗi trang trong buffer có thể chứa cập nhật của các transaction **chưa commit** hoặc **commit sau** khi T<sub>i</sub> bắt đầu. Nếu trang không có cập nhật nào như vậy (mọi cập nhật trên trang thuộc transaction đã commit trước StartTS(T<sub>i</sub>), hoặc của chính T<sub>i</sub>) thì trả về **chính trang trong buffer**.
- Ngược lại, **chép trang** ra một bản tạm. Dùng các **undo log record** của trang (liên kết theo trang, mới nhất trước): đi ngược từ bản ghi mới nhất, áp **undo action** của mỗi thao tác thuộc transaction mà T<sub>i</sub> không được thấy (chưa commit, hoặc commit sau StartTS(T<sub>i</sub>)), dừng khi tới thao tác cũ hơn thời điểm T<sub>i</sub> bắt đầu. Các thao tác của chính T<sub>i</sub> giữ nguyên.
- Trả bản chép này làm **snapshot page** cho T<sub>i</sub>; có thể cache bản đó (kèm timestamp) để transaction khác cùng snapshot dùng lại. Giả định mỗi thao tác và undo của nó chỉ chạm một trang nên chỉ cần log của trang đó.`,
    },
  ],

  exercises: [
    {
      id: 'CH19.01', topic: 'transaction status', level: 1,
      prompt: '`tx_log(log_id, lsn, txn, kind, item, old_val, new_val, active)` lưu các log (hệ thống crash ngay sau bản ghi cuối). Với `LOG1`, trả về `txn, status`: `committed`, `aborted` hoặc `incomplete`.',
      solution: `select txn,
       case when bool_or(kind = 'commit') then 'committed'
            when bool_or(kind = 'abort') then 'aborted'
            else 'incomplete' end as status
from tx_log
where log_id = 'LOG1' and txn is not null
group by txn;`,
    },
    {
      id: 'CH19.02', topic: 'values after recovery', level: 3,
      prompt: `Tính giá trị của mỗi item sau khi phục hồi \`LOG1\` bằng thuật toán Section 19.4: redo mọi bản ghi update/clr theo thứ tự, rồi undo (ngược) mọi update của transaction **incomplete**. Trả về \`item, value\`.
Gợi ý quy tắc: nếu item có update của transaction incomplete thì giá trị cuối là **old_val của update sớm nhất** trong số đó; ngược lại là giá trị (new_val) của bản ghi update/clr **cuối cùng**.`,
      solution: `with undo_list as (
  select txn from tx_log
  where log_id = 'LOG1' and txn is not null
  group by txn
  having not bool_or(kind in ('commit', 'abort'))
), w as (
  select * from tx_log where log_id = 'LOG1' and kind in ('update', 'clr')
)
select i.item,
       coalesce((select u.old_val from w u
                 where u.item = i.item and u.kind = 'update' and u.txn in (select txn from undo_list)
                 order by u.lsn limit 1),
                (select u.new_val from w u where u.item = i.item order by u.lsn desc limit 1)) as value
from (select distinct item from w) i;`,
    },
    {
      id: 'CH19.03', topic: 'undo-list from checkpoint', level: 2,
      prompt: '`LOG2` có bản ghi `checkpoint` (cột `active` = danh sách L). Theo pha redo của Section 19.4: undo-list khởi tạo bằng L của checkpoint **cuối cùng**, thêm transaction có `start` sau checkpoint, bỏ transaction có `commit`/`abort` sau checkpoint. Trả về undo-list (`txn`).',
      solution: `with chk as (
  select max(lsn) as lsn from tx_log where log_id = 'LOG2' and kind = 'checkpoint'
), l as (
  select unnest(active) as txn from tx_log where log_id = 'LOG2' and lsn = (select lsn from chk)
  union
  select txn from tx_log where log_id = 'LOG2' and kind = 'start' and lsn > (select lsn from chk)
)
select txn from l
where txn not in (select txn from tx_log
                  where log_id = 'LOG2' and kind in ('commit', 'abort') and lsn > (select lsn from chk));`,
    },
    {
      id: 'CH19.04', topic: 'redo phase', level: 2,
      prompt: 'Liệt kê các bản ghi được **redo** khi phục hồi `LOG2` (mọi `update` và `clr` sau checkpoint cuối cùng): `lsn, txn, kind, item`.',
      solution: `select lsn, txn, kind, item
from tx_log
where log_id = 'LOG2' and kind in ('update', 'clr')
  and lsn > (select max(lsn) from tx_log where log_id = 'LOG2' and kind = 'checkpoint');`,
    },
    {
      id: 'CH19.05', topic: 'undo phase log', level: 3,
      prompt: 'Pha **undo** khi phục hồi `LOG2` duyệt log ngược và **ghi thêm** log: với mỗi update của transaction trong undo-list ghi CLR `<T, X, old_val>`; khi gặp `start` của transaction đó ghi `<T abort>`. Trả về các bản ghi được ghi thêm theo đúng thứ tự: `seq, txn, kind` (`clr`/`abort`), `item, value` (null với abort).',
      solution: `with undo_list as (
  select txn from tx_log
  where log_id = 'LOG2' and txn is not null
  group by txn
  having not bool_or(kind in ('commit', 'abort'))
)
select row_number() over (order by lsn desc) as seq, txn,
       case when kind = 'update' then 'clr' else 'abort' end as kind,
       case when kind = 'update' then item end as item,
       case when kind = 'update' then old_val end as value
from tx_log
where log_id = 'LOG2' and txn in (select txn from undo_list) and kind in ('update', 'start')
order by seq;`,
      ordered: true,
    },
    {
      id: 'CH19.06', topic: 'undo order', level: 2, pe: '19.1',
      prompt: '`LOG3`: transaction incomplete T7 sửa X và Y nhiều lần. Với mỗi item trả về `item, correct_value` (undo **ngược**) và `wrong_value` (nếu undo **xuôi**, tức áp old_val theo thứ tự LSN tăng dần).',
      solution: `select item,
       (array_agg(old_val order by lsn))[1]      as correct_value,
       (array_agg(old_val order by lsn desc))[1] as wrong_value
from tx_log
where log_id = 'LOG3' and kind = 'update'
group by item;`,
    },
    {
      id: 'CH19.07', topic: 'logging rollback', level: 3, pe: '19.7',
      prompt: '`LOG4` là log của thuật toán sửa **sai** ở PE 19.7 (rollback của T1 không ghi log); `LOG5` là log đúng (có CLR và abort). Áp cùng quy tắc phục hồi như CH19.02 cho cả hai log và trả về `log_id, item, value`.',
      solution: `with undo_list as (
  select log_id, txn from tx_log
  where log_id in ('LOG4', 'LOG5') and txn is not null
  group by log_id, txn
  having not bool_or(kind in ('commit', 'abort'))
), w as (
  select * from tx_log where log_id in ('LOG4', 'LOG5') and kind in ('update', 'clr')
)
select i.log_id, i.item,
       coalesce((select u.old_val from w u
                      join undo_list ul on ul.log_id = u.log_id and ul.txn = u.txn
                 where u.log_id = i.log_id and u.item = i.item and u.kind = 'update'
                 order by u.lsn limit 1),
                (select u.new_val from w u
                 where u.log_id = i.log_id and u.item = i.item
                 order by u.lsn desc limit 1)) as value
from (select distinct log_id, item from w) i;`,
    },
    {
      id: 'CH19.08', topic: 'log truncation', level: 2, pe: '19.3',
      prompt: 'Theo PE 19.3, với `LOG2`, bản ghi của transaction **không** active lúc checkpoint cuối và **đã kết thúc trước** checkpoint thì xoá được. Trả về các `lsn` của `LOG2` có thể xoá (mọi bản ghi của những transaction đó).',
      solution: `with chk as (
  select lsn, active from tx_log
  where log_id = 'LOG2' and kind = 'checkpoint'
  order by lsn desc limit 1
)
select l.lsn
from tx_log l, chk
where l.log_id = 'LOG2' and l.txn is not null
  and l.lsn < chk.lsn
  and not (l.txn = any (chk.active))
  and l.txn not in (select txn from tx_log where log_id = 'LOG2' and lsn > chk.lsn and txn is not null);`,
    },
    {
      id: 'CH19.09', topic: 'deferred modification', level: 2, pe: '19.5b',
      prompt: 'Giả sử `LOG1` được sinh với **deferred modification**: CSDL trên đĩa (`tx_disk(item, val)`) chỉ chứa giá trị ban đầu, chỉ cập nhật của transaction **đã commit** được áp khi phục hồi. Trả về giá trị sau phục hồi của mọi item trong `tx_disk`: `item, value`.',
      solution: `select d.item,
       coalesce((select l.new_val from tx_log l
                 where l.log_id = 'LOG1' and l.kind = 'update' and l.item = d.item
                   and l.txn in (select txn from tx_log where log_id = 'LOG1' and kind = 'commit')
                 order by l.lsn desc limit 1), d.val) as value
from tx_disk d;`,
    },
    {
      id: 'CH19.10', topic: 'undo committed txn', level: 2, pe: '19.11a',
      prompt: '`tx_bank_log(lsn, txn, item, old_val, new_val)`: T1 rồi T2 cùng gửi 10 vào A (đều đã commit). Muốn huỷ **chỉ T1**. Trả về một dòng `normal_undo` (A sau khi undo T1 bằng old value như bình thường) và `logical_undo` (A hiện tại trừ đi khoản T1 đã cộng).',
      solution: `select (select old_val from tx_bank_log where txn = 'T1') as normal_undo,
       (select new_val from tx_bank_log order by lsn desc limit 1)
         - (select new_val - old_val from tx_bank_log where txn = 'T1') as logical_undo;`,
    },
    {
      id: 'CH19.11', topic: 'ARIES analysis', level: 3,
      prompt: 'ARIES: `tx_aries_log(lsn, prev_lsn, txn, kind, page_id, undo_next_lsn)`, checkpoint ở LSN 50 ghi DirtyPageTable `tx_aries_chk_dpt(page_id, rec_lsn)`. Pha **analysis** đọc xuôi từ checkpoint: trang nào được update/clr mà chưa có trong DirtyPageTable thì thêm với RecLSN = LSN đó. Trả về DirtyPageTable sau analysis: `page_id, rec_lsn`.',
      solution: `with chk as (
  select lsn from tx_aries_log where kind = 'checkpoint'
)
select page_id, rec_lsn from tx_aries_chk_dpt
union all
select page_id, min(lsn)
from tx_aries_log
where kind in ('update', 'clr') and lsn > (select lsn from chk)
  and page_id not in (select page_id from tx_aries_chk_dpt)
group by page_id;`,
    },
    {
      id: 'CH19.12', topic: 'ARIES redo', level: 3,
      prompt: 'Tiếp CH19.11. **RedoLSN** = RecLSN nhỏ nhất. Pha **redo** đọc xuôi từ RedoLSN và redo bản ghi update/clr trừ khi: trang không có trong DirtyPageTable, hoặc LSN < RecLSN của trang, hoặc PageLSN trên đĩa (`tx_aries_page`) ≥ LSN. Trả về các bản ghi được redo: `lsn, txn, page_id`.',
      solution: `with chk as (
  select lsn from tx_aries_log where kind = 'checkpoint'
), dpt as (
  select page_id, rec_lsn from tx_aries_chk_dpt
  union all
  select page_id, min(lsn) from tx_aries_log
  where kind in ('update', 'clr') and lsn > (select lsn from chk)
    and page_id not in (select page_id from tx_aries_chk_dpt)
  group by page_id
)
select l.lsn, l.txn, l.page_id
from tx_aries_log l
     join dpt d on d.page_id = l.page_id
     join tx_aries_page p on p.page_id = l.page_id
where l.kind in ('update', 'clr')
  and l.lsn >= (select min(rec_lsn) from dpt)
  and l.lsn >= d.rec_lsn
  and p.page_lsn < l.lsn;`,
    },
    {
      id: 'CH19.13', topic: 'ARIES undo', level: 3,
      prompt: 'Pha **undo** của ARIES: transaction chưa kết thúc (không có `commit`/`end`) là loser. Bắt đầu từ bản ghi cuối của mỗi loser, đi lùi theo `prev_lsn` (với CLR thì nhảy theo `undo_next_lsn`). Trả về các bản ghi **update** bị undo, theo **thứ tự undo** (LSN giảm dần): `lsn, txn, page_id`.',
      solution: `with recursive losers as (
  select txn, max(lsn) as last_lsn
  from tx_aries_log
  where txn is not null
  group by txn
  having not bool_or(kind in ('commit', 'end'))
), chain (txn, lsn) as (
  select txn, last_lsn from losers
  union all
  select l.txn, case when l.kind = 'clr' then l.undo_next_lsn else l.prev_lsn end
  from chain c join tx_aries_log l on l.lsn = c.lsn
  where (case when l.kind = 'clr' then l.undo_next_lsn else l.prev_lsn end) is not null
)
select l.lsn, l.txn, l.page_id
from chain c join tx_aries_log l on l.lsn = c.lsn
where l.kind = 'update'
order by l.lsn desc;`,
      ordered: true,
    },
    {
      id: 'CH19.14', topic: 'savepoint', level: 2, fresh: true, pe: '19.4',
      prompt: 'Savepoint thật trên PostgreSQL: trong một transaction, cộng 100 vào `A-101`; `savepoint s1`; trừ 300 khỏi `A-102`; `savepoint s2`; xoá tài khoản `A-301`; **rollback về s1**; cộng 1 vào `A-201`; commit.',
      solution: `begin;
update tx_account set balance = balance + 100 where acc_id = 'A-101';
savepoint s1;
update tx_account set balance = balance - 300 where acc_id = 'A-102';
savepoint s2;
delete from tx_account where acc_id = 'A-301';
rollback to savepoint s1;
update tx_account set balance = balance + 1 where acc_id = 'A-201';
commit;`,
      check: `select acc_id, balance from tx_account order by acc_id;`,
    },
  ],
};
