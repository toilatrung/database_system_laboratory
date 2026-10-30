# Chapter 8 — Complex Data Types

## 8.1
Using the sample university database, present the information about the student named Shankar — his *student* tuple, the *takes* tuples that belong to him, and the *course* tuples that those *takes* tuples refer to — in each of the following forms:

### a
JSON, with a suitable nested structure.

### b
XML, with the same nesting as in part a.

### c
RDF triples.

### d
An RDF graph.

## 8.2
Take the RDF representation of university data illustrated in Figure 8.3. Express each of the following queries in SPARQL.

### a
Find the titles of every course taken by any student whose name is Zhang.

### b
Find the titles of the courses for which a student named Zhang takes a section that is taught by an instructor named Srinivasan.

### c
Without listing the attribute names explicitly in the query, find the names and values of all attributes of the instructor named Srinivasan.

## 8.3
A car-rental company keeps a database of every vehicle in its current fleet. For every vehicle it stores the vehicle identification number, license number, manufacturer, model, purchase date, and color. Some kinds of vehicles carry extra data:

- Trucks: cargo capacity.
- Sports cars: horsepower, and the minimum age required of the renter.
- Vans: number of passengers.
- Off-road vehicles: ground clearance, and drivetrain (four-wheel or two-wheel drive).

Write an SQL schema definition for this database, using inheritance where it is appropriate.

## 8.4
A database schema has a relation Emp whose attributes are listed below; types are given for the multivalued attributes.

- Emp = (ename, ChildrenSet **multiset**(Children), SkillSet **multiset**(Skills))
- Children = (name, birthday)
- Skills = (type, ExamSet **setof**(Exams))
- Exams = (year, city)

Define this schema in SQL, declaring the multiset attributes with the SQL Server table-type syntax of Section 8.2.1.1.

## 8.5
Figure 8.7 shows an E-R diagram for the entity set *instructor*. Write an SQL schema definition that corresponds to this E-R diagram, using Oracle or PostgreSQL syntax and representing *phone_number* as an array of 10 elements.

## 8.6
Take the relational schema of Figure 8.8.

### a
Write an SQL schema definition for it in which the foreign-key relationships are expressed with references (reference types).

### b
Write each of these queries in SQL on that schema: (i) find the company with the most employees; (ii) find the company with the smallest payroll; (iii) find the companies whose employees earn, on average, a higher salary than the average salary at First Bank Corporation.

## 8.7
Using suitable definitions of term frequency and inverse document frequency, compute how relevant each Practice Exercise of this chapter is to the query “SQL relation”.

## 8.8
Show how the matrices used to compute PageRank can be stored as relations. Then write an SQL query that performs one step of the iterative PageRank technique, so that the whole algorithm can be implemented as a loop around that query.

## 8.9
Assume the *student* relation has an attribute *location* of type point, and the *classroom* relation has an attribute *location* of type polygon. Using the PostGIS spatial functions and predicates introduced in the chapter, write these queries in SQL:

### a
Find the names of the students whose location lies inside the classroom Packard 101.

### b
Find every classroom that lies within 100 meters of Packard 101; assume all distances are measured in meters.

### c
Find the ID and name of the student who is geographically closest to the student whose ID is 12345.

### d
Find the IDs and names of every pair of students whose locations are less than 200 meters apart.

## Figure 8.3
*Figure 8.3 — RDF representation of part of the university data (subject, predicate, object):*

| subject | predicate | object |
|---|---|---|
| 10101 | instance-of | instructor |
| 10101 | name | "Srinivasan" |
| 10101 | salary | "65000" |
| 00128 | instance-of | student |
| 00128 | name | "Zhang" |
| 00128 | tot_cred | "102" |
| comp_sci | dept_name | "Comp. Sci." |
| biology | dept_name | "Biology" |
| CS-101 | instance-of | course |
| CS-101 | title | "Intro. to Computer Science" |
| CS-101 | course_dept | comp_sci |
| sec1 | instance-of | section |
| sec1 | sec_course | CS-101 |
| sec1 | sec_id | "1" |
| sec1 | semester | "Fall" |
| sec1 | year | "2017" |
| sec1 | classroom | packard-101 |
| sec1 | time_slot_id | "H" |
| 10101 | inst_dept | comp_sci |
| 00128 | stud_dept | comp_sci |
| 00128 | takes | sec1 |
| 10101 | teaches | sec1 |

## Figure 8.7
*Figure 8.7 — E-R diagram with composite, multivalued, and derived attributes:*

```
instructor
  ID
  name
    first_name
    middle_initial
    last_name
  address
    street
      street_number
      street_name
      apt_number
    city
    state
    zip
  { phone_number }
  date_of_birth
  age ( )
```

## Figure 8.8
*Figure 8.8 — Relational database for Exercise 8.6:*

- employee (person_name, street, city)
- works (person_name, company_name, salary)
- company (company_name, city)
- manages (person_name, manager_name)
