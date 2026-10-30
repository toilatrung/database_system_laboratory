# Chương 20 — Kiến trúc hệ CSDL

*Database-System Architectures · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch20`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 0. Phạm vi
Chương 20 không nằm trong lịch học CS4420 (Chương 1–7); phần này để tự học theo slide của sách. Bài SQL **mô phỏng** các khái niệm (speedup, scaleup, Amdahl, skew, NUMA) bằng dữ liệu đo đạc trong các bảng `pd_*`.

### 1. Kiến trúc tập trung và client–server (slide 20.3–20.8)
- **Centralized system**: một máy (có thể nhiều core) chạy DBMS. *Coarse-grained parallelism*: vài core dùng chung bộ nhớ; *fine-grained*: rất nhiều bộ xử lý.
- **Client–server**: chức năng tách thành **front end** (form, report, GUI, công cụ phân tích) và **back end** (truy cập dữ liệu, tối ưu truy vấn, đồng thời, phục hồi). Giao tiếp qua SQL hoặc API (ODBC/JDBC).
- **Multiuser ≠ parallel** (PE 20.1): một bộ xử lý một core vẫn phục vụ nhiều người dùng bằng cách chạy xen kẽ nhiều tiến trình.

### 2. Server system architectures (slide 20.9–20.20)
- **Transaction server (query server)**: client gửi yêu cầu (SQL, RPC), server thực thi và trả kết quả. Gồm nhiều tiến trình dùng chung **shared memory**:
  - *server processes* nhận và thực hiện truy vấn; *lock manager process*; *database writer* (ghi buffer bị sửa xuống đĩa); *log writer*; *checkpoint*; *process monitor*.
  - Shared memory chứa buffer pool, lock table, log buffer, cached query plans.
- **Mutual exclusion** trên cấu trúc dùng chung bằng lệnh nguyên tử **test-and-set** hoặc **compare-and-swap**, kèm **memory fence** để mọi cập nhật trước đó được thấy bởi tiến trình lấy được mutex (PE 20.2, 20.6).
- **Latch vs lock** (PE 20.4): *latch* là khoá ngắn hạn bảo vệ cấu trúc dữ liệu **nội bộ** (một trang buffer, một mục lock table), giữ trong thời gian một thao tác, không theo 2PL; *lock* do giao dịch giữ trên **dữ liệu** của database, thường giữ tới cuối giao dịch.
- Lock table đặt trong shared memory (thay vì một tiến trình riêng): tránh hai message IPC cho mỗi lần xin khoá (PE 20.3).
- **Data server** (page shipping / item shipping): client lấy dữ liệu về xử lý; cần *prefetching*, *data caching*, *lock caching*, *adaptive lock granularity* (lock de-escalation).

### 3. Hệ song song (slide 20.21–20.35)
- **Throughput** (số việc hoàn thành trong một đơn vị thời gian) vs **response time** (thời gian hoàn thành một việc).
- **Speedup**: bài toán cố định, tăng tài nguyên N lần. speedup = T<sub>small</sub> / T<sub>large</sub>; **tuyến tính** nếu bằng N, **sublinear** nếu nhỏ hơn.
- **Scaleup**: tăng cả bài toán và tài nguyên N lần. scaleup = T<sub>small</sub> / T<sub>large</sub> (bài toán nhỏ trên máy nhỏ chia cho bài toán lớn trên máy lớn); **tuyến tính** nếu = 1. *Batch scaleup* (một việc lớn hơn) và *transaction scaleup* (nhiều việc hơn).
- **Superlinear speedup** (PE 20.9): speedup > N, xảy ra khi phần dữ liệu trên mỗi node bắt đầu **vừa bộ nhớ**, ví dụ relation trong của join nằm gọn trong RAM, tránh đọc đĩa nhiều lần.
- Các yếu tố làm giảm speedup/scaleup:
  - **Startup / sequential cost**: chi phí khởi động nhiều tiến trình, phần không song song được → **Amdahl's law**: speedup = 1 / ((1 − p) + p/n), với p là phần song song hoá được. Khi n → ∞, speedup → 1/(1 − p). PE 20.5: p = 0.8 → tối đa 5.
  - **Interference**: tranh chấp tài nguyên dùng chung (bus, đĩa, khoá).
  - **Skew**: chia việc không đều, thời gian của job = thời gian của **phần chậm nhất**.
  - **Gustafson's law** (scaleup): scaleup = 1 / ((1 − p)/n + p).

### 4. Interconnection network và kiến trúc song song (slide 20.36–20.50)
- Mạng nối: **bus** (không mở rộng tốt), **ring**, **mesh**, **hypercube** (số bước ≤ log n), **tree-like / fat-tree** (dùng trong data center).
- **Shared memory**: mọi bộ xử lý dùng chung bộ nhớ (và đĩa). Giao tiếp rất nhanh; khó mở rộng quá vài chục/trăm core; cần **cache coherency**.
- **NUMA** (non-uniform memory access): mỗi bộ xử lý có bộ nhớ cục bộ; truy cập bộ nhớ của node khác chậm hơn (PE 20.7). Hệ điều hành cấp phát bộ nhớ cục bộ và hạn chế chuyển tiến trình giữa các core (PE 20.8).
- **Shared disk**: mỗi node có bộ nhớ riêng, dùng chung đĩa (SAN). Chịu lỗi tốt (node hỏng, node khác tiếp quản), nút thắt ở kết nối tới đĩa.
- **Shared nothing**: mỗi node có bộ nhớ và đĩa riêng, giao tiếp qua mạng. Mở rộng tới hàng nghìn node; chi phí truyền dữ liệu giữa các node cao.
- **Hierarchical**: kết hợp — các node shared-memory nối với nhau theo kiểu shared nothing.

### 5. Hệ phân tán (slide 20.51–20.60)
- Dữ liệu trải trên nhiều **site** địa lý; *local transaction* (chỉ truy cập một site) và *global transaction* (nhiều site).
- **Homogeneous**: cùng phần mềm, cùng global schema, hợp tác xử lý truy vấn. **Federated / heterogeneous**: schema và phần mềm khác nhau, hợp tác hạn chế (PE 20.10).
- Ưu điểm: chia sẻ dữ liệu, tự chủ (autonomy), sẵn sàng cao nhờ replication. Nhược: phức tạp, cần **two-phase commit**, chi phí truyền thông.

### 6. Cloud (slide 20.61–20.68)
- **IaaS**: thuê máy (ảo); **PaaS**: thuê nền tảng (có DBMS được quản lý); **SaaS**: thuê ứng dụng; **DBaaS** là một dạng PaaS.
- Chọn IaaS khi muốn tự kiểm soát ứng dụng và tự chọn, tự quản DBMS (PE 20.11).
- **Virtual machine / container**: máy vật lý hỏng thì VM khởi động lại nhanh trên máy khác (nếu dữ liệu nằm ở storage ngoài) → sẵn sàng cao (PE 20.12).

### Công thức cần nhớ
| Đại lượng | Công thức |
|---|---|
| Speedup | T(1 node) / T(n node), cùng bài toán |
| Efficiency | speedup / n |
| Scaleup | T(bài nhỏ, máy nhỏ) / T(bài lớn n lần, máy lớn n lần) |
| Amdahl | 1 / ((1 − p) + p/n) → tối đa 1/(1 − p) |
| Skew | thời gian job = max thời gian các node; độ lệch = max / trung bình |

## 2. Trắc nghiệm (10 câu)

**Câu 1.** Một hệ có một CPU một core phục vụ 200 người dùng cùng lúc. Đó có phải hệ song song không?

- A. Có, vì có nhiều người dùng
- B. Không: multiuser không đòi hỏi parallel, các tiến trình chạy xen kẽ
- C. Có, nếu dùng shared memory
- D. Không xác định

<details><summary>Đáp án</summary>

**B** — PE 20.1: một bộ xử lý vẫn có thể chạy nhiều tiến trình phục vụ nhiều người dùng.

</details>

**Câu 2.** Bài toán cố định, tăng từ 1 lên 8 node, thời gian giảm từ 400 s xuống 60 s. Speedup là?

- A. 8
- B. 6.67
- C. 0.15
- D. 340

<details><summary>Đáp án</summary>

**B** — speedup = 400 / 60 ≈ 6.67 < 8 → sublinear.

</details>

**Câu 3.** Scaleup tuyến tính nghĩa là gì?

- A. Thời gian giảm N lần khi tăng tài nguyên N lần
- B. Bài toán lớn N lần trên máy lớn N lần chạy trong cùng thời gian
- C. Throughput không đổi
- D. Speedup bằng 1

<details><summary>Đáp án</summary>

**B** — scaleup = T_small/T_large = 1.

</details>

**Câu 4.** PE 20.5: 80% thời gian ở SQL (song song được), 20% ở C. Speedup tối đa?

- A. 4
- B. 5
- C. 80
- D. Vô hạn

<details><summary>Đáp án</summary>

**B** — Amdahl: 1/(1 − 0.8) = 5 khi n → ∞.

</details>

**Câu 5.** Bốn node xử lý một job trong 5, 5, 5, 25 giây. Thời gian của job?

- A. 10 s
- B. 25 s
- C. 40 s
- D. 5 s

<details><summary>Đáp án</summary>

**B** — Job kết thúc khi phần chậm nhất xong — đây là ảnh hưởng của skew.

</details>

**Câu 6.** Khác biệt chính giữa latch và lock?

- A. Latch giữ đến cuối giao dịch
- B. Latch ngắn hạn bảo vệ cấu trúc nội bộ, không theo 2PL; lock do giao dịch giữ trên dữ liệu
- C. Lock chỉ dùng trong shared nothing
- D. Không khác nhau

<details><summary>Đáp án</summary>

**B** — PE 20.4.

</details>

**Câu 7.** Kiến trúc nào mở rộng tốt nhất tới hàng nghìn node?

- A. Shared memory
- B. Shared disk
- C. Shared nothing
- D. Bus

<details><summary>Đáp án</summary>

**C** — Không dùng chung bộ nhớ hay đĩa nên không có nút thắt chung; chi phí là truyền dữ liệu qua mạng.

</details>

**Câu 8.** Vì sao có thể xảy ra superlinear speedup khi chạy join?

- A. Do lỗi đo đạc
- B. Khi tăng node, phần dữ liệu mỗi node vừa bộ nhớ nên tránh được I/O lặp lại
- C. Do Amdahl
- D. Do skew

<details><summary>Đáp án</summary>

**B** — PE 20.9.

</details>

**Câu 9.** Trong NUMA, vì sao hệ điều hành tránh chuyển tiến trình sang core khác?

- A. Để tiết kiệm điện
- B. Vì tiến trình sẽ phải truy cập bộ nhớ (từng là cục bộ) ở node xa, chậm hơn
- C. Vì không thể chuyển
- D. Vì lock table

<details><summary>Đáp án</summary>

**B** — PE 20.8.

</details>

**Câu 10.** Hệ phân tán federated khác homogeneous ở điểm nào?

- A. Federated có global schema chung
- B. Federated có thể khác schema và phần mềm, hợp tác hạn chế
- C. Homogeneous không dùng 2PC
- D. Không khác

<details><summary>Đáp án</summary>

**B** — PE 20.10.

</details>

## 3. Câu hỏi tự luận (12 câu)

**Câu 1.** 

> **Exercise 20.1.** Must a multiuser system necessarily be a parallel system? Justify your answer.

**PE 20.1** — Hệ nhiều người dùng có nhất thiết là hệ song song không?

<details><summary>Gợi ý đáp án</summary>

**Không.** Một bộ xử lý với một core vẫn chạy được nhiều tiến trình, xen kẽ theo thời gian, để phục vụ nhiều người dùng. Song song là chuyện có **nhiều bộ xử lý/core** cùng chạy. (Thực tế hầu hết hệ hiện nay đều song song vì CPU nhiều core.)

</details>

**Câu 2.** 

> **Exercise 20.2.** On many architectures, atomic instructions such as compare-and-swap and test-and-set also perform a memory fence as part of the instruction. Considering data in shared memory that is protected by a mutex built from such an atomic instruction, explain why executing the memory fence is needed. Also explain what a process should do before it releases a mutex.

**PE 20.2** — Vì sao lệnh nguyên tử dùng làm mutex phải kèm memory fence? Tiến trình phải làm gì trước khi nhả mutex?

<details><summary>Gợi ý đáp án</summary>

CPU hiện đại có thể **sắp xếp lại** lệnh đọc/ghi bộ nhớ và giữ giá trị trong cache của core. Memory fence bảo đảm mọi thao tác bộ nhớ trước fence hoàn tất (và được thấy bởi core khác) trước các thao tác sau nó. Khi lấy mutex, fence bảo đảm tiến trình thấy **mọi cập nhật** mà chủ cũ của mutex đã làm trên dữ liệu được bảo vệ, kể cả khi cập nhật xảy ra ở core khác.

Trước khi nhả mutex, tiến trình phải **thực hiện memory fence** (đẩy hết các lệnh ghi lên dữ liệu dùng chung) rồi mới ghi giá trị "mở khoá" — nếu không, tiến trình tiếp theo có thể lấy được mutex nhưng vẫn đọc giá trị cũ.

</details>

**Câu 3.** 

> **Exercise 20.3.** Rather than keeping shared structures in shared memory, an alternative architecture keeps them in the local memory of one special process, and other processes reach the shared data through interprocess communication with that process. What would be the disadvantage of this architecture?

**PE 20.3** — Nhược điểm của việc giữ cấu trúc dùng chung (như lock table) trong bộ nhớ của một tiến trình riêng và truy cập qua IPC?

<details><summary>Gợi ý đáp án</summary>

- Mỗi lần xin khoá tốn **hai message IPC** (yêu cầu và xác nhận cấp khoá); IPC đắt hơn truy cập bộ nhớ rất nhiều → chi phí khoá tăng mạnh.
- Tiến trình giữ cấu trúc trở thành **nút thắt cổ chai** (mọi yêu cầu xếp hàng qua nó).

Ưu điểm duy nhất: cấu trúc được bảo vệ tốt hơn khỏi cập nhật sai, vì chỉ một tiến trình truy cập.

</details>

**Câu 4.** 

> **Exercise 20.4.** For transactional concurrency control, explain the difference between a latch and a lock.

**PE 20.4** — Phân biệt latch và lock.

<details><summary>Gợi ý đáp án</summary>

| | Latch | Lock |
|---|---|---|
| Bảo vệ | cấu trúc dữ liệu **nội bộ** của hệ (trang buffer, mục lock table, node B+-tree) | **dữ liệu** của database (tuple, trang, bảng) |
| Thời gian giữ | rất ngắn, trong một thao tác | thường tới cuối giao dịch (hoặc một phần lớn) |
| Giao thức | không theo two-phase locking, không phát hiện deadlock | theo 2PL, có xử lý deadlock |
| Ai giữ | tiến trình/luồng | giao dịch |

</details>

**Câu 5.** 

> **Exercise 20.5.** A transaction is written in C with embedded SQL; about 80 percent of its running time is spent in SQL code and the other 20 percent in C code. If parallelism is applied only to the SQL code, how much speedup can one hope for? Explain.

**PE 20.5** — 80% thời gian ở SQL (song song hoá được), 20% ở code C. Speedup tối đa nếu chỉ song song hoá SQL?

<details><summary>Gợi ý đáp án</summary>

Theo **Amdahl**: speedup = 1 / ((1 − p) + p/n) với p = 0.8. Khi n rất lớn, p/n → 0 nên speedup → 1 / 0.2 = **5**. Phần 20% tuần tự luôn tốn ít nhất 1/5 thời gian ban đầu, nên không thể nhanh hơn 5 lần dù có bao nhiêu bộ xử lý. Bài CH20.04 tính công thức này cho nhiều giá trị p, n.

</details>

**Câu 6.** 

> **Exercise 20.6.** In a shared-memory system, process A updates a data structure and then sets a flag to signal that the update is finished. Process B watches the flag and begins processing the data structure only once it sees that the flag is set.
> 
> Explain what can go wrong on a memory architecture in which writes may be reordered, and explain how the sfence and lfence instructions can be used to prevent the problem.

**PE 20.6** — Tiến trình A cập nhật cấu trúc rồi bật cờ, B chờ cờ rồi xử lý. Sự cố gì xảy ra khi lệnh ghi bị sắp xếp lại, và dùng sfence/lfence thế nào?

<details><summary>Gợi ý đáp án</summary>

Nếu lệnh ghi bị sắp xếp lại, lệnh ghi **cờ** có thể tới bộ nhớ chính **trước** một số lệnh ghi lên cấu trúc. B thấy cờ đã bật nhưng chỉ đọc được **một phần** cập nhật → xử lý dữ liệu không nhất quán.

Cách khắc phục:
- A thực hiện **sfence** (store fence) **sau khi cập nhật cấu trúc, trước khi bật cờ**; có thể thêm sfence sau khi bật cờ để đẩy cờ ra bộ nhớ sớm.
- B thực hiện **lfence** (load fence) **sau khi thấy cờ bật, trước khi đọc cấu trúc**, để các lệnh đọc cấu trúc không bị thực hiện sớm hơn lệnh đọc cờ.

</details>

**Câu 7.** 

> **Exercise 20.7.** On a shared-memory architecture, why can the time needed to access a memory location depend on which location is accessed?

**PE 20.7** — Vì sao trong shared memory, thời gian truy cập một ô nhớ có thể phụ thuộc vào vị trí ô nhớ?

<details><summary>Gợi ý đáp án</summary>

Vì kiến trúc **NUMA**: bộ nhớ được chia theo node, mỗi bộ xử lý truy cập bộ nhớ **cục bộ** của nó nhanh hơn bộ nhớ gắn với bộ xử lý khác — truy cập xa phải đi qua kết nối giữa các bộ xử lý. Bài CH20.08 tính độ trễ trung bình local/remote từ số đo.

</details>

**Câu 8.** 

> **Exercise 20.8.** Most operating systems for parallel machines (i) allocate memory from a local memory area when a process asks for memory, and (ii) try not to move a process from one core to another. Why do these optimizations matter on a NUMA architecture?

**PE 20.8** — Vì sao trên NUMA, hệ điều hành cấp phát bộ nhớ cục bộ và tránh chuyển tiến trình giữa các core?

<details><summary>Gợi ý đáp án</summary>

- Cấp phát ở bộ nhớ cục bộ: dữ liệu của tiến trình nằm gần bộ xử lý đang chạy nó → truy cập nhanh.
- Nếu chuyển tiến trình sang core ở node khác, dữ liệu đã cấp phát giờ thành **bộ nhớ xa**, mọi truy cập chậm đi; lợi ích của cấp phát cục bộ mất hết. Vì vậy hệ điều hành cố giữ tiến trình trên core cũ.

</details>

**Câu 9.** 

> **Exercise 20.9.** Some database operations, such as joins, run much faster when the data (for example, one of the relations being joined) fits in memory than when it does not. Show how this explains *superlinear speedup*, in which an application obtains a speedup larger than the increase in resources given to it.

**PE 20.9** — Giải thích superlinear speedup bằng việc dữ liệu vừa/không vừa bộ nhớ.

<details><summary>Gợi ý đáp án</summary>

Ví dụ: join r ⋈ s, s lớn hơn bộ nhớ của một máy. Với 1 node phải dùng thuật toán ngoài (block nested-loop đọc s nhiều lần, hoặc hash join chia partition ghi ra đĩa). Khi tăng lên n node (hoặc tăng gấp đôi bộ nhớ), phần s trên mỗi node **vừa bộ nhớ**: mỗi node đọc dữ liệu đúng **một lần** và join trong RAM. Tổng I/O giảm nhiều hơn n lần, nên thời gian giảm **nhiều hơn n lần** → speedup > n.

Bài CH20.02 và CH20.09: workload Q3 (64 GB, mỗi node 16 GB RAM) có speedup 2 với 2 node (32 GB/node, chưa vừa RAM) nhưng **5** với 4 node (16 GB/node, vừa RAM).

</details>

**Câu 10.** 

> **Exercise 20.10.** What is the essential difference between homogeneous and federated distributed database systems?

**PE 20.10** — Khác biệt chính giữa homogeneous và federated distributed database?

<details><summary>Gợi ý đáp án</summary>

Ở **mức độ hợp tác và điều khiển tập trung**:
- **Homogeneous**: mọi site chạy cùng phần mềm DBMS, có chung một **global schema**, chủ động hợp tác xử lý truy vấn và giao dịch.
- **Federated (heterogeneous)**: các site có thể có schema và phần mềm khác nhau (thường là các hệ có sẵn), giữ quyền tự chủ, chỉ hợp tác hạn chế; cần lớp trung gian để dịch schema và truy vấn.

</details>

**Câu 11.** 

> **Exercise 20.11.** Why might a client choose to subscribe only to the basic infrastructure-as-a-service model instead of the services offered by the other cloud service models?

**PE 20.11** — Vì sao khách hàng có thể chỉ thuê IaaS thay vì các dịch vụ cloud khác?

<details><summary>Gợi ý đáp án</summary>

- Muốn **tự kiểm soát ứng dụng** của mình → không dùng SaaS.
- Muốn **tự chọn và tự quản lý DBMS** (phiên bản, cấu hình, tối ưu, sản phẩm thương mại có license riêng) → không dùng PaaS/DBaaS.
IaaS chỉ cung cấp máy (ảo), lưu trữ, mạng; mọi phần mềm phía trên do khách hàng quyết định.

</details>

**Câu 12.** 

> **Exercise 20.12.** Assuming the data reside on external storage, why do cloud-computing services best support traditional database systems by running them in a virtual machine, rather than directly on the provider’s physical machine?

**PE 20.12** — Vì sao chạy DBMS truyền thống trên cloud tốt nhất là trong virtual machine (dữ liệu ở storage ngoài)?

<details><summary>Gợi ý đáp án</summary>

Khi máy vật lý hỏng, các **VM** đang chạy trên nó có thể được **khởi động lại nhanh** trên một hoặc nhiều máy vật lý khác, vì dữ liệu vẫn truy cập được ở storage ngoài (được nhân bản hoặc có độ sẵn sàng cao). DBMS truyền thống không cần biết gì về việc chuyển máy → **độ sẵn sàng** cao hơn. VM còn giúp chia một máy lớn cho nhiều khách hàng và cô lập chúng.

</details>

## 4. Bài tập SQL (9 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH20.01 | speedup | ★☆☆ | Bảng `pd_run(workload, nodes, data_gb, seconds)`. Với workload `Q1` (dữ liệu cố định 100 GB), tính cho mỗi số node: `nodes`, `speedup` = thời gian với 1 node chia thời gian với `nodes` node, và `efficiency` = speedup / nodes. Làm tròn speedup và efficiency 2 chữ số. Sắp theo nodes. |
| CH20.02 | linear / sublinear / superlinear | ★★☆ | Với các workload `Q1` và `Q3` (cùng dữ liệu, tăng node), phân loại mỗi lần chạy có `nodes > 1`: `superlinear` nếu speedup > nodes, `linear` nếu speedup = nodes, ngược lại `sublinear` (speedup tính như CH20.01, không làm tròn). Trả về workload, nodes, `kind`, sắp theo workload, nodes. |
| CH20.03 | scaleup | ★☆☆ | Workload `Q2` tăng dữ liệu tỉ lệ với số node (10 GB mỗi node). Tính `scaleup` = thời gian của lần chạy 1 node chia thời gian của lần chạy `nodes` node, làm tròn 3 chữ số. Trả về nodes, data_gb, scaleup, sắp theo nodes. Scaleup tuyến tính thì giá trị là bao nhiêu? |
| CH20.04 | Amdahl | ★☆☆ | Exercise 20.5. A transaction is written in C with embedded SQL; about 80 percent of its running time is spent in SQL code and the other 20 percent in C code. If parallelism is applied only to the SQL code, how much speedup can one hope for? Explain.<br>Bảng `pd_amdahl(task, p, n)`: p là phần song song hoá được, n là số bộ xử lý. Tính speedup theo Amdahl `1 / ((1 − p) + p / n)` cho mỗi task, làm tròn 3 chữ số (cột `speedup`). Task `PE20.5` là PE 20.5 với n rất lớn. |
| CH20.05 | Amdahl: giới hạn | ★★☆ | Với mỗi task trong `pd_amdahl`, trả về `max_speedup` = giới hạn của speedup khi n → ∞ (làm tròn 2 chữ số) và `pct_of_max` = speedup thật với n của task chia max_speedup, nhân 100, làm tròn 1 chữ số. |
| CH20.06 | skew | ★★☆ | Bảng `pd_job_task(job, node, seconds)`. Một job song song chỉ xong khi node chậm nhất xong. Với mỗi job, trả về `job_time` (thời gian job), `avg_time` (thời gian trung bình các node, làm tròn 2) và `skew` = job_time / avg_time (làm tròn 2). Sắp theo job. |
| CH20.07 | kiến trúc song song | ★☆☆ | Bảng `pd_system(name, shared_memory, shared_disk)`. Phân loại mỗi hệ: `shared memory` nếu dùng chung bộ nhớ, `shared disk` nếu chỉ dùng chung đĩa, `shared nothing` nếu không dùng chung gì. Trả về name, `architecture`. |
| CH20.08 | NUMA | ★★☆ | Exercise 20.7. On a shared-memory architecture, why can the time needed to access a memory location depend on which location is accessed?<br>Bảng `pd_proc(proc, home_node)` và `pd_mem_access(proc, mem_node, ns)` (độ trễ đo được). Với mỗi bộ xử lý, trả về `local_ns` (độ trễ tới bộ nhớ node của chính nó), `remote_ns` (trung bình độ trễ tới các node khác) và `ratio` = remote_ns / local_ns làm tròn 2. Sắp theo proc. |
| CH20.09 | superlinear speedup | ★★☆ | Exercise 20.9. Some database operations, such as joins, run much faster when the data (for example, one of the relations being joined) fits in memory than when it does not. Show how this explains *superlinear speedup*, in which an application obtains a speedup larger than the increase in resources given to it.<br>Workload `Q3` là một join 64 GB; mỗi node có 16 GB RAM. Với mỗi lần chạy của Q3, trả về nodes, `gb_per_node` (data_gb / nodes, kiểu numeric, làm tròn 1), `fits_in_memory` (boolean: gb_per_node ≤ 16) và `speedup` (làm tròn 2). Sắp theo nodes. Speedup vượt số node bắt đầu từ lúc nào? |
