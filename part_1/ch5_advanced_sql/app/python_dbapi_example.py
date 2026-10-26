# Chương 5 — Database access from Python (tham khảo).
# Cần: Python 3, server PostgreSQL có University database, và `pip install psycopg[binary]`.
#   python python_dbapi_example.py
import psycopg

with psycopg.connect("dbname=university user=postgres") as conn:
    with conn.cursor() as cur:
        # Truy vấn & duyệt kết quả
        cur.execute("select dept_name, avg(salary) from instructor group by dept_name")
        for dept_name, avg_salary in cur:
            print(dept_name, avg_salary)

        # Tham số (%s) — tương đương PreparedStatement, chống SQL injection
        name = "X' or 'Y' = 'Y"
        cur.execute("select ID, name from instructor where name = %s", (name,))
        print("Số dòng:", len(cur.fetchall()))  # 0

        # Transaction: khối `with conn` commit khi thành công, rollback khi có exception
        try:
            cur.execute("update department set budget = budget - 10000 where dept_name = %s", ("Finance",))
            cur.execute("update department set budget = budget + 10000 where dept_name = %s", ("History",))
            conn.commit()
        except psycopg.Error:
            conn.rollback()

        # Metadata của kết quả
        cur.execute("select * from department")
        print([col.name for col in cur.description])
