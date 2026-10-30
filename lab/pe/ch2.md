# Chapter 2 — Introduction to the Relational Model

## 2.1
Consider the employee database of Figure 2.17. What are the appropriate primary keys?

## 2.2
Consider the foreign-key constraint from the *dept_name* attribute of *instructor* to the *department* relation. Give examples of inserts and deletes to these relations that can cause a violation of the foreign-key constraint.

## 2.3
Consider the *time_slot* relation. Given that a particular time slot can meet more than once in a week, explain why *day* and *start_time* are part of the primary key of this relation, while *end_time* is not.

## 2.4
In the instance of *instructor* shown in Figure 2.1, no two instructors have the same name. From this, can we conclude that *name* can be used as a superkey (or primary key) of *instructor*?

## 2.5
What is the result of first performing the Cartesian product of *student* and *advisor*, and then performing a selection operation on the result with the predicate *s_id* = *ID*? (Using the symbolic notation of relational algebra, this query can be written as σ<sub>s_id=ID</sub>(*student* × *advisor*).)

## 2.6
Consider the employee database of Figure 2.17. Give an expression in the relational algebra to express each of the following queries:

### a
Find the name of each employee who lives in city “Miami”.

### b
Find the name of each employee whose salary is greater than $100000.

### c
Find the name of each employee who lives in “Miami” and whose salary is greater than $100000.

## 2.7
Consider the bank database of Figure 2.18. Give an expression in the relational algebra for each of the following queries:

### a
Find the name of each branch located in “Chicago”.

### b
Find the ID of each borrower who has a loan in branch “Downtown”.

## 2.8
Consider the employee database of Figure 2.17. Give an expression in the relational algebra to express each of the following queries:

### a
Find the ID and name of each employee who does not work for “BigBank”.

### b
Find the ID and name of each employee who earns at least as much as every employee in the database.

## 2.9
The division operator of relational algebra, “÷”, is defined as follows. Let r(R) and s(S) be relations, and let S ⊆ R; that is, every attribute of schema S is also in schema R. Given a tuple t, let t[S] denote the projection of tuple t on the attributes in S. Then r ÷ s is a relation on schema R − S (that is, on the schema containing all attributes of schema R that are not in schema S). A tuple t is in r ÷ s if and only if both of two conditions hold:

- t is in Π<sub>R−S</sub>(r)
- For every tuple t<sub>s</sub> in s, there is a tuple t<sub>r</sub> in r satisfying both of the following:
  - t<sub>r</sub>[S] = t<sub>s</sub>[S]
  - t<sub>r</sub>[R − S] = t

Given the above definition:

### a
Write a relational algebra expression using the division operator to find the IDs of all students who have taken all Comp. Sci. courses. (Hint: project *takes* to just ID and *course_id*, and generate the set of all Comp. Sci. *course_id*s using a select expression, before doing the division.)

### b
Show how to write the above query in relational algebra, without using division. (By doing so, you would have shown how to define the division operation using the other relational algebra operations.)

## Figure 2.17
*Figure 2.17 — Employee database* (primary keys underlined):

- employee (<u>ID</u>, person_name, street, city)
- works (<u>ID</u>, company_name, salary)
- company (<u>company_name</u>, city)

## Figure 2.18
*Figure 2.18 — Bank database* (primary keys underlined):

- branch (<u>branch_name</u>, branch_city, assets)
- customer (<u>ID</u>, customer_name, customer_street, customer_city)
- loan (<u>loan_number</u>, branch_name, amount)
- borrower (<u>ID, loan_number</u>)
- account (<u>account_number</u>, branch_name, balance)
- depositor (<u>ID, account_number</u>)
