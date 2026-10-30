# Chapter 6 — Database Design Using the E-R Model

## 6.1
Construct an E-R diagram for a car-insurance company. Each customer owns one or more cars. Each car has zero or more recorded accidents. Each insurance policy covers one or more cars and has one or more premium payments. Each payment covers a particular period of time and has a due date and the date on which the payment was received.

## 6.2
A database contains the entity sets *student*, *course*, and *section* of the university schema, and in addition records the marks students obtain in the different exams of the different sections.

### a
Construct an E-R diagram that models exams as entities and uses a ternary relationship in the design.

### b
Construct an alternative E-R diagram that uses only a binary relationship between *student* and *section*. There must be only one relationship between a given *student* and *section* pair, yet it must still be possible to represent the marks a student gets in different exams.

## 6.3
Design an E-R diagram that keeps track of the scoring statistics of your favorite sports team. Store the matches played, the scores of each match, the players in each match, and each player’s individual scoring statistics for each match. Model summary statistics as derived attributes, explaining how each one is computed.

## 6.4
In an E-R diagram the same entity set may appear several times, with its attributes repeated in more than one occurrence. Why is allowing this redundancy a bad practice that should be avoided?

## 6.5
An E-R diagram can be seen as a graph. What does each of the following mean for the structure of an enterprise schema?

### a
The graph is disconnected.

### b
The graph has a cycle.

## 6.6
Consider representing the ternary relationship R of Figure 6.29a (among A, B, C) by an entity set E with binary relationships R<sub>A</sub>, R<sub>B</sub>, R<sub>C</sub>, as in Figure 6.29b (attributes not shown).

### a
Give a simple instance of E, A, B, C, R<sub>A</sub>, R<sub>B</sub>, and R<sub>C</sub> that cannot correspond to any instance of A, B, C, and R.

### b
Modify the E-R diagram of Figure 6.29b by adding constraints that guarantee every instance of E, A, B, C, R<sub>A</sub>, R<sub>B</sub>, and R<sub>C</sub> satisfying them corresponds to an instance of A, B, C, and R.

### c
Modify the translation above so that it also handles total participation constraints on the ternary relationship.

## 6.7
A weak entity set can always be turned into a strong entity set by adding to its attributes the primary-key attributes of its identifying entity set. Describe the kind of redundancy this produces.

## 6.8
Take a relation such as *sec_course*, created from the many-to-one relationship set *sec_course*. Do the primary-key and foreign-key constraints created on that relation enforce the many-to-one cardinality constraint? Explain why.

## 6.9
Suppose the *advisor* relationship set were one-to-one. Which additional constraints are needed on the relation *advisor* so that the one-to-one cardinality constraint is enforced?

## 6.10
Let R be a many-to-one relationship between entity sets A and B, and suppose the relation created from R is merged into the relation created from A. In SQL, attributes that take part in a foreign-key constraint may be null. Explain how total participation of A in R can be enforced with **not null** constraints in SQL.

## 6.11
In SQL a foreign key may reference only the primary-key attributes of the referenced relation, or other attributes declared as a superkey with **unique**. Consequently, total participation constraints on a many-to-many relationship set (or on the “one” side of a one-to-many relationship set) cannot be enforced on the relations created from that relationship set using only primary-key, foreign-key, and not-null constraints.

### a
Explain why.

### b
Explain how total participation constraints can be enforced using complex check constraints or assertions (see Section 4.4.8). (These features are, unfortunately, not supported by any widely used database at present.)

## 6.12
Consider a lattice of generalization and specialization (attributes not shown) with higher-level entity sets X and Y and lower-level entity sets A, B, C: A specializes X, B specializes both X and Y, and C specializes Y.

For entity sets A, B, and C, explain how attributes are inherited from the higher-level entity sets X and Y. Discuss how to deal with the case where an attribute of X has the same name as an attribute of Y.

## 6.13
An E-R diagram normally models the state of an enterprise at one point in time. Suppose instead we want to track *temporal changes*, i.e., how data changes over time. For instance, Zhang may have been a student from September 2015 to May 2019, and Shankar may have had instructor Einstein as advisor from May 2018 to December 2018 and again from June 2019 to January 2020. Likewise, attribute values of entities or relationships — such as *title* and *credits* of *course*, *salary* or even *name* of *instructor*, and *tot_cred* of *student* — can change over time.

One way to model this: define a new data type **valid time**, which is a time interval or a set of time intervals, and attach a *valid_time* attribute to every entity and relationship, recording the periods during which it is valid. The end of an interval may be infinity; e.g., if Shankar became a student in September 2018 and still is one, the end of the valid-time interval of the Shankar entity is infinity. Attributes that change over time are modeled as a set of values, each with its own *valid_time*.

### a
Draw an E-R diagram with the *student* and *instructor* entities and the *advisor* relationship, using the extensions above to track temporal changes.

### b
Convert that E-R diagram into a set of relations.

### ~
The resulting set of relations is clearly quite complex, which makes tasks such as writing SQL queries difficult. A more widely used alternative is to ignore temporal changes (especially changes to attribute values) while designing the E-R model, and then modify the relations generated from the E-R model so that they track temporal changes.
