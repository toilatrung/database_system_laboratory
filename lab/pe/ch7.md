# Chapter 7 — Relational Database Design

## 7.1
The schema R = (A, B, C, D, E) is decomposed into (A, B, C) and (A, D, E). Show that this decomposition is lossless when the following set F of functional dependencies holds:

A → BC, CD → E, B → D, E → A

## 7.2
List every nontrivial functional dependency satisfied by the relation of Figure 7.18.

## 7.3
Explain how functional dependencies can be used to express each of the following:

- a one-to-one relationship set exists between the entity sets *student* and *instructor*;
- a many-to-one relationship set exists between the entity sets *student* and *instructor*.

## 7.4
Use Armstrong’s axioms to prove that the union rule is sound. (Hint: with the augmentation rule show that if α → β then α → αβ. Apply augmentation again using α → γ, and then apply the transitivity rule.)

## 7.5
Use Armstrong’s axioms to prove that the pseudotransitivity rule is sound.

## 7.6
For the relation schema R = (A, B, C, D, E), compute the closure of the following set F of functional dependencies:

A → BC, CD → E, B → D, E → A

List the candidate keys of R.

## 7.7
Using the functional dependencies of Exercise 7.6, compute the canonical cover F<sub>c</sub>.

## 7.8
Consider the algorithm of Figure 7.19 for computing α<sup>+</sup>. Show that it is more efficient than the algorithm of Figure 7.8 (Section 7.4.2) and that it computes α<sup>+</sup> correctly.

## 7.9
For the schema R(A, B, C) and a relation r on R, write an SQL query that tests whether the functional dependency B → C holds on r. Also write an SQL assertion that enforces this dependency. Assume no null values are present. (Such assertions belong to the SQL standard but no database implementation currently supports them.)

## 7.10
Our treatment of lossless decomposition silently assumed that attributes on the left-hand side of a functional dependency cannot be null. What could go wrong in a decomposition if this assumption is violated?

## 7.11
In the BCNF decomposition algorithm, suppose a functional dependency α → β is used to decompose a relation schema r(α, β, γ) into r<sub>1</sub>(α, β) and r<sub>2</sub>(α, γ).

### a
Which primary-key and foreign-key constraints do you expect to hold on the decomposed relations?

### b
Give an example of an inconsistency that an erroneous update could cause if the foreign-key constraint were not enforced on these decomposed relations.

### c
When a relation schema is decomposed into 3NF with the algorithm of Section 7.5.2, which primary-key and foreign-key dependencies would you expect on the decomposed schema?

## 7.12
Let R<sub>1</sub>, R<sub>2</sub>, …, R<sub>n</sub> be a decomposition of schema U, let u(U) be a relation, and let r<sub>i</sub> = Π<sub>R<sub>i</sub></sub>(u). Show that

u ⊆ r<sub>1</sub> ⋈ r<sub>2</sub> ⋈ ⋯ ⋈ r<sub>n</sub>

## 7.13
Show that the decomposition of Exercise 7.1 does not preserve dependencies.

## 7.14
Using the dependencies X → YZ, Y → XZ, and Z → XY, show that a set of functional dependencies can have more than one canonical cover.

## 7.15
The canonical-cover algorithm removes only one extraneous attribute at a time. With the functional dependencies of Exercise 7.14, show what can go wrong if two attributes found to be extraneous are removed at the same time.

## 7.16
Show that a dependency-preserving decomposition into 3NF can be made lossless by guaranteeing that at least one schema contains a candidate key of the schema being decomposed. (Hint: show that the join of all projections onto the schemas of the decomposition cannot have more tuples than the original relation.)

## 7.17
Give an example of a relation schema R′ and a set F′ of functional dependencies for which there are at least three distinct lossless decompositions of R′ into BCNF.

## 7.18
Call an attribute *prime* if it appears in at least one candidate key. Let α and β be sets of attributes such that α → β holds but β → α does not, and let A be an attribute that is in neither α nor β and for which β → A holds. We then say A is *transitively dependent* on α. 3NF can be restated as: a relation schema R is in 3NF with respect to a set F of functional dependencies if no nonprime attribute A of R is transitively dependent on a key for R. Show that this definition is equivalent to the original one.

## 7.19
A functional dependency α → β is a *partial dependency* if some proper subset γ of α satisfies γ → β; β is then *partially dependent* on α. A relation schema R is in *second normal form* (2NF) if every attribute A of R satisfies one of these criteria:

- it appears in a candidate key;
- it is not partially dependent on a candidate key.

Show that every 3NF schema is in 2NF. (Hint: show that every partial dependency is a transitive dependency.)

## 7.20
Give an example of a relation schema R and a set of dependencies for which R is in BCNF but not in 4NF.

## Figure 7.18
*Figure 7.18 — Relation of Exercise 7.2:*

| A | B | C |
|---|---|---|
| a1 | b1 | c1 |
| a1 | b1 | c2 |
| a2 | b1 | c1 |
| a2 | b1 | c3 |
