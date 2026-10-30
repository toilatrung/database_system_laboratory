// Cấu hình Part 2 — đọc bởi lab/tools (build, verify, grade, sql).
export default {
  number: 2,
  title: 'Part 2 — Chương 6 và 7',
  subtitle: 'Thiết kế CSDL bằng mô hình E-R · Chuẩn hoá (Normalization)',
  lead: 'Chương 6 (E-R model, chuyển E-R sang lược đồ quan hệ) và Chương 7 (phụ thuộc hàm, lossless, BCNF, 3NF). Bài SQL tập trung vào việc hiện thực thiết kế: tạo bảng từ E-R, ép ràng buộc cardinality/participation, kiểm tra phụ thuộc hàm và phân rã trên dữ liệu thật. Có thêm công cụ Phụ thuộc hàm để tự kiểm tra bài tính bao đóng, khoá, canonical cover, BCNF/3NF.',
  weeks: 'Tuần 9–12',
  storage: 'cs4420p2',
  unit: 'Chương',
  fdTool: true,
  setup: ['university_schema.sql', 'university_data.sql', 'extra_tables.sql', 'er_tables.sql', 'normalization_tables.sql'],
  chapters: ['ch6', 'ch7'],
  schemaGroups: [
    { title: 'University database (theo sách)', core: true },
    { title: 'Bảng cho bài tập Chương 6 (E-R)', tables: [], prefix: 'er_' },
    { title: 'Bảng cho bài tập Chương 7 (Normalization)', tables: [], prefix: 'nf_' },
    { title: 'Bảng phụ từ Part 1' },
  ],
};
