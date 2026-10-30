// Cấu hình Part 4 — đọc bởi lab/tools (build, verify, grade, sql).
export default {
  number: 4,
  title: 'Part 4 — Chương 10 và 11',
  subtitle: 'Big Data · Data Analytics (data warehouse, OLAP, data mining)',
  lead: 'Chương 10 (lưu trữ và xử lý dữ liệu lớn: distributed file system, key-value / document store, MapReduce, Spark, streaming, graph database) và Chương 11 (data warehouse, star schema, OLAP với cube/rollup, column store, data mining). Hệ thống phân tán không chạy được trong trình duyệt, nên bài SQL mô phỏng đúng ý tưởng trên PostgreSQL: word count và join kiểu MapReduce, document bằng jsonb, range query trên khoá ghép, tumbling window, PageRank bằng recursive query; cross-tab, rollup theo hierarchy, window function, luật kết hợp và đánh giá classifier.',
  weeks: 'Ngoài lịch học',
  storage: 'cs4420part4',
  unit: 'Chương',
  setup: ['university_schema.sql', 'university_data.sql', 'extra_tables.sql', 'p4_bigdata.sql', 'p4_olap.sql'],
  chapters: ['ch10', 'ch11'],
  schemaGroups: [
    { title: 'University database (theo sách)', core: true },
    { title: 'Bảng cho bài tập Chương 10 (Big Data)', tables: [], prefix: 'bd_' },
    { title: 'Bảng cho bài tập Chương 11 (Data Analytics)', tables: [], prefix: 'olap_' },
    { title: 'Bảng phụ từ Part 1' },
  ],
};
