// Cấu hình Part 7 — đọc bởi lab/tools (build, verify, grade, sql).
export default {
  number: 7,
  title: 'Part 7 — Chương 17, 18 và 19',
  subtitle: 'Transactions · Concurrency Control · Recovery System',
  lead: 'Quản lý giao tác (Part 7 của sách): Chương 17 (ACID, schedule, conflict/view serializability, recoverable và cascadeless, isolation level), Chương 18 (two-phase locking, deadlock, timestamp ordering, validation, multiversion, snapshot isolation) và Chương 19 (log, WAL, checkpoint, undo/redo, ARIES). Phần này nằm ngoài lịch học CS4420. Bài SQL gồm hai loại: chạy transaction thật (commit, rollback, savepoint) trên CSDL mới, và phân tích schedule, bảng khoá, log được lưu thành dòng trong các bảng tx_ — tính precedence graph, phát hiện chu trình, kiểm tra 2PL, mô phỏng timestamp ordering, tính undo-list, redo và ARIES.',
  weeks: 'Ngoài lịch học',
  storage: 'cs4420part7',
  unit: 'Chương',
  setup: ['university_schema.sql', 'university_data.sql', 'extra_tables.sql', 'p7_tx_tables.sql'],
  chapters: ['ch17', 'ch18', 'ch19'],
  schemaGroups: [
    { title: 'University database (theo sách)', core: true },
    { title: 'Chương 17 — tài khoản, schedule, precedence graph', tables: ['tx_account', 'tx_sched', 'tx_pg_edge'] },
    { title: 'Chương 18 — khoá, deadlock, timestamp, validation, snapshot', tables: ['tx_lock_compat', 'tx_lock_req', 'tx_lock_sched', 'tx_txn', 'tx_waits', 'tx_conflict', 'tx_to_req', 'tx_to_ops', 'tx_val', 'tx_si', 'tx_versions', 'tx_mv_reads', 'tx_pred', 'tx_ins'] },
    { title: 'Chương 19 — log, checkpoint, ARIES', tables: ['tx_log', 'tx_disk', 'tx_bank_log', 'tx_aries_log', 'tx_aries_chk_dpt', 'tx_aries_chk_tt', 'tx_aries_page'] },
    { title: 'Bảng phụ' },
  ],
};
