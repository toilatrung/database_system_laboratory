export default {
  number: 26,
  slug: 'ch26_blockchain',
  title: 'Blockchain Databases',
  titleVi: 'Cơ sở dữ liệu blockchain',

  summary: `
### 1. Blockchain là gì
- Một **sổ cái (ledger) chỉ được thêm** (append-only), được **nhân bản** trên nhiều node không tin nhau, và **chống sửa đổi** (tamper-resistant).
- Dữ liệu được gom thành **khối (block)**; mỗi khối chứa **hash của khối trước** (hash pointer) → thành chuỗi. Khối đầu là **genesis block**.
- Sửa một khối làm hash của nó đổi → con trỏ ở khối sau không còn khớp → phải sửa **mọi khối sau** và thuyết phục đa số mạng chấp nhận → thực tế không làm được (PE 26.6).
- **Public (permissionless)** blockchain: ai cũng tham gia, danh tính là khoá công khai (ẩn danh giả — pseudonymous), ví dụ Bitcoin, Ethereum. **Permissioned** blockchain: một tổ chức/nhóm kiểm soát thành viên và danh tính, ví dụ Hyperledger Fabric (PE 26.5).

### 2. Hàm băm mật mã
Cần ba tính chất:
- **Collision resistance**: khó tìm x ≠ y với h(x) = h(y).
- **Irreversibility (one-way)**: biết h(x) khó tìm lại x (khi x được chọn từ miền rất lớn).
- **Puzzle friendliness**: biết k và giá trị đích, không có cách nào tìm nonce x để h(k ‖ x) rơi vào tập đích nhanh hơn thử từng giá trị.
- SHA-256 là ví dụ; h(x) = x mod 2<sup>256</sup> **không** có các tính chất này (PE 26.2).

### 3. Chữ ký số và giao dịch
- Mỗi người dùng có cặp khoá công khai/bí mật; giao dịch được **ký** bằng khoá bí mật, ai cũng kiểm tra được bằng khoá công khai.
- Bitcoin dùng mô hình **UTXO**: mỗi giao dịch tiêu các output chưa tiêu của giao dịch trước; **double spending** = tiêu cùng một output hai lần — đồng thuận ngăn điều này.

### 4. Merkle tree
- Các giao dịch trong khối là **lá**; mỗi node trong = hash(con trái ‖ con phải); số node lẻ thì nhân đôi node cuối. **Merkle root** được đặt trong header của khối.
- Chứng minh một giao dịch thuộc khối chỉ cần **log₂ n** hash (đường từ lá lên gốc) — client nhẹ không cần tải cả khối.
- Biến thể **Merkle-Patricia tree** (Ethereum) lưu trạng thái tài khoản.

### 5. Đồng thuận (consensus)
- **Proof-of-work (PoW)**: thợ đào tìm **nonce** sao cho hash của header nhỏ hơn một ngưỡng (ví dụ bắt đầu bằng một số chữ số 0). Độ khó tự điều chỉnh để giữ tốc độ ra khối (Bitcoin ~10 phút). Tốn **năng lượng** rất lớn; an toàn nếu không ai có > 50% sức tính toán. Dễ điều chỉnh tốc độ đào, khó bị một nhóm nhỏ chủ sở hữu lớn khống chế (PE 26.3, 26.4).
- **Proof-of-stake (PoS)**: quyền tạo khối tỉ lệ với lượng tiền đặt cọc; tiết kiệm năng lượng; rủi ro tập trung quyền vào người giàu.
- **Byzantine consensus** (PBFT…): dùng trong permissioned blockchain, chịu được f node **độc hại hoặc lỗi tuỳ ý** khi có ≥ 3f + 1 node; khác **2PC** vốn chỉ giả định lỗi **fail-stop** (PE 26.9).
- **Fork**: hai khối cùng nối vào một khối cha. Quy tắc **chuỗi dài nhất** (nhiều công nhất) quyết định nhánh thắng. **Soft fork** = thay đổi luật tương thích ngược (khối cũ vẫn hợp lệ); **hard fork** = thay đổi không tương thích, làm khối/luật cũ không còn hợp lệ, có thể tách thành hai chuỗi (PE 26.1).
- **Finality**: với PoW, giao dịch coi là chắc chắn sau vài khối (Bitcoin ~6 khối).

### 6. Smart contract
- Chương trình lưu trên chuỗi, tự thực thi khi điều kiện thoả (Ethereum, ngôn ngữ Solidity, chạy trên EVM).
- **Gas**: phí trả cho mỗi bước tính toán → giới hạn thời gian chạy, chống chương trình vô hạn và bù đắp cho thợ đào (PE 26.8).
- Ứng dụng: escrow, token, chuỗi cung ứng; rủi ro: lỗi trong code là bất biến (vụ The DAO).

### 7. Hiệu năng và mở rộng
- Throughput thấp (Bitcoin ~7 tps) so với CSDL truyền thống (hàng nghìn tới hàng triệu tps).
- Hướng cải thiện: **sharding** (chia mạng thành nhóm xử lý song song — nhưng mỗi nhóm ít thợ đào hơn, dễ bị tấn công hơn, PE 26.10), **off-chain / layer 2** (payment channel, Lightning Network), sidechain, khối lớn hơn.

### 8. Blockchain và CSDL
| | CSDL tập trung | Blockchain |
|---|---|---|
| Tin cậy | tin quản trị viên | không cần tin bên nào |
| Sửa/xoá | được | chỉ thêm |
| Hiệu năng | cao | thấp |
| Truy vấn | SQL phong phú | hạn chế (thường phải xây index ngoài chuỗi) |
- Enterprise blockchain thường thêm **truy cập kiểu CSDL** (SQL, index) vì lưu dữ liệu tổng quát chứ không chỉ chuyển tiền (PE 26.11).
- Ẩn danh trong public blockchain chỉ là **giả danh**: phân tích đồ thị giao dịch kết hợp dữ liệu ngoài có thể lộ danh tính (PE 26.7).
- Ứng dụng phù hợp: nhiều bên không tin nhau cần chung một sổ cái — thanh toán xuyên biên giới, chuỗi cung ứng, chứng nhận, tài sản số.
`,

  quiz: [
    {
      q: 'Vì sao sửa dữ liệu một khối cũ trong blockchain bị phát hiện?',
      options: ['Khối bị mã hoá', 'Hash của khối đổi nên hash pointer ở khối kế tiếp không còn khớp', 'Có log riêng', 'Admin kiểm tra hằng ngày'],
      answer: 1,
      explain: 'Kẻ sửa phải tính lại mọi khối sau và thắng đồng thuận của cả mạng.',
    },
    {
      q: 'Tính chất nào của hàm băm làm cho proof-of-work không có lối tắt?',
      options: ['Collision resistance', 'Irreversibility', 'Puzzle friendliness', 'Tính tất định'],
      answer: 2,
      explain: 'Puzzle friendliness: không có cách tìm nonce nhanh hơn thử từng giá trị.',
    },
    {
      q: 'h(x) = x mod 2^256 có collision resistance không?',
      options: ['Có', 'Không — dễ tìm vô số x có cùng 256 bit cuối', 'Chỉ khi x < 2^256', 'Chỉ với x nguyên tố'],
      answer: 1,
      explain: 'x và x + 2^256 luôn va chạm (PE 26.2).',
    },
    {
      q: 'Merkle root được dùng để:',
      options: ['Mã hoá giao dịch', 'Tóm tắt mọi giao dịch của khối, cho phép chứng minh một giao dịch thuộc khối bằng log n hash', 'Chọn thợ đào', 'Lưu số dư'],
      answer: 1,
      explain: 'Đường từ lá lên gốc chỉ cần log₂ n hash.',
    },
    {
      q: 'Lý do chính chọn proof-of-stake thay vì proof-of-work là:',
      options: ['Bảo mật tuyệt đối', 'Tiết kiệm năng lượng', 'Dễ hiện thực hơn', 'Không cần chữ ký số'],
      answer: 1,
      explain: 'PoW tiêu tốn năng lượng khổng lồ (PE 26.3).',
    },
    {
      q: 'Hard fork khác soft fork ở chỗ:',
      options: ['Hard fork làm các khối/luật cũ không còn hợp lệ', 'Hard fork nhanh hơn', 'Soft fork tạo hai đồng tiền', 'Không khác'],
      answer: 0,
      explain: 'Soft fork tương thích ngược; hard fork thì không (PE 26.1).',
    },
    {
      q: 'Gas trong Ethereum dùng để:',
      options: ['Làm mát máy đào', 'Trả phí cho việc thực thi smart contract và giới hạn lượng tính toán', 'Tăng tốc mạng', 'Lưu khoá bí mật'],
      answer: 1,
      explain: 'Gas đặt giới hạn thời gian chạy và trả công thợ đào (PE 26.8).',
    },
    {
      q: 'Byzantine consensus hơn 2PC ở điểm nào khi người dùng không độc hại?',
      options: ['Nhanh hơn', 'Chịu được lỗi tuỳ ý (arbitrary failures), không chỉ fail-stop', 'Ít thông điệp hơn', 'Không cần coordinator'],
      answer: 1,
      explain: '2PC giả định fail-stop; mô hình Byzantine tổng quát hơn (PE 26.9).',
    },
    {
      q: 'Rủi ro của sharding trong blockchain là:',
      options: ['Mất dữ liệu', 'Mỗi shard có ít thợ đào hơn nên dễ bị tấn công hơn', 'Không song song được', 'Không tính được hash'],
      answer: 1,
      explain: 'PE 26.10.',
    },
  ],

  questions: [
    {
      pe: '26.1',
      q: '**PE 26.1.** Fork trong blockchain là gì? Hai loại fork khác nhau thế nào?',
      answer: `**Fork** xảy ra khi một khối được nối vào một khối **không phải khối mới nhất** của chuỗi, khiến chuỗi tách thành hai nhánh (bài 26.12). Fork tạm thời do hai thợ đào tìm khối gần như cùng lúc được giải quyết bằng quy tắc chuỗi dài nhất.
Khi thay đổi luật giao thức:
- **Soft fork**: luật mới chặt hơn nhưng **tương thích ngược** — các khối trước đó vẫn hợp lệ, node cũ vẫn chấp nhận khối mới.
- **Hard fork**: luật mới **không tương thích** — làm các khối/luật trước đó không còn hợp lệ với node mới (hoặc ngược lại); nếu không phải mọi node cùng nâng cấp, chuỗi tách vĩnh viễn thành hai (ví dụ Ethereum / Ethereum Classic).`,
    },
    {
      pe: '26.2',
      q: '**PE 26.2.** Hàm h(x) = x mod 2<sup>256</sup> (256 bit cuối của x) có (a) collision resistance, (b) irreversibility, (c) puzzle friendliness không? Vì sao?',
      answer: `a. **Không.** Với giá trị hash y bất kỳ, mọi x = y + k·2<sup>256</sup> đều cho h(x) = y → tạo bao nhiêu va chạm cũng được (bài 26.08 minh hoạ với mod 256).
b. **Không theo nghĩa mạnh.** Biết y, tập các x thoả x mod 2<sup>256</sup> = y rất dễ liệt kê; trừ khi miền giá trị thật của x là gần như vô hạn, kẻ tấn công dễ tìm lại x. (Nếu x nhỏ hơn 2<sup>256</sup> thì h(x) = x — lộ hoàn toàn.)
c. **Không.** h(k ‖ x) chỉ là 256 bit cuối của chuỗi ghép, phụ thuộc trực tiếp vào x (nếu x đủ dài, chính là x) → muốn hash đích nào chỉ cần chọn x tương ứng, không phải thử. Proof-of-work với hàm này là vô nghĩa.`,
    },
    {
      pe: '26.3',
      q: '**PE 26.3.** Thiết kế public blockchain mới: vì sao có thể chọn proof-of-stake thay vì proof-of-work?',
      answer: `Lý do lớn nhất là **năng lượng**: PoW bắt các thợ đào thi nhau tính hash, tiêu tốn điện năng khổng lồ và cần phần cứng chuyên dụng. PoS chọn người tạo khối theo lượng tiền đặt cọc, gần như không tốn tính toán. Thêm vào đó PoS có thể cho finality nhanh hơn, và kẻ gian bị phạt mất tiền cọc (slashing).`,
    },
    {
      pe: '26.4',
      q: '**PE 26.4.** Vì sao có thể chọn proof-of-work thay vì proof-of-stake?',
      answer: `- PoW **dễ điều chỉnh tốc độ đào** (chỉ cần chỉnh độ khó) và đã được kiểm chứng lâu năm (Bitcoin).
- PoW **khó bị một nhóm nhỏ chủ sở hữu lớn khống chế**: với PoS, người nắm nhiều tiền có nhiều quyền hơn và càng giàu thêm; với PoW, muốn kiểm soát phải bỏ chi phí thật (phần cứng, điện) liên tục.
- PoS có những vấn đề riêng như "nothing at stake" (đặt cược trên mọi nhánh fork không tốn gì).`,
    },
    {
      pe: '26.5',
      q: '**PE 26.5.** Phân biệt public và permissioned blockchain; khi nào nên dùng mỗi loại?',
      answer: `- **Public**: không có cơ quan kiểm soát; ai cũng tham gia, đọc, đào; danh tính là khoá công khai. Cần đồng thuận chống Sybil (PoW/PoS) nên chậm. Phù hợp khi **không có bên nào được mọi người tin**, cần mở cho công chúng (tiền mã hoá công khai).
- **Permissioned**: có tổ chức kiểm soát ít nhất việc **cấp quyền thành viên và quản lý danh tính**; các node đã biết nhau nên dùng được đồng thuận Byzantine nhanh hơn, hỗ trợ bảo mật dữ liệu. Phù hợp cho **liên minh doanh nghiệp** (ngân hàng, chuỗi cung ứng) — các bên biết nhau nhưng không muốn trao toàn quyền cho một bên.`,
    },
    {
      pe: '26.6',
      q: '**PE 26.6.** Tính chống sửa đổi của blockchain an toàn hơn trong thực tế so với bảo mật của một CSDL doanh nghiệp truyền thống ở điểm nào?',
      answer: `- Blockchain được **nhân bản rất nhiều**: kẻ gian phải sửa một số lượng bản sao quá lớn; mọi lần thử thất bại đáng kể đều bị mạng **phát hiện**.
- Cấu trúc **hash pointer**: sửa một khối buộc phải sửa **mọi khối sau nó** (và với PoW phải đào lại tất cả, nhanh hơn cả mạng) — bài 26.02, 26.03 cho thấy chuỗi bị sửa lộ ngay.
- Với CSDL truyền thống, ai **đánh cắp được mật khẩu quản trị** là có thể sửa tuỳ ý ở bất kỳ đâu mà không để lại dấu vết (có thể sửa cả log).`,
    },
    {
      pe: '26.7',
      q: '**PE 26.7.** Trong public blockchain, làm sao xác định danh tính thật đằng sau một user ID?',
      answer: `User ID chỉ là **giả danh**, và mọi giao dịch đều công khai. Có thể:
- **Khai phá dữ liệu** chuỗi kết hợp với dữ liệu ngoài đời (thời điểm, số tiền, địa chỉ IP, giao dịch với sàn có KYC) để tìm tương quan.
- Dựng **đồ thị quan hệ** từ các giao dịch: một ID giao dịch với một ID đã bị lộ danh tính (ví dụ ví của một sàn, một cửa hàng) giúp suy ra danh tính; các địa chỉ cùng được dùng làm input một giao dịch thường thuộc cùng một người.`,
    },
    {
      pe: '26.8',
      q: '**PE 26.8.** Gas trong Ethereum dùng để làm gì?',
      answer: `Gas là **khoản phí trả cho thợ đào (validator) để thực thi smart contract**: mỗi lệnh EVM tốn một lượng gas, người gửi giao dịch đặt giới hạn gas và giá gas. Nhờ tính phí cho việc thực thi, Ethereum **giới hạn được tổng thời gian chạy** (chương trình hết gas thì dừng — chống vòng lặp vô hạn, DoS) và **không khuyến khích** viết hợp đồng tốn nhiều tính toán.`,
    },
    {
      pe: '26.9',
      q: '**PE 26.9.** Nếu người dùng được giả định không độc hại, Byzantine consensus còn ưu điểm gì so với 2PC?',
      answer: `Không độc hại nghĩa là không cần lo tấn công Sybil, nhưng vẫn cần chịu được **lỗi tuỳ ý (arbitrary failures)** — node gửi thông điệp sai do lỗi phần mềm, phần cứng, chứ không chỉ dừng hẳn. Mô hình lỗi **Byzantine** bao gồm những lỗi đó, còn **2PC chỉ giả định fail-stop** (node hoặc chạy đúng hoặc dừng). Ngoài ra 2PC có thể bị **block** khi coordinator hỏng, còn giao thức Byzantine vẫn tiến triển khi tối đa f trên 3f + 1 node hỏng.`,
    },
    {
      pe: '26.10',
      q: '**PE 26.10.** Lợi ích và rủi ro của sharding.',
      answer: `- **Lợi ích**: chia mạng/dữ liệu thành các shard, mỗi shard xử lý một phần giao dịch → **đào/xác nhận song song**, throughput tăng gần tuyến tính theo số shard; mỗi node lưu ít dữ liệu hơn.
- **Rủi ro**: tập thợ đào/validator bị chia thành các **nhóm nhỏ hơn**, kẻ tấn công chỉ cần chiếm đa số một shard (ít tốn kém hơn nhiều so với chiếm cả mạng); giao dịch **xuyên shard** phức tạp, cần giao thức phối hợp (giống commit phân tán).`,
    },
    {
      pe: '26.11',
      q: '**PE 26.11.** Vì sao enterprise blockchain thường kèm truy cập kiểu CSDL?',
      answer: `Enterprise blockchain thường lưu **dữ liệu tổng quát** (hợp đồng, lô hàng, hồ sơ, chứng nhận…) chứ không chỉ các giao dịch chuyển tiền giữa tài khoản. Người dùng cần **truy vấn** dữ liệu đó (lọc, join, tổng hợp), có index, quen dùng SQL và tích hợp với hệ thống sẵn có — nên các nền tảng thêm lớp truy cập kiểu CSDL (ví dụ world state dạng key-value/CouchDB trong Hyperledger Fabric, hoặc CSDL quan hệ có tính năng sổ cái như Oracle Blockchain Table). Bài 26.11 ép tính chỉ-thêm bằng trigger trong PostgreSQL.`,
    },
  ],

  exercises: [
    // ---------------- Hash chain ----------------
    {
      id: 'CH26.01', topic: 'tính hash khối', level: 1,
      prompt: 'Mỗi khối trong `bc_block` có hash = sha256 của chuỗi `height || \'|\' || prev_hash || \'|\' || data || \'|\' || nonce` (mã hoá UTF-8), viết dạng hex. Tính lại hash cho mọi khối và trả về `height`, `hash_ok` (true nếu hash tính lại bằng cột hash).',
      hint: "encode(sha256(convert_to(..., 'UTF8')), 'hex')",
      solution: `select height,
       encode(sha256(convert_to(height || '|' || prev_hash || '|' || data || '|' || nonce, 'UTF8')), 'hex') = hash as hash_ok
from bc_block;`,
    },
    {
      id: 'CH26.02', topic: 'kiểm tra chuỗi bị sửa', level: 2, pe: '26.6',
      prompt: '`bc_block_tampered` là bản sao mà ai đó đã sửa dữ liệu một khối và tính lại hash của khối đó. Với mỗi khối, trả về `height`, `hash_ok` (hash tính lại bằng cột hash) và `link_ok` (prev_hash bằng hash của khối có height − 1; khối 0 coi là true).',
      solution: `select b.height,
       encode(sha256(convert_to(b.height || '|' || b.prev_hash || '|' || b.data || '|' || b.nonce, 'UTF8')), 'hex') = b.hash as hash_ok,
       coalesce(b.prev_hash = p.hash, true) as link_ok
from bc_block_tampered b left join bc_block_tampered p on p.height = b.height - 1;`,
    },
    {
      id: 'CH26.03', topic: 'khối phải đào lại', level: 2, pe: '26.6',
      prompt: 'Tiếp CH26.02: kẻ sửa muốn chuỗi hợp lệ trở lại thì phải tính lại (đào lại) mọi khối **từ khối đầu tiên bị lỗi liên kết tới khối cuối**. Trả về một dòng: `first_broken` (height nhỏ nhất có link_ok = false) và `blocks_to_remine` (số khối từ first_broken tới khối cuối).',
      solution: `with chk as (
  select b.height, coalesce(b.prev_hash = p.hash, true) as link_ok
  from bc_block_tampered b left join bc_block_tampered p on p.height = b.height - 1)
select min(height) as first_broken,
       (select count(*) from bc_block_tampered where height >= (select min(height) from chk where not link_ok)) as blocks_to_remine
from chk
where not link_ok;`,
    },
    // ---------------- Merkle tree ----------------
    {
      id: 'CH26.04', topic: 'Merkle: lá', level: 1,
      prompt: 'Lá của Merkle tree là sha256 (hex) của payload mỗi giao dịch. Trả về `tx_no`, `leaf_hash` cho các giao dịch của khối 1 trong `bc_tx`.',
      solution: `select tx_no, encode(sha256(convert_to(payload, 'UTF8')), 'hex') as leaf_hash
from bc_tx
where block_height = 1;`,
    },
    {
      id: 'CH26.05', topic: 'Merkle root', level: 3,
      prompt: 'Tính **Merkle root** của khối 1: mỗi node cha = sha256 (hex) của chuỗi ghép hash con trái || hash con phải (ghép chuỗi hex, mã hoá UTF-8); ghép các node theo thứ tự 1-2, 3-4, …; nếu một mức có số node lẻ thì node cuối được ghép với chính nó. Trả về một dòng một cột `merkle_root`.',
      hint: 'with recursive giữ mảng hash của một mức; mức sau tính từ hs[2i−1] || hs[2i] bằng generate_series.',
      solution: `with recursive lvl (depth, hs) as (
  select 0, array_agg(encode(sha256(convert_to(payload, 'UTF8')), 'hex') order by tx_no)
  from bc_tx where block_height = 1
  union all
  select depth + 1,
         (select array_agg(encode(sha256(convert_to(hs[2 * i - 1] || coalesce(hs[2 * i], hs[2 * i - 1]), 'UTF8')), 'hex') order by i)
          from generate_series(1, (cardinality(hs) + 1) / 2) as i)
  from lvl
  where cardinality(hs) > 1)
select hs[1] as merkle_root from lvl where cardinality(hs) = 1;`,
    },
    {
      id: 'CH26.06', topic: 'Merkle root, số lá lẻ', level: 3,
      prompt: 'Như CH26.05 nhưng cho **khối 2** (3 giao dịch — mức lá có số node lẻ, giao dịch 3 được ghép với chính nó).',
      solution: `with recursive lvl (depth, hs) as (
  select 0, array_agg(encode(sha256(convert_to(payload, 'UTF8')), 'hex') order by tx_no)
  from bc_tx where block_height = 2
  union all
  select depth + 1,
         (select array_agg(encode(sha256(convert_to(hs[2 * i - 1] || coalesce(hs[2 * i], hs[2 * i - 1]), 'UTF8')), 'hex') order by i)
          from generate_series(1, (cardinality(hs) + 1) / 2) as i)
  from lvl
  where cardinality(hs) > 1)
select hs[1] as merkle_root from lvl where cardinality(hs) = 1;`,
    },
    // ---------------- Proof of work, hash properties ----------------
    {
      id: 'CH26.07', topic: 'proof-of-work', level: 2,
      prompt: 'Proof-of-work độ khó nhỏ: tìm **nonce nhỏ nhất** trong 0…20000 sao cho sha256 (hex) của chuỗi `\'6|\' || hash_khối_5 || \'|Bob pays Dave 6|\' || nonce` **bắt đầu bằng \'000\'** (hash_khối_5 lấy từ bc_block). Trả về `nonce` và `hash`.',
      hint: 'generate_series(0, 20000), order by nonce limit 1.',
      solution: `select n as nonce, h as hash
from (select n, encode(sha256(convert_to('6|' || b.hash || '|Bob pays Dave 6|' || n, 'UTF8')), 'hex') as h
      from bc_block b cross join generate_series(0, 20000) as n
      where b.height = 5) as t
where h like '000%'
order by n
limit 1;`,
    },
    {
      id: 'CH26.08', topic: 'hash yếu: va chạm', level: 1, pe: '26.2a',
      prompt: 'Minh hoạ PE 26.2 với phiên bản thu nhỏ h(x) = x mod 256: trả về 5 giá trị x dương nhỏ nhất có cùng hash với x = 42 (kể cả 42), cột `x`, sắp tăng dần. Collision resistance hoàn toàn không có.',
      solution: `select x from generate_series(1, 2000) as x
where x % 256 = 42 % 256
order by x
limit 5;`,
      ordered: true,
    },
    // ---------------- Ledger ----------------
    {
      id: 'CH26.09', topic: 'số dư từ sổ cái', level: 2,
      prompt: 'Số dư hiện tại của mỗi tài khoản = số dư ban đầu (`bc_genesis`) + tổng tiền nhận − tổng tiền gửi trong `bc_transfer` (giả sử mọi lệnh đều hợp lệ). Trả về `acct`, `balance`.',
      solution: `select g.acct,
       g.amount
       + coalesce((select sum(amount) from bc_transfer t where t.to_acct = g.acct), 0)
       - coalesce((select sum(amount) from bc_transfer t where t.from_acct = g.acct), 0) as balance
from bc_genesis g;`,
    },
    {
      id: 'CH26.10', topic: 'phát hiện tiêu quá số dư', level: 3,
      prompt: 'Xử lý các lệnh chuyển theo thứ tự tx_id (mọi lệnh đều được áp dụng). Tìm các lệnh mà **ngay sau khi áp dụng**, số dư của người gửi bị **âm** — những lệnh một node hợp lệ phải từ chối (tương tự double spending). Trả về `tx_id`, `from_acct`, `balance_after`.',
      hint: 'Biến mỗi lệnh thành hai dòng (+ cho người nhận, − cho người gửi), rồi tổng chạy theo tài khoản, order by tx_id.',
      solution: `with moves as (
  select 0 as tx_id, acct, amount as delta from bc_genesis
  union all select tx_id, to_acct, amount from bc_transfer
  union all select tx_id, from_acct, -amount from bc_transfer),
running as (
  select tx_id, acct, delta,
         sum(delta) over (partition by acct order by tx_id, delta desc) as bal
  from moves)
select r.tx_id, r.acct as from_acct, r.bal as balance_after
from running r join bc_transfer t on t.tx_id = r.tx_id and t.from_acct = r.acct
where r.delta < 0 and r.bal < 0;`,
    },
    {
      id: 'CH26.11', topic: 'append-only bằng trigger', level: 3, pe: '26.11',
      prompt: 'Biến `bc_ledger` thành sổ cái **chỉ được thêm**: tạo hàm trigger và trigger `bc_ledger_append_only` **before update or delete** trên bc_ledger, raise exception (SQLSTATE mặc định P0001). Hệ thống thử update, delete và insert.',
      solution: `create function bc_ledger_no_change() returns trigger
language plpgsql as $$
begin
  raise exception 'bc_ledger is append-only';
end $$;

create trigger bc_ledger_append_only
before update or delete on bc_ledger
for each row execute function bc_ledger_no_change();`,
      check: `select try_sql($$update bc_ledger set note = 'withdraw 2' where entry_id = 3$$) as try_update,
       try_sql($$delete from bc_ledger where entry_id = 1$$) as try_delete,
       try_sql($$insert into bc_ledger values (4, 'deposit 5')$$) as try_insert,
       sql_value($$select count(*) from bc_ledger$$) as num_entries;`,
    },
    // ---------------- Fork ----------------
    {
      id: 'CH26.12', topic: 'điểm fork', level: 1, pe: '26.1',
      prompt: '`bc_fork(block_id, parent_id)` là các khối một node đã thấy. Tìm các **điểm fork** — khối có nhiều hơn một khối con: `block_id`, `num_children`.',
      solution: `select parent_id as block_id, count(*) as num_children
from bc_fork
where parent_id is not null
group by parent_id
having count(*) > 1;`,
    },
    {
      id: 'CH26.13', topic: 'quy tắc chuỗi dài nhất', level: 3, pe: '26.1',
      prompt: 'Theo quy tắc **chuỗi dài nhất**, node chọn nhánh có khối ngọn (tip) xa genesis nhất. Trả về `tip` và `chain` — chuỗi block_id từ genesis tới tip, ngăn cách bởi \' -> \' — của chuỗi dài nhất.',
      hint: 'with recursive từ khối có parent_id null đi xuống, mang theo đường đi và độ dài.',
      solution: `with recursive walk (block_id, len, chain) as (
  select block_id, 1, block_id::text from bc_fork where parent_id is null
  union all
  select f.block_id, w.len + 1, w.chain || ' -> ' || f.block_id
  from walk w join bc_fork f on f.parent_id = w.block_id)
select block_id as tip, chain
from walk
where len = (select max(len) from walk);`,
    },
  ],
};
