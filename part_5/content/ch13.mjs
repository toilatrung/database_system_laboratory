export default {
  number: 13,
  slug: 'ch13_storage_structures',
  title: 'Data Storage Structures',
  titleVi: 'Cấu trúc lưu trữ dữ liệu',

  summary: `
### 1. File organization (slide 13.3)
CSDL được lưu thành tập các **file**; mỗi file là một dãy **record**, được chia thành các **block** cố định (đơn vị chuyển giữa đĩa và bộ nhớ, 4–8 KB). Giả định đơn giản: mỗi file chỉ chứa record của một relation, record nhỏ hơn block.

### 2. Record độ dài cố định (slide 13.4–13.8)
Ví dụ \`instructor(ID varchar(5), name varchar(20), dept_name varchar(20), salary numeric(8,2))\` coi như cố định: 5 + 20 + 20 + 8 = **53 byte**. Record i bắt đầu ở byte n × (i − 1).
- Không để record vắt qua hai block: mỗi block chứa ⌊block_size / record_size⌋ record, phần dư bỏ trống.
- **Xoá record i** — ba cách (PE 13.1):
  1. dời các record i + 1, …, n lên một chỗ (giữ thứ tự, tốn nhiều I/O nhất);
  2. dời **record cuối** vào chỗ trống (ít dời, nhưng phá thứ tự);
  3. **không dời**, nối chỗ trống vào **free list**.
- **Free list**: **file header** chứa địa chỉ record trống đầu tiên; mỗi record trống chứa con trỏ tới record trống kế tiếp. **Insert** lấy chỗ đầu tiên trong free list (header trỏ sang chỗ kế tiếp); **delete** đẩy chỗ vừa trống lên đầu danh sách (PE 13.2, bài CH13.04–06).

### 3. Record độ dài thay đổi (slide 13.9–13.12)
Phát sinh do: kiểu dữ liệu độ dài thay đổi (varchar), nhiều loại record trong một file, trường lặp (mảng).
- **Biểu diễn**: các thuộc tính cố định trước; mỗi thuộc tính độ dài thay đổi được thay bằng cặp **(offset, length)** ở phần cố định, dữ liệu thật nằm sau. **Null bitmap** cho biết thuộc tính nào null.
- PostgreSQL: varchar ngắn có header 1 byte (\`pg_column_size('Wu'::varchar)\` = 3), còn \`char(20)\` luôn chiếm đủ 20 ký tự + header (bài CH13.02–03).

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
Chia relation lớn thành các relation nhỏ hơn theo giá trị một thuộc tính, ví dụ \`transaction\` theo năm → \`transaction_2018\`, \`transaction_2019\`, … Lợi ích: truy vấn chỉ một năm đọc ít dữ liệu hơn; có thể đặt partition cũ trên đĩa rẻ, partition mới trên SSD; quản lý (xoá dữ liệu cũ) dễ hơn. Nhược điểm: truy vấn trải nhiều partition tốn hơn (PE 13.6, bài CH13.11 dùng **declarative partitioning** của PostgreSQL).

### 8. Data dictionary (system catalog) (slide 13.27–13.29)
Lưu **metadata**: tên relation, thuộc tính (tên, kiểu, độ dài), view, ràng buộc toàn vẹn, người dùng và quyền, thống kê (số tuple, phân bố giá trị), index, cách lưu trữ vật lý. Bản thân catalog thường cũng là các relation (PostgreSQL: \`pg_class\`, \`pg_attribute\`, \`pg_index\`…).

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
`,

  quiz: [
    {
      q: 'Record instructor cố định 53 byte, block 4096 byte, record không vắt qua block. Mỗi block chứa bao nhiêu record?',
      options: ['77', '78', '76', '53'],
      answer: 0,
      explain: '⌊4096 / 53⌋ = 77; 4096 − 77 × 53 = 15 byte bỏ trống.',
    },
    {
      q: 'Trong file có free list, một record mới được insert vào đâu?',
      options: ['Cuối file', 'Chỗ trống mà file header đang trỏ tới', 'Chỗ trống cuối cùng của danh sách', 'Chỗ trống có số nhỏ nhất'],
      answer: 1,
      explain: 'Lấy chỗ đầu tiên của free list; header được cập nhật trỏ sang chỗ trống kế tiếp.',
    },
    {
      q: 'Trong slotted page, con trỏ từ bên ngoài (ví dụ từ index) trỏ tới đâu?',
      options: ['Byte đầu tiên của record', 'Entry của record trong header của block', 'Cuối vùng trống', 'Block kế tiếp'],
      answer: 1,
      explain: 'Nhờ vậy record có thể được dời trong block mà không phải sửa con trỏ bên ngoài.',
    },
    {
      q: 'Biểu diễn record độ dài thay đổi: thuộc tính varchar được lưu thế nào ở phần cố định?',
      options: ['Lưu đủ độ dài tối đa', 'Cặp (offset, length)', 'Con trỏ tới file khác', 'Không lưu'],
      answer: 1,
      explain: 'Dữ liệu thật nằm sau phần cố định; null bitmap cho biết thuộc tính null.',
    },
    {
      q: 'Multitable clustering file organization có lợi cho truy vấn nào?',
      options: ['Đếm số tuple của một relation', 'Join department với instructor của nó', 'Quét toàn bộ instructor', 'Cập nhật salary'],
      answer: 1,
      explain: 'Các record join với nhau nằm chung block. Truy vấn chỉ một relation phải đọc qua record của relation kia nên chậm hơn.',
    },
    {
      q: 'Cấu trúc dữ liệu thường dùng để tìm nhanh một block có trong buffer không?',
      options: ['Danh sách liên kết', 'Hash table theo địa chỉ block', 'B+-tree trên đĩa', 'Mảng sắp xếp'],
      answer: 1,
      explain: 'PE 13.5: buffer rất lớn, hash table cho phép tra cứu O(1).',
    },
    {
      q: 'Khi tính nested-loop join r ⋈ s (với mỗi tuple của r quét lại toàn bộ s), chính sách thay block nào phù hợp cho các block của s?',
      options: ['LRU', 'MRU', 'FIFO', 'Random'],
      answer: 1,
      explain: 'Block vừa quét xong sẽ được cần lại muộn nhất trong lần quét kế tiếp, nên thay nó (MRU). LRU sẽ thay đúng block sắp cần.',
    },
    {
      q: '**Pinned block** trong buffer là gì?',
      options: ['Block đã bị sửa', 'Block đang được dùng nên không được phép thay', 'Block của catalog', 'Block đã ghi xuống đĩa'],
      answer: 1,
      explain: 'Pin count > 0 thì buffer manager không chọn block đó để thay.',
    },
    {
      q: 'Lưu trữ theo cột (columnar) phù hợp nhất với loại công việc nào?',
      options: ['Xử lý giao dịch cập nhật từng tuple', 'Truy vấn phân tích đọc vài cột trên rất nhiều dòng', 'Insert liên tục', 'Lấy toàn bộ một tuple theo khoá'],
      answer: 1,
      explain: 'Chỉ đọc cột cần, nén tốt, xử lý vector.',
    },
    {
      q: 'Partitioning relation takes theo year có nhược điểm gì?',
      options: ['Không truy vấn được năm cũ', 'Truy vấn trải nhiều năm phải đọc nhiều partition, tốn hơn', 'Không thể tạo index', 'Mất ràng buộc khoá chính'],
      answer: 1,
      explain: 'PE 13.6. Ưu điểm: truy vấn một năm chỉ đọc partition đó, có thể đặt dữ liệu cũ trên đĩa rẻ.',
    },
  ],

  questions: [
    {
      pe: '13.1',
      q: '**PE 13.1** — Xoá record 5 khỏi file ở Figure 13.3: so sánh ưu nhược điểm của (a) dời 6 → 5, 7 → 6; (b) dời 7 → 5; (c) đánh dấu xoá, không dời gì.',
      answer: `a. Đơn giản nhất và **giữ thứ tự**, nhưng phải **dời nhiều record nhất** → nhiều lần truy cập (với file lớn có thể là rất nhiều block).

b. Chỉ dời **một** record nên ít truy cập hơn, nhưng **phá thứ tự** của file (nếu file đang sắp theo khoá).

c. **Giữ thứ tự**, **không dời** record nào, nhưng cần thêm chi phí **quản lý chỗ trống** (free list). File có thể có nhiều "lỗ" — nếu không thỉnh thoảng dồn lại (compaction) thì hiệu năng giảm vì ít chỗ trống liên tục.`,
    },
    {
      pe: '13.2',
      q: '**PE 13.2** — Vẽ file Figure 13.4 sau mỗi bước: (a) insert (24556, Turnamian, Finance, 98000); (b) xoá record 2; (c) insert (34556, Thompson, Music, 67000).',
      answer: `Ban đầu: header → 1 → 4 → 6 (hết).

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

Bài CH13.04 và CH13.05 thực hiện đúng các bước này trên bảng \`st_file\`.`,
    },
    {
      pe: '13.3',
      q: '**PE 13.3** — Cho ví dụ instance của section và takes với 3 section, mỗi section 5 sinh viên, và một cấu trúc file dùng multitable clustering.',
      answer: `section:
| course_id | sec_id | semester | year | building | room |
|---|---|---|---|---|---|
| BIO-301 | 1 | Summer | 2010 | Painter | 514 |
| CS-101 | 1 | Fall | 2009 | Packard | 101 |
| CS-347 | 1 | Fall | 2009 | Taylor | 3128 |

takes (5 sinh viên mỗi section): BIO-301: 17968, 59762, 78546, 89729, 98988 (grade null); CS-101: 00128 A, 12345 C, 45678 F, 54321 A−, 76543 A; CS-347: 00128 A−, 12345 A, 23856 A, 54321 A, 76543 A.

**Multitable clustering**: trong file, mỗi record section được đặt ngay trước các record takes của nó:
\`\`\`
BIO-301 1 Summer 2010 Painter 514
   17968 BIO-301 1 Summer 2010 null
   59762 ... 78546 ... 89729 ... 98988 ...
CS-101 1 Fall 2009 Packard 101
   00128 CS-101 1 Fall 2009 A
   12345 ... C,  45678 ... F,  54321 ... A-,  76543 ... A
CS-347 1 Fall 2009 Taylor 3128
   00128 CS-347 1 Fall 2009 A-
   12345 ... A,  23856 ... A,  54321 ... A,  76543 ... A
\`\`\`
Join section ⋈ takes chỉ cần đọc tuần tự. Bài CH13.12 sinh bố cục này từ dữ liệu mẫu.`,
    },
    {
      pe: '13.4',
      q: '**PE 13.4** — Free-space map 2 bit/block (00: 0–30%, 01: 30–60%, 10: 60–90%, 11: > 90% đầy). (a) Hai lợi ích, một nhược điểm so với 1 byte/block; (b) cập nhật bitmap khi insert/delete; (c) lợi ích so với free list.',
      answer: `a. Lợi ích: (1) **tốn ít chỗ** hơn (4 block mỗi byte), dễ giữ cả trong bộ nhớ; (2) **ít phải cập nhật** hơn — phần lớn insert/delete không làm block đổi mức. Nhược điểm: chỉ biết **xấp xỉ** chỗ trống → có thể lãng phí chỗ, hoặc phải đọc block lên rồi mới biết không đủ chỗ (tăng chi phí tìm).

b. Mỗi lần insert/delete, tính lại mức đầy của block; **chỉ khi vượt qua ranh giới** 30/60/90% mới sửa 2 bit tương ứng. Phần lớn trường hợp không phải chạm vào bitmap.

c. Free list: tìm chỗ cho record lớn (hoặc nhiều record) có thể phải duyệt nhiều phần tử trong danh sách (mỗi phần tử có thể là một I/O) mới gặp chỗ đủ lớn. Bitmap: một page bitmap mô tả rất nhiều block → tìm chỗ trống tốn rất ít I/O. Khi xoá cả block hoặc một phần lớn của nó, cập nhật bitmap cũng đơn giản hơn. Bài CH13.07–08.`,
    },
    {
      pe: '13.5',
      q: '**PE 13.5** — Dùng cấu trúc dữ liệu (trong bộ nhớ) nào để biết nhanh một block có trong buffer không và nằm ở đâu?',
      answer: `**Hash table** với khoá là định danh block (file, số block). Hàm băm chỉ tới một bucket, rồi tìm tuần tự trong bucket (rất ngắn). Thời gian tra cứu gần như hằng số dù buffer rất lớn.`,
    },
    {
      pe: '13.6',
      q: '**PE 13.6** — Partition relation takes rất lớn thế nào, lợi ích gì, nhược điểm gì?',
      answer: `Partition theo **(year, semester)** (hoặc theo year): mỗi năm/học kỳ một partition.
- **Lợi ích**: truy vấn chỉ định năm chỉ đọc partition đó; record cũ ít dùng có thể đặt trên đĩa từ rẻ, record mới trên SSD; xoá/lưu trữ dữ liệu cũ chỉ là thao tác trên cả partition.
- **Nhược điểm**: truy vấn lấy dữ liệu **nhiều năm** tốn hơn vì record nằm ở nhiều relation và nhiều block khác nhau.

Bài CH13.11 tạo partition bằng \`partition by range (year)\` của PostgreSQL.`,
    },
    {
      pe: '13.7',
      q: '**PE 13.7** — Cho ví dụ biểu thức đại số quan hệ và chiến lược xử lý khi (a) MRU tốt hơn LRU, (b) LRU tốt hơn MRU.',
      answer: `a. **MRU tốt hơn**: r₁ ⋈ r₂ tính bằng **nested-loop**: với mỗi tuple của r₂ quét lại mọi block của r₁. Xử lý xong một tuple của r₂, block cần tiếp theo là **block đầu tiên** của r₁ — chính là block **lâu nhất chưa dùng**, nên LRU sẽ thay đúng nó khi cần chỗ. MRU thay block vừa dùng (block cuối của r₁, sẽ cần lại muộn nhất).

b. **LRU tốt hơn**: r₁ ⋈ r₂ tính bằng **sort-merge**: sắp hai relation theo thuộc tính join rồi duyệt song song. Khi có giá trị join trùng, có thể phải **lùi lại** trong một relation, vượt qua ranh giới block về block **vừa dùng gần nhất** — MRU sẽ đã thay chính block đó.

Ngoài ra với MRU, một số block không dùng nữa có thể nằm mãi trong bộ nhớ; thực tế MRU chỉ dùng cho tình huống đặc biệt như nested-loop.`,
    },
    {
      pe: '13.8',
      q: '**PE 13.8** — PostgreSQL dùng buffer nhỏ, để phần bộ nhớ còn lại cho buffer file của hệ điều hành. (a) Lợi ích, (b) hạn chế chính?',
      answer: `a. CSDL không biết nhu cầu bộ nhớ của các tiến trình khác; buffer nhỏ giúp PostgreSQL **không chiếm quá nhiều bộ nhớ**. Đồng thời, block bị đẩy ra khỏi buffer của CSDL **vẫn có thể còn trong buffer file** của hệ điều hành, nên một lần buffer miss của CSDL thường không đắt (không phải đọc đĩa).

b. CSDL **không điều khiển được chính sách thay thế** của buffer hệ điều hành (và không ép được thứ tự ghi), nên hệ điều hành có thể chọn đẩy ra những block không tối ưu (ví dụ không biết mẫu truy cập của nested-loop). Ngoài ra một block có thể nằm hai lần trong bộ nhớ (double buffering).`,
    },
  ],

  exercises: [
    {
      id: 'CH13.01', topic: 'fixed-length records', level: 1,
      prompt: 'Record instructor độ dài cố định 53 byte (5 + 20 + 20 + 8), record **không** được vắt qua hai block. Với các kích thước block 2048, 4096 và 8192 byte, trả về `block_bytes`, `records_per_block`, `wasted_bytes` (phần dư mỗi block), và `blocks_for_10000` = số block cần để lưu 10 000 record instructor.',
      solution: `select b as block_bytes,
       b / 53 as records_per_block,
       b - (b / 53) * 53 as wasted_bytes,
       ceil(10000.0 / (b / 53)) as blocks_for_10000
from (values (2048), (4096), (8192)) as t(b);`,
    },
    {
      id: 'CH13.02', topic: 'variable-length storage', level: 1,
      prompt: 'Trong PostgreSQL varchar là kiểu độ dài thay đổi: giá trị ngắn được lưu bằng 1 byte header + nội dung. Với mỗi instructor trả về ID, name, `chars` = octet_length(name) và `stored_bytes` = `pg_column_size(name)`.',
      solution: `select ID, name, octet_length(name) as chars, pg_column_size(name) as stored_bytes
from instructor;`,
    },
    {
      id: 'CH13.03', topic: 'char vs varchar', level: 2,
      prompt: 'So sánh tổng số byte để lưu **tên của mọi instructor** nếu cột name là `char(20)` (độ dài cố định) và nếu là `varchar(20)`: trả về một dòng hai cột `as_char`, `as_varchar` (dùng `pg_column_size`).',
      solution: `select sum(pg_column_size(name::char(20))) as as_char,
       sum(pg_column_size(name::varchar(20))) as as_varchar
from instructor;`,
    },
    {
      id: 'CH13.04', topic: 'PE 13.2a free list insert', level: 2, pe: '13.2a',
      prompt: '`st_file(slot, id, name, dept_name, salary, next_free)` là file của Figure 13.4: slot −1 là **header**; slot trống có id null và next_free trỏ tới slot trống kế tiếp. Viết lệnh **insert (24556, Turnamian, Finance, 98000)** đúng theo free list: ghi vào slot mà header trỏ tới (đặt next_free của slot đó thành null) và cho header trỏ sang slot trống kế tiếp. Không được viết cứng số slot. Hệ thống đọc lại toàn bộ st_file.',
      hint: 'Một câu `with old as (select ...), h as (update st_file set next_free = ... where slot = -1 returning 1) update st_file ... where slot = (select s from old);` — mọi phần của câu nhìn cùng một trạng thái ban đầu.',
      solution: `with old as (
  select h.next_free as s, f.next_free as nxt
  from st_file h join st_file f on f.slot = h.next_free
  where h.slot = -1),
hdr as (
  update st_file set next_free = (select nxt from old) where slot = -1 returning 1)
update st_file
set id = '24556', name = 'Turnamian', dept_name = 'Finance', salary = 98000, next_free = null
where slot = (select s from old);`,
      check: `select * from st_file order by slot;`,
    },
    {
      id: 'CH13.05', topic: 'PE 13.2 insert, delete, insert', level: 3, pe: '13.2',
      prompt: 'Thực hiện **cả ba bước** của PE 13.2 trên `st_file`, mỗi bước theo đúng quy tắc free list (insert lấy slot ở đầu free list; delete đẩy slot vừa trống lên đầu free list và xoá nội dung của nó): (a) insert (24556, Turnamian, Finance, 98000); (b) delete record ở slot 2; (c) insert (34556, Thompson, Music, 67000). Hệ thống đọc lại toàn bộ st_file.',
      hint: 'Delete slot k: next_free của k = next_free hiện tại của header; header trỏ tới k.',
      solution: `with old as (
  select h.next_free as s, f.next_free as nxt
  from st_file h join st_file f on f.slot = h.next_free where h.slot = -1),
hdr as (update st_file set next_free = (select nxt from old) where slot = -1 returning 1)
update st_file set id = '24556', name = 'Turnamian', dept_name = 'Finance', salary = 98000, next_free = null
where slot = (select s from old);

with h as (select next_free as s from st_file where slot = -1),
hdr as (update st_file set next_free = 2 where slot = -1 returning 1)
update st_file set id = null, name = null, dept_name = null, salary = null, next_free = (select s from h)
where slot = 2;

with old as (
  select h.next_free as s, f.next_free as nxt
  from st_file h join st_file f on f.slot = h.next_free where h.slot = -1),
hdr as (update st_file set next_free = (select nxt from old) where slot = -1 returning 1)
update st_file set id = '34556', name = 'Thompson', dept_name = 'Music', salary = 67000, next_free = null
where slot = (select s from old);`,
      check: `select * from st_file order by slot;`,
    },
    {
      id: 'CH13.06', topic: 'walk the free list', level: 2,
      prompt: 'Liệt kê các slot trống của `st_file` **theo thứ tự trong free list**, bắt đầu từ slot mà header trỏ tới: cột `pos` (1, 2, …) và `slot`.',
      hint: '`with recursive` đi theo next_free.',
      ordered: true,
      solution: `with recursive fl (pos, slot) as (
  select 1, next_free from st_file where slot = -1 and next_free is not null
  union all
  select fl.pos + 1, f.next_free
  from fl join st_file f on f.slot = fl.slot
  where f.next_free is not null)
select pos, slot from fl order by pos;`,
    },
    {
      id: 'CH13.07', topic: 'PE 13.4 2-bit free-space map', level: 2, pe: '13.4',
      prompt: '`st_block(block_no, used_bytes)` cho biết số byte đã dùng của mỗi block 8192 byte. Tính free-space map 2 bit của PE 13.4: `pct` = tỉ lệ đầy (%, làm tròn 1 chữ số) và `bits`: \'00\' nếu dưới 30%, \'01\' nếu từ 30% tới dưới 60%, \'10\' nếu từ 60% tới dưới 90%, \'11\' nếu từ 90% trở lên. Trả về block_no, pct, bits.',
      hint: 'So sánh trên giá trị chưa làm tròn: block 7 dùng 2457 byte = 29.99% → 00.',
      solution: `select block_no,
       round(100.0 * used_bytes / 8192, 1) as pct,
       case when 100.0 * used_bytes / 8192 < 30 then '00'
            when 100.0 * used_bytes / 8192 < 60 then '01'
            when 100.0 * used_bytes / 8192 < 90 then '10'
            else '11' end as bits
from st_block;`,
    },
    {
      id: 'CH13.08', topic: 'search with the bitmap', level: 3, pe: '13.4',
      prompt: 'Chỉ nhìn **bitmap 2 bit** (không biết used_bytes chính xác), những block nào **chắc chắn** còn ít nhất **3000 byte** trống? Mã 00 bảo đảm còn ≥ 70% trống, 01 bảo đảm ≥ 40%, 10 bảo đảm ≥ 10%, 11 không bảo đảm gì. Trả về block_no và `guaranteed_free` (số byte trống tối thiểu được bảo đảm, lấy phần nguyên) của các block đó.',
      solution: `with m as (
  select block_no,
         case when 100.0 * used_bytes / 8192 < 30 then 0.70
              when 100.0 * used_bytes / 8192 < 60 then 0.40
              when 100.0 * used_bytes / 8192 < 90 then 0.10
              else 0 end as free_frac
  from st_block)
select block_no, floor(free_frac * 8192) as guaranteed_free
from m
where free_frac * 8192 >= 3000;`,
    },
    {
      id: 'CH13.09', topic: 'LRU simulation', level: 3,
      prompt: '`st_buffer_trace(seq, block_id)` là chuỗi yêu cầu block. Buffer có **3 frame**, dùng **LRU**. Lần truy cập ở vị trí s là **hit** khi và chỉ khi block đó đã được truy cập trước, ở lần gần nhất p, và số block **khác nhau** được truy cập giữa p và s (không kể hai đầu) nhỏ hơn 3. Trả về seq, block_id, `hit` (boolean), sắp theo seq.',
      hint: 'Với mỗi s: p = max(seq) < s cùng block; đếm `count(distinct block_id)` trong (p, s).',
      ordered: true,
      solution: `select t.seq, t.block_id,
       prev.p is not null
         and (select count(distinct m.block_id) from st_buffer_trace m
              where m.seq > prev.p and m.seq < t.seq) < 3 as hit
from st_buffer_trace t
cross join lateral (select max(seq) as p from st_buffer_trace x
                    where x.block_id = t.block_id and x.seq < t.seq) as prev
order by t.seq;`,
    },
    {
      id: 'CH13.10', topic: 'buffer size vs hits', level: 3,
      prompt: 'Dùng cùng quy tắc LRU như CH13.09, đếm số **hit** trên st_buffer_trace với buffer **2, 3, 4 và 5** frame. Trả về `frames`, `hits`.',
      solution: `select k as frames,
       count(*) filter (where prev.p is not null
                        and (select count(distinct m.block_id) from st_buffer_trace m
                             where m.seq > prev.p and m.seq < t.seq) < k) as hits
from (values (2), (3), (4), (5)) as f(k)
cross join st_buffer_trace t
cross join lateral (select max(seq) as p from st_buffer_trace x
                    where x.block_id = t.block_id and x.seq < t.seq) as prev
group by k;`,
    },
    {
      id: 'CH13.11', topic: 'PE 13.6 partitioning', level: 2, pe: '13.6',
      prompt: 'Tạo bảng `st_takes_part` có cùng các cột như takes (ID, course_id, sec_id, semester, year, grade), **partition by range (year)**, với hai partition `st_takes_2017` (year từ 2017 tới trước 2018) và `st_takes_2018` (từ 2018 tới trước 2019). Chép mọi dòng của takes vào st_takes_part. Hệ thống đếm số dòng của mỗi partition.',
      solution: `create table st_takes_part (
  ID varchar(5), course_id varchar(8), sec_id varchar(8),
  semester varchar(6), year numeric(4,0), grade varchar(2)
) partition by range (year);
create table st_takes_2017 partition of st_takes_part for values from (2017) to (2018);
create table st_takes_2018 partition of st_takes_part for values from (2018) to (2019);
insert into st_takes_part select ID, course_id, sec_id, semester, year, grade from takes;`,
      check: `select tableoid::regclass::text as partition, count(*) as num_rows
from st_takes_part group by tableoid order by 1;`,
    },
    {
      id: 'CH13.12', topic: 'PE 13.3 multitable clustering', level: 3, pe: '13.3',
      prompt: 'Sinh bố cục file **multitable clustering** của section và takes cho các section **Fall 2017**: mỗi record section, ngay sau là các record takes của nó. Cột: course_id, sec_id, `rec_type` (\'section\' hoặc \'takes\'), `info` (với section: building || \' \' || room_number; với takes: ID). Sắp theo course_id, sec_id, section trước takes, rồi theo ID.',
      ordered: true,
      solution: `select course_id, sec_id, rec_type, info
from (select course_id, sec_id, 'section' as rec_type, building || ' ' || room_number as info, 0 as k
      from section where semester = 'Fall' and year = 2017
      union all
      select course_id, sec_id, 'takes', ID, 1
      from takes where semester = 'Fall' and year = 2017) as f
order by course_id, sec_id, k, info;`,
    },
    {
      id: 'CH13.13', topic: 'row vs column store', level: 2,
      prompt: '`st_column_spec(column_name, bytes)` là các cột của một bảng sales có **1 000 000** dòng. Truy vấn phân tích chỉ cần các cột sale_date, quantity, unit_price. Trả về một dòng: `row_store_mb` (row store phải đọc cả tuple), `column_store_mb` (chỉ đọc 3 cột), làm tròn 1 chữ số với 1 MB = 1 048 576 byte, và `ratio` = row_store / column_store làm tròn 1 chữ số.',
      solution: `select round(sum(bytes) * 1000000.0 / 1048576, 1) as row_store_mb,
       round(sum(bytes) filter (where column_name in ('sale_date', 'quantity', 'unit_price')) * 1000000.0 / 1048576, 1) as column_store_mb,
       round(sum(bytes)::numeric / sum(bytes) filter (where column_name in ('sale_date', 'quantity', 'unit_price')), 1) as ratio
from st_column_spec;`,
    },
    {
      id: 'CH13.14', topic: 'slotted page, ctid', level: 2, fresh: true,
      prompt: 'PostgreSQL định danh mỗi tuple bằng `ctid = (block, slot)` của slotted page. Tạo bảng `st_slot_demo(name varchar(10))`, chèn lần lượt \'a\', \'b\', \'c\'; xoá \'b\'; cập nhật \'c\' thành \'c2\'; chèn \'d\'. Trả về name và `ctid::text` của các tuple còn lại, sắp theo name. (Quan sát: slot của \'b\' không được dùng lại ngay, và update tạo một **phiên bản tuple mới** ở slot mới.)',
      solution: `create table st_slot_demo (name varchar(10));
insert into st_slot_demo values ('a');
insert into st_slot_demo values ('b');
insert into st_slot_demo values ('c');
delete from st_slot_demo where name = 'b';
update st_slot_demo set name = 'c2' where name = 'c';
insert into st_slot_demo values ('d');
select name, ctid::text as ctid from st_slot_demo order by name;`,
    },
  ],
};
