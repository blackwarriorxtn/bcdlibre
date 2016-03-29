

DROP DATABASE IF EXISTS bibliopuce
;

CREATE DATABASE IF NOT EXISTS bibliopuce DEFAULT CHARACTER SET = utf8
;
USE bibliopuce
;

GRANT 
  ALL PRIVILEGES
ON 
  bibliopuce.* 
TO 
  'bibliopuce'@'localhost' IDENTIFIED BY 'FPxWFYVux7BhEuU9',
  'bibliopuce'@'127.0.0.1' IDENTIFIED BY 'FPxWFYVux7BhEuU9',
  'bibliopuce'@'::1'       IDENTIFIED BY 'FPxWFYVux7BhEuU9'
 WITH  
   GRANT OPTION
;
FLUSH PRIVILEGES
;


DROP TABLE IF EXISTS item
;
CREATE TABLE item(
  id INTEGER NOT NULL AUTO_INCREMENT,

  book_id INTEGER NULL COMMENT 'Link to the book table (it item is a book - NULL otherwise)',
  dvd_id INTEGER NULL COMMENT 'Link to the dvd table (it item is a DVD - NULL otherwise)',

  PRIMARY KEY(id),
  KEY item_book_id(book_id),
  KEY item_dvd_id(dvd_id)

) ENGINE=INNODB COMMENT 'Items in the inventory (one row per instance)'
;

DROP TABLE IF EXISTS book
;
CREATE TABLE book(
  id INTEGER NOT NULL AUTO_INCREMENT,

  title VARCHAR(255) NOT NULL COMMENT 'Book Title',
  author VARCHAR(255) NOT NULL COMMENT 'Book Author',
  description TEXT NULL COMMENT 'Book Description (synopsis)',
  isbn13 VARCHAR(13) NULL COMMENT 'International Standard Book Number (ISBN13)',

  PRIMARY KEY(id),
  UNIQUE KEY book_isbn13(isbn13)

) ENGINE=INNODB COMMENT 'Book Description'
;

DROP TABLE IF EXISTS book_search
;
CREATE TABLE book_search(
  id INTEGER NOT NULL AUTO_INCREMENT,

  book_id INTEGER NOT NULL COMMENT 'Link to the book table (it item is a book - NULL otherwise)',
  title VARCHAR(255) NOT NULL COMMENT 'Book Title',
  author VARCHAR(255) NOT NULL COMMENT 'Book Author',

  PRIMARY KEY(id),
  KEY book_search_title(title),
  KEY book_author(author),
  FULLTEXT KEY book_ft_title(title),
  FULLTEXT KEY book_ft_author(author)

)  ENGINE=MyISAM COMMENT 'Search engine for books (MyISAM Format for FULL TEXT SEARCHES)'
;



DROP TABLE IF EXISTS user
;
CREATE TABLE user(
  id INTEGER NOT NULL AUTO_INCREMENT,

  name VARCHAR(255) NOT NULL COMMENT 'User name', 
  login VARCHAR(64) NOT NULL COMMENT 'User login', 
  phone VARCHAR(64) NULL COMMENT 'Phone number', 
  comment TEXT NULL COMMENT 'User Comment', 

  PRIMARY KEY(id),
  UNIQUE KEY user_login(login),
  KEY user_name(name),
  KEY user_phone(phone)

) ENGINE=INNODB COMMENT 'User description'
;


DROP TABLE IF EXISTS borrow
;
CREATE TABLE borrow(
  id INTEGER NOT NULL AUTO_INCREMENT,

  begin_date DATETIME NOT NULL COMMENT 'Beginning of Borrowing (Date/Time)',
  end_date DATETIME NULL COMMENT 'End of Borrowing (Date/Time)',
  item_id INTEGER NOT NULL COMMENT 'Link to borrowed item',
  user_id INTEGER NOT NULL COMMENT 'Link to borrowing user',

  PRIMARY KEY(id),
  KEY borrow_item_user(item_id,user_id),
  KEY borrow_user_item(user_id,item_id),
  KEY borrow_begin_date(begin_date),

  CONSTRAINT borrow_fk_item FOREIGN KEY(item_id) REFERENCES item(id)
      ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT borrow_fk_user FOREIGN KEY(user_id) REFERENCES user(id)
      ON UPDATE CASCADE ON DELETE RESTRICT

) ENGINE=INNODB COMMENT 'Borrowing information (link between user and item)'
;
