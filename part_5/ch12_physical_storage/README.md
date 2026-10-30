# Chương 12 — Hệ thống lưu trữ vật lý

*Physical Storage Systems · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch12`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 1. Phân loại phương tiện lưu trữ (slide 12.3–12.6)
| Tiêu chí | Ý nghĩa |
|---|---|
| **Volatile** (khả biến) | mất dữ liệu khi mất điện: cache, main memory |
| **Non-volatile** (bất biến) | giữ dữ liệu khi mất điện: flash, đĩa từ, đĩa quang, băng từ |
| Tốc độ, giá/byte, độ tin cậy | càng lên cao trong hệ thống phân cấp càng nhanh, càng đắt |

**Hệ thống phân cấp lưu trữ** (từ nhanh/đắt tới chậm/rẻ): cache → main memory → flash memory → magnetic disk → optical disk → magnetic tape.
- **Primary storage**: nhanh nhất, volatile (cache, main memory).
- **Secondary storage** (on-line): flash, đĩa từ — bất biến, truy cập khá nhanh.
- **Tertiary storage** (off-line): băng từ, đĩa quang, kho lưu trữ — rẻ, chậm, dùng để lưu trữ lâu dài/backup.

### 2. Giao diện lưu trữ (slide 12.7)
- SATA (≈ 6 Gbps), SAS (≈ 12 Gbps), NVMe qua PCIe (≈ 24 Gbps trở lên, dành cho SSD).
- **SAN** (storage area network): nhiều đĩa nối với máy chủ qua mạng tốc độ cao, máy chủ thấy như đĩa cục bộ (giao thức block).
- **NAS** (network attached storage): cung cấp **giao diện file** (NFS, CIFS) qua mạng.
- **Cloud storage**: dữ liệu lưu trên cloud, truy cập qua API (thường là object store).

### 3. Đĩa từ (magnetic disk, slide 12.8–12.15)
**Cấu tạo**: platter → track (rãnh) → sector (512 byte hoặc 4 KB; đơn vị nhỏ nhất đọc/ghi). Đầu đọc gắn trên **disk arm**; mọi đầu đọc di chuyển cùng nhau, các track cùng vị trí trên mọi platter tạo thành **cylinder**. **Disk controller** dịch lệnh đọc/ghi, tính **checksum**, và **remap** sector hỏng.

**Các đại lượng hiệu năng**
| Đại lượng | Định nghĩa | Giá trị điển hình |
|---|---|---|
| **Seek time** | thời gian đưa arm tới đúng track | trung bình 4–10 ms (≈ 1/3 seek tối đa) |
| **Rotational latency** | chờ sector cần đọc quay tới đầu đọc | trung bình = **1/2 vòng quay**: 7200 rpm → 60000/7200/2 ≈ **4.17 ms** |
| **Access time** | seek + rotational latency | 5–20 ms |
| **Data-transfer rate** | tốc độ đọc khi đã ở đúng chỗ | 25–200 MB/s (track ngoài nhanh hơn track trong) |
| **IOPS** | số yêu cầu đọc block ngẫu nhiên mỗi giây | 50–200 với đĩa từ |
| **MTTF** | thời gian trung bình tới khi hỏng | 500.000–1.200.000 giờ (với đĩa mới) |

Công thức hay dùng:
```
latency trung bình (ms)  = 0.5 × 60000 / rpm
access time (ms)          = seek + latency
thời gian đọc một block   = access time + block_size / transfer_rate
IOPS ≈ 1000 / thời gian đọc một block (ms)
```
- **Sequential access**: các block liên tiếp trên cùng track/cylinder liền kề → chỉ cần seek một lần, tốc độ ≈ transfer rate.
- **Random access**: mỗi block một lần seek → bị giới hạn bởi IOPS. Đó là lý do mọi thuật toán trong CSDL cố gắng đọc tuần tự.
- **MTTF của nhiều đĩa**: 1000 đĩa, mỗi đĩa MTTF 1.200.000 giờ → trung bình **1.200 giờ (≈ 50 ngày)** lại có một đĩa hỏng.

### 4. Flash memory và SSD (slide 12.16–12.19)
- **NAND flash**: đọc theo **page** (512 byte – 4 KB, ≈ 20–100 µs), nhưng một page đã ghi chỉ ghi lại được sau khi **xoá cả erase block** (256 KB – 1 MB, ≈ 2–5 ms). Mỗi block chỉ chịu được **100.000 – 1.000.000 lần xoá**.
- **Remapping**: ghi một page logic vào một page vật lý đã xoá sẵn, ghi nhận ánh xạ trong **flash translation table**; page cũ bị đánh dấu xoá. Lớp **flash translation layer** che giấu điều này để SSD trông như đĩa thường.
- **Wear leveling**: phân bố đều số lần xoá trên các block (đưa dữ liệu "lạnh" vào block đã bị xoá nhiều).
- **Garbage collection**: gom các page còn hợp lệ của một erase block sang chỗ khác rồi xoá block.
- SSD: hàng chục nghìn tới hàng trăm nghìn **IOPS** ngẫu nhiên, transfer 500 MB/s (SATA) – 3 GB/s trở lên (NVMe). Ghi chậm hơn đọc.
- Kích thước bảng ánh xạ = (dung lượng / page_size) × kích thước một địa chỉ (PE 12.3: 64 GB, page 4 KB, địa chỉ 32 bit → **64 MB**).
- **Storage class memory** (ví dụ 3D-XPoint/Optane): bất biến, truy cập theo byte, nhanh gần bằng RAM.

### 5. RAID (slide 12.20–12.36)
**RAID** = Redundant Arrays of Independent Disks: dùng nhiều đĩa để tăng **dung lượng, tốc độ (song song)** và **độ tin cậy (dư thừa)**.

**Độ tin cậy nhờ dư thừa — mirroring**: mỗi đĩa logic là hai đĩa vật lý. Dữ liệu chỉ mất khi đĩa thứ hai hỏng trước khi đĩa thứ nhất được thay xong:
```
mean time to data loss ≈ MTTF² / (2 × MTTR)
```
Ví dụ MTTF = 100.000 giờ, MTTR = 10 giờ → 500 × 10⁶ giờ ≈ 57.000 năm (bỏ qua hỏng hóc phụ thuộc nhau như mất điện, cháy, lỗi lô sản xuất).

**Tăng tốc nhờ song song — striping**:
- **Bit-level striping**: bit i của mỗi byte ghi lên đĩa i (ít dùng).
- **Block-level striping**: với n đĩa, block i ghi lên đĩa (i mod n) + 1. Đọc nhiều block khác nhau song song, đọc file lớn song song.

**Các mức RAID**
| Mức | Cách làm | Dung lượng hữu ích (n đĩa) | Ghi chú |
|---|---|---|---|
| **RAID 0** | block striping, không dư thừa | n | nhanh nhất, hỏng một đĩa là mất dữ liệu; dùng khi mất dữ liệu không quan trọng |
| **RAID 1** | mirroring (+ striping = RAID 1+0 / 10) | n/2 | đọc/ghi tốt, ghi chỉ tốn 2 lần ghi; phổ biến cho log và dữ liệu cập nhật nhiều |
| **RAID 5** | block-interleaved **distributed parity**: parity của n−1 block nằm trên đĩa thứ n, xoay vòng giữa các đĩa | n − 1 | rẻ hơn RAID 1; **ghi một block nhỏ tốn 4 I/O** (đọc block cũ + parity cũ, ghi block mới + parity mới) |
| **RAID 6** | P + Q redundancy (mã sửa lỗi), chịu được **hai** đĩa hỏng | n − 2 | an toàn hơn RAID 5 với mảng lớn |
| RAID 2, 3, 4 | mã ECC kiểu bộ nhớ / bit-interleaved parity / block-interleaved parity trên **một** đĩa riêng | | không còn dùng; RAID 4 có đĩa parity là nút cổ chai |

**Parity block**: P = B₁ ⊕ B₂ ⊕ … ⊕ B<sub>n−1</sub>. Mất một block bất kỳ → khôi phục bằng XOR các block còn lại. Vì vậy **parity không được nằm cùng đĩa với block dữ liệu mà nó bảo vệ** (PE 12.4).

**Chọn mức RAID**: RAID 0 khi không cần an toàn; RAID 1 khi cập nhật nhiều (hiệu năng ghi tốt, rebuild nhanh); RAID 5/6 khi dữ liệu lớn, chủ yếu đọc, cần tiết kiệm. Tiêu chí: chi phí, hiệu năng khi bình thường, **khi có đĩa hỏng**, và **khi rebuild** (rebuild RAID 1 chỉ cần chép một đĩa; RAID 5 phải đọc mọi đĩa còn lại).

**Vấn đề phần cứng**: **software RAID** (do hệ điều hành làm) vs **hardware RAID** (controller có **NV-RAM** ghi đệm an toàn). Lỗi **latent failure** (sector hỏng chưa phát hiện) → **scrubbing** định kỳ. **Hot swapping**, đĩa dự phòng (**hot spare**), nguồn và controller dư thừa.

**Ghi một phần (partial write)**: mất điện khi đang ghi có thể làm block hỏng một nửa hoặc mirror lệch nhau → cần quy trình ghi lần lượt và khôi phục khi khởi động lại (PE 12.6).

### 6. Truy cập dữ liệu đĩa (slide 12.37–12.42)
- **Block** (page): đơn vị chuyển giữa đĩa và bộ nhớ, thường 4–16 KB. Block nhỏ → nhiều lần truy cập; block lớn → lãng phí nếu chỉ cần một ít dữ liệu.
- **Buffering**: giữ block trong bộ nhớ để dùng lại (Chương 13).
- **Read-ahead (prefetch)**: đọc trước các block kế tiếp khi đọc tuần tự.
- **Disk-arm scheduling**: sắp các yêu cầu để arm di chuyển ít nhất — **elevator algorithm** (đi một chiều phục vụ hết yêu cầu rồi quay lại).
- **File organization / defragmenting**: hệ điều hành cấp phát **extent** (nhiều block liên tiếp) để đọc tuần tự chỉ cần một seek mỗi extent (PE 12.7).
- **Non-volatile write buffer**: ghi vào NV-RAM rồi báo xong ngay, ghi xuống đĩa sau → giảm độ trễ ghi.
- **Log disk**: đĩa chỉ dùng để ghi log tuần tự — rất nhanh vì không cần seek.

### Mẹo làm bài
- Tính toán luôn đổi đơn vị cẩn thận: 1 GB = 2³⁰ byte (theo sách: 64 GB / 4 KB = 2²⁴ page), ms ↔ s, giờ ↔ năm (8760 giờ).
- Latency trung bình là **nửa vòng quay**, không phải một vòng.
- Câu "chọn kiến trúc" (SSD làm tầng lưu trữ hay làm cache) trả lời theo tiêu chí: **đảm bảo thời gian** → tầng lưu trữ cố định; **không biết trước block nào nóng** → cache.

## 2. Trắc nghiệm (10 câu)

**Câu 1.** Đĩa quay 7200 rpm. Rotational latency **trung bình** là bao nhiêu?

- A. 8.33 ms
- B. 4.17 ms
- C. 7.2 ms
- D. 0.12 ms

<details><summary>Đáp án</summary>

**B** — Một vòng = 60000/7200 = 8.33 ms; trung bình phải chờ nửa vòng ≈ 4.17 ms.

</details>

**Câu 2.** Phương tiện nào sau đây là **volatile**?

- A. Flash memory
- B. Magnetic disk
- C. Main memory
- D. Magnetic tape

<details><summary>Đáp án</summary>

**C** — Main memory và cache mất dữ liệu khi mất điện.

</details>

**Câu 3.** Vì sao ghi lại một page flash đã có dữ liệu lại tốn kém?

- A. Phải chờ đĩa quay
- B. Phải xoá cả erase block chứa nó trước
- C. Flash chỉ ghi được một lần
- D. Phải tính lại parity

<details><summary>Đáp án</summary>

**B** — Page đã ghi chỉ ghi được lại sau khi erase cả block (hàng trăm KB). Vì vậy SSD ghi vào page trống và cập nhật flash translation table.

</details>

**Câu 4.** RAID 5 với 5 đĩa, mỗi đĩa 4 TB. Dung lượng hữu ích là?

- A. 20 TB
- B. 16 TB
- C. 10 TB
- D. 12 TB

<details><summary>Đáp án</summary>

**B** — Một đĩa tương đương dành cho parity (phân tán): (5 − 1) × 4 = 16 TB.

</details>

**Câu 5.** Ghi **một block nhỏ** trên RAID 5 tốn bao nhiêu I/O?

- A. 1
- B. 2
- C. 4
- D. n (số đĩa)

<details><summary>Đáp án</summary>

**C** — Đọc block cũ, đọc parity cũ, ghi block mới, ghi parity mới.

</details>

**Câu 6.** Mức RAID nào phù hợp nhất cho dữ liệu cập nhật thường xuyên như log, khi cần hiệu năng ghi và rebuild nhanh?

- A. RAID 0
- B. RAID 1 (1+0)
- C. RAID 5
- D. RAID 6

<details><summary>Đáp án</summary>

**B** — Mirroring: ghi chỉ 2 lần ghi, rebuild chỉ chép một đĩa.

</details>

**Câu 7.** 1000 đĩa, mỗi đĩa MTTF 1.200.000 giờ. Trung bình bao lâu có một đĩa hỏng?

- A. 1.200.000 giờ
- B. 1.200 giờ
- C. 120 giờ
- D. 12.000 giờ

<details><summary>Đáp án</summary>

**B** — MTTF của hệ = MTTF đĩa / số đĩa = 1200 giờ ≈ 50 ngày.

</details>

**Câu 8.** Elevator algorithm dùng để làm gì?

- A. Chọn block để thay trong buffer
- B. Sắp thứ tự các yêu cầu đọc để giảm di chuyển của disk arm
- C. Phân bố đều số lần xoá trên flash
- D. Tính parity

<details><summary>Đáp án</summary>

**B** — Arm đi một chiều phục vụ mọi yêu cầu trên đường rồi đổi chiều, như thang máy.

</details>

**Câu 9.** Wear leveling trên flash nhằm mục đích gì?

- A. Tăng tốc đọc
- B. Phân bố đều số lần erase để block không hỏng sớm
- C. Giảm kích thước bảng ánh xạ
- D. Nén dữ liệu

<details><summary>Đáp án</summary>

**B** — Mỗi erase block chỉ chịu được số lần xoá giới hạn.

</details>

**Câu 10.** SAN khác NAS ở điểm nào?

- A. SAN cung cấp giao diện file, NAS cung cấp giao diện block
- B. SAN cung cấp giao diện block (như đĩa cục bộ), NAS cung cấp giao diện file (NFS/CIFS)
- C. SAN chỉ dùng SSD
- D. Không khác

<details><summary>Đáp án</summary>

**B** — SAN: máy chủ thấy đĩa từ xa như đĩa thật; NAS: chia sẻ file qua mạng.

</details>

## 3. Câu hỏi tự luận (7 câu)

**Câu 1.** 

> **Exercise 12.1.** SSDs can serve as a storage layer between main memory and magnetic disks, keeping some parts of the database (for example, some relations) on SSD and the rest on magnetic disk. Alternatively, SSDs can serve as a buffer or cache for magnetic disks: frequently used blocks live on the SSD layer and rarely used blocks stay on magnetic disk.
> 
> a. Which of the two alternatives would you pick if you must support real-time queries that have to be answered within a guaranteed short time? Explain why.
> 
> b. Which of the two alternatives would you pick for a very large *customer* relation in which only some disk blocks are accessed frequently and the other blocks are rarely accessed?

**PE 12.1** — SSD làm tầng lưu trữ riêng (một số relation nằm hẳn trên SSD) hay làm cache cho đĩa từ: chọn cách nào cho (a) truy vấn thời gian thực có thời hạn đảm bảo, (b) relation customer rất lớn, chỉ một số block được truy cập thường xuyên?

<details><summary>Gợi ý đáp án</summary>

a. **SSD làm tầng lưu trữ**: dữ liệu cần cho truy vấn thời gian thực nằm hẳn trên SSD nên thời gian trả lời **được đảm bảo**. Nếu SSD chỉ là cache, một số yêu cầu sẽ **cache miss** và phải đọc từ đĩa từ (≈ 10 ms mỗi block) → không đảm bảo được thời hạn.

b. **SSD làm cache**: ta không biết trước (ở mức relation) block nào sẽ nóng, nên không thể gán đúng phần cần thiết của relation lên SSD; relation lại quá lớn để đặt toàn bộ lên SSD. Cache tự động giữ các block được truy cập thường xuyên trên SSD.

</details>

**Câu 2.** 

> **Exercise 12.2.** Some databases use magnetic disks so that only the sectors on the outer tracks are used and the sectors on the inner tracks are left empty. What benefits might this bring?

**PE 12.2** — Một số CSDL chỉ dùng các sector ở track ngoài, bỏ trống track trong. Lợi ích là gì?

<details><summary>Gợi ý đáp án</summary>

- **Transfer rate cao hơn**: đĩa quay với tốc độ góc không đổi, track ngoài dài hơn và chứa nhiều sector hơn, nên trong cùng thời gian có nhiều sector đi qua đầu đọc hơn.
- **Quan trọng hơn: giảm seek time**: dữ liệu chỉ nằm trên một dải track hẹp nên disk arm di chuyển rất ít → giảm độ trễ truy cập. Điều này quan trọng với hệ thống xử lý giao dịch, nơi độ trễ quyết định số giao dịch mỗi giây. (Đánh đổi: phí dung lượng.)

</details>

**Câu 3.** 

> **Exercise 12.3.** Flash storage:
> 
> a. How is the flash translation table — which maps logical page numbers to physical page numbers — represented in memory?
> 
> b. A flash storage system holds 64 gigabytes and uses a 4096-byte page. If each page has a 32-bit address and the table is stored as an array, how large is the flash translation table?
> 
> c. Suggest how to shrink the translation table when long ranges of consecutive logical page numbers are very often mapped to consecutive physical page numbers.

**PE 12.3** — Flash translation table được biểu diễn thế nào trong bộ nhớ? Kích thước với flash 64 GB, page 4096 byte, địa chỉ 32 bit? Cách giảm kích thước khi các dải page logic liên tiếp được ánh xạ tới page vật lý liên tiếp?

<details><summary>Gợi ý đáp án</summary>

a. Một **mảng** chứa số page vật lý, **chỉ mục là số page logic**. Chi phí bằng kích thước một địa chỉ page cho mỗi page.

b. Số page = 64 × 2³⁰ / 2¹² = 2²⁴ page; mỗi page 32 bit = 4 byte → 2²⁴ × 4 = 2²⁶ byte = **64 MB** (tức 32 bit cho mỗi 4096 byte lưu trữ). Bài CH12.07 tính cho nhiều thiết bị.

c. Nếu mỗi dải p page logic liên tiếp được ánh xạ tới p page vật lý liên tiếp, chỉ cần lưu ánh xạ của **page đầu tiên mỗi dải** → bảng nhỏ đi **p lần**. Nếu p là luỹ thừa của 2, có thể bỏ thêm các bit thấp của địa chỉ được lưu (chúng luôn bằng 0). Bài CH12.08.

</details>

**Câu 4.** 

> **Exercise 12.4.** Data and parity blocks are arranged on four disks as shown in Figure 12.4. The B<sub>i</sub> are data blocks and the P<sub>i</sub> are parity blocks; parity block P<sub>i</sub> is the parity block for data blocks B<sub>4i−3</sub> to B<sub>4i</sub>. What problem, if any, can this arrangement cause?
> 
> *Figure 12.4 — Block arrangement for Exercise 12.4* (each column is a disk, rows go down the disk):
> 
> | Disk 1 | Disk 2 | Disk 3 | Disk 4 |
> |---|---|---|---|
> | B1 | B2 | B3 | B4 |
> | P1 | B5 | B6 | B7 |
> | B8 | P2 | B9 | B10 |
> | … | … | … | … |

**PE 12.4** — Bố trí block và parity trên 4 đĩa như hình (P<sub>i</sub> là parity của B<sub>4i−3</sub>…B<sub>4i</sub>). Có vấn đề gì?

<details><summary>Gợi ý đáp án</summary>

P<sub>i</sub> nằm **cùng đĩa** với B<sub>4i−3</sub>: P1 và B1 cùng ở đĩa 1, P2 và B5 cùng ở đĩa 2, … Nếu đĩa đó hỏng thì **mất cả block dữ liệu lẫn parity của nó**, nên không khôi phục được B<sub>4i−3</sub>. (Ngoài ra mỗi parity phủ 4 block dữ liệu trong khi chỉ có 4 đĩa — một nhóm parity phải trải trên n − 1 = 3 đĩa dữ liệu và parity ở đĩa còn lại.) Bài CH12.09 tìm các cặp vi phạm bằng SQL.

</details>

**Câu 5.** 

> **Exercise 12.5.** A database administrator can decide how many disks go into one RAID 5 array. What are the trade-offs between using fewer disks and using more disks, with respect to cost, reliability, performance while a disk has failed, and performance while the failed disk is rebuilt?

**PE 12.5** — Số đĩa trong một mảng RAID 5: ít đĩa và nhiều đĩa đánh đổi gì về chi phí, độ tin cậy, hiệu năng khi có đĩa hỏng và khi rebuild?

<details><summary>Gợi ý đáp án</summary>

| | Ít đĩa | Nhiều đĩa |
|---|---|---|
| **Chi phí** | cao hơn: tỉ lệ dung lượng dành cho parity là 1/n lớn | rẻ hơn trên mỗi GB hữu ích |
| **Độ tin cậy** | tốt hơn | xác suất **hai đĩa hỏng** cùng lúc (trong lúc rebuild) cao hơn → mất dữ liệu |
| **Khi có đĩa hỏng** | đọc một block của đĩa hỏng cần đọc ít block ở đĩa khác | phải đọc block tương ứng từ **mọi** đĩa còn lại → chậm |
| **Khi rebuild** | ít đĩa phải đọc | phải đọc toàn bộ n − 1 đĩa → lâu hơn, tải nặng hơn |

</details>

**Câu 6.** 

> **Exercise 12.6.** If power fails while a disk block is being written, the block may end up only partially written. Assume partially written blocks can be detected. An *atomic block write* is one in which either the whole block is written or nothing is written (no partial writes). Propose schemes that achieve the effect of atomic block writes with each of the following RAID schemes; your schemes should include what is done during recovery from a failure.
> 
> a. RAID level 1 (mirroring)
> 
> b. RAID level 5 (block-interleaved, distributed parity)

**PE 12.6** — Đề xuất cách đạt hiệu quả **atomic block write** (ghi trọn hoặc không ghi gì) với (a) RAID 1, (b) RAID 5, kể cả việc phải làm khi khôi phục sau sự cố.

<details><summary>Gợi ý đáp án</summary>

a. **RAID 1**:
1. Ghi lên block vật lý thứ nhất.
2. Ghi xong thành công mới ghi cùng nội dung lên block thứ hai.
3. Chỉ báo hoàn tất khi lần ghi thứ hai xong.

Khôi phục: xét từng cặp block. Giống nhau và không có ghi dở → không làm gì. Một block bị ghi dở → chép nội dung block kia đè lên. Không có ghi dở nhưng khác nhau → chép block thứ nhất sang block thứ hai (hoặc ngược lại, nhất quán một chiều). Kết quả: lần ghi hoặc thành công hoàn toàn hoặc như chưa xảy ra.

So sánh mọi cặp block khi khôi phục rất tốn → ghi lại danh sách các block **đang được ghi** vào một ít **NV-RAM**; khi khôi phục chỉ so sánh các block đó.

b. **RAID 5**: tương tự — ghi block dữ liệu trước, rồi mới ghi parity tương ứng. Khôi phục: xét từng nhóm gồm block thứ n của mọi đĩa. Không có block ghi dở và parity khớp → không làm gì. Có block ghi dở → dựng lại nó từ các block còn lại (kể cả parity). Không có block ghi dở nhưng parity không khớp → tính lại parity. (Cũng dùng NV-RAM để chỉ kiểm tra các nhóm đang ghi.)

</details>

**Câu 7.** 

> **Exercise 12.7.** Placing all blocks of a large file on consecutive disk blocks would minimize seeks during sequential reads of the file. Why is this impractical? What do operating systems do instead to keep the number of seeks low during sequential reads?

**PE 12.7** — Vì sao không thực tế khi đặt mọi block của một file lớn trên các block liên tiếp? Hệ điều hành làm gì thay vào đó?

<details><summary>Gợi ý đáp án</summary>

Nếu cả file nằm liên tiếp thì đọc tuần tự chỉ cần **một lần seek**. Nhưng file liên tục được tạo, xoá, mở rộng → vùng trống trên đĩa bị **phân mảnh**, khó tìm được một dải rất dài block trống liên tiếp (và file lớn lên thì không có chỗ nối tiếp).

Hệ điều hành cấp phát theo **extent**: các đoạn **lớn nhưng kích thước cố định** gồm nhiều block liên tiếp. Đọc tuần tự chỉ cần **một seek cho mỗi extent**. Có thể chạy công cụ **defragment** để gom lại.

</details>

## 4. Bài tập SQL (11 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH12.01 | access time | ★☆☆ | Với mỗi ổ đĩa từ (`kind = 'HDD'`) trong `st_disk`: disk_id, `latency_ms` = rotational latency trung bình, `access_ms` = avg_seek_ms + latency_ms. Làm tròn 2 chữ số. |
| CH12.02 | IOPS | ★★☆ | Ước lượng số lần đọc block 4 KB ngẫu nhiên mỗi giây (`iops`, lấy phần nguyên) của mọi thiết bị trong st_disk. Thời gian một lần đọc = avg_seek_ms + latency (0 với SSD) + thời gian truyền 4 KB (coi 1 MB = 1024 KB). Trả về disk_id, `read_ms` (làm tròn 4 chữ số), iops; sắp theo iops giảm dần. |
| CH12.03 | sequential vs random | ★★☆ | Đọc một file 10 GB (1 GB = 1024 MB, 1 MB = 1024 KB) trên mỗi thiết bị: `seq_s` = đọc tuần tự (chỉ tính thời gian truyền), `random_s` = đọc thành các block 4 KB ngẫu nhiên (mỗi block tốn một lần access đầy đủ như CH12.02). Trả về disk_id, seq_s và random_s làm tròn 1 chữ số, và `ratio` = random_s / seq_s làm tròn 0 chữ số. |
| CH12.04 | RAID capacity | ★☆☆ | Với mỗi mảng trong `st_raid_array`: array_id, raid_level, `raw_gb` (tổng dung lượng các đĩa) và `usable_gb` — RAID 0: n·c, RAID 1: n·c/2, RAID 5: (n−1)·c, RAID 6: (n−2)·c, với c = capacity_gb của loại đĩa dùng trong mảng. |
| CH12.05 | MTTF of many disks | ★☆☆ | Với mỗi mảng RAID: array_id và thời gian trung bình tới khi một đĩa nào đó trong mảng hỏng: `hours_to_first_failure` = MTTF của đĩa / num_disks (phần nguyên) và `days` (làm tròn 1 chữ số). |
| CH12.06 | mean time to data loss | ★★☆ | Với các mảng RAID 1 (mỗi cặp đĩa mirror): array_id và mean time to data loss của một cặp theo công thức MTTF² / (2 × MTTR), tính bằng năm (8760 giờ/năm), làm tròn tới hàng đơn vị (`years`). |
| CH12.07 | PE 12.3b flash table | ★★☆ | Exercise 12.3 (b). Flash storage:  b. A flash storage system holds 64 gigabytes and uses a 4096-byte page. If each page has a 32-bit address and the table is stored as an array, how large is the flash translation table?<br>Với mỗi thiết bị trong `st_flash`: device, `pages` = số page (1 GB = 2³⁰ byte) và `table_mb` = kích thước flash translation table dạng mảng, mỗi phần tử address_bits bit (1 MB = 2²⁰ byte). Dòng F64 phải ra 64 MB như lời giải PE 12.3b. |
| CH12.08 | PE 12.3c run mapping | ★★☆ | Exercise 12.3 (c). Flash storage:  c. Suggest how to shrink the translation table when long ranges of consecutive logical page numbers are very often mapped to consecutive physical page numbers.<br>Với thiết bị F64, giả sử mỗi dải p page logic liên tiếp được ánh xạ tới p page vật lý liên tiếp nên chỉ cần lưu một phần tử cho mỗi dải. Trả về p và `table_kb` (kích thước bảng, KB = 1024 byte) cho p ∈ {1, 8, 64, 512}. |
| CH12.09 | PE 12.4 parity placement | ★★★ | Exercise 12.4. Data and parity blocks are arranged on four disks as shown in Figure 12.4. The B[i] are data blocks and the P[i] are parity blocks; parity block P[i] is the parity block for data blocks B[4i−3] to B[4i]. What problem, if any, can this arrangement cause?  *Figure 12.4 — Block arrangement for Exercise 12.4* (each column is a disk, rows go down the disk):  \| Disk 1 \| Disk 2 \| Disk 3 \| Disk 4 \| \|---\|---\|---\|---\| \| B1 \| B2 \| B3 \| B4 \| \| P1 \| B5 \| B6 \| B7 \| \| B8 \| P2 \| B9 \| B10 \| \| … \| … \| … \| … \|<br>`st_raid_layout(disk_no, stripe, label)` chứa bố trí của PE 12.4 (mở rộng thêm vài stripe). Parity P[i] bảo vệ B[4i−3] … B[4i]. Tìm mọi cặp (parity, data_block, disk_no) mà block dữ liệu nằm cùng đĩa với parity bảo vệ nó. |
| CH12.10 | cost per GB | ★☆☆ | Xếp hạng thiết bị theo giá mỗi GB: disk_id, kind, `usd_per_gb` (làm tròn 4 chữ số), sắp tăng dần theo usd_per_gb. |
| CH12.11 | RAID write penalty | ★★★ | Ứng dụng tạo 1000 lần ghi block nhỏ ngẫu nhiên mỗi giây lên từng mảng. Số I/O vật lý cho mỗi lần ghi logic: RAID 0 → 1, RAID 1 → 2, RAID 5 → 4, RAID 6 → 6. Trả về array_id, raid_level, `physical_iops` và `per_disk_iops` (= physical_iops / num_disks, làm tròn 1 chữ số). |
