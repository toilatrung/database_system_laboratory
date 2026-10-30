# Chương 23 — Xử lý giao dịch song song và phân tán

*Parallel and Distributed Transaction Processing · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch23`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 0. Phạm vi
Chương 23 ngoài lịch học CS4420. Bài SQL phân tích dữ liệu "log" của nhiều site: quyết định của coordinator và hành động phục hồi trong **two-phase commit**, quorum, đọc dữ liệu cũ do lazy replication, đồ thị wait-for toàn cục, Lamport timestamp, chain replication, lease và precedence graph của một federated schedule.

### 1. Mô hình giao dịch phân tán (slide 23.3–23.8)
- Mỗi site có **transaction manager** (log, đồng thời cục bộ) và **transaction coordinator** (khởi động giao dịch, chia việc cho các site, điều phối kết thúc).
- Lỗi đặc thù của hệ phân tán: **site hỏng**, **mất message**, **link hỏng**, **network partition** (mạng bị chia thành các nhóm không liên lạc được) (PE 23.2). Một site không phân biệt được site kia hỏng, link hỏng hay site kia quá tải (PE 23.4) → giao thức phải đúng trong mọi trường hợp.
- LAN vs WAN (PE 23.1): WAN độ trễ cao, băng thông thấp, dễ partition → giảm số vòng liên lạc, nhân bản dữ liệu gần người dùng.

### 2. Two-phase commit — 2PC (slide 23.9–23.20)
Coordinator C của giao dịch T, các participant S<sub>i</sub>:
- **Phase 1 (prepare)**: C ghi `<prepare T>` và gửi `prepare T` tới mọi site. Mỗi site: nếu không commit được → ghi `<no T>` và trả lời abort; nếu được → force-write mọi log của T và `<ready T>` rồi trả lời ready.
- **Phase 2 (commit/abort)**: nếu **mọi** site trả lời ready → C ghi `<commit T>` (đây là **điểm quyết định**); nếu có site trả lời no hoặc hết thời gian chờ → `<abort T>`. C gửi quyết định tới các site; mỗi site ghi log tương ứng.
- **Site S<sub>k</sub> phục hồi**, xét log của chính nó:
  - có `<commit T>` → **redo(T)**; có `<abort T>` → **undo(T)**;
  - có `<ready T>` mà không có commit/abort → **hỏi coordinator** (hoặc site khác) về quyết định;
  - không có gì về T (chưa ready) → **undo(T)** (coordinator chắc chắn không thể đã commit).
- **Coordinator hỏng**: participant nào có `<commit T>` thì T commit; có `<abort T>` hoặc chưa `<ready T>` thì T phải abort; nếu **mọi** site còn sống chỉ có `<ready T>` → phải **chờ** coordinator phục hồi: **blocking problem** của 2PC (vẫn giữ khoá của T).
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
| `<commit T>` | redo(T) |
| `<abort T>` (hoặc `<no T>`) | undo(T) |
| chỉ `<ready T>` | hỏi coordinator / site khác; nếu không ai biết → **blocked** |
| không có gì của T | undo(T) |

## 2. Trắc nghiệm (9 câu)

**Câu 1.** Trong 2PC, điểm quyết định commit của giao dịch T là lúc nào?

- A. Khi mọi site ghi <ready T>
- B. Khi coordinator ghi <commit T> vào log bền vững
- C. Khi site cuối cùng ghi <commit T>
- D. Khi gửi prepare

<details><summary>Đáp án</summary>

**B** — Sau khi <commit T> ở coordinator được ghi bền vững, T chắc chắn commit.

</details>

**Câu 2.** Site phục hồi thấy log có <ready T> nhưng không có commit/abort. Nó làm gì?

- A. redo(T)
- B. undo(T)
- C. Hỏi coordinator (hoặc site khác) về quyết định
- D. Bỏ qua T

<details><summary>Đáp án</summary>

**C** — Site đã hứa commit nên không được tự quyết.

</details>

**Câu 3.** Blocking problem của 2PC xảy ra khi?

- A. Một participant trả lời no
- B. Coordinator hỏng và mọi site còn sống chỉ có <ready T>
- C. Mạng chậm
- D. Có deadlock cục bộ

<details><summary>Đáp án</summary>

**B** — Không ai biết quyết định; các site phải chờ và giữ khoá của T.

</details>

**Câu 4.** n = 5 replica. Cấu hình quorum nào hợp lệ?

- A. Qr = 2, Qw = 3
- B. Qr = 3, Qw = 3
- C. Qr = 1, Qw = 3
- D. Qr = 4, Qw = 2

<details><summary>Đáp án</summary>

**B** — Cần Qr + Qw > 5 và 2Qw > 5: chỉ (3, 3) thoả.

</details>

**Câu 5.** Site A không nhận được trả lời từ B. A có phân biệt được B hỏng, link hỏng hay B quá tải?

- A. Có, nhờ timeout
- B. Không — giao thức phải đúng trong mọi trường hợp
- C. Có, nếu dùng 2PC
- D. Có, trong LAN

<details><summary>Đáp án</summary>

**B** — PE 23.4.

</details>

**Câu 6.** Trong chain replication, một lần ghi coi là hoàn tất khi nào?

- A. Head đã ghi
- B. Đa số replica đã ghi
- C. Tail đã áp dụng
- D. Coordinator gửi ack

<details><summary>Đáp án</summary>

**C** — Đọc ở tail, nên ghi chỉ thấy được khi tail có.

</details>

**Câu 7.** CAP theorem nói gì?

- A. Không thể có cả consistency, availability, partition tolerance khi có network partition
- B. Mọi hệ phân tán đều eventual consistency
- C. Partition không thể xảy ra trong LAN
- D. 2PC đảm bảo availability

<details><summary>Đáp án</summary>

**A** — Khi mạng bị chia, phải chọn giữa nhất quán và sẵn sàng.

</details>

**Câu 8.** Lazy replication, đọc từ replica chưa cập nhật rồi ghi lên primary dựa trên giá trị đó gây ra gì?

- A. Deadlock
- B. Mất cập nhật (lost update) / trạng thái không nhất quán
- C. Blocking
- D. Không vấn đề gì nếu có khoá X ở primary

<details><summary>Đáp án</summary>

**B** — PE 23.7: cộng 10 vào số dư cũ 100 thay vì 110.

</details>

**Câu 9.** Lamport timestamp của sự kiện nhận message bằng gì?

- A. Timestamp của sự kiện gửi
- B. max(timestamp sự kiện trước trên cùng tiến trình, timestamp sự kiện gửi) + 1
- C. Số thứ tự trên tiến trình
- D. Giờ đồng hồ thật

<details><summary>Đáp án</summary>

**B** — Bảo đảm a happened-before b ⇒ L(a) < L(b).

</details>

## 3. Câu hỏi tự luận (13 câu)

**Câu 1.** 

> **Exercise 23.1.** Which key differences between a local-area network and a wide-area network affect the design of a distributed database?

**PE 23.1** — Những khác biệt chính giữa LAN và WAN ảnh hưởng tới thiết kế CSDL phân tán?

<details><summary>Gợi ý đáp án</summary>

- **Tốc độ truyền và độ trễ**: LAN nhanh, độ trễ thấp; WAN chậm, độ trễ cao (khoảng cách địa lý). Giao thức cần nhiều vòng liên lạc chấp nhận được trong LAN nhưng hệ cho WAN phải **giảm số vòng**.
- **Nhân bản gần người dùng** để giảm độ trễ đọc rất quan trọng trong WAN, ít quan trọng trong LAN.
- **Hỏng link và network partition** xảy ra thường hơn trong WAN (LAN dễ làm dự phòng). Giao thức cho WAN phải xử lý các lỗi này mà không làm database mất nhất quán.

</details>

**Câu 2.** 

> **Exercise 23.2.** Building a highly available distributed system requires knowing which kinds of failures can happen.
> 
> a. List the possible kinds of failure in a distributed system.
> 
> b. Which of the items in your list for part a also apply to a centralized system?

**PE 23.2** — (a) Các loại lỗi trong hệ phân tán; (b) loại nào cũng có ở hệ tập trung?

<details><summary>Gợi ý đáp án</summary>

a. (1) **Site hỏng**; (2) **đĩa hỏng**; (3) **mất message**; (4) **lỗi liên lạc** — link hỏng làm một hoặc nhiều site mất kết nối, có thể dẫn tới **network partition**.

b. **Site hỏng** (máy sập) và **đĩa hỏng** cũng xảy ra ở hệ tập trung. Mất message và network partition là đặc thù của hệ phân tán.

</details>

**Câu 3.** 

> **Exercise 23.3.** Consider a failure that happens during 2PC for a transaction. For each kind of failure you listed in Exercise 23.2a, explain how 2PC keeps the transaction atomic in spite of that failure.

**PE 23.3** — Với mỗi loại lỗi ở PE 23.2a, 2PC bảo đảm atomicity thế nào?

<details><summary>Gợi ý đáp án</summary>

Ý chính: sau khi mọi site đã gửi `<ready T>`, **chỉ coordinator** quyết định commit hay abort; mọi site khác chỉ commit/abort sau khi biết quyết định đó (trực tiếp từ coordinator hoặc gián tiếp qua site khác). Vì vậy không thể có site commit trong khi site khác abort.

Một site chỉ **abort** T khi: (i) chưa ghi `<ready T>` — coordinator chưa và sẽ không nhận được ready từ nó, nên chỉ có thể quyết định abort; (ii) đã ready nhưng biết site khác có `<abort T>` — site đó đã biết quyết định của coordinator; (iii) nó là coordinator — không ai commit được nếu coordinator chưa quyết định commit.
Một site chỉ **commit** T khi: (i) đã ready và biết site khác có `<commit T>`; (ii) nó là coordinator và đã nhận ready của mọi site.

Theo từng lỗi:
- **Participant hỏng**: trước khi gửi ready → coordinator coi như no, abort; sau khi ready → khi phục hồi, site đọc log (commit → redo, abort → undo, chỉ ready → hỏi). Log ghi bền vững nên đĩa phục hồi đủ thông tin.
- **Coordinator hỏng**: participant xem log của các site còn sống; nếu có commit/abort thì theo đó; nếu ai đó chưa ready thì abort; nếu mọi site chỉ ready thì **chờ** (blocking) — không bao giờ quyết định trái nhau.
- **Mất message / link hỏng / partition**: hết thời gian chờ thì coi như site kia hỏng; phía có coordinator tiếp tục, phía kia xử lý như coordinator hỏng. Message gửi lại khi liên lạc khôi phục.
- **Đĩa hỏng** (mất log bền vững) vượt khỏi phạm vi 2PC — cần stable storage (nhân bản log).

</details>

**Câu 4.** 

> **Exercise 23.4.** A distributed system has two sites, A and B. Can site A tell apart the following situations?
> 
> - B has gone down.
> - The link between A and B has gone down.
> - B is extremely overloaded, and its response time is 100 times longer than normal.
> 
> What does your answer imply for recovery in distributed systems?

**PE 23.4** — Site A có phân biệt được B hỏng, link A–B hỏng, hay B quá tải (trả lời chậm 100 lần)? Hệ quả cho phục hồi?

<details><summary>Gợi ý đáp án</summary>

**Không**, chừng nào chưa liên lạc lại được với B — A chỉ thấy B không trả lời. Do đó hành động của A khi không liên lạc được với B phải **đúng trong cả ba trường hợp**, và phải cho phép B **tái hoà nhập nhất quán** khi liên lạc khôi phục (ví dụ B có thể vẫn đang chạy và đã làm gì đó trong lúc đó). Đây là lý do 2PC bị blocking, và các hệ dùng timeout, lease, consensus.

</details>

**Câu 5.** 

> **Exercise 23.5.** The persistent-messaging scheme of this chapter relies on timestamps. Its drawback is that received messages can be discarded only once they are too old, so a large number of received messages may have to be remembered. Propose an alternative scheme based on sequence numbers instead of timestamps that can discard messages sooner.

**PE 23.5** — Đề xuất cơ chế persistent messaging dựa trên sequence number để bỏ message đã nhận sớm hơn timestamp.

<details><summary>Gợi ý đáp án</summary>

- Mỗi message được gắn **sequence number** duy nhất cho cặp (site gửi, site nhận), tăng 1 cho mỗi message mới từ site gửi tới site nhận.
- Site nhận chỉ **lưu và ack** một message nếu đã nhận **mọi message có số nhỏ hơn** từ site đó (message đến sớm thì bỏ hoặc giữ tạm, chờ gửi lại).
- Site gửi gửi lại một message tới khi nhận ack có số **≥** số của message đó, rồi xoá nó khỏi hàng đợi gửi.
- Site nhận bỏ mọi message có số **≤** số lớn nhất đã lưu từ site gửi đó (trùng lặp). Trong *received_messages* chỉ cần giữ **số lớn nhất** của mỗi site gửi (sau khi message đã được xử lý cục bộ).

Chi phí lưu ở site nhận cố định và nhỏ cho mỗi site gửi, không phụ thuộc số message (cơ chế timestamp tốn chỗ cho mỗi message trong khoảng timeout). Bài CH23.09 tính số ack cao nhất cho mỗi site gửi.

</details>

**Câu 6.** 

> **Exercise 23.6.** Explain how data replication in a distributed system differs from maintaining a remote backup site.

**PE 23.6** — Khác biệt giữa replication trong hệ phân tán và duy trì remote backup site?

<details><summary>Gợi ý đáp án</summary>

- **Remote backup**: mọi giao dịch chạy ở **primary site**; **toàn bộ** database được sao sang backup bằng cách gửi log record. Primary hỏng thì backup tiếp quản. Không dùng 2PC → chi phí thấp, độ sẵn sàng thấp hơn.
- **Replication phân tán**: nhiều bản sao ở nhiều site, các item khác nhau có thể nhân bản ở các site khác nhau; giao dịch có thể chạy ở **mọi site**, đọc bản gần nhất. Phải dùng 2PC hoặc consensus để giữ các bản sao nhất quán → sẵn sàng cao hơn nhưng tốn chi phí hơn.

</details>

**Câu 7.** 

> **Exercise 23.7.** Give an example in which lazy replication leads to an inconsistent database state, even though updates obtain an exclusive lock on the primary (master) copy, when data are read from a node other than the master.

**PE 23.7** — Ví dụ lazy replication gây trạng thái không nhất quán dù cập nhật lấy khoá X ở bản chính, khi đọc từ node không phải master.

<details><summary>Gợi ý đáp án</summary>

Số dư tài khoản = 100, nhân bản ở N site. T1 và T2 mỗi giao dịch gửi thêm 10 → kết quả đúng phải là 120. T1 chạy trước: khoá X ở primary, đổi thành 110, commit; bản sao ở site s **chưa được cập nhật** (lazy). T2 đọc số dư từ site s (vẫn 100), rồi lấy khoá X ở primary và ghi 100 + 10 = **110**. Kết quả cuối ở primary là 110 — cập nhật của T1 bị **mất**. Khoá ở primary không giúp vì T2 đọc ở chỗ khác. Bài CH23.10 tìm các lần đọc thấy dữ liệu cũ.

</details>

**Câu 8.** 

> **Exercise 23.8.** Consider the following deadlock-detection algorithm. When transaction T<sub>i</sub> at site S<sub>1</sub> requests a resource from T<sub>j</sub> at site S<sub>3</sub>, a request message with timestamp n is sent. The edge (T<sub>i</sub>, T<sub>j</sub>, n) is inserted into the local wait-for graph of S<sub>1</sub>. The edge (T<sub>i</sub>, T<sub>j</sub>, n) is inserted into the local wait-for graph of S<sub>3</sub> only if T<sub>j</sub> has received the request message and cannot grant the requested resource immediately. A request from T<sub>i</sub> to T<sub>j</sub> at the same site is handled in the usual way, and no timestamp is attached to the edge (T<sub>i</sub>, T<sub>j</sub>). A central coordinator starts the detection algorithm by sending an initiating message to every site.
> 
> When a site receives this message, it sends its local wait-for graph to the coordinator. Such a graph holds all the local information the site has about the state of the real graph; it reflects an instantaneous state of that site but is not synchronized with any other site.
> 
> After the controller has received a reply from every site, it builds a graph as follows:
> 
> - The graph has a vertex for every transaction in the system.
> - The graph has an edge (T<sub>i</sub>, T<sub>j</sub>) if and only if either there is an edge (T<sub>i</sub>, T<sub>j</sub>) in one of the wait-for graphs, or an edge (T<sub>i</sub>, T<sub>j</sub>, n) (for some n) appears in more than one wait-for graph.
> 
> Show that if the constructed graph contains a cycle, the system is in a deadlock state, and that if it contains no cycle, the system was not in a deadlock state when the algorithm started.

**PE 23.8** — Chứng minh: đồ thị do controller xây có chu trình ⇒ hệ đang deadlock; không có chu trình ⇒ hệ không deadlock lúc thuật toán bắt đầu.

<details><summary>Gợi ý đáp án</summary>

**(⇒ deadlock)** Giả sử có chu trình T<sub>i</sub> → T<sub>j</sub> → … → T<sub>m</sub> → T<sub>i</sub>. Mỗi cạnh là (1) cạnh cục bộ (T<sub>k</sub>, T<sub>l</sub>) — chắc chắn T<sub>k</sub> đang chờ T<sub>l</sub>; hoặc (2) cạnh liên site (T<sub>k</sub>, T<sub>l</sub>, n) xuất hiện ở **hơn một** đồ thị — tức đã được chèn ở cả site của T<sub>l</sub>, nghĩa là yêu cầu đã tới T<sub>l</sub> và T<sub>l</sub> không cấp ngay được, nên T<sub>k</sub> thật sự đang chờ T<sub>l</sub>. Vậy mọi cạnh của chu trình là một quan hệ chờ thật, và một vòng chờ như vậy là deadlock (một giao dịch đang chờ không giải phóng tài nguyên).

**(Không chu trình ⇒ không deadlock lúc bắt đầu)** Ngay khi T<sub>k</sub> bắt đầu chờ T<sub>l</sub>: cùng site thì có cạnh cục bộ; khác site thì cạnh (T<sub>k</sub>, T<sub>l</sub>, n) được thêm ở **cả hai** site. Nếu lúc thuật toán bắt đầu có vòng chờ, các giao dịch trong vòng bị deadlock nên **không cạnh nào của vòng biến mất** cho tới khi thuật toán kết thúc. Do đó dù các đồ thị cục bộ được thu thập ở các thời điểm khác nhau, mọi cạnh của vòng vẫn có mặt trong các đồ thị gửi về, và controller sẽ thấy chu trình. Phản đảo: không thấy chu trình ⇒ không có deadlock lúc bắt đầu. Bài CH23.06 và CH23.07 xây đồ thị và tìm chu trình.

</details>

**Câu 9.** 

> **Exercise 23.9.** Consider the chain-replication protocol of Section 23.4.3.2, a variant of the primary-copy protocol.
> 
> a. If locking is used for concurrency control, what is the earliest moment at which a process may release an exclusive lock after updating a data item?
> 
> b. Each data item could have its own chain, but give two reasons why it is better to define a chain at a coarser level, for example per partition or tablet.
> 
> c. How can consensus protocols be used to make sure that the chain is uniquely determined at every point in time?

**PE 23.9** — Chain replication: (a) sớm nhất khi nào được nhả khoá X sau khi cập nhật? (b) hai lý do định nghĩa chain theo partition/tablet thay vì từng item; (c) dùng consensus để chain xác định duy nhất?

<details><summary>Gợi ý đáp án</summary>

a. Chỉ sau khi cập nhật đã được ghi nhận ở **tail** của chuỗi, vì các lần đọc sau đọc ở tail; nhả sớm hơn thì giao dịch khác có thể đọc giá trị cũ ở tail rồi ghi đè. (Nếu dùng two-phase locking thì còn phải giữ tới khi giao dịch commit.)

b. (1) Lưu thông tin chain cho **từng item** tốn rất nhiều metadata. (2) Khi node hỏng, mọi chain chứa node đó phải sửa — làm theo từng item thì chi phí phục hồi rất lớn; theo partition chỉ phải sửa vài chain.

c. Mọi node trong chain phải đồng ý về **thành viên và thứ tự** của chain. Lưu cấu hình chain như metadata được nhân bản bằng consensus (Paxos/Raft), thường qua một dịch vụ điều phối chịu lỗi như **ZooKeeper** hay **Chubby**; mỗi thay đổi chain là một cập nhật metadata qua consensus, nên tại mọi thời điểm chỉ có một cấu hình được chấp nhận. Bài CH23.11 tìm các phiên bản đang trên đường qua chain.

</details>

**Câu 10.** 

> **Exercise 23.10.** With the primary-copy replication scheme, if the primary becomes disconnected from the rest of the system, a new node may be elected primary. The old primary may not notice that it was disconnected, and may later reconnect without knowing that a new primary exists.
> 
> a. What problems can occur if the old primary does not realize that a new primary has taken over?
> 
> b. How can leases be used to avoid these problems?
> 
> c. Would such a situation — a participant node is disconnected and then reconnected without realizing it was disconnected — cause any problem for the majority or quorum protocols?

**PE 23.10** — Primary cũ bị ngắt rồi nối lại mà không biết đã có primary mới: (a) vấn đề gì? (b) dùng lease thế nào? (c) có ảnh hưởng majority/quorum protocol không?

<details><summary>Gợi ý đáp án</summary>

a. Primary cũ vẫn nhận và trả lời **đọc** bằng dữ liệu cũ, thiếu các cập nhật đã làm ở primary mới; nếu nó còn nhận **ghi**, hai primary cùng cập nhật → các bản sao mâu thuẫn.

b. Primary chỉ được phục vụ khi giữ **lease** còn hạn và phải gia hạn trước khi hết. Bị ngắt thì không gia hạn được, nên khi lease hết nó **tự ngừng** phục vụ. Primary mới chỉ được bầu sau khi lease của primary cũ chắc chắn đã hết → không bao giờ có hai primary cùng phục vụ. Bài CH23.12 tìm các request bị phục vụ ngoài lease.

c. **Không**: trong majority/quorum, mọi read quorum giao với mọi write quorum, nên một lần đọc luôn gặp ít nhất một node có phiên bản mới nhất (lấy version lớn nhất). Node cũ quay lại chỉ là một replica có version cũ.

</details>

**Câu 11.** 

> **Exercise 23.11.** Consider a federated database system in which at most one global transaction is guaranteed to be active at any time, and every local site guarantees local serializability.
> 
> a. Suggest ways in which the federated system can make sure that at most one global transaction is active at any time.
> 
> b. Show with an example that a nonserializable global schedule can still occur under these assumptions.

**PE 23.11** — Federated DB, tối đa một global transaction tại một thời điểm, mỗi site serializable cục bộ: (a) làm sao bảo đảm chỉ một global transaction? (b) ví dụ global schedule không serializable.

<details><summary>Gợi ý đáp án</summary>

a. Dùng một **data item đặc biệt** ở một site: mọi global transaction phải lấy khoá trên nó trước khi bắt đầu và nhả sau khi kết thúc. Để không phụ thuộc một site, dùng **bầu chọn** để chọn coordinator trong các site đang sống và yêu cầu khoá trên item ở coordinator hiện tại.

b. Hai site, giao dịch cục bộ T1 (site 1) và T2 (site 2), global G1 và G2 (G2 bắt đầu sau khi G1 kết thúc) — bảng `pd_sched`:
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

Site 1 serializable theo thứ tự G2 → T1 → G1; site 2 theo G1 → T2 → G2. Toàn cục có chu trình G1 → T2 → G2 → T1 → G1 → **không serializable**, dù chỉ một global transaction chạy tại mỗi thời điểm. Bài CH23.13 tính các cạnh precedence.

</details>

**Câu 12.** 

> **Exercise 23.12.** Consider a federated database system in which every local site guarantees local serializability and all global transactions are read-only.
> 
> a. Show with an example that nonserializable executions can occur in such a system.
> 
> b. Show how a ticket scheme could be used to guarantee global serializability.

**PE 23.12** — Federated DB, mỗi site serializable cục bộ, mọi global transaction chỉ đọc: (a) ví dụ không serializable; (b) dùng ticket để bảo đảm global serializability.

<details><summary>Gợi ý đáp án</summary>

a. Cùng hệ hai site như PE 23.11, nhưng G1, G2 chỉ đọc: site 1: G1 read(X1), T1 write(X1), G2 read(X1) → G1 → T1 → G2. Site 2: G2 read(X2), T2 write(X2), G1 read(X2) → G2 → T2 → G1. Mỗi site serializable, nhưng toàn cục G1 trước G2 ở site 1 và G2 trước G1 ở site 2 → chu trình, không serializable.

b. Vì mỗi site serializable cục bộ, một chu trình trong precedence graph toàn cục phải đi qua ít nhất hai site và hai global transaction. **Ticket**: mỗi site có một data item *ticket*; mọi global transaction truy cập site phải đọc rồi ghi (tăng) ticket ở đó, nên hai global transaction luôn **xung đột** trên ticket tại mỗi site chung. Global transaction manager điều khiển thứ tự lấy ticket để các global transaction có **cùng thứ tự serializable ở mọi site** → không thể có chu trình như trên.

</details>

**Câu 13.** 

> **Exercise 23.13.** A large relation r(A, B, C) has a materialized view v = <sub>A</sub>γ<sub>sum(B)</sub>(r). View maintenance can be done as part of every transaction that updates r, on a parallel/distributed storage system that supports transactions spanning several nodes. The system uses two-phase commit together with a consensus protocol such as Paxos across geographically distributed data centers.
> 
> a. Explain why doing view maintenance inside the update transaction is a bad idea if some values of attribute A are *hot* at certain times, that is, many updates concern those values of A.
> 
> b. Explain how operation locking (if supported) could solve this problem.
> 
> c. Explain the trade-offs of using asynchronous view maintenance in this setting.

**PE 23.13** — View v = <sub>A</sub>γ<sub>sum(B)</sub>(r) được duy trì trong giao dịch cập nhật, trên hệ dùng 2PC + Paxos qua nhiều data center: (a) vì sao tệ khi có giá trị A "nóng"? (b) operation locking giúp gì? (c) đánh đổi của duy trì view bất đồng bộ?

<details><summary>Gợi ý đáp án</summary>

a. Mọi giao dịch cập nhật r với A nóng phải cập nhật **cùng một tuple** của view → xếp hàng trên khoá X của tuple đó. Commit qua 2PC + Paxos giữa các data center mất hàng trăm mili giây, khoá bị giữ suốt thời gian đó → throughput chỉ còn vài chục giao dịch mỗi giây, dù các giao dịch không xung đột gì khác.

b. Cập nhật view chỉ là **cộng thêm** vào sum. **Operation locking** (khoá theo thao tác, ví dụ khoá "increment") cho phép nhiều thao tác cộng chạy đồng thời vì phép cộng giao hoán, các khoá increment không xung đột nhau → throughput tăng mạnh.

c. **Bất đồng bộ**: giao dịch chỉ cập nhật r và ghi lại thay đổi; view được cập nhật sau → không còn nút thắt, throughput cao. Đổi lại, đọc view có thể thấy **dữ liệu cũ** (chưa phản ánh các cập nhật gần đây), và cần cơ chế bảo đảm mọi thay đổi cuối cùng đều được áp dụng đúng một lần.

</details>

## 4. Bài tập SQL (13 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH23.01 | 2PC: quyết định của coordinator | ★☆☆ | Bảng `pd_2pc_log(txn, site, seq, rec)` chứa log của coordinator (site `C`) và các participant. Với mỗi giao dịch, trả về txn và `decision`: `commit` nếu coordinator đã ghi commit, `abort` nếu coordinator đã ghi abort, ngược lại `undecided`. Sắp theo txn. |
| CH23.02 | 2PC: phục hồi participant | ★★☆ | Bảng `pd_2pc_part(txn, site)` liệt kê participant của mỗi giao dịch. Mỗi participant phục hồi chỉ dựa vào log của chính nó: có commit → `redo`; có abort hoặc no → `undo`; chỉ có ready → `ask`; không có record nào của txn → `undo`. Trả về txn, site, `action`, sắp theo txn, site. |
| CH23.03 | 2PC: blocking | ★★☆ | Coordinator `C` vừa hỏng. Các participant còn sống trao đổi log với nhau. Với mỗi giao dịch, quyết định: `commit` nếu có participant nào có commit; `abort` nếu có participant có abort/no hoặc có participant chưa ghi ready; nếu mọi participant đều chỉ có ready → `blocked` (phải chờ C). Trả về txn, `outcome`, sắp theo txn. |
| CH23.04 | quorum consensus | ★☆☆ | Bảng `pd_quorum(cfg, n, r, w)`. Một cấu hình hợp lệ khi `r + w > n` (đọc luôn giao với lần ghi gần nhất) và `2w > n` (hai lần ghi không thể cùng lúc). Trả về cfg, `read_sees_write` (boolean r + w > n), `writes_conflict` (boolean 2w > n), `valid` (cả hai), sắp theo cfg. |
| CH23.05 | đọc quorum: version lớn nhất | ★★☆ | Bảng `pd_copy(item, node, version, val)` là các bản sao; `pd_read_req(req, item, node)` cho biết mỗi lần đọc quorum hỏi những node nào. Lần đọc trả về giá trị có version lớn nhất trong các node được hỏi. Trả về req, item, `version`, `val`, sắp theo req. |
| CH23.06 | global wait-for graph | ★★☆ | Exercise 23.8. Consider the following deadlock-detection algorithm. When transaction T[i] at site S[1] requests a resource from T[j] at site S[3], a request message with timestamp n is sent. The edge (T[i], T[j], n) is inserted into the local wait-for graph of S[1]. The edge (T[i], T[j], n) is inserted into the local wait-for graph of S[3] only if T[j] has received the request message and cannot grant the requested resource immediately. A request from T[i] to T[j] at the same site is handled in the usual way, and no timestamp is attached to the edge (T[i], T[j]). A central coordinator starts the detection algorithm by sending an initiating message to every site.  When a site receives this message, it sends its local wait-for graph to the coordinator. Such a graph holds all the local information the site has about the state of the real graph; it reflects an instantaneous state of that site but is not synchronized with any other site.  After the controller has received a reply from every site, it builds a graph as follows:  - The graph has a vertex for every transaction in the system. - The graph has an edge (T[i], T[j]) if and only if either there is an edge (T[i], T[j]) in one of the wait-for graphs, or an edge (T[i], T[j], n) (for some n) appears in more than one wait-for graph.  Show that if the constructed graph contains a cycle, the system is in a deadlock state, and that if it contains no cycle, the system was not in a deadlock state when the algorithm started.<br>Bảng `pd_wfg(site, waiter, holder, ts)` là các local wait-for graph (ts null = cạnh cục bộ; ts khác null = cạnh liên site gắn timestamp của request). Theo PE 23.8, đồ thị toàn cục gồm cạnh (waiter, holder) nếu: có một cạnh cục bộ như vậy, hoặc cạnh liên site (waiter, holder, ts) xuất hiện ở hơn một site. Trả về các cạnh (waiter, holder) của đồ thị toàn cục, không trùng, sắp theo waiter, holder. |
| CH23.07 | phát hiện deadlock | ★★★ | Exercise 23.8. Consider the following deadlock-detection algorithm. When transaction T[i] at site S[1] requests a resource from T[j] at site S[3], a request message with timestamp n is sent. The edge (T[i], T[j], n) is inserted into the local wait-for graph of S[1]. The edge (T[i], T[j], n) is inserted into the local wait-for graph of S[3] only if T[j] has received the request message and cannot grant the requested resource immediately. A request from T[i] to T[j] at the same site is handled in the usual way, and no timestamp is attached to the edge (T[i], T[j]). A central coordinator starts the detection algorithm by sending an initiating message to every site.  When a site receives this message, it sends its local wait-for graph to the coordinator. Such a graph holds all the local information the site has about the state of the real graph; it reflects an instantaneous state of that site but is not synchronized with any other site.  After the controller has received a reply from every site, it builds a graph as follows:  - The graph has a vertex for every transaction in the system. - The graph has an edge (T[i], T[j]) if and only if either there is an edge (T[i], T[j]) in one of the wait-for graphs, or an edge (T[i], T[j], n) (for some n) appears in more than one wait-for graph.  Show that if the constructed graph contains a cycle, the system is in a deadlock state, and that if it contains no cycle, the system was not in a deadlock state when the algorithm started.<br>Dùng đồ thị toàn cục của CH23.06, tìm các giao dịch nằm trên một chu trình (deadlock). Trả về cột `txn`, sắp theo txn. Gợi ý: recursive CTE tìm mọi cặp (x, y) mà y đến được từ x; x nằm trên chu trình nếu x đến được chính nó. |
| CH23.08 | Lamport timestamp | ★★★ | Bảng `pd_event(proc, seq, kind, msg)`: các sự kiện của từng tiến trình theo thứ tự seq; sự kiện `recv` nhận message do sự kiện `send` có cùng `msg` gửi. Lamport timestamp: L(e) = 1 + max(L của sự kiện liền trước trên cùng tiến trình, L của sự kiện send tương ứng nếu e là recv), với max của tập rỗng = 0. Trả về proc, seq, `lamport`, sắp theo proc, seq. |
| CH23.09 | persistent messaging: sequence number | ★★☆ | Exercise 23.5. The persistent-messaging scheme of this chapter relies on timestamps. Its drawback is that received messages can be discarded only once they are too old, so a large number of received messages may have to be remembered. Propose an alternative scheme based on sequence numbers instead of timestamps that can discard messages sooner.<br>Bảng `pd_msg_in(sender, seq, arrival)`: các message nhận được từ mỗi site gửi (sequence number bắt đầu từ 1). Theo PE 23.5, site nhận chỉ ack/lưu message seq = k nếu đã có mọi message 1 … k − 1. Với mỗi sender, trả về `acked_upto` = số k lớn nhất mà mọi message 1 … k đều đã nhận (0 nếu chưa có message 1). Sắp theo sender. |
| CH23.10 | lazy replication: đọc dữ liệu cũ | ★★★ | Exercise 23.7. Give an example in which lazy replication leads to an inconsistent database state, even though updates obtain an exclusive lock on the primary (master) copy, when data are read from a node other than the master.<br>`pd_primary_hist(version, t_commit, balance)` là các phiên bản đã commit ở primary; `pd_replica_apply(node, version, t_apply)` cho biết replica áp dụng phiên bản lúc nào; `pd_replica_read(read_id, node, t)` là các lần đọc ở replica. Một lần đọc thấy balance của phiên bản lớn nhất mà replica đã áp dụng tại thời điểm ≤ t; balance đúng là phiên bản lớn nhất primary đã commit tại thời điểm ≤ t. Trả về read_id, node, `seen`, `primary_balance`, `stale` (boolean), sắp theo read_id. |
| CH23.11 | chain replication | ★★☆ | Exercise 23.9. Consider the chain-replication protocol of Section 23.4.3.2, a variant of the primary-copy protocol.  a. If locking is used for concurrency control, what is the earliest moment at which a process may release an exclusive lock after updating a data item?  b. Each data item could have its own chain, but give two reasons why it is better to define a chain at a coarser level, for example per partition or tablet.  c. How can consensus protocols be used to make sure that the chain is uniquely determined at every point in time?<br>Bảng `pd_chain(item, pos, node, version)`: chain của mỗi item, pos 1 là head, pos lớn nhất là tail; version là phiên bản mới nhất node đó đã áp dụng. Một lần ghi chỉ coi là commit khi tail đã áp dụng. Với mỗi item, trả về `head_version`, `committed_version` (version ở tail), `in_flight` (= head_version − committed_version), sắp theo item. |
| CH23.12 | lease | ★★☆ | Exercise 23.10. With the primary-copy replication scheme, if the primary becomes disconnected from the rest of the system, a new node may be elected primary. The old primary may not notice that it was disconnected, and may later reconnect without knowing that a new primary exists.  a. What problems can occur if the old primary does not realize that a new primary has taken over?  b. How can leases be used to avoid these problems?  c. Would such a situation — a participant node is disconnected and then reconnected without realizing it was disconnected — cause any problem for the majority or quorum protocols?<br>Bảng `pd_lease(node, lease_start, lease_end)` (lease có hiệu lực trong [lease_start, lease_end)) và `pd_serve(req, node, t)` (các request mà node đã phục vụ với tư cách primary lúc t). Tìm các request vi phạm: node không giữ lease nào còn hiệu lực tại t. Trả về req, node, t, sắp theo req. |
| CH23.13 | federated: precedence graph | ★★★ | Exercise 23.11 (b). Consider a federated database system in which at most one global transaction is guaranteed to be active at any time, and every local site guarantees local serializability.  b. Show with an example that a nonserializable global schedule can still occur under these assumptions.<br>Bảng `pd_sched(step, site, txn, op, item)` là schedule của PE 23.11b. Hai thao tác xung đột nếu cùng site, cùng item, khác giao dịch và ít nhất một là write; thao tác xảy ra trước (step nhỏ hơn) tạo cạnh `from_txn → to_txn`. Trả về các cạnh (from_txn, to_txn, site) không trùng, sắp theo site, from_txn. Có chu trình không? |
