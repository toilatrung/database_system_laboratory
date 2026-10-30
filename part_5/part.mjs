// Cấu hình Part 5 — đọc bởi lab/tools (build, verify, grade, sql).
export default {
  number: 5,
  title: 'Part 5 — Chương 12, 13 và 14',
  subtitle: 'Storage Management and Indexing: lưu trữ vật lý · cấu trúc lưu trữ dữ liệu · index',
  lead: 'Chương 12 (đĩa từ, SSD/flash, RAID, độ tin cậy), Chương 13 (tổ chức file và bản ghi, free list, slotted page, tổ chức bản ghi trong file, partitioning, buffer manager, lưu trữ theo cột) và Chương 14 (ordered index, B+-tree, hashing, index nhiều khoá, write-optimized index, bitmap index, spatial index). Phần này không nằm trong lịch thi CS4420 nhưng là nền tảng để hiểu vì sao truy vấn chạy nhanh hay chậm. Bài SQL tính toán các con số của phần cứng (thời gian truy cập, dung lượng RAID, MTTF, kích thước bảng ánh xạ flash), mô phỏng free list, free-space map, buffer LRU, và tạo/kiểm tra index thật trong PostgreSQL qua catalog.',
  weeks: 'Ngoài lịch học',
  storage: 'cs4420part5',
  unit: 'Chương',
  setup: ['university_schema.sql', 'university_data.sql', 'extra_tables.sql', 'p5_storage.sql'],
  chapters: ['ch12', 'ch13', 'ch14'],
  schemaGroups: [
    { title: 'University database (theo sách)', core: true },
    { title: 'Bảng cho Chương 12–13 (lưu trữ, file, buffer)', tables: [], prefix: 'st_' },
    { title: 'Bảng cho Chương 14 (index)', tables: [], prefix: 'ix_' },
    { title: 'Bảng phụ' },
  ],
};
