export default {
  number: 24,
  slug: 'ch24_advanced_indexing',
  title: 'Advanced Indexing Techniques',
  titleVi: 'Kỹ thuật index nâng cao',

  summary: `
### 0. Bối cảnh
Chương 14 trình bày B<sup>+</sup>-tree và hashing cơ bản. Chương 24 mở rộng theo bốn hướng: (1) cấu trúc **xác suất** cho tra cứu tồn tại (Bloom filter), (2) index **tối ưu ghi** (LSM tree, buffer tree), (3) **bitmap index** cho dữ liệu ít giá trị khác nhau, (4) index **không gian** (k-d tree, quadtree, R-tree) và (5) **hash index động** (extendable hashing, linear hashing).

### 1. Bloom filter
- Một mảng **m bit** (ban đầu toàn 0) và **k hàm băm** độc lập h₁…h<sub>k</sub>, mỗi hàm cho giá trị trong 0…m−1.
- **Chèn** khoá x: đặt bit h₁(x), …, h<sub>k</sub>(x) thành 1.
- **Tra cứu** khoá y: nếu *mọi* bit h<sub>i</sub>(y) đều là 1 → "**có thể có**"; nếu có một bit 0 → "**chắc chắn không có**".
- **Không có false negative**, nhưng có **false positive**: các bit của y tình cờ đều bị khoá khác bật lên.
- Xác suất false positive sau khi chèn n khoá: **p ≈ (1 − e<sup>−kn/m</sup>)<sup>k</sup>**. Số hàm băm tối ưu: **k = (m/n) · ln 2**; khi đó p ≈ 0.6185<sup>m/n</sup>. Khoảng 10 bit mỗi khoá cho p ≈ 1%.
- Không xoá được khoá (xoá bit sẽ phá khoá khác) — muốn xoá dùng *counting Bloom filter* (mỗi ô là bộ đếm).
- Ứng dụng: LSM tree giữ một Bloom filter cho mỗi run để **khỏi đọc** những run chắc chắn không chứa khoá; semijoin trong hệ phân tán (gửi filter thay cho cả tập khoá).

### 2. LSM tree (Log-Structured Merge tree)
- Mức **L0** nằm trong bộ nhớ (thường là B<sup>+</sup>-tree/skip list). Khi L0 đầy, nó được **ghi tuần tự** ra đĩa thành L1; khi L<sub>i</sub> vượt kích thước, nó được **merge** vào L<sub>i+1</sub> (mỗi mức lớn hơn mức trước k lần).
- Mọi ghi đều là **sequential I/O** → rất nhanh với đĩa từ và tốt cho SSD (ít ghi đè).
- **Cập nhật** = chèn phiên bản mới (timestamp lớn hơn); **xoá** = chèn **tombstone**. Khi merge, chỉ giữ phiên bản mới nhất; tombstone xoá các bản cũ (và có thể bỏ khi tới mức cuối).
- **Tra cứu** phải xem nhiều mức, từ mới tới cũ → chậm hơn B<sup>+</sup>-tree; giảm bằng Bloom filter cho mỗi mức/run.
- Biến thể **stepped-merge** (nhiều run mỗi mức, merge cả nhóm) giảm chi phí ghi nhưng tăng chi phí đọc. Dùng trong BigTable, HBase, Cassandra, LevelDB, RocksDB.

### 3. Buffer tree
- Mỗi node trong của B<sup>+</sup>-tree có thêm một **buffer** chứa các thao tác chèn đang chờ. Khi buffer đầy, các bản ghi được đẩy xuống một lượt cho các node con.
- Giảm I/O mỗi lần chèn như LSM, và tra cứu chỉ đi **một** cây (phải kiểm tra buffer dọc đường).
- Nhưng việc đẩy buffer xuống các node rải rác gây **random I/O** — lý do LSM được ưa chuộng hơn trong Big Data (PE 24.1).

### 4. Bitmap index
- Với thuộc tính có **ít giá trị khác nhau** (gender, income_level…), mỗi giá trị v có một **bitmap**: bit thứ i = 1 nếu bản ghi i có giá trị v. Bản ghi được đánh số theo vị trí.
- Điều kiện nhiều thuộc tính → **AND / OR** các bitmap (rất nhanh, dùng phép toán trên word 64 bit). **NOT** phải AND thêm **existence bitmap** (bản ghi đã bị xoá có bit 0).
- **count(*)** = đếm số bit 1; cách nhanh: tra mảng đếm sẵn số bit cho mỗi byte (hoặc mỗi 2 byte) — mảng phải vừa cache (PE 24.2). CPU hiện đại có lệnh popcount.
- Bitmap rất thưa có thể nén (run-length); khi ít bản ghi khớp thì danh sách RID tốt hơn. Kết hợp với B<sup>+</sup>-tree: lá lưu bitmap cho giá trị phổ biến, danh sách cho giá trị hiếm.

### 5. Index không gian (spatial)
- **k-d tree**: chia không gian theo một chiều ở mỗi mức (luân phiên x, y…), mỗi node chia đôi số điểm. **k-d-B tree**: biến thể nhiều nhánh trên đĩa.
- **Quadtree**: mỗi node chia vùng thành 4 phần bằng nhau (2 chiều); *point quadtree* chia tới khi mỗi lá có ≤ c điểm; *region quadtree* cho ảnh/raster.
- **R-tree**: giống B<sup>+</sup>-tree nhưng mỗi entry là một **minimum bounding rectangle (MBR)**; các MBR anh em **có thể chồng nhau**.
  - Tìm kiếm: đi vào *mọi* con có MBR giao vùng hỏi → có thể nhiều đường.
  - Chèn: chọn con cần **mở rộng MBR ít nhất**; tách node bằng thuật toán quadratic split (chọn cặp lãng phí nhiều nhất làm hạt giống).
  - Đối tượng dài, chéo (đoạn thẳng) có MBR lớn chứa nhiều khoảng trống → nhiều **false hit**; chia đối tượng thành mảnh nhỏ (PE 24.3).
  - Nearest neighbor: duyệt theo **priority queue** khoảng cách tới MBR, dừng khi khoảng cách tốt nhất ≤ khoảng cách nhỏ nhất của node chưa xét (PE 24.4).
  - Spatial join hai R-tree: đệ quy trên các cặp node có MBR giao nhau (PE 24.5).
- Truy vấn không gian: **region query** (nằm trong vùng), **nearest neighbor**, **spatial join**. PostgreSQL có kiểu point, box, lseg, toán tử \`<->\` (khoảng cách), \`&&\` (MBR giao nhau), \`<@\` (nằm trong), \`?#\` (giao nhau) và index **GiST** (R-tree tổng quát).

### 6. Hash index động
- **Static hashing** cố định số bucket → bucket tràn khi dữ liệu tăng, lãng phí khi dữ liệu giảm.
- **Extendable hashing**: hàm băm cho chuỗi b bit; chỉ dùng **i bit đầu** (global depth) để tra **bucket address table** có 2<sup>i</sup> ô. Mỗi bucket j có **local depth** i<sub>j</sub> ≤ i; nhiều ô có thể trỏ cùng bucket.
  - Bucket j đầy: nếu i<sub>j</sub> < i → tách bucket, tăng i<sub>j</sub>, phân lại các ô trỏ tới nó; nếu i<sub>j</sub> = i → **nhân đôi bảng** (i + 1) rồi tách.
  - Xoá: bucket rỗng hoặc gộp được với "buddy" (khác bit cuối, cùng local depth, tổng ≤ dung lượng) thì **coalesce** (PE 24.8); bảng có thể thu nhỏ khi mọi bucket có i<sub>j</sub> < i (PE 24.9).
  - Ưu: hiệu năng không giảm khi file lớn, ít lãng phí. Nhược: thêm một mức gián tiếp; nhân đôi bảng tốn kém.
- **Linear hashing**: tăng số bucket **từng cái một** theo con trỏ next (tách bucket next dù tràn ở bucket khác, dùng overflow chain tạm thời) — không cần bảng địa chỉ.

### 7. So sánh nhanh
| Cấu trúc | Mạnh ở | Yếu ở |
|---|---|---|
| B<sup>+</sup>-tree | đọc điểm và khoảng | ghi ngẫu nhiên nhiều |
| LSM tree | ghi (tuần tự) | đọc (nhiều mức) |
| Buffer tree | ghi, đọc một cây | random I/O khi đẩy buffer |
| Bitmap | điều kiện trên nhiều thuộc tính ít giá trị, count | cập nhật thường xuyên |
| R-tree | dữ liệu không gian | MBR chồng nhau, đối tượng chéo |
| Extendable hash | tra cứu bằng | truy vấn khoảng |
`,

  quiz: [
    {
      q: 'Bloom filter trả lời "không có" cho khoá y. Điều đó có nghĩa gì?',
      options: ['y có thể có trong tập', 'y chắc chắn không có trong tập', 'Cần đọc đĩa để chắc chắn', 'Filter bị lỗi'],
      answer: 1,
      explain: 'Bloom filter không có false negative: có một bit 0 thì khoá chắc chắn chưa từng được chèn.',
    },
    {
      q: 'Với m bit, n khoá, số hàm băm tối ưu của Bloom filter xấp xỉ:',
      options: ['k = n/m', 'k = (m/n) · ln 2', 'k = log₂ m', 'k = m − n'],
      answer: 1,
      explain: 'k = (m/n) ln 2 cực tiểu hoá (1 − e^{−kn/m})^k.',
    },
    {
      q: 'Trong LSM tree, thao tác xoá một khoá được thực hiện thế nào?',
      options: ['Tìm và xoá tại chỗ trên mọi mức', 'Chèn một tombstone với timestamp mới', 'Đánh dấu trong Bloom filter', 'Xoá ở L0, các mức dưới giữ nguyên mãi mãi'],
      answer: 1,
      explain: 'Ghi luôn là chèn; tombstone che các phiên bản cũ và được dọn khi merge.',
    },
    {
      q: 'Vì sao LSM tree được dùng nhiều hơn buffer tree trong Big Data (PE 24.1)?',
      options: ['LSM tra cứu nhanh hơn', 'LSM dùng chủ yếu sequential I/O, buffer tree gây nhiều random I/O', 'Buffer tree không hỗ trợ xoá', 'LSM chiếm ít bộ nhớ hơn'],
      answer: 1,
      explain: 'Trên đĩa từ, random I/O đắt hơn nhiều so với sequential I/O.',
    },
    {
      q: 'Để tính điều kiện NOT (income_level = 3) bằng bitmap, ngoài NOT bitmap của giá trị 3 cần thêm gì?',
      options: ['OR với bitmap của mọi giá trị', 'AND với existence bitmap', 'Không cần gì', 'Một B+-tree phụ'],
      answer: 1,
      explain: 'Bản ghi đã xoá cũng có bit 0 trong bitmap giá trị 3, nên NOT sẽ bật bit của chúng; AND với existence bitmap để loại.',
    },
    {
      q: 'Điểm khác biệt chính giữa R-tree và B+-tree là:',
      options: ['R-tree không cân bằng', 'Các MBR anh em trong R-tree có thể chồng nhau, nên tìm kiếm có thể đi nhiều nhánh', 'R-tree chỉ lưu điểm', 'R-tree không có node lá'],
      answer: 1,
      explain: 'R-tree vẫn cân bằng, nhưng vùng của các con có thể giao nhau.',
    },
    {
      q: 'Một đoạn thẳng chéo dài trong R-tree gây ra vấn đề gì (PE 24.3)?',
      options: ['Không chèn được', 'MBR lớn, nhiều false hit khi hỏi vùng', 'Cây mất cân bằng', 'Không tính được khoảng cách'],
      answer: 1,
      explain: 'MBR chứa nhiều khoảng trống, nên nhiều vùng hỏi giao MBR mà không giao đoạn thẳng thật.',
    },
    {
      q: 'Extendable hashing: bucket đầy có local depth i_j bằng global depth i. Hệ thống làm gì?',
      options: ['Thêm overflow bucket', 'Nhân đôi bucket address table rồi tách bucket', 'Chỉ tách bucket', 'Băm lại toàn bộ file bằng hàm mới'],
      answer: 1,
      explain: 'Khi i_j = i không còn ô nào thừa để chia, phải tăng i (nhân đôi bảng).',
    },
    {
      q: 'Linear hashing khác extendable hashing ở chỗ:',
      options: ['Không cần bucket address table, tăng số bucket từng cái một', 'Dùng B+-tree bên trong', 'Không hỗ trợ chèn', 'Chỉ dùng cho bộ nhớ chính'],
      answer: 0,
      explain: 'Linear hashing tách bucket theo thứ tự con trỏ next, chấp nhận overflow chain tạm thời.',
    },
  ],

  questions: [
    {
      pe: '24.1',
      q: '**PE 24.1.** LSM tree và buffer tree đều tốt cho ghi; buffer tree còn đọc tốt hơn. Vì sao Big Data vẫn chuộng LSM tree?',
      answer: `Khác biệt quan trọng nhất là **kiểu I/O**. Buffer tree đẩy các bản ghi từ buffer xuống các node con rải rác trên đĩa → nhiều **random I/O** khi chèn. LSM tree ghi cả một run và merge các run theo thứ tự khoá → gần như toàn **sequential I/O**. Trong Big Data, dữ liệu thường nằm trên đĩa từ, nơi random I/O đắt hơn sequential I/O hàng chục, hàng trăm lần, nên LSM tree thắng. (Ngoài ra LSM tree dễ phân tán: mỗi run là một file bất biến.)`,
    },
    {
      pe: '24.2',
      q: '**PE 24.2.** Đếm số bit 1 của bitmap bằng mảng tra cứu: mảng nhỏ hay lớn thì có lợi/hại gì, khi tính tới kích thước cache?',
      answer: `Mảng được đánh chỉ số bằng một nhóm bit (8 bit → 256 ô, 16 bit → 65 536 ô) và lưu sẵn số bit 1 của nhóm đó.
- **Mảng lớn hơn** (nhóm nhiều bit hơn): ít lần tra và ít phép cộng hơn cho cùng một bitmap.
- Nhưng nếu mảng **vượt quá cache**, mỗi lần tra có thể là cache miss → chậm hơn hẳn, xoá mất lợi ích.
- Vì vậy chọn kích thước sao cho mảng **vừa trong cache** (ví dụ chỉ số 16 bit, 64 KB với ô 1 byte là hợp lý). CPU hiện đại có lệnh popcount thì không cần mảng.`,
    },
    {
      pe: '24.3',
      q: '**PE 24.3.** Lưu đoạn thẳng trong R-tree: (1) bounding box lớn ảnh hưởng thế nào tới truy vấn "đoạn nào giao vùng R"? (2) Kỹ thuật nào cải thiện, cho ví dụ.',
      answer: `1. Đoạn chéo có MBR lớn, chủ yếu là khoảng trống. Truy vấn vùng phải đi vào mọi node có MBR giao vùng hỏi, nên nhiều node/entry bị đọc mà đoạn thật **không** giao vùng (**false hit**). Các MBR lớn cũng chồng nhau nhiều, làm tìm kiếm đi nhiều nhánh và mỗi false hit phải kiểm tra hình học chính xác.
2. **Chia đoạn thành nhiều mảnh nhỏ**, mỗi mảnh có MBR nhỏ, lưu mỗi mảnh như một entry trỏ về cùng đối tượng (loại trùng khi trả kết quả). Ví dụ đoạn (0,0)–(10,10) có MBR là cả hình vuông 10×10 (diện tích 100); chia thành 10 mảnh thì tổng diện tích MBR chỉ còn 10 × 1 = 10. Vùng hỏi (8,0)–(10,2) giao MBR gốc nhưng không giao mảnh nào → không còn false hit.

Bài 24.11 trong phần SQL cho thấy các cặp chỉ giao MBR mà không giao thật.`,
    },
    {
      pe: '24.4',
      q: '**PE 24.4.** Thuật toán tìm nearest neighbor của điểm q trên R-tree.',
      answer: `Best-first search:
1. Đặt gốc vào một **priority queue** theo khoá = khoảng cách nhỏ nhất từ q tới MBR (bằng 0 nếu MBR chứa q).
2. Lấy phần tử gần nhất ra. Nếu là node trong → đưa các con vào queue với khoảng cách tới MBR của chúng. Nếu là đối tượng (lá) → tính khoảng cách thật d, cập nhật kết quả tốt nhất.
3. **Dừng** khi khoảng cách tốt nhất hiện có ≤ khoá nhỏ nhất trong queue: mọi node chưa xét đều xa hơn.

Mở rộng cho k nearest neighbors: giữ k kết quả tốt nhất, dừng khi kết quả thứ k ≤ khoá nhỏ nhất của queue. PostgreSQL làm điều này với GiST index và \`order by loc <-> point(...) limit k\`.`,
    },
    {
      pe: '24.5',
      q: '**PE 24.5.** Thủ tục đệ quy tính spatial join của hai relation đều có R-tree.',
      answer: `\`\`\`
join(n1, n2):                     -- n1 thuộc R-tree của r, n2 thuộc R-tree của s
  for each entry e1 in n1:
    for each entry e2 in n2:
      if MBR(e1) giao MBR(e2):
        if n1, n2 đều là lá:
          if đối tượng e1 thật sự giao e2: output (e1, e2)
        else if n1 là lá: join(n1-as-single-entry, child(e2))
        else if n2 là lá: join(child(e1), n2-as-single-entry)
        else: join(child(e1), child(e2))
gọi join(root_r, root_s)
\`\`\`
Cặp node có MBR không giao nhau bị **cắt bỏ cả cây con**, nên chỉ một phần nhỏ các cặp được xét. Nếu hai cây khác chiều cao, tiếp tục đi xuống cây cao hơn khi cây kia đã tới lá.`,
    },
    {
      pe: '24.6',
      q: '**PE 24.6.** Vẽ cấu trúc extendable hashing cho các khoá 2, 3, 5, 7, 11, 17, 19, 23, 29, 31 với h(x) = x mod 8, bucket chứa 3 bản ghi.',
      answer: `h(x) dạng 3 bit: 2→010, 3→011, 5→101, 7→111, 11→011, 17→001, 19→011, 23→111, 29→101, 31→111.

Dùng i bit đầu: với i = 1, nhóm 0 có {17, 2, 3, 11, 19} = 5 > 3; i = 2, nhóm 01 có {2, 3, 11, 19} = 4 > 3 → cần **global depth i = 3** (bài 24.13).

| Ô | Bucket (local depth) | Khoá |
|---|---|---|
| 000, 001 | B1 (2) | 17 |
| 010 | B2 (3) | 2 |
| 011 | B3 (3) | 3, 11, 19 |
| 100, 101 | B4 (2) | 5, 29 |
| 110, 111 | B5 (2) | 7, 23, 31 |

(Lời giải sách vẽ tương tự: bucket 01x tách thành 010 và 011 với local depth 3, các bucket còn lại local depth 2.)`,
    },
    {
      pe: '24.7',
      q: '**PE 24.7.** Từ cấu trúc của PE 24.6, cấu trúc thay đổi thế nào sau: (a) xoá 11; (b) xoá 31; (c) chèn 1; (d) chèn 15?',
      answer: `Áp dụng lần lượt a → d lên cấu trúc của 24.6:
- **a. Xoá 11**: bucket 011 còn {3, 19}. Lúc này bucket 010 {2} và 011 {3, 19} là buddy (cùng local depth 3, chỉ khác bit cuối, tổng 3 bản ghi ≤ 3) nên **có thể coalesce** thành bucket 01x với local depth 2; khi đó mọi bucket có local depth ≤ 2 và bảng có thể thu về 4 ô. Lời giải sách chọn không gộp.
- **b. Xoá 31**: bucket 11x còn {7, 23}.
- **c. Chèn 1**: h(1) = 001 → bucket 00x, thành {17, 1}.
- **d. Chèn 15**: h(15) = 111 → bucket 11x, thành {7, 15, 23} — vừa đủ 3, không phải tách.

Lưu ý: nếu chèn 15 khi 31 chưa bị xoá, bucket 11x sẽ có 4 khoá cùng h = 111; tách hay nhân đôi bảng cũng không tách được chúng (h chỉ có 3 bit) → phải dùng **overflow bucket**.`,
    },
    {
      pe: '24.8',
      q: '**PE 24.8.** Viết pseudocode xoá trong extendable hashing, kèm khi nào và cách coalesce bucket (không cần thu nhỏ bảng).',
      answer: `\`\`\`
delete(K):
  j := bucket được trỏ bởi i bit đầu của h(K)
  xoá K khỏi bucket j
  coalesce(j)

coalesce(j):
  ij := local depth của j
  if ij = 0: return
  k  := buddy của j — bucket có (ij − 1) bit đầu giống j, bit thứ ij ngược lại
  if local depth của k ≠ ij: return          -- buddy đã bị tách sâu hơn, không gộp được
  if |j| + |k| > bsize: return               -- gộp sẽ tràn
  chuyển mọi bản ghi của k sang j
  ij := ij − 1
  cho mọi ô của bucket address table đang trỏ tới k trỏ sang j
  giải phóng k
  coalesce(j)                                -- có thể gộp tiếp ở mức trên
\`\`\`
Mỗi lần chỉ gộp hai bucket; tiền tố chung của bucket kết quả ngắn hơn 1 bit.`,
    },
    {
      pe: '24.9',
      q: '**PE 24.9.** Dùng một bộ đếm đi kèm bucket address table để kiểm tra nhanh khi nào bảng có thể thu nhỏ. Cập nhật bộ đếm thế nào khi tách, gộp, xoá bucket?',
      answer: `Bảng dùng i bit. Giữ **count = số bucket có local depth đúng bằng i**. Bảng thu nhỏ được (còn i − 1 bit) ⇔ count = 0.
- **Tách** bucket j: nếu i<sub>j</sub> = i thì bảng phải nhân đôi (i tăng) và hai bucket mới có local depth = i mới → **count := 2** (chỉ chúng). Nếu i<sub>j</sub> = i − 1 → hai bucket mới có depth i → **count += 2**. (Sách đếm theo bucket bị tách: đặt 1 hoặc tăng 1 — tương đương nếu đếm theo cặp.)
- **Gộp** hai buddy có depth i → **count −= 2** (bucket kết quả có depth i − 1).
- **Xoá** một bucket (gộp vào buddy) có depth i → giảm tương ứng.
- Khi count = 0 thì có thể thu nhỏ. Vì thu nhỏ đắt và có thể phải nhân đôi lại ngay, nên trì hoãn: giữ **mảng đếm** count[d] = số bucket có local depth d; thu nhỏ nhiều mức một lúc khi các count[i], count[i−1], … đều bằng 0 và số entry đã nhỏ so với kích thước bảng.`,
    },
  ],

  exercises: [
    // ---------------- Bloom filter ----------------
    {
      id: 'CH24.01', topic: 'Bloom filter: false positive', level: 1,
      prompt: 'Bloom filter có m = 10000 bit, đã chèn n = 1000 khoá. Trả về một dòng hai cột: `fp_rate` — xác suất false positive (1 − e<sup>−kn/m</sup>)<sup>k</sup> với k = 7, làm tròn 5 chữ số; và `k_opt` — số hàm băm tối ưu (m/n)·ln 2 làm tròn tới số nguyên.',
      hint: 'exp(), ln(), power(); round(x::numeric, 5).',
      solution: `select round(power(1 - exp(-7 * 1000.0 / 10000), 7)::numeric, 5) as fp_rate,
       round(10000.0 / 1000 * ln(2)) as k_opt;`,
    },
    {
      id: 'CH24.02', topic: 'Bloom filter: bật bit', level: 2,
      prompt: 'Bloom filter m = 40 bit, k = 3 hàm băm: h<sub>i</sub>(x) = `abs(hashtext(x || \'#\' || i)) % 40` với i = 1, 2, 3. Chèn mọi từ trong `ai_word`. Trả về các vị trí bit được bật (cột `pos`, không trùng).',
      hint: 'ai_word cross join generate_series(1, 3).',
      solution: `select distinct abs(hashtext(word || '#' || i)) % 40 as pos
from ai_word cross join generate_series(1, 3) as i;`,
    },
    {
      id: 'CH24.03', topic: 'Bloom filter: tra cứu', level: 2,
      prompt: 'Dùng filter của CH24.02. Với mỗi từ trong `ai_probe`, trả về `word`, `maybe_present` (true nếu cả 3 bit của từ đều đã bật) và `actually_present` (từ có trong ai_word). Những dòng maybe_present = true mà actually_present = false là false positive (trên dữ liệu mẫu có hai dòng như vậy).',
      solution: `with bits as (
  select distinct abs(hashtext(word || '#' || i)) % 40 as pos
  from ai_word cross join generate_series(1, 3) as i)
select p.word,
       not exists (select 1 from generate_series(1, 3) as i
                   where abs(hashtext(p.word || '#' || i)) % 40 not in (select pos from bits)) as maybe_present,
       p.word in (select word from ai_word) as actually_present
from ai_probe p;`,
    },
    // ---------------- LSM tree ----------------
    {
      id: 'CH24.04', topic: 'LSM tree: tra cứu', level: 2,
      prompt: 'LSM tree hai mức `ai_lsm_l0` (mới) và `ai_lsm_l1` (cũ); mỗi phiên bản có timestamp `ts`, tombstone có `is_delete = true`. Trả về giá trị hiện tại của mọi khoá còn sống: `k`, `val` (phiên bản có ts lớn nhất trên cả hai mức; khoá mà phiên bản mới nhất là tombstone thì không xuất hiện).',
      hint: 'union all hai mức, rồi distinct on (k) order by k, ts desc — hoặc row_number().',
      solution: `select k, val
from (select distinct on (k) k, val, is_delete
      from (select * from ai_lsm_l0 union all select * from ai_lsm_l1) as v
      order by k, ts desc) as latest
where not is_delete;`,
    },
    {
      id: 'CH24.05', topic: 'LSM tree: compaction', level: 3,
      prompt: 'Mô phỏng merge L0 vào L1: tạo bảng `ai_lsm_merged(k, val, ts)` chứa đúng **một** phiên bản mới nhất của mỗi khoá còn sống (bỏ tombstone và mọi phiên bản cũ). Hệ thống đọc bảng theo k.',
      solution: `create table ai_lsm_merged as
select k, val, ts
from (select distinct on (k) k, val, ts, is_delete
      from (select * from ai_lsm_l0 union all select * from ai_lsm_l1) as v
      order by k, ts desc) as latest
where not is_delete;`,
      check: 'select k, val, ts from ai_lsm_merged order by k;',
      ordered: true,
    },
    // ---------------- Bitmap ----------------
    {
      id: 'CH24.06', topic: 'bitmap index', level: 2,
      prompt: 'Xây bitmap index trên `ai_customer.gender`: với mỗi giá trị gender, trả về `gender` và `bitmap` — chuỗi bit (kiểu `varbit`) dài 12, bit thứ i (từ trái) là 1 nếu khách có cust_id = i có gender đó. (Chưa xét cột deleted.)',
      hint: "string_agg(case ... then '1' else '0' end, '' order by cust_id)::varbit",
      solution: `select g.gender,
       string_agg(case when c.gender = g.gender then '1' else '0' end, '' order by c.cust_id)::varbit as bitmap
from (select distinct gender from ai_customer) as g cross join ai_customer c
group by g.gender;`,
    },
    {
      id: 'CH24.07', topic: 'bitmap AND + count', level: 2,
      prompt: 'Trả lời "khách nữ có income_level = 2" bằng bitmap: tính bitmap của gender = \'F\', bitmap của income_level = 2 và **AND** chúng. Trả về một dòng: `result_bitmap` (varbit) và `num_rows` (số bit 1 của kết quả).',
      hint: 'bit_count(varbit) đếm số bit 1.',
      solution: `with b as (
  select string_agg(case when gender = 'F' then '1' else '0' end, '' order by cust_id)::varbit as f,
         string_agg(case when income_level = 2 then '1' else '0' end, '' order by cust_id)::varbit as l2
  from ai_customer)
select f & l2 as result_bitmap, bit_count(f & l2) as num_rows
from b;`,
    },
    {
      id: 'CH24.08', topic: 'bitmap NOT + existence', level: 3,
      prompt: 'Bản ghi có `deleted = true` coi như đã bị xoá. Tính "income_level **khác** 3" bằng bitmap: NOT bitmap(income_level = 3) **AND** existence bitmap (bit 1 nếu bản ghi chưa bị xoá). Trả về `naive_not` (chỉ NOT, chưa AND), `with_existence` và `num_rows` (số bit 1 của with_existence).',
      solution: `with b as (
  select string_agg(case when income_level = 3 then '1' else '0' end, '' order by cust_id)::varbit as l3,
         string_agg(case when deleted then '0' else '1' end, '' order by cust_id)::varbit as ex
  from ai_customer)
select ~l3 as naive_not, ~l3 & ex as with_existence, bit_count(~l3 & ex) as num_rows
from b;`,
    },
    // ---------------- Spatial ----------------
    {
      id: 'CH24.09', topic: 'nearest neighbor', level: 1, pe: '24.4',
      prompt: 'Ba địa điểm trong `ai_place` gần điểm (5, 5) nhất: `name`, `dist` (khoảng cách Euclid, làm tròn 3 chữ số), sắp theo khoảng cách tăng dần.',
      hint: 'Toán tử <-> giữa hai point; order by ... limit 3.',
      solution: `select name, round((loc <-> point(5, 5))::numeric, 3) as dist
from ai_place
order by loc <-> point(5, 5)
limit 3;`,
      ordered: true,
    },
    {
      id: 'CH24.10', topic: 'region query', level: 1,
      prompt: 'Region query: với mỗi vùng trong `ai_region`, liệt kê các địa điểm nằm trong vùng đó (kể cả trên biên): `region`, `place`.',
      hint: 'point <@ box.',
      solution: `select r.name as region, p.name as place
from ai_region r join ai_place p on p.loc <@ r.area;`,
    },
    {
      id: 'CH24.11', topic: 'MBR filter vs giao thật', level: 3, pe: '24.3',
      prompt: 'Spatial join theo hai bước như R-tree: bước lọc dùng **MBR** của đoạn thẳng (`box(seg[0], seg[1])`) giao vùng (`&&`), bước tinh kiểm tra đoạn **thật sự** giao vùng (`seg ?# area`). Với mọi cặp (vùng, đoạn) qua được bước lọc, trả về `region`, `seg_id`, `really_intersects`. Các dòng false là false hit do MBR lớn.',
      solution: `select r.name as region, s.seg_id, s.seg ?# r.area as really_intersects
from ai_region r join ai_segment s on box(s.seg[0], s.seg[1]) && r.area;`,
    },
    // ---------------- Extendable hashing ----------------
    {
      id: 'CH24.12', topic: 'extendable hashing: bit', level: 1, pe: '24.6',
      prompt: 'Với mỗi khoá trong `ai_hash_key` và h(x) = x mod 8, trả về `k`, `h` và `h_bits` — h viết dạng chuỗi nhị phân 3 bit (ví dụ 5 → \'101\').',
      hint: '(x % 8)::bit(3)::text.',
      solution: `select k, k % 8 as h, ((k % 8)::bit(3))::text as h_bits
from ai_hash_key;`,
    },
    {
      id: 'CH24.13', topic: 'extendable hashing: global depth', level: 3, pe: '24.6',
      prompt: 'Bucket chứa tối đa 3 bản ghi; extendable hashing dùng **i bit đầu** của h_bits (CH24.12). Với i = 1, 2, 3, trả về `i` và `max_bucket` — số khoá lớn nhất rơi vào cùng một tiền tố i bit. Từ đó thấy global depth nhỏ nhất là bao nhiêu.',
      solution: `select i, max(cnt) as max_bucket
from (select i, left(((k % 8)::bit(3))::text, i) as prefix, count(*) as cnt
      from ai_hash_key cross join generate_series(1, 3) as i
      group by i, prefix) as t
group by i;`,
    },
  ],
};
