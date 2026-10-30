# Chương 13 — Cấu trúc lưu trữ dữ liệu

*Data Storage Structures · Database System Concepts, 7th Ed.*

> **Cách học:** *Tóm tắt kiến thức* → *Trắc nghiệm* → *Câu hỏi tự luận* → *Bài tập SQL*, trong [`playground.html`](../playground.html) hoặc [`my_answers.sql`](my_answers.sql) (chấm trong thư mục `lab/` bằng `npm run grade -- ch13`). Đáp án SQL: [`solutions.sql`](solutions.sql).

## 1. Tóm tắt kiến thức

### 1. File organization (slide 13.3)
CSDL được lưu thành tập các **file**; mỗi file là một dãy **record**, được chia thành các **block** cố định (đơn vị chuyển giữa đĩa và bộ nhớ, 4–8 KB). Giả định đơn giản: mỗi file chỉ chứa record của một relation, record nhỏ hơn block.

### 2. Record độ dài cố định (slide 13.4–13.8)
Ví dụ `instructor(ID varchar(5), name varchar(20), dept_name varchar(20), salary numeric(8,2))` coi như cố định: 5 + 20 + 20 + 8 = **53 byte**. Record i bắt đầu ở byte n × (i − 1).
- Không để record vắt qua hai block: mỗi block chứa ⌊block_size / record_size⌋ record, phần dư bỏ trống.
- **Xoá record i** — ba cách (PE 13.1):
  1. dời các record i + 1, …, n lên một chỗ (giữ thứ tự, tốn nhiều I/O nhất);
  2. dời **record cuối** vào chỗ trống (ít dời, nhưng phá thứ tự);
  3. **không dời**, nối chỗ trống vào **free list**.
- **Free list**: **file header** chứa địa chỉ record trống đầu tiên; mỗi record trống chứa con trỏ tới record trống kế tiếp. **Insert** lấy chỗ đầu tiên trong free list (header trỏ sang chỗ kế tiếp); **delete** đẩy chỗ vừa trống lên đầu danh sách (PE 13.2, bài CH13.04–06).

### 3. Record độ dài thay đổi (slide 13.9–13.12)
Phát sinh do: kiểu dữ liệu độ dài thay đổi (varchar), nhiều loại record trong một file, trường lặp (mảng).
- **Biểu diễn**: các thuộc tính cố định trước; mỗi thuộc tính độ dài thay đổi được thay bằng cặp **(offset, length)** ở phần cố định, dữ liệu thật nằm sau. **Null bitmap** cho biết thuộc tính nào null.
- PostgreSQL: varchar ngắn có header 1 byte (`pg_column_size('Wu'::varchar)` = 3), còn `char(20)` luôn chiếm đủ 20 ký tự + header (bài CH13.02–03).

### 4. Slotted page (slide 13.11–13.12)
Header của mỗi block chứa: **số record**, **cuối vùng trống**, và **vị trí + kích thước** của từng record (mảng slot). Record được xếp từ cuối block ngược lên, mảng slot mọc từ đầu xuống, vùng trống ở giữa.
- Record có thể được dời trong block để dồn chỗ trống; chỉ cần sửa entry trong header.
- Con trỏ từ bên ngoài **trỏ tới entry trong header** (block, slot) chứ không trỏ thẳng tới record. PostgreSQL gọi địa chỉ này là **ctid = (block, slot)** (bài CH13.14).

### 5. Lưu đối tượng lớn (slide 13.13)
blob/clob rất lớn: lưu thành file riêng trong hệ thống file, hoặc chia nhỏ thành nhiều tuple trong một relation riêng (PostgreSQL: **TOAST**).

### 6. Tổ chức record trong file (slide 13.14–13.25)
| Tổ chức | Ý tưởng | Ghi chú |
|---|---|---|
| **Heap** | record đặt ở bất kỳ chỗ trống nào | cần **free-space map** để tìm block còn chỗ |
| **Sequential** | sắp theo **search key** | tốt cho truy cập tuần tự/khoảng; insert: chèn vào chỗ trống hoặc **overflow block**, thỉnh thoảng phải **reorganize** |
| **Multitable clustering** | record của **nhiều relation** đặt chung file, ví dụ mỗi department theo sau là các instructor của nó | join nhanh; truy vấn chỉ một relation chậm hơn (PE 13.3, bài CH13.12) |
| **B+-tree file organization** | record lưu trong lá của B+-tree | giữ thứ tự cả khi insert/delete nhiều (Chương 14) |
| **Hashing** | hàm băm trên một thuộc tính quyết định block | Chương 14 |

**Free-space map**: mảng có một phần tử cho mỗi block, ghi mức đầy của block (ví dụ 3 bit: tỉ lệ đầy theo phần tám). Có thể làm map **hai cấp** (mỗi phần tử cấp 2 là giá trị lớn nhất của nhiều phần tử cấp 1) để tìm nhanh. Ghi xuống đĩa định kỳ; sai lệch nhỏ được sửa dần. PE 13.4 dùng **2 bit**/block (bài CH13.07–08).

### 7. Partitioning (slide 13.26)
Chia relation lớn thành các relation nhỏ hơn theo giá trị một thuộc tính, ví dụ `transaction` theo năm → `transaction_2018`, `transaction_2019`, … Lợi ích: truy vấn chỉ một năm đọc ít dữ liệu hơn; có thể đặt partition cũ trên đĩa rẻ, partition mới trên SSD; quản lý (xoá dữ liệu cũ) dễ hơn. Nhược điểm: truy vấn trải nhiều partition tốn hơn (PE 13.6, bài CH13.11 dùng **declarative partitioning** của PostgreSQL).

### 8. Data dictionary (system catalog) (slide 13.27–13.29)
Lưu **metadata**: tên relation, thuộc tính (tên, kiểu, độ dài), view, ràng buộc toàn vẹn, người dùng và quyền, thống kê (số tuple, phân bố giá trị), index, cách lưu trữ vật lý. Bản thân catalog thường cũng là các relation (PostgreSQL: `pg_class`, `pg_attribute`, `pg_index`…).

### 9. Buffer manager (slide 13.30–13.39)
**Buffer**: vùng bộ nhớ chứa bản sao các block của đĩa. Khi chương trình cần một block:
1. Block đã có trong buffer → trả địa chỉ (tìm bằng **hash table**, PE 13.5).
2. Chưa có → chọn một block để **thay thế** (nếu block bị thay đã sửa thì ghi xuống đĩa trước), đọc block cần vào chỗ đó.

Khái niệm:
- **Pinned block**: đang được dùng, không được thay (pin count).
- **Shared / exclusive lock** trên buffer: đọc song song nhiều, ghi một.
- **Replacement policy**:
  - **LRU** (least recently used): thay block lâu nhất chưa dùng — dựa trên quá khứ để đoán tương lai.
  - **MRU** (most recently used): thay block vừa dùng xong — tốt cho **nested-loop join**, khi block vừa quét xong sẽ là block cần lại muộn nhất (PE 13.7).
  - **Toss-immediate**: giải phóng block ngay khi xử lý xong tuple cuối của nó.
  - **Clock**: xấp xỉ LRU rẻ hơn (mỗi block có bit "vừa dùng").
  - Block của catalog/index (dùng nhiều) nên được giữ lại.
- **Forced output**: ghi block xuống đĩa ngay (cần cho recovery, Chương 19).
- Hệ điều hành cũng có buffer riêng; PostgreSQL dùng buffer nhỏ và dựa vào bộ đệm file của hệ điều hành (PE 13.8).

### 10. Lưu trữ theo cột (columnar storage) (slide 13.40–13.44)
Mỗi thuộc tính lưu riêng (mảng giá trị theo cột); tuple thứ i lấy phần tử thứ i của mỗi cột.
- **Ưu**: truy vấn chỉ đọc vài cột thì chỉ đọc các cột đó (giảm I/O); **nén** tốt (giá trị cùng kiểu, lặp nhiều); **vector processing** trên CPU hiện đại.
- **Nhược**: dựng lại tuple tốn; cập nhật/xoá/insert từng tuple tốn; giải nén tốn.
- Phù hợp **decision support/analytics**; row store phù hợp **xử lý giao dịch**. Định dạng file: **ORC, Parquet** (lưu theo cột trong từng stripe/row group). Một số hệ thống **hybrid** (row cho dữ liệu mới, column cho dữ liệu cũ).
- **Main-memory database**: không cần buffer manager, dùng con trỏ trực tiếp, tối ưu cho cache CPU.

### Mẹo làm bài
- Câu hỏi về xoá record: luôn so sánh **số record phải dời / số I/O**, **giữ thứ tự hay không**, **chi phí quản lý chỗ trống**.
- Vẽ file sau insert/delete: insert lấy **đầu** free list, delete đẩy chỗ trống lên **đầu** free list.
- LRU vs MRU: nghĩ về **mẫu truy cập lặp lại** của nested-loop join.

## 2. Trắc nghiệm (10 câu)

**Câu 1.** Record instructor cố định 53 byte, block 4096 byte, record không vắt qua block. Mỗi block chứa bao nhiêu record?

- A. 77
- B. 78
- C. 76
- D. 53

<details><summary>Đáp án</summary>

**A** — ⌊4096 / 53⌋ = 77; 4096 − 77 × 53 = 15 byte bỏ trống.

</details>

**Câu 2.** Trong file có free list, một record mới được insert vào đâu?

- A. Cuối file
- B. Chỗ trống mà file header đang trỏ tới
- C. Chỗ trống cuối cùng của danh sách
- D. Chỗ trống có số nhỏ nhất

<details><summary>Đáp án</summary>

**B** — Lấy chỗ đầu tiên của free list; header được cập nhật trỏ sang chỗ trống kế tiếp.

</details>

**Câu 3.** Trong slotted page, con trỏ từ bên ngoài (ví dụ từ index) trỏ tới đâu?

- A. Byte đầu tiên của record
- B. Entry của record trong header của block
- C. Cuối vùng trống
- D. Block kế tiếp

<details><summary>Đáp án</summary>

**B** — Nhờ vậy record có thể được dời trong block mà không phải sửa con trỏ bên ngoài.

</details>

**Câu 4.** Biểu diễn record độ dài thay đổi: thuộc tính varchar được lưu thế nào ở phần cố định?

- A. Lưu đủ độ dài tối đa
- B. Cặp (offset, length)
- C. Con trỏ tới file khác
- D. Không lưu

<details><summary>Đáp án</summary>

**B** — Dữ liệu thật nằm sau phần cố định; null bitmap cho biết thuộc tính null.

</details>

**Câu 5.** Multitable clustering file organization có lợi cho truy vấn nào?

- A. Đếm số tuple của một relation
- B. Join department với instructor của nó
- C. Quét toàn bộ instructor
- D. Cập nhật salary

<details><summary>Đáp án</summary>

**B** — Các record join với nhau nằm chung block. Truy vấn chỉ một relation phải đọc qua record của relation kia nên chậm hơn.

</details>

**Câu 6.** Cấu trúc dữ liệu thường dùng để tìm nhanh một block có trong buffer không?

- A. Danh sách liên kết
- B. Hash table theo địa chỉ block
- C. B+-tree trên đĩa
- D. Mảng sắp xếp

<details><summary>Đáp án</summary>

**B** — PE 13.5: buffer rất lớn, hash table cho phép tra cứu O(1).

</details>

**Câu 7.** Khi tính nested-loop join r ⋈ s (với mỗi tuple của r quét lại toàn bộ s), chính sách thay block nào phù hợp cho các block của s?

- A. LRU
- B. MRU
- C. FIFO
- D. Random

<details><summary>Đáp án</summary>

**B** — Block vừa quét xong sẽ được cần lại muộn nhất trong lần quét kế tiếp, nên thay nó (MRU). LRU sẽ thay đúng block sắp cần.

</details>

**Câu 8.** **Pinned block** trong buffer là gì?

- A. Block đã bị sửa
- B. Block đang được dùng nên không được phép thay
- C. Block của catalog
- D. Block đã ghi xuống đĩa

<details><summary>Đáp án</summary>

**B** — Pin count > 0 thì buffer manager không chọn block đó để thay.

</details>

**Câu 9.** Lưu trữ theo cột (columnar) phù hợp nhất với loại công việc nào?

- A. Xử lý giao dịch cập nhật từng tuple
- B. Truy vấn phân tích đọc vài cột trên rất nhiều dòng
- C. Insert liên tục
- D. Lấy toàn bộ một tuple theo khoá

<details><summary>Đáp án</summary>

**B** — Chỉ đọc cột cần, nén tốt, xử lý vector.

</details>

**Câu 10.** Partitioning relation takes theo year có nhược điểm gì?

- A. Không truy vấn được năm cũ
- B. Truy vấn trải nhiều năm phải đọc nhiều partition, tốn hơn
- C. Không thể tạo index
- D. Mất ràng buộc khoá chính

<details><summary>Đáp án</summary>

**B** — PE 13.6. Ưu điểm: truy vấn một năm chỉ đọc partition đó, có thể đặt dữ liệu cũ trên đĩa rẻ.

</details>

## 3. Câu hỏi tự luận (8 câu)

**Câu 1.** 

> **Exercise 13.1.** Record 5 is to be deleted from the file of Figure 13.3. Compare the relative merits of the following ways of implementing the deletion:
> 
> a. Move record 6 into the space of record 5, then move record 7 into the space of record 6.
> 
> b. Move record 7 into the space of record 5.
> 
> c. Mark record 5 as deleted and move no records.
> 
> *Figure 13.3 — File of instructor records (Figure 13.1) after record 3 was deleted and the final record moved into its place:*
> 
> | Slot | ID | name | dept_name | salary |
> |---|---|---|---|---|
> | record 0 | 10101 | Srinivasan | Comp. Sci. | 65000 |
> | record 1 | 12121 | Wu | Finance | 90000 |
> | record 2 | 15151 | Mozart | Music | 40000 |
> | record 3 | 98345 | Kim | Elec. Eng. | 80000 |
> | record 4 | 32343 | El Said | History | 60000 |
> | record 5 | 33456 | Gold | Physics | 87000 |
> | record 6 | 45565 | Katz | Comp. Sci. | 75000 |
> | record 7 | 58583 | Califieri | History | 62000 |
> | record 8 | 76543 | Singh | Finance | 80000 |
> | record 9 | 76766 | Crick | Biology | 72000 |
> | record 10 | 83821 | Brandt | Comp. Sci. | 92000 |

**PE 13.1** — Xoá record 5 khỏi file ở Figure 13.3: so sánh ưu nhược điểm của (a) dời 6 → 5, 7 → 6; (b) dời 7 → 5; (c) đánh dấu xoá, không dời gì.

<details><summary>Gợi ý đáp án</summary>

a. Đơn giản nhất và **giữ thứ tự**, nhưng phải **dời nhiều record nhất** → nhiều lần truy cập (với file lớn có thể là rất nhiều block).

b. Chỉ dời **một** record nên ít truy cập hơn, nhưng **phá thứ tự** của file (nếu file đang sắp theo khoá).

c. **Giữ thứ tự**, **không dời** record nào, nhưng cần thêm chi phí **quản lý chỗ trống** (free list). File có thể có nhiều "lỗ" — nếu không thỉnh thoảng dồn lại (compaction) thì hiệu năng giảm vì ít chỗ trống liên tục.

</details>

**Câu 2.** 

> **Exercise 13.2.** Show the structure of the file of Figure 13.4 after each of the following steps:
> 
> a. Insert (24556, Turnamian, Finance, 98000).
> 
> b. Delete record 2.
> 
> c. Insert (34556, Thompson, Music, 67000).
> 
> *Figure 13.4 — File of instructor records (Figure 13.1) after deleting records 1, 4, and 6.* Deleted slots form a free list: the header points to record 1, record 1 points to record 4, record 4 points to record 6, and record 6 ends the list.
> 
> | Slot | ID | name | dept_name | salary |
> |---|---|---|---|---|
> | header | → 1 | | | |
> | record 0 | 10101 | Srinivasan | Comp. Sci. | 65000 |
> | record 1 | → 4 | | | |
> | record 2 | 15151 | Mozart | Music | 40000 |
> | record 3 | 22222 | Einstein | Physics | 95000 |
> | record 4 | → 6 | | | |
> | record 5 | 33456 | Gold | Physics | 87000 |
> | record 6 | (end) | | | |
> | record 7 | 58583 | Califieri | History | 62000 |
> | record 8 | 76543 | Singh | Finance | 80000 |
> | record 9 | 76766 | Crick | Biology | 72000 |
> | record 10 | 83821 | Brandt | Comp. Sci. | 92000 |
> | record 11 | 98345 | Kim | Elec. Eng. | 80000 |

**PE 13.2** — Vẽ file Figure 13.4 sau mỗi bước: (a) insert (24556, Turnamian, Finance, 98000); (b) xoá record 2; (c) insert (34556, Thompson, Music, 67000).

<details><summary>Gợi ý đáp án</summary>

Ban đầu: header → 1 → 4 → 6 (hết).

a. Insert lấy chỗ đầu free list là **record 1**: record 1 = (24556, Turnamian, Finance, 98000); header → **4** → 6.

b. Xoá record 2: record 2 được đẩy lên đầu free list: header → **2** → 4 → 6. (Cũng có thể nối chuỗi khác, ví dụ header → 4 → 2 → 6, miễn là đủ các chỗ trống.)

c. Insert lấy **record 2**: record 2 = (34556, Thompson, Music, 67000); header → 4 → 6.

| Slot | Sau (a) | Sau (b) | Sau (c) |
|---|---|---|---|
| header | → 4 | → 2 | → 4 |
| 1 | 24556 Turnamian | 24556 Turnamian | 24556 Turnamian |
| 2 | 15151 Mozart | → 4 | 34556 Thompson |
| 4 | → 6 | → 6 | → 6 |
| 6 | (hết) | (hết) | (hết) |

Bài CH13.04 và CH13.05 thực hiện đúng các bước này trên bảng `st_file`.

</details>

**Câu 3.** 

> **Exercise 13.3.** Consider the relations *section* and *takes*. Give an example instance of the two relations with three sections, each having five students. Then give a file structure for these relations that uses multitable clustering.

**PE 13.3** — Cho ví dụ instance của section và takes với 3 section, mỗi section 5 sinh viên, và một cấu trúc file dùng multitable clustering.

<details><summary>Gợi ý đáp án</summary>

section:
| course_id | sec_id | semester | year | building | room |
|---|---|---|---|---|---|
| BIO-301 | 1 | Summer | 2010 | Painter | 514 |
| CS-101 | 1 | Fall | 2009 | Packard | 101 |
| CS-347 | 1 | Fall | 2009 | Taylor | 3128 |

takes (5 sinh viên mỗi section): BIO-301: 17968, 59762, 78546, 89729, 98988 (grade null); CS-101: 00128 A, 12345 C, 45678 F, 54321 A−, 76543 A; CS-347: 00128 A−, 12345 A, 23856 A, 54321 A, 76543 A.

**Multitable clustering**: trong file, mỗi record section được đặt ngay trước các record takes của nó:
```
BIO-301 1 Summer 2010 Painter 514
   17968 BIO-301 1 Summer 2010 null
   59762 ... 78546 ... 89729 ... 98988 ...
CS-101 1 Fall 2009 Packard 101
   00128 CS-101 1 Fall 2009 A
   12345 ... C,  45678 ... F,  54321 ... A-,  76543 ... A
CS-347 1 Fall 2009 Taylor 3128
   00128 CS-347 1 Fall 2009 A-
   12345 ... A,  23856 ... A,  54321 ... A,  76543 ... A
```
Join section ⋈ takes chỉ cần đọc tuần tự. Bài CH13.12 sinh bố cục này từ dữ liệu mẫu.

</details>

**Câu 4.** 

> **Exercise 13.4.** Consider a free-space map kept as a bitmap with two bits per block of the file: the bits are 00 if the block is 0–30 percent full, 01 if 30–60 percent full, 10 if 60–90 percent full, and 11 if more than 90 percent full. Such bitmaps fit in memory even for very large files.
> 
> a. Give two benefits and one drawback of using two bits per block instead of one byte per block as described earlier in the chapter.
> 
> b. Explain how the bitmap is kept up to date when records are inserted and deleted.
> 
> c. Explain the advantage of the bitmap technique over free lists, both for searching for free space and for updating free-space information.

**PE 13.4** — Free-space map 2 bit/block (00: 0–30%, 01: 30–60%, 10: 60–90%, 11: > 90% đầy). (a) Hai lợi ích, một nhược điểm so với 1 byte/block; (b) cập nhật bitmap khi insert/delete; (c) lợi ích so với free list.

<details><summary>Gợi ý đáp án</summary>

a. Lợi ích: (1) **tốn ít chỗ** hơn (4 block mỗi byte), dễ giữ cả trong bộ nhớ; (2) **ít phải cập nhật** hơn — phần lớn insert/delete không làm block đổi mức. Nhược điểm: chỉ biết **xấp xỉ** chỗ trống → có thể lãng phí chỗ, hoặc phải đọc block lên rồi mới biết không đủ chỗ (tăng chi phí tìm).

b. Mỗi lần insert/delete, tính lại mức đầy của block; **chỉ khi vượt qua ranh giới** 30/60/90% mới sửa 2 bit tương ứng. Phần lớn trường hợp không phải chạm vào bitmap.

c. Free list: tìm chỗ cho record lớn (hoặc nhiều record) có thể phải duyệt nhiều phần tử trong danh sách (mỗi phần tử có thể là một I/O) mới gặp chỗ đủ lớn. Bitmap: một page bitmap mô tả rất nhiều block → tìm chỗ trống tốn rất ít I/O. Khi xoá cả block hoặc một phần lớn của nó, cập nhật bitmap cũng đơn giản hơn. Bài CH13.07–08.

</details>

**Câu 5.** 

> **Exercise 13.5.** We must be able to determine quickly whether a block is in the buffer and, if it is, where in the buffer it is. Since database buffers are very large, which in-memory data structure would you use for this?

**PE 13.5** — Dùng cấu trúc dữ liệu (trong bộ nhớ) nào để biết nhanh một block có trong buffer không và nằm ở đâu?

<details><summary>Gợi ý đáp án</summary>

**Hash table** với khoá là định danh block (file, số block). Hàm băm chỉ tới một bucket, rồi tìm tuần tự trong bucket (rất ngắn). Thời gian tra cứu gần như hằng số dù buffer rất lớn.

</details>

**Câu 6.** 

> **Exercise 13.6.** Suppose your university has accumulated a very large number of *takes* records over many years. Explain how the *takes* relation could be partitioned and what benefits partitioning could bring. Also explain one possible drawback of the technique.

**PE 13.6** — Partition relation takes rất lớn thế nào, lợi ích gì, nhược điểm gì?

<details><summary>Gợi ý đáp án</summary>

Partition theo **(year, semester)** (hoặc theo year): mỗi năm/học kỳ một partition.
- **Lợi ích**: truy vấn chỉ định năm chỉ đọc partition đó; record cũ ít dùng có thể đặt trên đĩa từ rẻ, record mới trên SSD; xoá/lưu trữ dữ liệu cũ chỉ là thao tác trên cả partition.
- **Nhược điểm**: truy vấn lấy dữ liệu **nhiều năm** tốn hơn vì record nằm ở nhiều relation và nhiều block khác nhau.

Bài CH13.11 tạo partition bằng `partition by range (year)` của PostgreSQL.

</details>

**Câu 7.** 

> **Exercise 13.7.** Give a relational-algebra expression and a query-processing strategy for each of these situations:
> 
> a. MRU is preferable to LRU.
> 
> b. LRU is preferable to MRU.

**PE 13.7** — Cho ví dụ biểu thức đại số quan hệ và chiến lược xử lý khi (a) MRU tốt hơn LRU, (b) LRU tốt hơn MRU.

<details><summary>Gợi ý đáp án</summary>

a. **MRU tốt hơn**: r₁ ⋈ r₂ tính bằng **nested-loop**: với mỗi tuple của r₂ quét lại mọi block của r₁. Xử lý xong một tuple của r₂, block cần tiếp theo là **block đầu tiên** của r₁ — chính là block **lâu nhất chưa dùng**, nên LRU sẽ thay đúng nó khi cần chỗ. MRU thay block vừa dùng (block cuối của r₁, sẽ cần lại muộn nhất).

b. **LRU tốt hơn**: r₁ ⋈ r₂ tính bằng **sort-merge**: sắp hai relation theo thuộc tính join rồi duyệt song song. Khi có giá trị join trùng, có thể phải **lùi lại** trong một relation, vượt qua ranh giới block về block **vừa dùng gần nhất** — MRU sẽ đã thay chính block đó.

Ngoài ra với MRU, một số block không dùng nữa có thể nằm mãi trong bộ nhớ; thực tế MRU chỉ dùng cho tình huống đặc biệt như nested-loop.

</details>

**Câu 8.** 

> **Exercise 13.8.** PostgreSQL usually keeps a small buffer of its own and leaves the rest of main memory to the operating system’s buffer manager for file-system buffering. Explain (a) the benefit of this approach and (b) one key limitation of it.

**PE 13.8** — PostgreSQL dùng buffer nhỏ, để phần bộ nhớ còn lại cho buffer file của hệ điều hành. (a) Lợi ích, (b) hạn chế chính?

<details><summary>Gợi ý đáp án</summary>

a. CSDL không biết nhu cầu bộ nhớ của các tiến trình khác; buffer nhỏ giúp PostgreSQL **không chiếm quá nhiều bộ nhớ**. Đồng thời, block bị đẩy ra khỏi buffer của CSDL **vẫn có thể còn trong buffer file** của hệ điều hành, nên một lần buffer miss của CSDL thường không đắt (không phải đọc đĩa).

b. CSDL **không điều khiển được chính sách thay thế** của buffer hệ điều hành (và không ép được thứ tự ghi), nên hệ điều hành có thể chọn đẩy ra những block không tối ưu (ví dụ không biết mẫu truy cập của nested-loop). Ngoài ra một block có thể nằm hai lần trong bộ nhớ (double buffering).

</details>

## 4. Bài tập SQL (14 bài)

| # | Chủ đề | Mức | Đề bài |
|---|---|---|---|
| CH13.01 | fixed-length records | ★☆☆ | Record instructor độ dài cố định 53 byte (5 + 20 + 20 + 8), record không được vắt qua hai block. Với các kích thước block 2048, 4096 và 8192 byte, trả về `block_bytes`, `records_per_block`, `wasted_bytes` (phần dư mỗi block), và `blocks_for_10000` = số block cần để lưu 10 000 record instructor. |
| CH13.02 | variable-length storage | ★☆☆ | Trong PostgreSQL varchar là kiểu độ dài thay đổi: giá trị ngắn được lưu bằng 1 byte header + nội dung. Với mỗi instructor trả về ID, name, `chars` = octet_length(name) và `stored_bytes` = `pg_column_size(name)`. |
| CH13.03 | char vs varchar | ★★☆ | So sánh tổng số byte để lưu tên của mọi instructor nếu cột name là `char(20)` (độ dài cố định) và nếu là `varchar(20)`: trả về một dòng hai cột `as_char`, `as_varchar` (dùng `pg_column_size`). |
| CH13.04 | PE 13.2a free list insert | ★★☆ | Exercise 13.2 (a). Show the structure of the file of Figure 13.4 after each of the following steps:  a. Insert (24556, Turnamian, Finance, 98000).  *Figure 13.4 — File of instructor records (Figure 13.1) after deleting records 1, 4, and 6.* Deleted slots form a free list: the header points to record 1, record 1 points to record 4, record 4 points to record 6, and record 6 ends the list.  \| Slot \| ID \| name \| dept_name \| salary \| \|---\|---\|---\|---\|---\| \| header \| → 1 \| \| \| \| \| record 0 \| 10101 \| Srinivasan \| Comp. Sci. \| 65000 \| \| record 1 \| → 4 \| \| \| \| \| record 2 \| 15151 \| Mozart \| Music \| 40000 \| \| record 3 \| 22222 \| Einstein \| Physics \| 95000 \| \| record 4 \| → 6 \| \| \| \| \| record 5 \| 33456 \| Gold \| Physics \| 87000 \| \| record 6 \| (end) \| \| \| \| \| record 7 \| 58583 \| Califieri \| History \| 62000 \| \| record 8 \| 76543 \| Singh \| Finance \| 80000 \| \| record 9 \| 76766 \| Crick \| Biology \| 72000 \| \| record 10 \| 83821 \| Brandt \| Comp. Sci. \| 92000 \| \| record 11 \| 98345 \| Kim \| Elec. Eng. \| 80000 \|<br>`st_file(slot, id, name, dept_name, salary, next_free)` là file của Figure 13.4: slot −1 là header; slot trống có id null và next_free trỏ tới slot trống kế tiếp. Viết lệnh insert (24556, Turnamian, Finance, 98000) đúng theo free list: ghi vào slot mà header trỏ tới (đặt next_free của slot đó thành null) và cho header trỏ sang slot trống kế tiếp. Không được viết cứng số slot. Hệ thống đọc lại toàn bộ st_file. |
| CH13.05 | PE 13.2 insert, delete, insert | ★★★ | Exercise 13.2. Show the structure of the file of Figure 13.4 after each of the following steps:  a. Insert (24556, Turnamian, Finance, 98000).  b. Delete record 2.  c. Insert (34556, Thompson, Music, 67000).  *Figure 13.4 — File of instructor records (Figure 13.1) after deleting records 1, 4, and 6.* Deleted slots form a free list: the header points to record 1, record 1 points to record 4, record 4 points to record 6, and record 6 ends the list.  \| Slot \| ID \| name \| dept_name \| salary \| \|---\|---\|---\|---\|---\| \| header \| → 1 \| \| \| \| \| record 0 \| 10101 \| Srinivasan \| Comp. Sci. \| 65000 \| \| record 1 \| → 4 \| \| \| \| \| record 2 \| 15151 \| Mozart \| Music \| 40000 \| \| record 3 \| 22222 \| Einstein \| Physics \| 95000 \| \| record 4 \| → 6 \| \| \| \| \| record 5 \| 33456 \| Gold \| Physics \| 87000 \| \| record 6 \| (end) \| \| \| \| \| record 7 \| 58583 \| Califieri \| History \| 62000 \| \| record 8 \| 76543 \| Singh \| Finance \| 80000 \| \| record 9 \| 76766 \| Crick \| Biology \| 72000 \| \| record 10 \| 83821 \| Brandt \| Comp. Sci. \| 92000 \| \| record 11 \| 98345 \| Kim \| Elec. Eng. \| 80000 \|<br>Thực hiện cả ba bước của PE 13.2 trên `st_file`, mỗi bước theo đúng quy tắc free list (insert lấy slot ở đầu free list; delete đẩy slot vừa trống lên đầu free list và xoá nội dung của nó): (a) insert (24556, Turnamian, Finance, 98000); (b) delete record ở slot 2; (c) insert (34556, Thompson, Music, 67000). Hệ thống đọc lại toàn bộ st_file. |
| CH13.06 | walk the free list | ★★☆ | Liệt kê các slot trống của `st_file` theo thứ tự trong free list, bắt đầu từ slot mà header trỏ tới: cột `pos` (1, 2, …) và `slot`. |
| CH13.07 | PE 13.4 2-bit free-space map | ★★☆ | Exercise 13.4. Consider a free-space map kept as a bitmap with two bits per block of the file: the bits are 00 if the block is 0–30 percent full, 01 if 30–60 percent full, 10 if 60–90 percent full, and 11 if more than 90 percent full. Such bitmaps fit in memory even for very large files.  a. Give two benefits and one drawback of using two bits per block instead of one byte per block as described earlier in the chapter.  b. Explain how the bitmap is kept up to date when records are inserted and deleted.  c. Explain the advantage of the bitmap technique over free lists, both for searching for free space and for updating free-space information.<br>`st_block(block_no, used_bytes)` cho biết số byte đã dùng của mỗi block 8192 byte. Tính free-space map 2 bit của PE 13.4: `pct` = tỉ lệ đầy (%, làm tròn 1 chữ số) và `bits`: '00' nếu dưới 30%, '01' nếu từ 30% tới dưới 60%, '10' nếu từ 60% tới dưới 90%, '11' nếu từ 90% trở lên. Trả về block_no, pct, bits. |
| CH13.08 | search with the bitmap | ★★★ | Exercise 13.4. Consider a free-space map kept as a bitmap with two bits per block of the file: the bits are 00 if the block is 0–30 percent full, 01 if 30–60 percent full, 10 if 60–90 percent full, and 11 if more than 90 percent full. Such bitmaps fit in memory even for very large files.  a. Give two benefits and one drawback of using two bits per block instead of one byte per block as described earlier in the chapter.  b. Explain how the bitmap is kept up to date when records are inserted and deleted.  c. Explain the advantage of the bitmap technique over free lists, both for searching for free space and for updating free-space information.<br>Chỉ nhìn bitmap 2 bit (không biết used_bytes chính xác), những block nào chắc chắn còn ít nhất 3000 byte trống? Mã 00 bảo đảm còn ≥ 70% trống, 01 bảo đảm ≥ 40%, 10 bảo đảm ≥ 10%, 11 không bảo đảm gì. Trả về block_no và `guaranteed_free` (số byte trống tối thiểu được bảo đảm, lấy phần nguyên) của các block đó. |
| CH13.09 | LRU simulation | ★★★ | `st_buffer_trace(seq, block_id)` là chuỗi yêu cầu block. Buffer có 3 frame, dùng LRU. Lần truy cập ở vị trí s là hit khi và chỉ khi block đó đã được truy cập trước, ở lần gần nhất p, và số block khác nhau được truy cập giữa p và s (không kể hai đầu) nhỏ hơn 3. Trả về seq, block_id, `hit` (boolean), sắp theo seq. |
| CH13.10 | buffer size vs hits | ★★★ | Dùng cùng quy tắc LRU như CH13.09, đếm số hit trên st_buffer_trace với buffer 2, 3, 4 và 5 frame. Trả về `frames`, `hits`. |
| CH13.11 | PE 13.6 partitioning | ★★☆ | Exercise 13.6. Suppose your university has accumulated a very large number of *takes* records over many years. Explain how the *takes* relation could be partitioned and what benefits partitioning could bring. Also explain one possible drawback of the technique.<br>Tạo bảng `st_takes_part` có cùng các cột như takes (ID, course_id, sec_id, semester, year, grade), partition by range (year), với hai partition `st_takes_2017` (year từ 2017 tới trước 2018) và `st_takes_2018` (từ 2018 tới trước 2019). Chép mọi dòng của takes vào st_takes_part. Hệ thống đếm số dòng của mỗi partition. |
| CH13.12 | PE 13.3 multitable clustering | ★★★ | Exercise 13.3. Consider the relations *section* and *takes*. Give an example instance of the two relations with three sections, each having five students. Then give a file structure for these relations that uses multitable clustering.<br>Sinh bố cục file multitable clustering của section và takes cho các section Fall 2017: mỗi record section, ngay sau là các record takes của nó. Cột: course_id, sec_id, `rec_type` ('section' hoặc 'takes'), `info` (với section: building \|\| ' ' \|\| room_number; với takes: ID). Sắp theo course_id, sec_id, section trước takes, rồi theo ID. |
| CH13.13 | row vs column store | ★★☆ | `st_column_spec(column_name, bytes)` là các cột của một bảng sales có 1 000 000 dòng. Truy vấn phân tích chỉ cần các cột sale_date, quantity, unit_price. Trả về một dòng: `row_store_mb` (row store phải đọc cả tuple), `column_store_mb` (chỉ đọc 3 cột), làm tròn 1 chữ số với 1 MB = 1 048 576 byte, và `ratio` = row_store / column_store làm tròn 1 chữ số. |
| CH13.14 | slotted page, ctid | ★★☆ | PostgreSQL định danh mỗi tuple bằng `ctid = (block, slot)` của slotted page. Tạo bảng `st_slot_demo(name varchar(10))`, chèn lần lượt 'a', 'b', 'c'; xoá 'b'; cập nhật 'c' thành 'c2'; chèn 'd'. Trả về name và `ctid::text` của các tuple còn lại, sắp theo name. (Quan sát: slot của 'b' không được dùng lại ngay, và update tạo một phiên bản tuple mới ở slot mới.) |
