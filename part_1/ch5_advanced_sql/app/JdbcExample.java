// Chương 5 — JDBC (tham khảo). Cần: JDK 11+, server PostgreSQL có University
// database (chạy lab/db/university_schema.sql + lab/db/university_data.sql), và
// PostgreSQL JDBC driver (https://jdbc.postgresql.org).
//
//   javac JdbcExample.java
//   java -cp .:postgresql-42.x.jar JdbcExample <user> <password>     (Windows: dùng ; thay cho :)

import java.sql.*;

public class JdbcExample {
    static final String URL = "jdbc:postgresql://localhost:5432/university";

    public static void main(String[] args) {
        String userid = args.length > 0 ? args[0] : "postgres";
        String passwd = args.length > 1 ? args[1] : "";

        // try-with-resources: connection & statement tự đóng khi ra khỏi khối try (Java 7+, JDBC 4+)
        try (Connection conn = DriverManager.getConnection(URL, userid, passwd);
             Statement stmt = conn.createStatement()) {

            // --- Update to database
            try {
                stmt.executeUpdate("insert into instructor values ('77987', 'Kim', 'Physics', 98000)");
            } catch (SQLException sqle) {
                System.out.println("Could not insert tuple. " + sqle);
            }

            // --- Execute query and fetch and print results
            ResultSet rset = stmt.executeQuery(
                "select dept_name, avg(salary) from instructor group by dept_name");
            while (rset.next()) {
                System.out.println(rset.getString("dept_name") + " " + rset.getFloat(2));
            }

            // --- Prepared statement: luôn dùng khi có input của người dùng
            PreparedStatement pStmt = conn.prepareStatement(
                "insert into instructor values (?, ?, ?, ?)");
            pStmt.setString(1, "88877");
            pStmt.setString(2, "Perry");
            pStmt.setString(3, "Finance");
            pStmt.setInt(4, 125000);
            pStmt.executeUpdate();
            pStmt.setString(1, "88878");
            pStmt.executeUpdate();

            // --- Null values
            ResultSet rs = stmt.executeQuery("select ID, grade from takes where ID = '98988'");
            while (rs.next()) {
                String grade = rs.getString("grade");
                if (rs.wasNull()) System.out.println(rs.getString(1) + ": Got null value");
                else System.out.println(rs.getString(1) + ": " + grade);
            }

            // --- ResultSetMetaData
            ResultSetMetaData rsmd = stmt.executeQuery("select * from department").getMetaData();
            for (int i = 1; i <= rsmd.getColumnCount(); i++) {
                System.out.println(rsmd.getColumnName(i) + " " + rsmd.getColumnTypeName(i));
            }

            // --- DatabaseMetaData
            DatabaseMetaData dbmd = conn.getMetaData();
            ResultSet cols = dbmd.getColumns(null, "public", "department", "%");
            while (cols.next()) {
                System.out.println(cols.getString("COLUMN_NAME") + " " + cols.getString("TYPE_NAME"));
            }
            ResultSet pk = dbmd.getPrimaryKeys(null, "public", "takes");
            while (pk.next()) {
                System.out.println(pk.getString("KEY_SEQ") + " " + pk.getString("COLUMN_NAME"));
            }

            // --- Transaction control
            conn.setAutoCommit(false);
            try (PreparedStatement p = conn.prepareStatement(
                    "update department set budget = budget + ? where dept_name = ?")) {
                p.setInt(1, -10000); p.setString(2, "Finance"); p.executeUpdate();
                p.setInt(1, 10000);  p.setString(2, "History"); p.executeUpdate();
                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
            } finally {
                conn.setAutoCommit(true);
            }

            // --- Callable statement (cần tạo function dept_count — bài 5.01)
            try (CallableStatement cStmt = conn.prepareCall("{? = call dept_count(?)}")) {
                cStmt.registerOutParameter(1, Types.INTEGER);
                cStmt.setString(2, "Physics");
                cStmt.execute();
                System.out.println("dept_count(Physics) = " + cStmt.getInt(1));
            } catch (SQLException e) {
                System.out.println("Chưa có function dept_count: " + e.getMessage());
            }

        } catch (SQLException sqle) {
            System.out.println("SQLException : " + sqle);
        }
    }
}
