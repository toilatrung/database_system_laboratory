export default {
  number: 12,
  slug: 'ch12_physical_storage',
  title: 'Physical Storage Systems',
  titleVi: 'Hệ thống lưu trữ vật lý',

  summary: `
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
\`\`\`
latency trung bình (ms)  = 0.5 × 60000 / rpm
access time (ms)          = seek + latency
thời gian đọc một block   = access time + block_size / transfer_rate
IOPS ≈ 1000 / thời gian đọc một block (ms)
\`\`\`
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
\`\`\`
mean time to data loss ≈ MTTF² / (2 × MTTR)
\`\`\`
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
`,

  quiz: [
    {
      q: 'Đĩa quay 7200 rpm. Rotational latency **trung bình** là bao nhiêu?',
      options: ['8.33 ms', '4.17 ms', '7.2 ms', '0.12 ms'],
      answer: 1,
      explain: 'Một vòng = 60000/7200 = 8.33 ms; trung bình phải chờ nửa vòng ≈ 4.17 ms.',
    },
    {
      q: 'Phương tiện nào sau đây là **volatile**?',
      options: ['Flash memory', 'Magnetic disk', 'Main memory', 'Magnetic tape'],
      answer: 2,
      explain: 'Main memory và cache mất dữ liệu khi mất điện.',
    },
    {
      q: 'Vì sao ghi lại một page flash đã có dữ liệu lại tốn kém?',
      options: ['Phải chờ đĩa quay', 'Phải xoá cả erase block chứa nó trước', 'Flash chỉ ghi được một lần', 'Phải tính lại parity'],
      answer: 1,
      explain: 'Page đã ghi chỉ ghi được lại sau khi erase cả block (hàng trăm KB). Vì vậy SSD ghi vào page trống và cập nhật flash translation table.',
    },
    {
      q: 'RAID 5 với 5 đĩa, mỗi đĩa 4 TB. Dung lượng hữu ích là?',
      options: ['20 TB', '16 TB', '10 TB', '12 TB'],
      answer: 1,
      explain: 'Một đĩa tương đương dành cho parity (phân tán): (5 − 1) × 4 = 16 TB.',
    },
    {
      q: 'Ghi **một block nhỏ** trên RAID 5 tốn bao nhiêu I/O?',
      options: ['1', '2', '4', 'n (số đĩa)'],
      answer: 2,
      explain: 'Đọc block cũ, đọc parity cũ, ghi block mới, ghi parity mới.',
    },
    {
      q: 'Mức RAID nào phù hợp nhất cho dữ liệu cập nhật thường xuyên như log, khi cần hiệu năng ghi và rebuild nhanh?',
      options: ['RAID 0', 'RAID 1 (1+0)', 'RAID 5', 'RAID 6'],
      answer: 1,
      explain: 'Mirroring: ghi chỉ 2 lần ghi, rebuild chỉ chép một đĩa.',
    },
    {
      q: '1000 đĩa, mỗi đĩa MTTF 1.200.000 giờ. Trung bình bao lâu có một đĩa hỏng?',
      options: ['1.200.000 giờ', '1.200 giờ', '120 giờ', '12.000 giờ'],
      answer: 1,
      explain: 'MTTF của hệ = MTTF đĩa / số đĩa = 1200 giờ ≈ 50 ngày.',
    },
    {
      q: 'Elevator algorithm dùng để làm gì?',
      options: ['Chọn block để thay trong buffer', 'Sắp thứ tự các yêu cầu đọc để giảm di chuyển của disk arm', 'Phân bố đều số lần xoá trên flash', 'Tính parity'],
      answer: 1,
      explain: 'Arm đi một chiều phục vụ mọi yêu cầu trên đường rồi đổi chiều, như thang máy.',
    },
    {
      q: 'Wear leveling trên flash nhằm mục đích gì?',
      options: ['Tăng tốc đọc', 'Phân bố đều số lần erase để block không hỏng sớm', 'Giảm kích thước bảng ánh xạ', 'Nén dữ liệu'],
      answer: 1,
      explain: 'Mỗi erase block chỉ chịu được số lần xoá giới hạn.',
    },
    {
      q: 'SAN khác NAS ở điểm nào?',
      options: ['SAN cung cấp giao diện file, NAS cung cấp giao diện block', 'SAN cung cấp giao diện block (như đĩa cục bộ), NAS cung cấp giao diện file (NFS/CIFS)', 'SAN chỉ dùng SSD', 'Không khác'],
      answer: 1,
      explain: 'SAN: máy chủ thấy đĩa từ xa như đĩa thật; NAS: chia sẻ file qua mạng.',
    },
  ],

  questions: [
    {
      pe: '12.1',
      q: '**PE 12.1** — SSD làm tầng lưu trữ riêng (một số relation nằm hẳn trên SSD) hay làm cache cho đĩa từ: chọn cách nào cho (a) truy vấn thời gian thực có thời hạn đảm bảo, (b) relation customer rất lớn, chỉ một số block được truy cập thường xuyên?',
      answer: `a. **SSD làm tầng lưu trữ**: dữ liệu cần cho truy vấn thời gian thực nằm hẳn trên SSD nên thời gian trả lời **được đảm bảo**. Nếu SSD chỉ là cache, một số yêu cầu sẽ **cache miss** và phải đọc từ đĩa từ (≈ 10 ms mỗi block) → không đảm bảo được thời hạn.

b. **SSD làm cache**: ta không biết trước (ở mức relation) block nào sẽ nóng, nên không thể gán đúng phần cần thiết của relation lên SSD; relation lại quá lớn để đặt toàn bộ lên SSD. Cache tự động giữ các block được truy cập thường xuyên trên SSD.`,
    },
    {
      pe: '12.2',
      q: '**PE 12.2** — Một số CSDL chỉ dùng các sector ở track ngoài, bỏ trống track trong. Lợi ích là gì?',
      answer: `- **Transfer rate cao hơn**: đĩa quay với tốc độ góc không đổi, track ngoài dài hơn và chứa nhiều sector hơn, nên trong cùng thời gian có nhiều sector đi qua đầu đọc hơn.
- **Quan trọng hơn: giảm seek time**: dữ liệu chỉ nằm trên một dải track hẹp nên disk arm di chuyển rất ít → giảm độ trễ truy cập. Điều này quan trọng với hệ thống xử lý giao dịch, nơi độ trễ quyết định số giao dịch mỗi giây. (Đánh đổi: phí dung lượng.)`,
    },
    {
      pe: '12.3',
      q: '**PE 12.3** — Flash translation table được biểu diễn thế nào trong bộ nhớ? Kích thước với flash 64 GB, page 4096 byte, địa chỉ 32 bit? Cách giảm kích thước khi các dải page logic liên tiếp được ánh xạ tới page vật lý liên tiếp?',
      answer: `a. Một **mảng** chứa số page vật lý, **chỉ mục là số page logic**. Chi phí bằng kích thước một địa chỉ page cho mỗi page.

b. Số page = 64 × 2³⁰ / 2¹² = 2²⁴ page; mỗi page 32 bit = 4 byte → 2²⁴ × 4 = 2²⁶ byte = **64 MB** (tức 32 bit cho mỗi 4096 byte lưu trữ). Bài CH12.07 tính cho nhiều thiết bị.

c. Nếu mỗi dải p page logic liên tiếp được ánh xạ tới p page vật lý liên tiếp, chỉ cần lưu ánh xạ của **page đầu tiên mỗi dải** → bảng nhỏ đi **p lần**. Nếu p là luỹ thừa của 2, có thể bỏ thêm các bit thấp của địa chỉ được lưu (chúng luôn bằng 0). Bài CH12.08.`,
    },
    {
      pe: '12.4',
      q: '**PE 12.4** — Bố trí block và parity trên 4 đĩa như hình (P<sub>i</sub> là parity của B<sub>4i−3</sub>…B<sub>4i</sub>). Có vấn đề gì?',
      answer: `P<sub>i</sub> nằm **cùng đĩa** với B<sub>4i−3</sub>: P1 và B1 cùng ở đĩa 1, P2 và B5 cùng ở đĩa 2, … Nếu đĩa đó hỏng thì **mất cả block dữ liệu lẫn parity của nó**, nên không khôi phục được B<sub>4i−3</sub>. (Ngoài ra mỗi parity phủ 4 block dữ liệu trong khi chỉ có 4 đĩa — một nhóm parity phải trải trên n − 1 = 3 đĩa dữ liệu và parity ở đĩa còn lại.) Bài CH12.09 tìm các cặp vi phạm bằng SQL.`,
    },
    {
      pe: '12.5',
      q: '**PE 12.5** — Số đĩa trong một mảng RAID 5: ít đĩa và nhiều đĩa đánh đổi gì về chi phí, độ tin cậy, hiệu năng khi có đĩa hỏng và khi rebuild?',
      answer: `| | Ít đĩa | Nhiều đĩa |
|---|---|---|
| **Chi phí** | cao hơn: tỉ lệ dung lượng dành cho parity là 1/n lớn | rẻ hơn trên mỗi GB hữu ích |
| **Độ tin cậy** | tốt hơn | xác suất **hai đĩa hỏng** cùng lúc (trong lúc rebuild) cao hơn → mất dữ liệu |
| **Khi có đĩa hỏng** | đọc một block của đĩa hỏng cần đọc ít block ở đĩa khác | phải đọc block tương ứng từ **mọi** đĩa còn lại → chậm |
| **Khi rebuild** | ít đĩa phải đọc | phải đọc toàn bộ n − 1 đĩa → lâu hơn, tải nặng hơn |`,
    },
    {
      pe: '12.6',
      q: '**PE 12.6** — Đề xuất cách đạt hiệu quả **atomic block write** (ghi trọn hoặc không ghi gì) với (a) RAID 1, (b) RAID 5, kể cả việc phải làm khi khôi phục sau sự cố.',
      answer: `a. **RAID 1**:
1. Ghi lên block vật lý thứ nhất.
2. Ghi xong thành công mới ghi cùng nội dung lên block thứ hai.
3. Chỉ báo hoàn tất khi lần ghi thứ hai xong.

Khôi phục: xét từng cặp block. Giống nhau và không có ghi dở → không làm gì. Một block bị ghi dở → chép nội dung block kia đè lên. Không có ghi dở nhưng khác nhau → chép block thứ nhất sang block thứ hai (hoặc ngược lại, nhất quán một chiều). Kết quả: lần ghi hoặc thành công hoàn toàn hoặc như chưa xảy ra.

So sánh mọi cặp block khi khôi phục rất tốn → ghi lại danh sách các block **đang được ghi** vào một ít **NV-RAM**; khi khôi phục chỉ so sánh các block đó.

b. **RAID 5**: tương tự — ghi block dữ liệu trước, rồi mới ghi parity tương ứng. Khôi phục: xét từng nhóm gồm block thứ n của mọi đĩa. Không có block ghi dở và parity khớp → không làm gì. Có block ghi dở → dựng lại nó từ các block còn lại (kể cả parity). Không có block ghi dở nhưng parity không khớp → tính lại parity. (Cũng dùng NV-RAM để chỉ kiểm tra các nhóm đang ghi.)`,
    },
    {
      pe: '12.7',
      q: '**PE 12.7** — Vì sao không thực tế khi đặt mọi block của một file lớn trên các block liên tiếp? Hệ điều hành làm gì thay vào đó?',
      answer: `Nếu cả file nằm liên tiếp thì đọc tuần tự chỉ cần **một lần seek**. Nhưng file liên tục được tạo, xoá, mở rộng → vùng trống trên đĩa bị **phân mảnh**, khó tìm được một dải rất dài block trống liên tiếp (và file lớn lên thì không có chỗ nối tiếp).

Hệ điều hành cấp phát theo **extent**: các đoạn **lớn nhưng kích thước cố định** gồm nhiều block liên tiếp. Đọc tuần tự chỉ cần **một seek cho mỗi extent**. Có thể chạy công cụ **defragment** để gom lại.`,
    },
  ],

  exercises: [
    {
      id: 'CH12.01', topic: 'access time', level: 1,
      prompt: 'Với mỗi **ổ đĩa từ** (`kind = \'HDD\'`) trong `st_disk`: disk_id, `latency_ms` = rotational latency trung bình, `access_ms` = avg_seek_ms + latency_ms. Làm tròn 2 chữ số.',
      hint: 'Latency trung bình là nửa vòng quay: 0.5 × 60000 / rpm.',
      solution: `select disk_id,
       round(0.5 * 60000 / rpm, 2) as latency_ms,
       round(avg_seek_ms + 0.5 * 60000 / rpm, 2) as access_ms
from st_disk
where kind = 'HDD';`,
    },
    {
      id: 'CH12.02', topic: 'IOPS', level: 2,
      prompt: 'Ước lượng số lần đọc **block 4 KB ngẫu nhiên** mỗi giây (`iops`, lấy phần nguyên) của **mọi** thiết bị trong st_disk. Thời gian một lần đọc = avg_seek_ms + latency (0 với SSD) + thời gian truyền 4 KB (coi 1 MB = 1024 KB). Trả về disk_id, `read_ms` (làm tròn 4 chữ số), iops; sắp theo iops giảm dần.',
      hint: 'Thời gian truyền (ms) = 4 / 1024 / transfer_mb_s × 1000. `coalesce(0.5 * 60000 / rpm, 0)`.',
      ordered: true,
      solution: `select disk_id,
       round(t, 4) as read_ms,
       floor(1000 / t) as iops
from (select disk_id,
             avg_seek_ms + coalesce(0.5 * 60000 / rpm, 0) + 4.0 / 1024 / transfer_mb_s * 1000 as t
      from st_disk) as d
order by iops desc;`,
    },
    {
      id: 'CH12.03', topic: 'sequential vs random', level: 2,
      prompt: 'Đọc một file **10 GB** (1 GB = 1024 MB, 1 MB = 1024 KB) trên mỗi thiết bị: `seq_s` = đọc tuần tự (chỉ tính thời gian truyền), `random_s` = đọc thành các block 4 KB ngẫu nhiên (mỗi block tốn một lần access đầy đủ như CH12.02). Trả về disk_id, seq_s và random_s làm tròn 1 chữ số, và `ratio` = random_s / seq_s làm tròn 0 chữ số.',
      solution: `select disk_id,
       round(seq, 1) as seq_s,
       round(rnd, 1) as random_s,
       round(rnd / seq, 0) as ratio
from (select disk_id,
             10 * 1024 / transfer_mb_s as seq,
             (10 * 1024 * 1024 / 4) * (avg_seek_ms + coalesce(0.5 * 60000 / rpm, 0) + 4.0 / 1024 / transfer_mb_s * 1000) / 1000 as rnd
      from st_disk) as d;`,
    },
    {
      id: 'CH12.04', topic: 'RAID capacity', level: 1,
      prompt: 'Với mỗi mảng trong `st_raid_array`: array_id, raid_level, `raw_gb` (tổng dung lượng các đĩa) và `usable_gb` — RAID 0: n·c, RAID 1: n·c/2, RAID 5: (n−1)·c, RAID 6: (n−2)·c, với c = capacity_gb của loại đĩa dùng trong mảng.',
      solution: `select a.array_id, a.raid_level,
       a.num_disks * d.capacity_gb as raw_gb,
       case a.raid_level
         when 0 then a.num_disks * d.capacity_gb
         when 1 then a.num_disks * d.capacity_gb / 2
         when 5 then (a.num_disks - 1) * d.capacity_gb
         when 6 then (a.num_disks - 2) * d.capacity_gb
       end as usable_gb
from st_raid_array a join st_disk d on d.disk_id = a.disk_id;`,
    },
    {
      id: 'CH12.05', topic: 'MTTF of many disks', level: 1,
      prompt: 'Với mỗi mảng RAID: array_id và thời gian trung bình tới khi **một đĩa nào đó** trong mảng hỏng: `hours_to_first_failure` = MTTF của đĩa / num_disks (phần nguyên) và `days` (làm tròn 1 chữ số).',
      solution: `select a.array_id,
       floor(d.mttf_hours::numeric / a.num_disks) as hours_to_first_failure,
       round(d.mttf_hours::numeric / a.num_disks / 24, 1) as days
from st_raid_array a join st_disk d on d.disk_id = a.disk_id;`,
    },
    {
      id: 'CH12.06', topic: 'mean time to data loss', level: 2,
      prompt: 'Với các mảng **RAID 1** (mỗi cặp đĩa mirror): array_id và mean time to data loss của **một cặp** theo công thức MTTF² / (2 × MTTR), tính bằng **năm** (8760 giờ/năm), làm tròn tới hàng đơn vị (`years`).',
      hint: 'Ép kiểu numeric trước khi bình phương để không tràn integer.',
      solution: `select a.array_id,
       round(power(d.mttf_hours::numeric, 2) / (2 * a.mttr_hours) / 8760, 0) as years
from st_raid_array a join st_disk d on d.disk_id = a.disk_id
where a.raid_level = 1;`,
    },
    {
      id: 'CH12.07', topic: 'PE 12.3b flash table', level: 2, pe: '12.3b',
      prompt: 'Với mỗi thiết bị trong `st_flash`: device, `pages` = số page (1 GB = 2³⁰ byte) và `table_mb` = kích thước flash translation table dạng mảng, mỗi phần tử address_bits bit (1 MB = 2²⁰ byte). Dòng F64 phải ra 64 MB như lời giải PE 12.3b.',
      solution: `select device,
       capacity_gb::bigint * 1073741824 / page_bytes as pages,
       capacity_gb::bigint * 1073741824 / page_bytes * address_bits / 8 / 1048576 as table_mb
from st_flash;`,
    },
    {
      id: 'CH12.08', topic: 'PE 12.3c run mapping', level: 2, pe: '12.3c',
      prompt: 'Với thiết bị **F64**, giả sử mỗi dải p page logic liên tiếp được ánh xạ tới p page vật lý liên tiếp nên chỉ cần lưu một phần tử cho mỗi dải. Trả về p và `table_kb` (kích thước bảng, KB = 1024 byte) cho p ∈ {1, 8, 64, 512}.',
      hint: '`generate_series` hoặc `values (1), (8), (64), (512)`.',
      solution: `select p,
       f.capacity_gb::bigint * 1073741824 / f.page_bytes / p * f.address_bits / 8 / 1024 as table_kb
from st_flash f, (values (1), (8), (64), (512)) as r(p)
where f.device = 'F64';`,
    },
    {
      id: 'CH12.09', topic: 'PE 12.4 parity placement', level: 3, pe: '12.4',
      prompt: '`st_raid_layout(disk_no, stripe, label)` chứa bố trí của PE 12.4 (mở rộng thêm vài stripe). Parity P<sub>i</sub> bảo vệ B<sub>4i−3</sub> … B<sub>4i</sub>. Tìm mọi cặp (parity, data_block, disk_no) mà block dữ liệu nằm **cùng đĩa** với parity bảo vệ nó.',
      hint: 'Lấy số sau ký tự đầu: `substr(label, 2)::int`. Block B<sub>k</sub> thuộc parity i khi 4i − 3 ≤ k ≤ 4i.',
      solution: `select p.label as parity, b.label as data_block, p.disk_no
from st_raid_layout p join st_raid_layout b on b.disk_no = p.disk_no
where p.label like 'P%' and b.label like 'B%'
  and substr(b.label, 2)::int between 4 * substr(p.label, 2)::int - 3 and 4 * substr(p.label, 2)::int;`,
    },
    {
      id: 'CH12.10', topic: 'cost per GB', level: 1,
      prompt: 'Xếp hạng thiết bị theo giá mỗi GB: disk_id, kind, `usd_per_gb` (làm tròn 4 chữ số), sắp tăng dần theo usd_per_gb.',
      ordered: true,
      solution: `select disk_id, kind, round(price_usd / capacity_gb, 4) as usd_per_gb
from st_disk
order by usd_per_gb;`,
    },
    {
      id: 'CH12.11', topic: 'RAID write penalty', level: 3,
      prompt: 'Ứng dụng tạo **1000 lần ghi block nhỏ ngẫu nhiên mỗi giây** lên từng mảng. Số I/O vật lý cho mỗi lần ghi logic: RAID 0 → 1, RAID 1 → 2, RAID 5 → 4, RAID 6 → 6. Trả về array_id, raid_level, `physical_iops` và `per_disk_iops` (= physical_iops / num_disks, làm tròn 1 chữ số).',
      solution: `select array_id, raid_level,
       1000 * f as physical_iops,
       round(1000.0 * f / num_disks, 1) as per_disk_iops
from (select array_id, raid_level, num_disks,
             case raid_level when 0 then 1 when 1 then 2 when 5 then 4 when 6 then 6 end as f
      from st_raid_array) as a;`,
    },
  ],
};
