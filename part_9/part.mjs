// Cấu hình Part 9 — đọc bởi lab/tools (build, verify, grade, sql).
export default {
  number: 9,
  title: 'Part 9 — Chương 24, 25 và 26',
  subtitle: 'Advanced Indexing · Advanced Application Development · Blockchain Databases',
  lead: 'Phần "Advanced Topics" của sách: Chương 24 (Bloom filter, LSM tree, buffer tree, bitmap index, spatial index, hash index), Chương 25 (tuning hiệu năng, benchmark, chuẩn hoá, directory system, kiểm thử ứng dụng) và Chương 26 (blockchain: hash chain, Merkle tree, đồng thuận, smart contract). Nội dung này nằm ngoài lịch học CS4420. Bài SQL mô phỏng các cấu trúc trên dữ liệu thật: tính bit của Bloom filter, gộp các mức LSM, phép AND trên bitmap, truy vấn không gian, kiểm tra chuỗi khối bằng sha256, tính Merkle root.',
  weeks: 'Ngoài lịch học',
  storage: 'cs4420part9',
  unit: 'Chương',
  setup: ['university_schema.sql', 'university_data.sql', 'extra_tables.sql', 'p9_tables.sql'],
  chapters: ['ch24', 'ch25', 'ch26'],
  schemaGroups: [
    { title: 'University database (theo sách)', core: true },
    { title: 'Bảng cho Chương 24 (Advanced Indexing)', tables: [], prefix: 'ai_' },
    { title: 'Bảng cho Chương 25 (Application Development)', tables: [], prefix: 'at_' },
    { title: 'Bảng cho Chương 26 (Blockchain)', tables: [], prefix: 'bc_' },
    { title: 'Bảng phụ' },
  ],
};
