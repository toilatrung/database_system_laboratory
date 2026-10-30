# Practice Exercises — đề gốc

Đề gốc (tiếng Anh, giữ nguyên văn) của toàn bộ Practice Exercises chương 1–7, *Database System Concepts*, 7th Ed.
Nguồn: <https://www.db-book.com/Practice-Exercises/index-solu.html>.

`lab/tools/pe.mjs` đọc các file này. Bài trong `part_N/content/*.mjs` trỏ tới đề bằng `pe`:

| Giá trị | Hiển thị |
|---|---|
| `pe: '3.2'` | toàn bộ bài 3.2 (đề chung + mọi câu) |
| `pe: '3.2a'` | đề chung của 3.2 + câu a |
| `pe: '3.2ab'` | đề chung + câu a và b |
| `pe: ['6.8', '6.11']` | nhiều bài, lần lượt |

Hình mà đề nhắc tới (`Figure 3.17`…) được nối vào cuối nếu có trong file.

## Định dạng
- `## 3.2` mở một bài; phần trước câu đầu tiên là đề chung.
- `### a` mở câu a. `### ~` là đoạn kết của bài, luôn được hiển thị kèm.
- `## Figure 3.17` là một hình (schema, bảng, code).
