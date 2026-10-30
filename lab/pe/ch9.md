# Chapter 9 — Application Development

## 9.1
Java programs usually run more slowly than C or C++ programs. Why, then, do servlets perform better than programs that use the common gateway interface (CGI)? Give the main reason.

## 9.2
List some advantages and disadvantages of connectionless protocols compared with protocols that keep connections open.

## 9.3
A carelessly written online-shopping web application puts the price of each item in a hidden form variable on the page sent to the customer; when the customer submits the form, the value of that hidden variable is used to compute the customer’s bill. What is the loophole in this design? (Customers of a real online-shopping site actually exploited such a loophole before it was noticed and fixed.)

## 9.4
Another carelessly written web application uses a servlet that checks whether there is an active session, but does not check whether the user is authorized to access the page; it relies on the fact that the link to the page is displayed only to authorized users. What is the risk in this approach? (In a real case, applicants to a college-admissions site logged in and used this loophole to view information they were not authorized to see; the access was detected, and those who did it were punished by being denied admission.)

## 9.5
Why is it important to open JDBC connections with the try-with-resources syntax, `try (…) { … }`?

## 9.6
List three ways in which caching can be used to improve the performance of a web server.

## 9.7
The netstat command (on Linux and Windows) lists the active network connections of a computer. Explain how it can be used to discover whether a particular web page fails to close the connections it opens — or, when connection pooling is used, fails to return connections to the pool. Take into account that, with connection pooling, a connection may not be closed right away.

## 9.8
Testing for SQL-injection vulnerability:

### a
Propose an approach to test whether an application is vulnerable to SQL-injection attacks through text input.

### b
Can SQL injection happen through kinds of HTML input other than text boxes? If so, how would you test for that vulnerability?

## 9.9
The values of some attributes of a database relation may be stored encrypted for security. Why do database systems not support indexes on encrypted attributes? Using your answer, explain why database systems do not allow primary-key attributes to be encrypted.

## 9.10
Exercise 9.9 deals with encrypting particular attributes. Some database systems, however, can encrypt the whole database. Explain how encrypting the entire database avoids the problems raised in Exercise 9.9.

## 9.11
Suppose someone pretends to be a company and obtains a certificate from a certificate-issuing authority. What is the effect on items (such as purchase orders or programs) certified by the company that was impersonated, and on items certified by other companies?

## 9.12
The passwords that control access to a database are arguably its most important data items. Propose a scheme for storing passwords securely. The scheme must still let the system check the passwords that users supply when they try to log in.
