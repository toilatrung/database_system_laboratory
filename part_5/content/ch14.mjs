// Câu kiểm tra chung: mọi index (trừ primary key) của một bảng, không phụ thuộc tên index.
const indexesOf = table => `select array_to_string(array(
         select coalesce(a.attname, 'expr') from unnest(i.indkey::int2[]) with ordinality as k(attnum, n)
         left join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
         order by k.n), ', ') as columns,
       am.amname as method,
       i.indisunique as is_unique,
       pg_get_expr(i.indexprs, i.indrelid) as expression,
       pg_get_expr(i.indpred, i.indrelid) as predicate
from pg_index i
join pg_class c on c.oid = i.indexrelid
join pg_am am on am.oid = c.relam
where i.indrelid = '${table}'::regclass and not i.indisprimary
order by 1;`;

export default {
  number: 14,
  slug: 'ch14_indexing',
  title: 'Indexing',
  titleVi: 'Index',

  summary: `
### 1. Khái niệm cơ bản (slide 14.3–14.5)
- **Search key**: thuộc tính (hoặc tập thuộc tính) dùng để tìm record. Index file gồm các **index entry** (search-key, pointer).
- Hai loại chính: **ordered index** (khoá được sắp) và **hash index** (khoá phân phối vào bucket bằng hàm băm).
- Tiêu chí đánh giá: kiểu truy cập hỗ trợ (tìm theo giá trị / theo **khoảng**), thời gian truy cập, thời gian insert, thời gian delete, chi phí chỗ.

### 2. Ordered index (slide 14.6–14.17)
| Loại | Định nghĩa |
|---|---|
| **Clustering index** (primary index) | thứ tự search key của index **trùng** thứ tự lưu record trong file (file tuần tự); search key thường (không bắt buộc) là primary key |
| **Secondary index** (nonclustering) | thứ tự khác thứ tự file; **phải dense**; mỗi entry trỏ tới một **bucket** chứa con trỏ tới mọi record có giá trị đó |
| **Dense index** | mỗi giá trị search key trong file có một entry |
| **Sparse index** | chỉ một số giá trị có entry (thường là record **đầu mỗi block**); chỉ dùng được khi file được sắp theo search key. Tìm k: lấy entry có khoá **lớn nhất ≤ k**, rồi quét tuần tự từ đó |

- Một relation chỉ có **một clustering index** (record chỉ sắp theo một thứ tự được — PE 14.2), nhưng nhiều secondary index.
- Quét tuần tự theo secondary index rất tốn: mỗi record có thể nằm ở một block khác → một I/O cho mỗi record.
- **Multilevel index**: index quá lớn thì coi nó như file tuần tự và lập **sparse index** trên nó (outer index trên inner index), lặp lại tới khi vừa bộ nhớ.
- Cập nhật index: insert/delete phải sửa mọi index của relation → **không nên tạo index trên mọi thuộc tính** (PE 14.1).
- **Composite search key** (a₁, a₂): sắp theo **thứ tự từ điển** — index (dept_name, salary) dùng được cho điều kiện trên dept_name, hoặc dept_name = … and salary < …, nhưng **không** hiệu quả cho chỉ điều kiện trên salary.

### 3. B+-tree (slide 14.18–14.45)
Cây cân bằng, mọi đường từ gốc tới lá dài bằng nhau. Với **n** = số con trỏ tối đa trong một nút:
| Nút | Số con trỏ / khoá |
|---|---|
| Nút trong (không phải gốc) | từ ⌈n/2⌉ tới n **con trỏ** con |
| Lá | từ ⌈(n−1)/2⌉ tới n − 1 **khoá** (mỗi khoá kèm con trỏ tới record), con trỏ thứ n nối sang lá kế tiếp |
| Gốc | nếu không là lá: ít nhất 2 con; nếu là lá: 0 tới n − 1 khoá |

- Nút trong: P₁, K₁, P₂, …, K<sub>n−1</sub>, P<sub>n</sub>; cây con P<sub>i</sub> chứa khoá ≥ K<sub>i−1</sub> và < K<sub>i</sub>.
- **Chiều cao**: với K khoá, đường từ gốc tới lá dài không quá **⌈log<sub>⌈n/2⌉</sub>(K)⌉**. Ví dụ: nút 4 KB, n ≈ 100, 1 triệu khoá → tối đa log₅₀(10⁶) ≈ 4 nút được truy cập; cây nhị phân cân bằng cần khoảng 20.
- **Fan-out**: với block B byte, khoá k byte, con trỏ p byte: n·p + (n − 1)·k ≤ B → n = ⌊(B + k)/(k + p)⌋.
- **Tìm kiếm** (find): từ gốc, ở mỗi nút chọn con trỏ theo khoá, tới lá. **Range query** (findRange / iterator): tới lá đầu tiên rồi đi theo con trỏ nối các lá (PE 14.6).
- **Insert**: chèn vào lá; nếu lá đầy (n khoá) → **split**: ⌈n/2⌉ khoá đầu ở lại, phần còn lại sang lá mới; chèn (khoá nhỏ nhất của lá mới, con trỏ) vào nút cha; cha đầy thì split tiếp, có thể lan tới gốc (cây cao thêm một mức).
- **Delete**: xoá khỏi lá; nếu lá quá vơi → **merge** với anh em (nếu vừa một nút) hoặc **redistribute** (mượn khoá); xoá entry ở cha, có thể lan lên; gốc chỉ còn một con thì bỏ gốc.
- **Chèn theo thứ tự sắp xếp**: mỗi lá bị tách chỉ còn **khoảng 50%** và không được chèn thêm (PE 14.7) → dùng **bulk loading**: sắp các entry rồi xây cây **từ dưới lên** (bottom-up), lấp đầy từng lá (PE 14.8).
- **Search key không unique**: thêm thuộc tính duy nhất (ví dụ primary key) vào search key để thành unique (record ID).
- **B+-tree file organization**: lá chứa chính record. **Secondary index trỏ tới search key của clustering index** thay vì địa chỉ record để không phải sửa khi record bị dời (split lá).
- **Khoá chuỗi độ dài thay đổi**: **prefix compression** — nút trong chỉ lưu tiền tố đủ phân biệt.
- **B-tree** (không có dấu +): khoá chỉ xuất hiện một lần, nút trong cũng chứa con trỏ record — ít lợi hơn trong thực tế.

### 4. Hash index (slide 14.46–14.57)
- **Bucket**: đơn vị lưu (một hoặc vài block). Hàm băm h: khoá → bucket. Hàm băm tốt: **uniform** và **random**.
- **Bucket overflow** do skew hoặc quá ít bucket → **overflow chaining** (closed addressing).
- **Static hashing**: số bucket cố định → khi dữ liệu tăng sẽ nhiều overflow; **dynamic hashing** (linear hashing, extendable hashing) tăng số bucket dần.
- Hash index chỉ tốt cho **so sánh bằng**, không hỗ trợ **range query**. PostgreSQL có \`using hash\`.

### 5. Index nhiều khoá (slide 14.58–14.64)
- Điều kiện dept_name = 'Finance' and salary = 80000: dùng index dept_name rồi lọc; dùng index salary rồi lọc; hoặc **giao hai tập con trỏ** từ hai index.
- **Composite index** (dept_name, salary) hiệu quả cho dept_name = … and salary < … nhưng không cho dept_name < … and salary < ….
- **Covering index**: lưu thêm thuộc tính (không thuộc search key) trong index để trả lời truy vấn **không cần đọc relation** (PostgreSQL: \`include (...)\`).

### 6. Tạo index trong SQL (slide 14.65)
\`\`\`sql
create index dept_index on instructor (dept_name);
create unique index ... ;          -- đồng thời ép ràng buộc unique
create index ... on instructor (dept_name, salary);        -- composite
create index ... on instructor (salary) where salary > 80000; -- partial (PostgreSQL)
create index ... on student (lower(name));                 -- expression index
create index ... on takes (course_id) include (grade);     -- covering
create index ... using hash (name);
drop index dept_index;
\`\`\`
Hầu hết hệ thống tự tạo index cho **primary key** (và unique). Foreign key thường **nên** có index (PE 14.10). PostgreSQL: \`cluster table using index\` sắp lại file theo index — chỉ một index được đánh dấu clustered.

### 7. Write-optimized index (slide 14.66–14.74)
B+-tree insert ngẫu nhiên tốn ≈ một I/O cho mỗi insert khi index không vừa bộ nhớ.
- **LSM tree** (log-structured merge): cây L₀ trong bộ nhớ; đầy thì gộp (merge) với L₁ trên đĩa bằng ghi tuần tự, L₁ đầy gộp vào L₂… (mỗi mức lớn hơn k lần). Tìm kiếm phải xem mọi mức. Biến thể **stepped-merge**: mỗi mức có nhiều cây, gộp khi đủ k cây → insert rẻ hơn, tìm đắt hơn (dùng **Bloom filter** để bỏ qua cây không chứa khoá). Dùng trong BigTable, Cassandra, RocksDB… Khi đọc nhiều mà không ghi, có thể gộp sớm để giảm số mức phải tìm (PE 14.11).
- **Buffer tree**: mỗi nút trong có buffer chứa các insert chưa đẩy xuống; buffer đầy thì đẩy xuống con. Dùng được với mọi cây (cả spatial index), nhưng nhiều I/O ngẫu nhiên hơn LSM (PE 14.12).

### 8. Bitmap index (slide 14.75–14.80)
Cho thuộc tính có **ít giá trị khác nhau** (gender, rating, khoảng lương). Mỗi giá trị v có một **bitmap**: bit i = 1 nếu record i có giá trị v (record được đánh số liên tiếp).
- Điều kiện kết hợp → **AND / OR / NOT** trên bitmap, cực nhanh (một lệnh CPU xử lý 32–64 bit). Đếm số record = đếm số bit 1.
- Phải xử lý record đã xoá bằng **existence bitmap** khi lấy NOT.
- Rất gọn: 1 bit mỗi record mỗi giá trị. PE 14.13 lập bitmap cho salary theo 4 khoảng và AND với bitmap Finance (bài CH14.09–11).

### 9. Index cho dữ liệu không gian và thời gian (slide 14.81–14.95)
- **k-d tree**: chia không gian luân phiên theo từng chiều. **Quadtree**: mỗi nút chia vùng thành 4 phần bằng nhau.
- **R-tree**: mỗi nút ứng với **hình chữ nhật bao (bounding box)** của các con; các hình chữ nhật có thể chồng nhau → tìm kiếm có thể đi nhiều nhánh. Hỗ trợ truy vấn vùng, nearest neighbor.
- Truy vấn tìm **đúng một điểm** thì B+-tree trên (x, y) đủ tốt và rẻ hơn (PE 14.14). Nearest neighbor bằng các truy vấn vùng tròn bán kính tăng dần (PE 14.15).
- **Temporal data**: khoảng thời gian [start, end) → index khoảng (R-tree một chiều, hoặc index trên (start, end)).

### Mẹo làm bài
- Vẽ B+-tree: ghi rõ n, quy tắc split (bên nào nhận ⌈n/2⌉), luôn kiểm tra số khoá tối thiểu của lá ⌈(n−1)/2⌉ và con trỏ tối thiểu của nút trong ⌈n/2⌉.
- Khi được hỏi "tạo index nào": index cho thuộc tính trong **điều kiện chọn**, **điều kiện join**, primary key/foreign key; bitmap cho thuộc tính ít giá trị; cân nhắc chi phí cập nhật.
`,

  quiz: [
    {
      q: 'Một relation có thể có bao nhiêu **clustering index** (theo các search key khác nhau)?',
      options: ['Không giới hạn', 'Một', 'Hai', 'Bằng số thuộc tính'],
      answer: 1,
      explain: 'Record chỉ được lưu theo một thứ tự (PE 14.2). Muốn hai thứ tự phải lưu relation hai lần.',
    },
    {
      q: 'Sparse index dùng được khi nào?',
      options: ['Luôn luôn', 'Khi file được sắp theo search key của index', 'Chỉ với hash index', 'Chỉ khi search key là unique'],
      answer: 1,
      explain: 'Tìm entry có khoá lớn nhất ≤ k rồi quét tuần tự — chỉ đúng khi file được sắp theo khoá đó.',
    },
    {
      q: 'B+-tree với n = 4 con trỏ mỗi nút. Một lá (không phải gốc) chứa tối thiểu bao nhiêu khoá?',
      options: ['1', '2', '3', '4'],
      answer: 1,
      explain: 'Lá chứa từ ⌈(n−1)/2⌉ = ⌈1.5⌉ = 2 tới n − 1 = 3 khoá.',
    },
    {
      q: 'Nút trong (không phải gốc) của B+-tree với n = 6 có tối thiểu bao nhiêu con trỏ con?',
      options: ['2', '3', '4', '6'],
      answer: 1,
      explain: '⌈n/2⌉ = 3.',
    },
    {
      q: 'Chèn khoá theo thứ tự tăng dần vào B+-tree (split thông thường) thì các lá đầy khoảng bao nhiêu?',
      options: ['100%', 'khoảng 50%', 'khoảng 67%', '25%'],
      answer: 1,
      explain: 'PE 14.7: nửa trái sau mỗi lần split không bao giờ được chèn thêm. Vì vậy nên bulk-load bottom-up.',
    },
    {
      q: 'Hash index **không** hỗ trợ tốt loại truy vấn nào?',
      options: ['name = \'Wu\'', 'salary between 60000 and 80000', 'ID = \'12121\'', 'Tìm một khoá cụ thể'],
      answer: 1,
      explain: 'Hàm băm phá vỡ thứ tự khoá, nên không dùng được cho range query.',
    },
    {
      q: 'Composite index trên (dept_name, salary) **không** hiệu quả cho điều kiện nào?',
      options: ['dept_name = \'Finance\'', 'dept_name = \'Finance\' and salary > 80000', 'salary > 80000 (không có điều kiện trên dept_name)', 'dept_name = \'Finance\' and salary = 90000'],
      answer: 2,
      explain: 'Khoá được sắp theo dept_name trước; các salary > 80000 nằm rải rác khắp index.',
    },
    {
      q: 'Bitmap index phù hợp nhất với thuộc tính nào?',
      options: ['ID (unique)', 'email', 'gender hoặc khoảng lương (ít giá trị khác nhau)', 'địa chỉ'],
      answer: 2,
      explain: 'Mỗi giá trị một bitmap; ít giá trị → ít bitmap, AND/OR rất nhanh.',
    },
    {
      q: 'LSM tree tối ưu cho thao tác nào và đánh đổi gì?',
      options: ['Tối ưu đọc, ghi chậm hơn', 'Tối ưu insert (ghi tuần tự theo mức), nhưng tìm kiếm phải xem nhiều mức', 'Tối ưu range query, tốn chỗ', 'Không đánh đổi gì'],
      answer: 1,
      explain: 'Dùng Bloom filter để giảm chi phí tìm trên các mức.',
    },
    {
      q: 'Covering index là gì?',
      options: ['Index trên mọi cột', 'Index lưu thêm thuộc tính để trả lời truy vấn mà không cần đọc relation', 'Index trên khoá ngoại', 'Index dạng bitmap'],
      answer: 1,
      explain: 'PostgreSQL: create index ... (course_id) include (grade).',
    },
    {
      q: 'Truy vấn duy nhất là "có nhà hàng nào ở đúng điểm (x, y) không?". Index nào phù hợp hơn?',
      options: ['R-tree', 'B+-tree trên (x, y)', 'Bitmap index', 'Không cần index'],
      answer: 1,
      explain: 'PE 14.14: truy vấn so sánh bằng trên một điểm; B+-tree đơn giản và rẻ hơn. R-tree cần cho truy vấn vùng/nearest neighbor.',
    },
  ],

  questions: [
    {
      pe: '14.1',
      q: '**PE 14.1** — Vì sao không nên tạo index trên mọi thuộc tính và mọi tổ hợp thuộc tính có thể là search key?',
      answer: `- Mỗi index tốn thêm **CPU và I/O khi insert, delete** (phải sửa mọi index).
- Index trên thuộc tính không phải khoá chính còn phải sửa khi **update** (update thường không đổi primary key, nên index primary key thường không bị ảnh hưởng).
- Mỗi index tốn thêm **chỗ lưu trữ**.
- Với truy vấn có điều kiện trên nhiều khoá, chỉ cần index trên một vài khoá là đã đủ hiệu quả — thêm index khi đã có nhiều index thì lợi ích giảm dần.`,
    },
    {
      pe: '14.2',
      q: '**PE 14.2** — Một relation có thể có hai clustering index trên hai search key khác nhau không?',
      answer: `Nói chung **không**: clustering index đòi hỏi record được lưu **theo thứ tự** của search key; record chỉ có thể sắp theo một thứ tự. Muốn hai clustering index phải **lưu relation hai lần** (nhân đôi dữ liệu) — không hiệu quả trong hệ thống tập trung. PostgreSQL thể hiện điều này: \`cluster ... using\` chỉ đánh dấu được một index là clustered (bài CH14.08).`,
    },
    {
      pe: '14.3',
      q: '**PE 14.3** — Xây B+-tree cho (2, 3, 5, 7, 11, 17, 19, 23, 29, 31), chèn theo thứ tự tăng, với n = 4, 6, 8 con trỏ mỗi nút.',
      answer: `Quy ước: lá chứa tối đa n − 1 khoá; khi split, nút không phải gốc không bao giờ có ít hơn ⌈n/2⌉ con trỏ.

**a. n = 4** (lá tối đa 3 khoá, tối thiểu 2):
\`\`\`
                [19]
        [5 | 11]        [29]
[2 3] [5 7] [11 17]  [19 23] [29 31]
\`\`\`

**b. n = 6** (lá tối đa 5 khoá, tối thiểu 3):
\`\`\`
              [7 | 19]
[2 3 5]  [7 11 17]  [19 23 29 31]
\`\`\`

**c. n = 8** (lá tối đa 7 khoá, tối thiểu 4):
\`\`\`
                 [11]
[2 3 5 7]   [11 17 19 23 29 31]
\`\`\`
Bài CH14.15 tính các giới hạn số khoá/con trỏ của từng trường hợp.`,
    },
    {
      pe: '14.4',
      q: '**PE 14.4** — Với mỗi cây của PE 14.3, vẽ cây sau mỗi bước: insert 9, insert 10, insert 8, delete 23, delete 19.',
      answer: `**Cây n = 4:**
- Insert 9: lá [5 7] → [5 7 9]. Cây: gốc [19]; nút trong [5 | 11], [29]; lá [2 3] [5 7 9] [11 17] [19 23] [29 31].
- Insert 10: lá [5 7 9] đầy → split [5 7] [9 10]; cha thành [5 | 9 | 11]. Lá: [2 3] [5 7] [9 10] [11 17] [19 23] [29 31].
- Insert 8: [5 7] → [5 7 8].
- Delete 23: lá [19] quá vơi, gộp với [29 31] → [19 29 31]; nút trong [29] mất con → mượn/gộp với [5 | 9 | 11]: cây thành gốc [11]; nút trong [5 | 9] và [19]; lá [2 3] [5 7 8] [9 10] [11 17] [19 29 31].
- Delete 19: lá [29 31], khoá ở cha đổi thành 29: gốc [11]; nút trong [5 | 9], [29]; lá [2 3] [5 7 8] [9 10] [11 17] [29 31].

**Cây n = 6:**
- Insert 9: [7 11 17] → [7 9 11 17]. Gốc [7 | 19].
- Insert 10: [7 9 10 11 17] (vẫn ≤ 5 khoá).
- Insert 8: lá đầy (6 khoá) → split [7 8 9] [10 11 17]; gốc [7 | 10 | 19]; lá [2 3 5] [7 8 9] [10 11 17] [19 23 29 31].
- Delete 23: [19 29 31] (vẫn ≥ 3 khoá).
- Delete 19: lá [29 31] quá vơi → gộp với [10 11 17] → [10 11 17 29 31]; gốc [7 | 10]; lá [2 3 5] [7 8 9] [10 11 17 29 31].

**Cây n = 8:**
- Insert 9: [2 3 5 7 9] | gốc [11] | [11 17 19 23 29 31].
- Insert 10: [2 3 5 7 9 10].
- Insert 8: [2 3 5 7 8 9 10] (7 khoá, vẫn vừa).
- Delete 23: [11 17 19 29 31].
- Delete 19: [11 17 29 31] (4 khoá = tối thiểu, vẫn hợp lệ). Gốc vẫn [11].`,
    },
    {
      pe: '14.5',
      q: '**PE 14.5** — Với cơ chế redistribution cải tiến (m − 1 anh em chia cho m nút), chiều cao kỳ vọng của B+-tree theo n là bao nhiêu?',
      answer: `Mỗi nút được bảo đảm đầy ít nhất khoảng (m − 1)/m thay vì 1/2, tức có ít nhất ⌊(m − 1)n/m⌋ con trỏ. Với K giá trị search key, chiều cao kỳ vọng là
\`\`\`
log_⌊(m−1)n/m⌋ (K)
\`\`\`
(so với log<sub>⌈n/2⌉</sub>(K) của B+-tree thường). Ví dụ m = 3 (2 nút chia cho 3) → mỗi nút đầy ít nhất 2/3.`,
    },
    {
      pe: '14.6',
      q: '**PE 14.6** — Viết pseudocode findRangeIterator() trả về iterator, và lớp iterator (biến, phương thức next()).',
      answer: `\`\`\`
function findRangeIterator(lb, ub)
    /* trả về iterator duyệt các record có lb ≤ khoá ≤ ub */
    C = root
    while C không phải lá
        i = số nhỏ nhất sao cho lb ≤ C.K_i
        if không có i như vậy then C = con trỏ khác null cuối cùng của C
        else if lb = C.K_i then C = C.P_(i+1)
        else C = C.P_i
    /* C là lá có thể chứa lb */
    i = số nhỏ nhất sao cho C.K_i ≥ lb   (nếu không có: i = số khoá của C + 1)
    return new RangeIterator(C, i, ub)

class RangeIterator
    leaf      /* lá hiện tại */
    pos       /* vị trí khoá kế tiếp trong lá */
    ub        /* cận trên */
    done = false

    method next()   /* trả về record kế tiếp, hoặc null khi hết */
        if done then return null
        if pos > số khoá của leaf then
            leaf = leaf.P_n          /* lá kế tiếp */
            pos = 1
            if leaf = null then done = true; return null
        if leaf.K_pos > ub then done = true; return null
        r = record được trỏ bởi leaf.P_pos
        pos = pos + 1
        return r
\`\`\`
Iterator chỉ giữ trạng thái (lá, vị trí, cận trên), không cần dựng sẵn toàn bộ kết quả.`,
    },
    {
      pe: '14.7',
      q: '**PE 14.7** — Nếu index entry được chèn theo thứ tự sắp xếp, mỗi lá của B+-tree đầy bao nhiêu? Vì sao?',
      answer: `Chèn **tăng dần**: entry mới luôn đi vào **lá cuối**. Lá cuối đầy thì bị tách làm hai; nút trái không bao giờ được chèn thêm, mọi insert sau đi vào nút phải. Vì vậy mọi lá (trừ lá cuối) chỉ đầy **khoảng 50%**.

Chèn **giảm dần**: tình huống đối xứng — nút phải sau split không bao giờ được chạm lại; mọi lá trừ lá đầu tiên đầy khoảng 50%.`,
    },
    {
      pe: '14.8',
      q: '**PE 14.8** — (a) Công thức chi phí xây secondary B+-tree bằng cách chèn từng record (mỗi block f entry, các mức trên lá nằm trong bộ nhớ); (b) chi phí với 10 triệu record nếu một lần truy cập ngẫu nhiên tốn 10 ms; (c) pseudocode xây bottom-up.',
      answer: `a. Tìm lá cần chèn gần như miễn phí (nút trong ở bộ nhớ). Ở mức lá: **một truy cập ngẫu nhiên để đọc** lá và **một để ghi** lại. Split lá cần thêm một lần ghi trang. Tổng cộng tối đa **2·n<sub>r</sub> truy cập ngẫu nhiên** và **n<sub>r</sub> + 2·(n<sub>r</sub>/f) lần ghi trang** (trường hợp xấu mỗi lá chỉ đầy một nửa nên số lần split ≈ 2·n<sub>r</sub>/f). Chi phí ghi nút trong ≈ 2·(n<sub>r</sub>/f)/f, nhỏ, có thể bỏ qua.

b. Bỏ qua chi phí ghi trang: 10 000 000 × 2 × 10 ms = 200 000 s ≈ **56 giờ** (bài CH14.16).

c. Sắp các cặp (khoá, con trỏ) bằng external sort, rồi:
\`\`\`
function insert_in_leaf(K, P)
    if cây rỗng then tạo lá L, cũng là gốc
    else L = lá cuối cùng của chuỗi lá
    if L có ít hơn n − 1 khoá then chèn (K, P) vào chỗ trống đầu tiên của L
    else
        tạo lá mới L1; L.P_n = L1
        K1 = khoá cuối cùng của L     /* hoặc K, khoá nhỏ nhất của L1 */
        insert_in_parent(1, L, K, L1)
        chèn (K, P) vào đầu L1

function insert_in_parent(level l, P, K, P1)
    if mức l chưa có nút then
        tạo nút trong N làm gốc; ghi (P, K, P1) vào N; return
    N = nút phải nhất ở mức l
    if N có ít hơn n con trỏ then chèn (K, P1) vào chỗ trống đầu tiên của N
    else
        tạo nút trong mới N1; ghi P1 vào đầu N1
        insert_in_parent(l + 1, N, K, N1)
\`\`\`
Gọi insert_in_leaf cho từng cặp theo thứ tự tăng dần. Giữ địa chỉ nút cuối mỗi mức trong một mảng để khỏi phải tìm. Nút cuối mỗi mức có thể chưa đầy một nửa → phân phối lại khoá giữa hai nút cuối của mức đó (nút áp chót luôn đầy). Mỗi trang chỉ được ghi một lần, tuần tự → nhanh hơn rất nhiều so với (b).`,
    },
    {
      pe: '14.9',
      q: '**PE 14.9** — (a) Vì sao lá của B+-tree file organization mất tính tuần tự? (b) Cấp phát lá theo đơn vị n block: (i) độ đầy tệ nhất, (ii) lá của một đơn vị có thể không liên tiếp không, (iii) số seek khi quét mức lá, (iv) vì sao redistribution hiệu quả hơn với cách này?',
      answer: `a. Khi mới tạo, có thể cấp các block gần như liên tiếp cho các lá liên tiếp. Sau nhiều insert/delete, lá mới sinh ra do split được đặt ở chỗ trống bất kỳ trên đĩa → các lá kề nhau trong cây nằm rải rác, quét tuần tự phải seek ngày càng nhiều.

b.
1. Tệ nhất mỗi đơn vị n block chỉ đầy một nửa và mỗi lá cũng chỉ đầy một nửa → **25%**.
2. **Không**: khi tách một đơn vị, n/2 lá đầu ở lại, phần còn lại sang đơn vị mới → thứ tự được giữ, các lá trong một đơn vị luôn liên tiếp nhau.
3. Cấp từng block: tệ nhất **một seek cho mỗi lá**. Cấp theo đơn vị: mỗi đơn vị chứa ít nhất n/2 lá và đọc được bằng một seek → số seek giảm khoảng **n/2 lần**.
4. Phân phối lại giữa các lá **trong cùng một đơn vị** không cần thêm seek (đơn vị đã ở trong buffer), trong khi B+-tree thường cần một seek cho mỗi lá tham gia. Độ đầy tệ nhất quay lại gần 50%.`,
    },
    {
      pe: '14.10',
      q: '**PE 14.10** — Có schema và các truy vấn chạy thường xuyên; dựa vào đó quyết định tạo index nào thế nào?',
      answer: `- Index trên các thuộc tính xuất hiện trong **điều kiện chọn** (where); nếu thuộc tính ít giá trị khác nhau → **bitmap index**, ngược lại B+-tree.
- B+-tree index trên **primary key** và **foreign key**.
- Index trên các thuộc tính trong **điều kiện join**.
- Cân nhắc **composite/covering index** cho truy vấn thường xuyên chỉ cần vài cột; tránh index cho bảng cập nhật nhiều mà ít truy vấn; bỏ index thừa (index có cột là tiền tố của index khác — bài CH14.17).`,
    },
    {
      pe: '14.11',
      q: '**PE 14.11** — LSM tree/stepped-merge chỉ gộp một mức xuống mức sau khi mức đầy. Đổi chính sách thế nào để tăng tốc đọc khi nhiều đọc, không cập nhật?',
      answer: `Khi đã lâu không có cập nhật nhưng có nhiều lần tra cứu, **gộp sớm** các entry ở mức i vào mức i + 1 **dù mức i chưa đầy** (với stepped-merge: gộp các cây trong cùng một mức thành một). Lợi ích: lần đọc sau không phải tìm ở mức i (ít cây/mức hơn để tra), giảm chi phí đọc.`,
    },
    {
      pe: '14.12',
      q: '**PE 14.12** — Buffer tree so với LSM tree có những đánh đổi gì?',
      answer: `- **Buffer tree** áp dụng được cho **mọi cây index** (kể cả spatial index như R-tree) để giảm chi phí insert/update. **LSM tree** chỉ dùng được với dữ liệu **có thứ tự tuyến tính**, gộp được (merge).
- Nhưng buffer tree cần **nhiều I/O ngẫu nhiên hơn** khi insert so với (mọi biến thể) LSM tree, vốn ghi tuần tự.
- Cả hai (write-optimized) đều giảm mạnh chi phí insert so với B+-tree, nhưng **tra cứu** có thể đắt hơn B+-tree đáng kể.`,
    },
    {
      pe: '14.13',
      q: '**PE 14.13** — (a) Lập bitmap index cho salary của instructor theo 4 khoảng (< 50000, 50000–< 60000, 60000–< 70000, ≥ 70000). (b) Các bước trả lời "instructor khoa Finance có salary ≥ 80000", kèm bitmap trung gian và cuối.',
      answer: `Record theo thứ tự: 10101, 12121, 15151, 22222, 32343, 33456, 45565, 58583, 76543, 76766, 83821, 98345.

a.
| Khoảng | Bitmap |
|---|---|
| S₁: < 50000 | 0 0 1 0 0 0 0 0 0 0 0 0 |
| S₂: 50000–< 60000 | 0 0 0 0 0 0 0 0 0 0 0 0 |
| S₃: 60000–< 70000 | 1 0 0 0 1 0 0 1 0 0 0 0 |
| S₄: ≥ 70000 | 0 1 0 1 0 1 1 0 1 1 1 1 |

b. Cần thêm bitmap trên dept_name; Finance = 0 1 0 0 0 0 0 0 1 0 0 0.
1. AND bitmap Finance với S₄ (khoảng chứa mọi salary ≥ 80000): 0 1 0 0 0 0 0 0 1 0 0 0.
2. Đọc các record có bit 1 (Wu 90000, Singh 80000) và **kiểm tra lại** salary ≥ 80000 (vì S₄ bắt đầu từ 70000).
3. Kết quả: **Wu** và **Singh**.

Bài CH14.09–11 dựng các bitmap này bằng SQL.`,
    },
    {
      pe: '14.14',
      q: '**PE 14.14** — Chỉ có truy vấn "có nhà hàng ở đúng điểm (x, y) không?". R-tree hay B-tree tốt hơn? Vì sao?',
      answer: `**B-tree/B+-tree** trên khoá ghép (x, y). Truy vấn chỉ là **so sánh bằng** trên cả hai toạ độ nên index thứ tự trên (x, y) tìm được trong một đường đi từ gốc tới lá, chiều cao log, không có chồng lấn. R-tree được thiết kế cho truy vấn **vùng/nearest neighbor**; các hình chữ nhật bao có thể **chồng nhau** nên một tìm kiếm điểm có thể phải đi nhiều nhánh, và R-tree phức tạp, tốn hơn để duy trì. (Hash index trên (x, y) cũng là lựa chọn tốt cho truy vấn bằng.)`,
    },
    {
      pe: '14.15',
      q: '**PE 14.15** — CSDL không gian chỉ hỗ trợ truy vấn vùng tròn, không hỗ trợ nearest neighbor. Thuật toán tìm nearest neighbor bằng nhiều truy vấn vùng?',
      answer: `Bắt đầu với bán kính r rất nhỏ quanh điểm truy vấn q. Nếu vùng tròn không chứa điểm nào, **tăng bán kính** (ví dụ nhân 1.5) và hỏi lại. Khi vùng chứa ít nhất một điểm, điểm gần nhất trong kết quả **chính là** nearest neighbor (mọi điểm ngoài vùng đều xa hơn r, còn điểm trong vùng có khoảng cách ≤ r). Vì bán kính chỉ lớn hơn bán kính tối thiểu cần thiết một hệ số nhỏ, kết quả mỗi truy vấn không có quá nhiều điểm.`,
    },
  ],

  exercises: [
    {
      id: 'CH14.01', topic: 'create index', level: 1,
      prompt: 'Tạo index B+-tree (mặc định) trên `instructor(dept_name)` để tăng tốc các truy vấn lọc theo khoa. Hệ thống liệt kê mọi index (không kể primary key) của instructor qua catalog.',
      solution: `create index ix_instructor_dept on instructor (dept_name);`,
      check: indexesOf('instructor'),
    },
    {
      id: 'CH14.02', topic: 'composite index', level: 2,
      prompt: 'Truy vấn thường xuyên: `select * from instructor where dept_name = ? and salary > ?`. Tạo **một** composite index phù hợp nhất (thứ tự cột quan trọng: điều kiện bằng trước, điều kiện khoảng sau).',
      solution: `create index ix_instructor_dept_salary on instructor (dept_name, salary);`,
      check: indexesOf('instructor'),
    },
    {
      id: 'CH14.03', topic: 'unique expression index', level: 2,
      prompt: 'Không cho hai sinh viên có tên trùng nhau **không phân biệt hoa thường**: tạo **unique index** trên `lower(name)` của student. Hệ thống kiểm tra catalog, rồi thử chèn sinh viên (\'99001\', \'SHANKAR\', \'Comp. Sci.\', 0) — phải bị từ chối (23505).',
      solution: `create unique index ix_student_lower_name on student (lower(name));`,
      check: `select (select count(*) from pg_index i where i.indrelid = 'student'::regclass and i.indisunique
          and pg_get_expr(i.indexprs, i.indrelid) = 'lower((name)::text)') as unique_lower_indexes,
       try_sql($$insert into student values ('99001', 'SHANKAR', 'Comp. Sci.', 0)$$) as insert_shankar;`,
    },
    {
      id: 'CH14.04', topic: 'partial index', level: 2,
      prompt: 'Chỉ các truy vấn về giảng viên **lương cao** (salary > 80000) cần index trên salary. Tạo **partial index** trên `instructor(salary)` chỉ chứa các dòng có `salary > 80000`.',
      solution: `create index ix_instructor_high_salary on instructor (salary) where salary > 80000;`,
      check: indexesOf('instructor'),
    },
    {
      id: 'CH14.05', topic: 'hash index', level: 1,
      prompt: 'Tạo **hash index** trên `student(name)` (chỉ dùng cho so sánh bằng).',
      solution: `create index ix_student_name_hash on student using hash (name);`,
      check: indexesOf('student'),
    },
    {
      id: 'CH14.06', topic: 'covering index', level: 2,
      prompt: 'Truy vấn `select grade from takes where course_id = ?` chạy rất thường xuyên. Tạo **covering index** trên `takes(course_id)` có kèm cột grade (`include`) để trả lời mà không cần đọc bảng takes. Hệ thống đọc định nghĩa index từ `pg_indexes`.',
      solution: `create index ix_takes_course_grade on takes (course_id) include (grade);`,
      check: `select regexp_replace(indexdef, '^CREATE INDEX \\S+ ', 'CREATE INDEX ... ') as indexdef
from pg_indexes where tablename = 'takes' and indexname <> 'takes_pkey';`,
    },
    {
      id: 'CH14.07', topic: 'catalog: existing indexes', level: 2,
      prompt: 'Hầu hết hệ thống tự tạo index cho primary key. Dùng catalog `pg_indexes`, liệt kê mọi index của các bảng **section, takes, teaches**: tablename, indexname và `columns` = phần trong ngoặc của indexdef (ví dụ `id, course_id, ...`). Sắp theo tablename.',
      hint: '`substring(indexdef from \'\\((.*)\\)\')`.',
      solution: `select tablename, indexname, substring(indexdef from '\\((.*)\\)') as columns
from pg_indexes
where schemaname = 'public' and tablename in ('section', 'takes', 'teaches')
order by tablename;`,
    },
    {
      id: 'CH14.08', topic: 'PE 14.2 one clustering index', level: 3, pe: '14.2', fresh: true,
      prompt: 'Minh hoạ PE 14.2 trong PostgreSQL: tạo index `ix_inst_salary` trên instructor(salary) và `ix_inst_name` trên instructor(name); `cluster instructor using ix_inst_salary`, rồi `cluster instructor using ix_inst_name`. Cuối cùng trả về tên các index của instructor (`indexrelid::regclass::text`) và cột `indisclustered`, sắp theo tên. (Chỉ một index có thể là clustering index.)',
      solution: `create index ix_inst_salary on instructor (salary);
create index ix_inst_name on instructor (name);
cluster instructor using ix_inst_salary;
cluster instructor using ix_inst_name;
select indexrelid::regclass::text as index_name, indisclustered
from pg_index where indrelid = 'instructor'::regclass
order by 1;`,
    },
    {
      id: 'CH14.09', topic: 'PE 14.13a bitmap on salary', level: 2, pe: '14.13a',
      prompt: 'Lập **bitmap index** trên salary của instructor theo 4 khoảng: S1 (< 50000), S2 (50000 – < 60000), S3 (60000 – < 70000), S4 (≥ 70000). Record được đánh số theo thứ tự **ID tăng dần**; bitmap là chuỗi các ký tự 0/1 (không có khoảng trắng). Trả về `range` và `bitmap`, sắp theo range. Khoảng không có giá trị nào vẫn phải có dòng (toàn 0).',
      ordered: true,
      solution: `select r.range,
       string_agg(case when i.salary >= r.lo and i.salary < r.hi then '1' else '0' end, '' order by i.ID) as bitmap
from (values ('S1', 0, 50000), ('S2', 50000, 60000), ('S3', 60000, 70000), ('S4', 70000, 1e9)) as r(range, lo, hi)
cross join instructor i
group by r.range
order by r.range;`,
    },
    {
      id: 'CH14.10', topic: 'PE 14.13b bitmap AND', level: 3, pe: '14.13b',
      prompt: 'Tiếp CH14.09: trả về ba dòng (`name`, `bitmap`) theo thứ tự: \'S4\' (bitmap salary ≥ 70000), \'Finance\' (bitmap dept_name = Finance), \'S4 AND Finance\' (AND từng bit). Dùng kiểu `bit varying` và toán tử `&` cho phép AND, rồi đổi về text.',
      hint: '`string_agg(...)::varbit`, rồi `(a & b)::text`.',
      ordered: true,
      solution: `with b as (
  select string_agg(case when salary >= 70000 then '1' else '0' end, '' order by ID)::varbit as s4,
         string_agg(case when dept_name = 'Finance' then '1' else '0' end, '' order by ID)::varbit as fin
  from instructor)
select 'S4' as name, s4::text as bitmap from b
union all select 'Finance', fin::text from b
union all select 'S4 AND Finance', (s4 & fin)::text from b;`,
    },
    {
      id: 'CH14.11', topic: 'PE 14.13b answer from bitmap', level: 3, pe: '14.13b',
      prompt: 'Hoàn tất PE 14.13b: dùng bitmap `S4 AND Finance` (như CH14.10), lấy các instructor ở những **vị trí có bit 1** (vị trí theo thứ tự ID tăng dần, bắt đầu từ 1), rồi **kiểm tra lại** điều kiện salary ≥ 80000. Trả về ID, name, salary.',
      hint: '`row_number() over (order by ID)` để có vị trí; `substring(bits from pos for 1) = \'1\'`.',
      solution: `with b as (
  select (string_agg(case when salary >= 70000 then '1' else '0' end, '' order by ID)::varbit
        & string_agg(case when dept_name = 'Finance' then '1' else '0' end, '' order by ID)::varbit)::text as bits
  from instructor),
numbered as (select ID, name, salary, row_number() over (order by ID) as pos from instructor)
select n.ID, n.name, n.salary
from numbered n, b
where substring(b.bits from n.pos::int for 1) = '1' and n.salary >= 80000;`,
    },
    {
      id: 'CH14.12', topic: 'sparse index', level: 2,
      prompt: '`ix_seq_file(pos, id, name)` là file tuần tự đã sắp theo id, mỗi block chứa **3 record** (block 0 gồm pos 0–2, …). Dựng **sparse index**: một entry cho mỗi block gồm `block_no` và `first_id` (id của record đầu block).',
      solution: `select pos / 3 as block_no, min(id) as first_id
from ix_seq_file
group by pos / 3;`,
    },
    {
      id: 'CH14.13', topic: 'sparse index lookup', level: 3,
      prompt: 'Dùng sparse index của CH14.12 để tìm block cần quét cho các khoá tìm kiếm \'33456\', \'76766\', \'99999\' và \'10000\': block có `first_id` **lớn nhất ≤ khoá** (null nếu khoá nhỏ hơn mọi first_id). Trả về `search_key`, `block_no`, và `found` (true nếu id đó thực sự có trong file).',
      solution: `with idx as (select pos / 3 as block_no, min(id) as first_id from ix_seq_file group by pos / 3)
select k.search_key,
       (select block_no from idx where first_id <= k.search_key order by first_id desc limit 1) as block_no,
       exists (select 1 from ix_seq_file f where f.id = k.search_key) as found
from (values ('33456'), ('76766'), ('99999'), ('10000')) as k(search_key);`,
    },
    {
      id: 'CH14.14', topic: 'B+-tree fan-out and height', level: 3,
      prompt: 'Với mỗi dòng của `ix_index_spec(index_name, num_keys, key_bytes, ptr_bytes, block_bytes)`: `fanout` n = ⌊(block_bytes + key_bytes) / (key_bytes + ptr_bytes)⌋ (n con trỏ và n − 1 khoá vừa một block); `min_height` = ⌈log<sub>n</sub>(num_keys)⌉ (mọi nút đầy); `max_height` = ⌈log<sub>⌈n/2⌉</sub>(num_keys)⌉ (mọi nút chỉ đầy tối thiểu). Dùng hàm `log(b, x)` kiểu numeric.',
      solution: `select index_name, n as fanout,
       ceil(log(n::numeric, num_keys::numeric)) as min_height,
       ceil(log(ceil(n / 2.0), num_keys::numeric)) as max_height
from (select index_name, num_keys, (block_bytes + key_bytes) / (key_bytes + ptr_bytes) as n
      from ix_index_spec) as s;`,
    },
    {
      id: 'CH14.15', topic: 'PE 14.3 node occupancy', level: 1, pe: '14.3',
      prompt: 'Với n = 4, 6, 8 con trỏ mỗi nút (các trường hợp của PE 14.3): `leaf_min_keys` = ⌈(n − 1)/2⌉, `leaf_max_keys` = n − 1, `inner_min_ptrs` = ⌈n/2⌉, `inner_max_ptrs` = n.',
      solution: `select n,
       ceil((n - 1) / 2.0) as leaf_min_keys,
       n - 1 as leaf_max_keys,
       ceil(n / 2.0) as inner_min_ptrs,
       n as inner_max_ptrs
from (values (4), (6), (8)) as t(n);`,
    },
    {
      id: 'CH14.16', topic: 'PE 14.8b build cost', level: 2, pe: '14.8b',
      prompt: 'Chèn từng record vào secondary B+-tree tốn **2 truy cập ngẫu nhiên** (đọc + ghi lá), mỗi lần **10 ms** (bỏ qua chi phí ghi khi split). Với mỗi index trong `ix_index_spec`, trả về index_name và `build_hours` (làm tròn 1 chữ số) nếu xây bằng cách chèn từng record (mỗi khoá là một record). Thêm dòng \'pe_14_8\' cho 10 000 000 record của PE 14.8b.',
      solution: `select index_name, round(num_keys * 2 * 10 / 1000.0 / 3600, 1) as build_hours
from ix_index_spec
union all
select 'pe_14_8', round(10000000 * 2 * 10 / 1000.0 / 3600, 1);`,
    },
    {
      id: 'CH14.17', topic: 'redundant indexes', level: 3,
      prompt: 'Bảng `ix_orders` có sẵn nhiều index. Một index (không unique) là **thừa** nếu danh sách cột của nó là **tiền tố thực sự** của danh sách cột của một index khác trên cùng bảng (ví dụ (customer_id) so với (customer_id, order_date)). Dùng `pg_index` (cột indkey) tìm các cặp `redundant`, `covered_by` (tên index, `::regclass::text`).',
      hint: '`indkey::text` có dạng \'2 3\'; tiền tố: `b.indkey::text like a.indkey::text || \' %\'`.',
      solution: `select a.indexrelid::regclass::text as redundant, b.indexrelid::regclass::text as covered_by
from pg_index a join pg_index b
  on a.indrelid = b.indrelid and a.indexrelid <> b.indexrelid
where a.indrelid = 'ix_orders'::regclass
  and not a.indisunique
  and b.indkey::text like a.indkey::text || ' %';`,
    },
    {
      id: 'CH14.18', topic: 'drop redundant indexes', level: 2,
      prompt: 'Dựa vào CH14.17, **xoá** các index thừa của ix_orders (ix_orders_cust và ix_orders_date). Hệ thống liệt kê các index còn lại của ix_orders (tên, sắp theo tên).',
      solution: `drop index ix_orders_cust;
drop index ix_orders_date;`,
      check: `select indexname from pg_indexes where tablename = 'ix_orders' order by indexname;`,
    },
  ],
};
