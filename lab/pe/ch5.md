# Chapter 5 — Advanced SQL

## 5.1
A company database has the relations emp (*ename*, *dname*, *salary*) and mgr (*ename*, *mname*). The Java program in Figure 5.20 uses JDBC on this database (assume the user id, password, machine name, etc. are all correct). Describe in one concise English sentence what the program does overall — for example “It finds the manager of the toy department” — rather than explaining each Java statement line by line.

## 5.2
Write a Java method that receives a ResultSet as a parameter and, using JDBC metadata features, prints the result as a table whose column headings are the appropriate column names.

## 5.3
We want every course that must be taken before a given course: its prerequisites, the prerequisites of those, and so on. Write a complete Java program using JDBC that:

- reads a *course_id* value from the keyboard;
- finds the prerequisites of that course with an SQL query sent through JDBC;
- for each course returned, finds its prerequisites, repeating this iteratively until no new prerequisite courses appear;
- prints the result.

Do not use a recursive SQL query; use the iterative approach above. A good solution should also cope with the error case in which the university has accidentally created a cycle of prerequisites (for example, course A is a prerequisite of B, B of C, and C of A).

## 5.4
Describe situations in which you would choose embedded SQL instead of using only SQL or only a general-purpose programming language.

## 5.5
Using triggers, show how to enforce the constraint “an instructor cannot teach two different sections in a semester in the same time slot”. Remember that the constraint can be violated by changes to the *teaches* relation as well as to the *section* relation.

## 5.6
Consider the bank database of Figure 5.21. Define the view *branch_cust* as:

```sql
create view branch_cust as
  select branch_name, customer_name
  from depositor, account
  where depositor.account_number = account.account_number
```

Assume the view is materialized (computed and stored). Write triggers that keep it up to date when tuples are inserted into *depositor* or *account*. Deletions and updates need not be handled, and for simplicity duplicates need not be eliminated.

## 5.7
Consider the bank database of Figure 5.21. Write an SQL trigger that does the following: when an account is deleted, for each customer who owned that account, check whether the customer still owns any other account; if not, remove the customer from the *depositor* relation.

## 5.8
Given a relation S (*student*, *subject*, *marks*), write a query using SQL ranking that finds the top 10 students by total marks. Students tied for the last place must all be included, even if that gives more than 10 students in total.

## 5.9
Given a relation nyse (*year*, *month*, *day*, *shares_traded*, *dollar_volume*) holding trading data of the New York Stock Exchange, list every trading day ordered by the number of shares traded, showing the rank of each day.

## 5.10
Using the relation of Exercise 5.9, write an SQL query producing a report of the number of shares traded, the number of trades, and the total dollar volume, broken down by year, by each month of each year, and by each trading day.

## 5.11
Show how to express **group by cube**(a, b, c, d) using **rollup**, with only a single **group by** clause in your answer.

## Figure 5.20
*Figure 5.20 — Java code for Exercise 5.1 (Oracle JDBC):*

```java
import java.sql.*;
public class Mystery {
  public static void main(String[] args) {
    try (
      Connection con = DriverManager.getConnection(
        "jdbc:oracle:thin:star/X@//edgar.cse.lehigh.edu:1521/XE");
      q = "select mname from mgr where ename = ?";
      PreparedStatement stmt = con.prepareStatement();
    ) {
      String q;
      String empName = "dog";
      boolean more;
      ResultSet result;
      do {
        stmt.setString(1, empName);
        result = stmt.executeQuery(q);
        more = result.next();
        if (more) {
          empName = result.getString("mname");
          System.out.println(empName);
        }
      } while (more);
      s.close();
      con.close();
    }
    catch (Exception e) {
      e.printStackTrace();
    }
  }
}
```

## Figure 5.21
*Figure 5.21 — Banking database for Exercise 5.6:*

- branch (branch_name, branch_city, assets)
- customer (customer_name, customer_street, customer_city)
- loan (loan_number, branch_name, amount)
- borrower (customer_name, loan_number)
- account (account_number, branch_name, balance)
- depositor (customer_name, account_number)
