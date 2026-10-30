export default {
  number: 23,
  slug: 'ch23_distributed_transactions',
  title: 'Parallel and Distributed Transaction Processing',
  titleVi: 'Xử lý giao dịch song song và phân tán',

  summary: `
### 0. Phạm vi
Chương 23 ngoài lịch học CS4420. Bài SQL phân tích dữ liệu "log" của nhiều site: quyết định của coordinator và hành động phục hồi trong **two-phase commit**, quorum, đọc dữ liệu cũ do lazy replication, đồ thị wait-for toàn cục, Lamport timestamp, chain replication, lease và precedence graph của một federated schedule.

### 1. Mô hình giao dịch phân tán (slide 23.3–23.8)
- Mỗi site có **transaction manager** (log, đồng thời cục bộ) và **transaction coordinator** (khởi động giao dịch, chia việc cho các site, điều phối kết thúc).
- Lỗi đặc thù của hệ phân tán: **site hỏng**, **mất message**, **link hỏng**, **network partition** (mạng bị chia thành các nhóm không liên lạc được) (PE 23.2). Một site không phân biệt được site kia hỏng, link hỏng hay site kia quá tải (PE 23.4) → giao thức phải đúng trong mọi trường hợp.
- LAN vs WAN (PE 23.1): WAN độ trễ cao, băng thông thấp, dễ partition → giảm số vòng liên lạc, nhân bản dữ liệu gần người dùng.

### 2. Two-phase commit — 2PC (slide 23.9–23.20)
Coordinator C của giao dịch T, các participant S<sub>i</sub>:
- **Phase 1 (prepare)**: C ghi \`<prepare T>\` và gửi \`prepare T\` tới mọi site. Mỗi site: nếu không commit được → ghi \`<no T>\` và trả lời abort; nếu được → force-write mọi log của T và \`<ready T>\` rồi trả lời ready.
- **Phase 2 (commit/abort)**: nếu **mọi** site trả lời ready → C ghi \`<commit T>\` (đây là **điểm quyết định**); nếu có site trả lời no hoặc hết thời gian chờ → \`<abort T>\`. C gửi quyết định tới các site; mỗi site ghi log tương ứng.
- **Site S<sub>k</sub> phục hồi**, xét log của chính nó:
  - có \`<commit T>\` → **redo(T)**; có \`<abort T>\` → **undo(T)**;
  - có \`<ready T>\` mà không có commit/abort → **hỏi coordinator** (hoặc site khác) về quyết định;
  - không có gì về T (chưa ready) → **undo(T)** (coordinator chắc chắn không thể đã commit).
- **Coordinator hỏng**: participant nào có \`<commit T>\` thì T commit; có \`<abort T>\` hoặc chưa \`<ready T>\` thì T phải abort; nếu **mọi** site còn sống chỉ có \`<ready T>\` → phải **chờ** coordinator phục hồi: **blocking problem** của 2PC (vẫn giữ khoá của T).
- Network partition: các site cùng phía coordinator chạy bình thường; phía kia hành xử như coordinator hỏng.
- **Three-phase commit** tránh blocking trong một số giả định nhưng tốn thêm vòng; thực tế dùng 2PC + **consensus** (Paxos/Raft) để coordinator chịu lỗi.

### 3. Persistent messaging và giao dịch dài (slide 23.21–23.25)
- Thay vì 2PC (giữ khoá, blocking), gửi **message bền vững**: bảo đảm được giao **đúng một lần** nếu giao dịch gửi commit. Message ghi vào bảng *messages_to_send* trong cùng giao dịch; tiến trình riêng gửi và gửi lại tới khi nhận ack; bên nhận lưu *received_messages* để loại trùng (theo timestamp hoặc **sequence number** — PE 23.5).
- Lỗi ở phía nhận phải xử lý bằng **giao dịch bù** (compensating transaction).

### 4. Đồng thời trong hệ phân tán (slide 23.26–23.40)
- **Single lock manager**: một site cấp mọi khoá — đơn giản nhưng là nút thắt và điểm hỏng duy nhất.
- **Distributed lock manager**: mỗi site quản khoá dữ liệu của mình. Phát hiện deadlock cần **global wait-for graph** (gộp các local graph) — có thể có **false cycle** do message trễ; PE 23.8 dùng timestamp trên cạnh liên site để chỉ chấp nhận cạnh đã được cả hai site xác nhận.
- **Timestamp toàn cục**: (local timestamp, site id); **Lamport clock**: mỗi sự kiện tăng bộ đếm, khi nhận message đặt bộ đếm = max(hiện tại, timestamp trong message) + 1 → thứ tự phù hợp quan hệ *happened-before*.

### 5. Replication và tính nhất quán (slide 23.41–23.60)
- **Primary copy**: mọi cập nhật qua bản chính (giữ khoá ở primary). Đồng bộ (cập nhật mọi replica trong giao dịch, dùng 2PC) hoặc **lazy** (truyền sau khi commit) — lazy nhanh nhưng đọc replica có thể thấy **dữ liệu cũ**, và cập nhật dựa trên dữ liệu cũ gây sai (PE 23.7).
- **Majority protocol**: ghi/khoá phải được đa số replica; **quorum consensus**: n replica, read quorum Qr, write quorum Qw với **Qr + Qw > n** (mọi lần đọc giao với lần ghi gần nhất) và **2·Qw > n** (hai lần ghi không thể cùng lúc). Đọc lấy giá trị có **version lớn nhất** trong quorum.
- **Chain replication** (PE 23.9): replica xếp thành chuỗi head → … → tail; ghi vào head, truyền dọc chuỗi, coi là xong khi **tail** đã áp dụng; đọc ở tail.
- **Lease**: primary chỉ được phục vụ khi lease còn hạn; mất liên lạc thì không gia hạn được → tự ngừng trước khi primary mới được bầu (PE 23.10).
- **CAP theorem**: khi có network partition, không thể vừa **Consistency** vừa **Availability**. Nhiều hệ chọn availability với **eventual consistency**; xung đột cập nhật được phát hiện bằng **version vector** và giải quyết bằng ứng dụng.
- **Consensus** (Paxos, Raft): một nhóm node thống nhất một giá trị/một log dù có node hỏng (cần đa số còn sống). Raft: bầu **leader** theo term, leader nhân bản log, entry commit khi đa số đã nhận.

### 6. Federated / multidatabase (slide 23.61–23.65)
- Mỗi site tự đảm bảo serializability cục bộ, nhưng global schedule vẫn có thể **không serializable** (PE 23.11, 23.12): thứ tự serial ở mỗi site khác nhau.
- **Ticket**: mỗi site có data item *ticket*; mọi global transaction phải đọc-ghi ticket tại các site nó truy cập → buộc các global transaction xung đột tại mỗi site, coordinator sắp xếp để thứ tự ở mọi site như nhau.

### Bảng tra nhanh phục hồi 2PC (log của site S<sub>k</sub>)
| Log có | Hành động |
|---|---|
| \`<commit T>\` | redo(T) |
| \`<abort T>\` (hoặc \`<no T>\`) | undo(T) |
| chỉ \`<ready T>\` | hỏi coordinator / site khác; nếu không ai biết → **blocked** |
| không có gì của T | undo(T) |
`,

  quiz: [
    {
      q: 'Trong 2PC, điểm quyết định commit của giao dịch T là lúc nào?',
      options: ['Khi mọi site ghi <ready T>', 'Khi coordinator ghi <commit T> vào log bền vững', 'Khi site cuối cùng ghi <commit T>', 'Khi gửi prepare'],
      answer: 1,
      explain: 'Sau khi <commit T> ở coordinator được ghi bền vững, T chắc chắn commit.',
    },
    {
      q: 'Site phục hồi thấy log có <ready T> nhưng không có commit/abort. Nó làm gì?',
      options: ['redo(T)', 'undo(T)', 'Hỏi coordinator (hoặc site khác) về quyết định', 'Bỏ qua T'],
      answer: 2,
      explain: 'Site đã hứa commit nên không được tự quyết.',
    },
    {
      q: 'Blocking problem của 2PC xảy ra khi?',
      options: ['Một participant trả lời no', 'Coordinator hỏng và mọi site còn sống chỉ có <ready T>', 'Mạng chậm', 'Có deadlock cục bộ'],
      answer: 1,
      explain: 'Không ai biết quyết định; các site phải chờ và giữ khoá của T.',
    },
    {
      q: 'n = 5 replica. Cấu hình quorum nào hợp lệ?',
      options: ['Qr = 2, Qw = 3', 'Qr = 3, Qw = 3', 'Qr = 1, Qw = 3', 'Qr = 4, Qw = 2'],
      answer: 1,
      explain: 'Cần Qr + Qw > 5 và 2Qw > 5: chỉ (3, 3) thoả.',
    },
    {
      q: 'Site A không nhận được trả lời từ B. A có phân biệt được B hỏng, link hỏng hay B quá tải?',
      options: ['Có, nhờ timeout', 'Không — giao thức phải đúng trong mọi trường hợp', 'Có, nếu dùng 2PC', 'Có, trong LAN'],
      answer: 1,
      explain: 'PE 23.4.',
    },
    {
      q: 'Trong chain replication, một lần ghi coi là hoàn tất khi nào?',
      options: ['Head đã ghi', 'Đa số replica đã ghi', 'Tail đã áp dụng', 'Coordinator gửi ack'],
      answer: 2,
      explain: 'Đọc ở tail, nên ghi chỉ thấy được khi tail có.',
    },
    {
      q: 'CAP theorem nói gì?',
      options: [
        'Không thể có cả consistency, availability, partition tolerance khi có network partition',
        'Mọi hệ phân tán đều eventual consistency',
        'Partition không thể xảy ra trong LAN',
        '2PC đảm bảo availability',
      ],
      answer: 0,
      explain: 'Khi mạng bị chia, phải chọn giữa nhất quán và sẵn sàng.',
    },
    {
      q: 'Lazy replication, đọc từ replica chưa cập nhật rồi ghi lên primary dựa trên giá trị đó gây ra gì?',
      options: ['Deadlock', 'Mất cập nhật (lost update) / trạng thái không nhất quán', 'Blocking', 'Không vấn đề gì nếu có khoá X ở primary'],
      answer: 1,
      explain: 'PE 23.7: cộng 10 vào số dư cũ 100 thay vì 110.',
    },
    {
      q: 'Lamport timestamp của sự kiện nhận message bằng gì?',
      options: ['Timestamp của sự kiện gửi', 'max(timestamp sự kiện trước trên cùng tiến trình, timestamp sự kiện gửi) + 1', 'Số thứ tự trên tiến trình', 'Giờ đồng hồ thật'],
      answer: 1,
      explain: 'Bảo đảm a happened-before b ⇒ L(a) < L(b).',
    },
  ],

  questions: [
    {
      pe: '23.1',
      q: '**PE 23.1** — Những khác biệt chính giữa LAN và WAN ảnh hưởng tới thiết kế CSDL phân tán?',
      answer: `- **Tốc độ truyền và độ trễ**: LAN nhanh, độ trễ thấp; WAN chậm, độ trễ cao (khoảng cách địa lý). Giao thức cần nhiều vòng liên lạc chấp nhận được trong LAN nhưng hệ cho WAN phải **giảm số vòng**.
- **Nhân bản gần người dùng** để giảm độ trễ đọc rất quan trọng trong WAN, ít quan trọng trong LAN.
- **Hỏng link và network partition** xảy ra thường hơn trong WAN (LAN dễ làm dự phòng). Giao thức cho WAN phải xử lý các lỗi này mà không làm database mất nhất quán.`,
    },
    {
      pe: '23.2',
      q: '**PE 23.2** — (a) Các loại lỗi trong hệ phân tán; (b) loại nào cũng có ở hệ tập trung?',
      answer: `a. (1) **Site hỏng**; (2) **đĩa hỏng**; (3) **mất message**; (4) **lỗi liên lạc** — link hỏng làm một hoặc nhiều site mất kết nối, có thể dẫn tới **network partition**.

b. **Site hỏng** (máy sập) và **đĩa hỏng** cũng xảy ra ở hệ tập trung. Mất message và network partition là đặc thù của hệ phân tán.`,
    },
    {
      pe: '23.3',
      q: '**PE 23.3** — Với mỗi loại lỗi ở PE 23.2a, 2PC bảo đảm atomicity thế nào?',
      answer: `Ý chính: sau khi mọi site đã gửi \`<ready T>\`, **chỉ coordinator** quyết định commit hay abort; mọi site khác chỉ commit/abort sau khi biết quyết định đó (trực tiếp từ coordinator hoặc gián tiếp qua site khác). Vì vậy không thể có site commit trong khi site khác abort.

Một site chỉ **abort** T khi: (i) chưa ghi \`<ready T>\` — coordinator chưa và sẽ không nhận được ready từ nó, nên chỉ có thể quyết định abort; (ii) đã ready nhưng biết site khác có \`<abort T>\` — site đó đã biết quyết định của coordinator; (iii) nó là coordinator — không ai commit được nếu coordinator chưa quyết định commit.
Một site chỉ **commit** T khi: (i) đã ready và biết site khác có \`<commit T>\`; (ii) nó là coordinator và đã nhận ready của mọi site.

Theo từng lỗi:
- **Participant hỏng**: trước khi gửi ready → coordinator coi như no, abort; sau khi ready → khi phục hồi, site đọc log (commit → redo, abort → undo, chỉ ready → hỏi). Log ghi bền vững nên đĩa phục hồi đủ thông tin.
- **Coordinator hỏng**: participant xem log của các site còn sống; nếu có commit/abort thì theo đó; nếu ai đó chưa ready thì abort; nếu mọi site chỉ ready thì **chờ** (blocking) — không bao giờ quyết định trái nhau.
- **Mất message / link hỏng / partition**: hết thời gian chờ thì coi như site kia hỏng; phía có coordinator tiếp tục, phía kia xử lý như coordinator hỏng. Message gửi lại khi liên lạc khôi phục.
- **Đĩa hỏng** (mất log bền vững) vượt khỏi phạm vi 2PC — cần stable storage (nhân bản log).`,
    },
    {
      pe: '23.4',
      q: '**PE 23.4** — Site A có phân biệt được B hỏng, link A–B hỏng, hay B quá tải (trả lời chậm 100 lần)? Hệ quả cho phục hồi?',
      answer: `**Không**, chừng nào chưa liên lạc lại được với B — A chỉ thấy B không trả lời. Do đó hành động của A khi không liên lạc được với B phải **đúng trong cả ba trường hợp**, và phải cho phép B **tái hoà nhập nhất quán** khi liên lạc khôi phục (ví dụ B có thể vẫn đang chạy và đã làm gì đó trong lúc đó). Đây là lý do 2PC bị blocking, và các hệ dùng timeout, lease, consensus.`,
    },
    {
      pe: '23.5',
      q: '**PE 23.5** — Đề xuất cơ chế persistent messaging dựa trên sequence number để bỏ message đã nhận sớm hơn timestamp.',
      answer: `- Mỗi message được gắn **sequence number** duy nhất cho cặp (site gửi, site nhận), tăng 1 cho mỗi message mới từ site gửi tới site nhận.
- Site nhận chỉ **lưu và ack** một message nếu đã nhận **mọi message có số nhỏ hơn** từ site đó (message đến sớm thì bỏ hoặc giữ tạm, chờ gửi lại).
- Site gửi gửi lại một message tới khi nhận ack có số **≥** số của message đó, rồi xoá nó khỏi hàng đợi gửi.
- Site nhận bỏ mọi message có số **≤** số lớn nhất đã lưu từ site gửi đó (trùng lặp). Trong *received_messages* chỉ cần giữ **số lớn nhất** của mỗi site gửi (sau khi message đã được xử lý cục bộ).

Chi phí lưu ở site nhận cố định và nhỏ cho mỗi site gửi, không phụ thuộc số message (cơ chế timestamp tốn chỗ cho mỗi message trong khoảng timeout). Bài CH23.09 tính số ack cao nhất cho mỗi site gửi.`,
    },
    {
      pe: '23.6',
      q: '**PE 23.6** — Khác biệt giữa replication trong hệ phân tán và duy trì remote backup site?',
      answer: `- **Remote backup**: mọi giao dịch chạy ở **primary site**; **toàn bộ** database được sao sang backup bằng cách gửi log record. Primary hỏng thì backup tiếp quản. Không dùng 2PC → chi phí thấp, độ sẵn sàng thấp hơn.
- **Replication phân tán**: nhiều bản sao ở nhiều site, các item khác nhau có thể nhân bản ở các site khác nhau; giao dịch có thể chạy ở **mọi site**, đọc bản gần nhất. Phải dùng 2PC hoặc consensus để giữ các bản sao nhất quán → sẵn sàng cao hơn nhưng tốn chi phí hơn.`,
    },
    {
      pe: '23.7',
      q: '**PE 23.7** — Ví dụ lazy replication gây trạng thái không nhất quán dù cập nhật lấy khoá X ở bản chính, khi đọc từ node không phải master.',
      answer: `Số dư tài khoản = 100, nhân bản ở N site. T1 và T2 mỗi giao dịch gửi thêm 10 → kết quả đúng phải là 120. T1 chạy trước: khoá X ở primary, đổi thành 110, commit; bản sao ở site s **chưa được cập nhật** (lazy). T2 đọc số dư từ site s (vẫn 100), rồi lấy khoá X ở primary và ghi 100 + 10 = **110**. Kết quả cuối ở primary là 110 — cập nhật của T1 bị **mất**. Khoá ở primary không giúp vì T2 đọc ở chỗ khác. Bài CH23.10 tìm các lần đọc thấy dữ liệu cũ.`,
    },
    {
      pe: '23.8',
      q: '**PE 23.8** — Chứng minh: đồ thị do controller xây có chu trình ⇒ hệ đang deadlock; không có chu trình ⇒ hệ không deadlock lúc thuật toán bắt đầu.',
      answer: `**(⇒ deadlock)** Giả sử có chu trình T<sub>i</sub> → T<sub>j</sub> → … → T<sub>m</sub> → T<sub>i</sub>. Mỗi cạnh là (1) cạnh cục bộ (T<sub>k</sub>, T<sub>l</sub>) — chắc chắn T<sub>k</sub> đang chờ T<sub>l</sub>; hoặc (2) cạnh liên site (T<sub>k</sub>, T<sub>l</sub>, n) xuất hiện ở **hơn một** đồ thị — tức đã được chèn ở cả site của T<sub>l</sub>, nghĩa là yêu cầu đã tới T<sub>l</sub> và T<sub>l</sub> không cấp ngay được, nên T<sub>k</sub> thật sự đang chờ T<sub>l</sub>. Vậy mọi cạnh của chu trình là một quan hệ chờ thật, và một vòng chờ như vậy là deadlock (một giao dịch đang chờ không giải phóng tài nguyên).

**(Không chu trình ⇒ không deadlock lúc bắt đầu)** Ngay khi T<sub>k</sub> bắt đầu chờ T<sub>l</sub>: cùng site thì có cạnh cục bộ; khác site thì cạnh (T<sub>k</sub>, T<sub>l</sub>, n) được thêm ở **cả hai** site. Nếu lúc thuật toán bắt đầu có vòng chờ, các giao dịch trong vòng bị deadlock nên **không cạnh nào của vòng biến mất** cho tới khi thuật toán kết thúc. Do đó dù các đồ thị cục bộ được thu thập ở các thời điểm khác nhau, mọi cạnh của vòng vẫn có mặt trong các đồ thị gửi về, và controller sẽ thấy chu trình. Phản đảo: không thấy chu trình ⇒ không có deadlock lúc bắt đầu. Bài CH23.06 và CH23.07 xây đồ thị và tìm chu trình.`,
    },
    {
      pe: '23.9',
      q: '**PE 23.9** — Chain replication: (a) sớm nhất khi nào được nhả khoá X sau khi cập nhật? (b) hai lý do định nghĩa chain theo partition/tablet thay vì từng item; (c) dùng consensus để chain xác định duy nhất?',
      answer: `a. Chỉ sau khi cập nhật đã được ghi nhận ở **tail** của chuỗi, vì các lần đọc sau đọc ở tail; nhả sớm hơn thì giao dịch khác có thể đọc giá trị cũ ở tail rồi ghi đè. (Nếu dùng two-phase locking thì còn phải giữ tới khi giao dịch commit.)

b. (1) Lưu thông tin chain cho **từng item** tốn rất nhiều metadata. (2) Khi node hỏng, mọi chain chứa node đó phải sửa — làm theo từng item thì chi phí phục hồi rất lớn; theo partition chỉ phải sửa vài chain.

c. Mọi node trong chain phải đồng ý về **thành viên và thứ tự** của chain. Lưu cấu hình chain như metadata được nhân bản bằng consensus (Paxos/Raft), thường qua một dịch vụ điều phối chịu lỗi như **ZooKeeper** hay **Chubby**; mỗi thay đổi chain là một cập nhật metadata qua consensus, nên tại mọi thời điểm chỉ có một cấu hình được chấp nhận. Bài CH23.11 tìm các phiên bản đang trên đường qua chain.`,
    },
    {
      pe: '23.10',
      q: '**PE 23.10** — Primary cũ bị ngắt rồi nối lại mà không biết đã có primary mới: (a) vấn đề gì? (b) dùng lease thế nào? (c) có ảnh hưởng majority/quorum protocol không?',
      answer: `a. Primary cũ vẫn nhận và trả lời **đọc** bằng dữ liệu cũ, thiếu các cập nhật đã làm ở primary mới; nếu nó còn nhận **ghi**, hai primary cùng cập nhật → các bản sao mâu thuẫn.

b. Primary chỉ được phục vụ khi giữ **lease** còn hạn và phải gia hạn trước khi hết. Bị ngắt thì không gia hạn được, nên khi lease hết nó **tự ngừng** phục vụ. Primary mới chỉ được bầu sau khi lease của primary cũ chắc chắn đã hết → không bao giờ có hai primary cùng phục vụ. Bài CH23.12 tìm các request bị phục vụ ngoài lease.

c. **Không**: trong majority/quorum, mọi read quorum giao với mọi write quorum, nên một lần đọc luôn gặp ít nhất một node có phiên bản mới nhất (lấy version lớn nhất). Node cũ quay lại chỉ là một replica có version cũ.`,
    },
    {
      pe: '23.11',
      q: '**PE 23.11** — Federated DB, tối đa một global transaction tại một thời điểm, mỗi site serializable cục bộ: (a) làm sao bảo đảm chỉ một global transaction? (b) ví dụ global schedule không serializable.',
      answer: `a. Dùng một **data item đặc biệt** ở một site: mọi global transaction phải lấy khoá trên nó trước khi bắt đầu và nhả sau khi kết thúc. Để không phụ thuộc một site, dùng **bầu chọn** để chọn coordinator trong các site đang sống và yêu cầu khoá trên item ở coordinator hiện tại.

b. Hai site, giao dịch cục bộ T1 (site 1) và T2 (site 2), global G1 và G2 (G2 bắt đầu sau khi G1 kết thúc) — bảng \`pd_sched\`:
| bước | site | giao dịch | thao tác |
|---|---|---|---|
| 1 | 1 | T1 | read(X1) |
| 2 | 1 | G1 | write(X1) |
| 3 | 2 | G1 | write(X2) |
| 4 | 2 | T2 | read(X2) |
| 5 | 2 | T2 | write(Y2) |
| 6 | 2 | G2 | read(Y2) |
| 7 | 1 | G2 | read(Y1) |
| 8 | 1 | T1 | write(Y1) |

Site 1 serializable theo thứ tự G2 → T1 → G1; site 2 theo G1 → T2 → G2. Toàn cục có chu trình G1 → T2 → G2 → T1 → G1 → **không serializable**, dù chỉ một global transaction chạy tại mỗi thời điểm. Bài CH23.13 tính các cạnh precedence.`,
    },
    {
      pe: '23.12',
      q: '**PE 23.12** — Federated DB, mỗi site serializable cục bộ, mọi global transaction chỉ đọc: (a) ví dụ không serializable; (b) dùng ticket để bảo đảm global serializability.',
      answer: `a. Cùng hệ hai site như PE 23.11, nhưng G1, G2 chỉ đọc: site 1: G1 read(X1), T1 write(X1), G2 read(X1) → G1 → T1 → G2. Site 2: G2 read(X2), T2 write(X2), G1 read(X2) → G2 → T2 → G1. Mỗi site serializable, nhưng toàn cục G1 trước G2 ở site 1 và G2 trước G1 ở site 2 → chu trình, không serializable.

b. Vì mỗi site serializable cục bộ, một chu trình trong precedence graph toàn cục phải đi qua ít nhất hai site và hai global transaction. **Ticket**: mỗi site có một data item *ticket*; mọi global transaction truy cập site phải đọc rồi ghi (tăng) ticket ở đó, nên hai global transaction luôn **xung đột** trên ticket tại mỗi site chung. Global transaction manager điều khiển thứ tự lấy ticket để các global transaction có **cùng thứ tự serializable ở mọi site** → không thể có chu trình như trên.`,
    },
    {
      pe: '23.13',
      q: '**PE 23.13** — View v = <sub>A</sub>γ<sub>sum(B)</sub>(r) được duy trì trong giao dịch cập nhật, trên hệ dùng 2PC + Paxos qua nhiều data center: (a) vì sao tệ khi có giá trị A "nóng"? (b) operation locking giúp gì? (c) đánh đổi của duy trì view bất đồng bộ?',
      answer: `a. Mọi giao dịch cập nhật r với A nóng phải cập nhật **cùng một tuple** của view → xếp hàng trên khoá X của tuple đó. Commit qua 2PC + Paxos giữa các data center mất hàng trăm mili giây, khoá bị giữ suốt thời gian đó → throughput chỉ còn vài chục giao dịch mỗi giây, dù các giao dịch không xung đột gì khác.

b. Cập nhật view chỉ là **cộng thêm** vào sum. **Operation locking** (khoá theo thao tác, ví dụ khoá "increment") cho phép nhiều thao tác cộng chạy đồng thời vì phép cộng giao hoán, các khoá increment không xung đột nhau → throughput tăng mạnh.

c. **Bất đồng bộ**: giao dịch chỉ cập nhật r và ghi lại thay đổi; view được cập nhật sau → không còn nút thắt, throughput cao. Đổi lại, đọc view có thể thấy **dữ liệu cũ** (chưa phản ánh các cập nhật gần đây), và cần cơ chế bảo đảm mọi thay đổi cuối cùng đều được áp dụng đúng một lần.`,
    },
  ],

  exercises: [
    {
      id: 'CH23.01', topic: '2PC: quyết định của coordinator', level: 1,
      prompt: 'Bảng `pd_2pc_log(txn, site, seq, rec)` chứa log của coordinator (site `C`) và các participant. Với mỗi giao dịch, trả về txn và `decision`: `commit` nếu coordinator đã ghi commit, `abort` nếu coordinator đã ghi abort, ngược lại `undecided`. Sắp theo txn.',
      solution: `select txn,
       case when bool_or(site = 'C' and rec = 'commit') then 'commit'
            when bool_or(site = 'C' and rec = 'abort') then 'abort'
            else 'undecided' end as decision
from pd_2pc_log
group by txn
order by txn;`,
      ordered: true,
    },
    {
      id: 'CH23.02', topic: '2PC: phục hồi participant', level: 2,
      prompt: 'Bảng `pd_2pc_part(txn, site)` liệt kê participant của mỗi giao dịch. Mỗi participant phục hồi chỉ dựa vào **log của chính nó**: có commit → `redo`; có abort hoặc no → `undo`; chỉ có ready → `ask`; không có record nào của txn → `undo`. Trả về txn, site, `action`, sắp theo txn, site.',
      solution: `select p.txn, p.site,
       case when bool_or(l.rec = 'commit') then 'redo'
            when bool_or(l.rec in ('abort', 'no')) then 'undo'
            when bool_or(l.rec = 'ready') then 'ask'
            else 'undo' end as action
from pd_2pc_part p
left join pd_2pc_log l on l.txn = p.txn and l.site = p.site
group by p.txn, p.site
order by p.txn, p.site;`,
      ordered: true,
    },
    {
      id: 'CH23.03', topic: '2PC: blocking', level: 2,
      prompt: 'Coordinator `C` vừa hỏng. Các participant còn sống trao đổi log với nhau. Với mỗi giao dịch, quyết định: `commit` nếu có participant nào có commit; `abort` nếu có participant có abort/no **hoặc** có participant chưa ghi ready; nếu **mọi** participant đều chỉ có ready → `blocked` (phải chờ C). Trả về txn, `outcome`, sắp theo txn.',
      solution: `with s as (
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
order by txn;`,
      ordered: true,
    },
    {
      id: 'CH23.04', topic: 'quorum consensus', level: 1,
      prompt: 'Bảng `pd_quorum(cfg, n, r, w)`. Một cấu hình hợp lệ khi `r + w > n` (đọc luôn giao với lần ghi gần nhất) **và** `2w > n` (hai lần ghi không thể cùng lúc). Trả về cfg, `read_sees_write` (boolean r + w > n), `writes_conflict` (boolean 2w > n), `valid` (cả hai), sắp theo cfg.',
      solution: `select cfg, r + w > n as read_sees_write, 2 * w > n as writes_conflict, (r + w > n and 2 * w > n) as valid
from pd_quorum
order by cfg;`,
      ordered: true,
    },
    {
      id: 'CH23.05', topic: 'đọc quorum: version lớn nhất', level: 2,
      prompt: 'Bảng `pd_copy(item, node, version, val)` là các bản sao; `pd_read_req(req, item, node)` cho biết mỗi lần đọc quorum hỏi những node nào. Lần đọc trả về giá trị có **version lớn nhất** trong các node được hỏi. Trả về req, item, `version`, `val`, sắp theo req.',
      solution: `select distinct on (q.req) q.req, q.item, c.version, c.val
from pd_read_req q join pd_copy c on c.item = q.item and c.node = q.node
order by q.req, c.version desc;`,
      ordered: true,
    },
    {
      id: 'CH23.06', topic: 'global wait-for graph', level: 2, pe: '23.8',
      prompt: 'Bảng `pd_wfg(site, waiter, holder, ts)` là các local wait-for graph (ts null = cạnh cục bộ; ts khác null = cạnh liên site gắn timestamp của request). Theo PE 23.8, đồ thị toàn cục gồm cạnh (waiter, holder) nếu: có một cạnh **cục bộ** như vậy, **hoặc** cạnh liên site (waiter, holder, ts) xuất hiện ở **hơn một** site. Trả về các cạnh (waiter, holder) của đồ thị toàn cục, không trùng, sắp theo waiter, holder.',
      solution: `select waiter, holder from pd_wfg where ts is null
union
select waiter, holder from pd_wfg where ts is not null
group by waiter, holder, ts having count(distinct site) > 1
order by waiter, holder;`,
      ordered: true,
    },
    {
      id: 'CH23.07', topic: 'phát hiện deadlock', level: 3, pe: '23.8',
      prompt: 'Dùng đồ thị toàn cục của CH23.06, tìm các giao dịch nằm trên **một chu trình** (deadlock). Trả về cột `txn`, sắp theo txn. Gợi ý: recursive CTE tìm mọi cặp (x, y) mà y đến được từ x; x nằm trên chu trình nếu x đến được chính nó.',
      solution: `with recursive g as (
  select waiter, holder from pd_wfg where ts is null
  union
  select waiter, holder from pd_wfg where ts is not null
  group by waiter, holder, ts having count(distinct site) > 1
), reach(src, dst) as (
  select waiter, holder from g
  union
  select r.src, g.holder from reach r join g on g.waiter = r.dst
)
select src as txn from reach where src = dst order by src;`,
      ordered: true,
    },
    {
      id: 'CH23.08', topic: 'Lamport timestamp', level: 3,
      prompt: 'Bảng `pd_event(proc, seq, kind, msg)`: các sự kiện của từng tiến trình theo thứ tự seq; sự kiện `recv` nhận message do sự kiện `send` có cùng `msg` gửi. Lamport timestamp: L(e) = 1 + max(L của sự kiện liền trước trên cùng tiến trình, L của sự kiện send tương ứng nếu e là recv), với max của tập rỗng = 0. Trả về proc, seq, `lamport`, sắp theo proc, seq.',
      hint: 'L(e) bằng số sự kiện trên đường happened-before dài nhất kết thúc tại e. Recursive CTE đi theo các cạnh (sự kiện trước → sự kiện sau), rồi lấy max độ dài.',
      solution: `with recursive edge(fp, fs, tp, ts) as (
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
order by proc, seq;`,
      ordered: true,
    },
    {
      id: 'CH23.09', topic: 'persistent messaging: sequence number', level: 2, pe: '23.5',
      prompt: 'Bảng `pd_msg_in(sender, seq, arrival)`: các message nhận được từ mỗi site gửi (sequence number bắt đầu từ 1). Theo PE 23.5, site nhận chỉ ack/lưu message seq = k nếu đã có mọi message 1 … k − 1. Với mỗi sender, trả về `acked_upto` = số k lớn nhất mà mọi message 1 … k đều đã nhận (0 nếu chưa có message 1). Sắp theo sender.',
      hint: 'k thoả khi số message có seq ≤ k bằng k.',
      solution: `select s.sender,
       coalesce((select max(m.seq) from pd_msg_in m
                 where m.sender = s.sender
                   and (select count(*) from pd_msg_in x where x.sender = m.sender and x.seq <= m.seq) = m.seq), 0) as acked_upto
from (select distinct sender from pd_msg_in) s
order by s.sender;`,
      ordered: true,
    },
    {
      id: 'CH23.10', topic: 'lazy replication: đọc dữ liệu cũ', level: 3, pe: '23.7',
      prompt: '`pd_primary_hist(version, t_commit, balance)` là các phiên bản đã commit ở primary; `pd_replica_apply(node, version, t_apply)` cho biết replica áp dụng phiên bản lúc nào; `pd_replica_read(read_id, node, t)` là các lần đọc ở replica. Một lần đọc thấy balance của phiên bản lớn nhất mà replica đã áp dụng tại thời điểm ≤ t; balance đúng là phiên bản lớn nhất primary đã commit tại thời điểm ≤ t. Trả về read_id, node, `seen`, `primary_balance`, `stale` (boolean), sắp theo read_id.',
      solution: `select r.read_id, r.node,
       (select h.balance from pd_replica_apply a join pd_primary_hist h on h.version = a.version
        where a.node = r.node and a.t_apply <= r.t order by a.version desc limit 1) as seen,
       (select h.balance from pd_primary_hist h where h.t_commit <= r.t order by h.version desc limit 1) as primary_balance,
       (select max(a.version) from pd_replica_apply a where a.node = r.node and a.t_apply <= r.t)
         < (select max(h.version) from pd_primary_hist h where h.t_commit <= r.t) as stale
from pd_replica_read r
order by r.read_id;`,
      ordered: true,
    },
    {
      id: 'CH23.11', topic: 'chain replication', level: 2, pe: '23.9',
      prompt: 'Bảng `pd_chain(item, pos, node, version)`: chain của mỗi item, pos 1 là **head**, pos lớn nhất là **tail**; version là phiên bản mới nhất node đó đã áp dụng. Một lần ghi chỉ coi là commit khi tail đã áp dụng. Với mỗi item, trả về `head_version`, `committed_version` (version ở tail), `in_flight` (= head_version − committed_version), sắp theo item.',
      solution: `select c.item,
       max(c.version) filter (where c.pos = 1) as head_version,
       max(c.version) filter (where c.pos = t.max_pos) as committed_version,
       max(c.version) filter (where c.pos = 1) - max(c.version) filter (where c.pos = t.max_pos) as in_flight
from pd_chain c
join (select item, max(pos) as max_pos from pd_chain group by item) t on t.item = c.item
group by c.item
order by c.item;`,
      ordered: true,
    },
    {
      id: 'CH23.12', topic: 'lease', level: 2, pe: '23.10',
      prompt: 'Bảng `pd_lease(node, lease_start, lease_end)` (lease có hiệu lực trong [lease_start, lease_end)) và `pd_serve(req, node, t)` (các request mà node đã phục vụ với tư cách primary lúc t). Tìm các request **vi phạm**: node không giữ lease nào còn hiệu lực tại t. Trả về req, node, t, sắp theo req.',
      solution: `select s.req, s.node, s.t
from pd_serve s
where not exists (select * from pd_lease l
                  where l.node = s.node and l.lease_start <= s.t and s.t < l.lease_end)
order by s.req;`,
      ordered: true,
    },
    {
      id: 'CH23.13', topic: 'federated: precedence graph', level: 3, pe: '23.11b',
      prompt: 'Bảng `pd_sched(step, site, txn, op, item)` là schedule của PE 23.11b. Hai thao tác **xung đột** nếu cùng site, cùng item, khác giao dịch và ít nhất một là write; thao tác xảy ra trước (step nhỏ hơn) tạo cạnh `from_txn → to_txn`. Trả về các cạnh (from_txn, to_txn, site) không trùng, sắp theo site, from_txn. Có chu trình không?',
      solution: `select distinct a.txn as from_txn, b.txn as to_txn, a.site
from pd_sched a join pd_sched b
  on a.site = b.site and a.item = b.item and a.txn <> b.txn and a.step < b.step
 and (a.op = 'write' or b.op = 'write')
order by a.site, a.txn;`,
      ordered: true,
    },
  ],
};
