// Cấu hình Part 6 — đọc bởi lab/tools (build, verify, grade, sql).
export default {
  number: 6,
  title: 'Part 6 — Chương 15 và 16',
  subtitle: 'Xử lý truy vấn (Query Processing) · Tối ưu truy vấn (Query Optimization)',
  lead: 'Chương 15 (mô hình chi phí, thuật toán selection, external sort-merge, các thuật toán join, pipelining) và Chương 16 (luật tương đương, ước lượng kích thước bằng thống kê và histogram, chọn thứ tự join, materialized view, khử tương quan subquery). Đây là chương lý thuyết nên bài SQL tập trung vào việc tính chi phí và ước lượng bằng SQL, hiện thực lại logic của thuật toán (sort-merge, semijoin, division), và kiểm chứng luật tương đương trên dữ liệu thật. Không chấm kết quả EXPLAIN vì kế hoạch thay đổi theo dữ liệu và phiên bản.',
  weeks: 'Ngoài lịch học',
  storage: 'cs4420part6',
  unit: 'Chương',
  setup: ['university_schema.sql', 'university_data.sql', 'extra_tables.sql', 'p6_query_tables.sql'],
  chapters: ['ch15', 'ch16'],
  schemaGroups: [
    { title: 'University database (theo sách)', core: true },
    { title: 'Bảng cho Chương 15–16', tables: [], prefix: 'qp_' },
    { title: 'Bảng phụ' },
  ],
};
