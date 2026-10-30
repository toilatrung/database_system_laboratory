// Cấu hình Part 8 — đọc bởi lab/tools (build, verify, grade, sql).
export default {
  number: 8,
  title: 'Part 8 — Chương 20 đến 23',
  subtitle: 'Kiến trúc hệ CSDL · Lưu trữ, xử lý truy vấn và giao dịch song song & phân tán',
  lead: 'Phần tự học ngoài lịch CS4420, theo Part 8 của sách (Parallel and Distributed Databases). Mỗi chương có tóm tắt theo slide, trắc nghiệm, toàn bộ Practice Exercises (kèm đề gốc) dạng tự luận, và bài SQL tự chấm. Vì Practice Lab chỉ có một database, các bài SQL mô phỏng hệ nhiều node bằng dữ liệu: cột node/site cho biết tuple nằm ở đâu, log của từng site, đồ thị wait-for… Bạn tính speedup và skew, chia partition, tính chi phí truyền tuple của các chiến lược join, phân tích log two-phase commit, kiểm tra quorum và phát hiện deadlock toàn cục.',
  weeks: 'Ngoài lịch học',
  storage: 'cs4420part8',
  unit: 'Chương',
  setup: ['university_schema.sql', 'university_data.sql', 'extra_tables.sql', 'p8_tables.sql'],
  chapters: ['ch20', 'ch21', 'ch22', 'ch23'],
  schemaGroups: [
    { title: 'Bảng cho Chương 20–23 (mô phỏng nhiều node)', tables: [], prefix: 'pd_' },
    { title: 'University database (theo sách)', core: true },
    { title: 'Bảng phụ từ Part 1' },
  ],
};
