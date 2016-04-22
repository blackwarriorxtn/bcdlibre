

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

DROP TABLE IF EXISTS item_detail
;
CREATE TABLE item_detail(
  id INTEGER NOT NULL AUTO_INCREMENT,

  title VARCHAR(255) NOT NULL COMMENT 'Item Title',
  author VARCHAR(255) NOT NULL COMMENT 'Item Author',
  description TEXT NULL COMMENT 'Item Description (synopsis)',
  isbn13 VARCHAR(13) NULL COMMENT 'International Standard Book Number (ISBN13)',

  PRIMARY KEY(id),
  UNIQUE KEY id_isbn13(isbn13)

) ENGINE=INNODB COMMENT 'Item Description'
;

DROP TABLE IF EXISTS item
;
CREATE TABLE item(
  id INTEGER NOT NULL AUTO_INCREMENT,

  item_detail_id INTEGER NOT NULL COMMENT 'Link to item description',

  PRIMARY KEY(id),
  KEY item_item_detail_id(item_detail_id),

  CONSTRAINT item_fk_description FOREIGN KEY(item_detail_id) REFERENCES item_detail(id)
      ON UPDATE CASCADE ON DELETE RESTRICT

) ENGINE=INNODB COMMENT 'Items in the inventory (one row per instance)'
;

DROP TABLE IF EXISTS item_detail_search
;
CREATE TABLE item_detail_search(
  id INTEGER NOT NULL AUTO_INCREMENT,

  item_detail_id INTEGER NOT NULL COMMENT 'Link to the item_detail table',
  title VARCHAR(255) NOT NULL COMMENT 'Item Title',
  author VARCHAR(255) NOT NULL COMMENT 'Item Author',

  PRIMARY KEY(id),
  KEY item_detail_search_title(title),
  KEY item_detail_search_author(author),
  FULLTEXT KEY item_ft_title(title),
  FULLTEXT KEY item_ft_author(author)

)  ENGINE=MyISAM COMMENT 'Search engine for items (MyISAM Format for FULL TEXT SEARCHES)'
;

/* Create trigger on item_detail to copy data into item_detail_search */
SET @SAVE_SQL_MODE=@@SQL_MODE
;
DELIMITER ;;
SET SESSION SQL_MODE="";;
/* INSERT : After INSERT INTO table, INSERT INTO search table */
DROP TRIGGER IF EXISTS `item_detail_after_insert`;;
CREATE DEFINER=CURRENT_USER TRIGGER `item_detail_after_insert` AFTER INSERT ON `item_detail` 
FOR EACH ROW BEGIN
  INSERT INTO item_detail_search(item_detail_id, title, author) VALUES(NEW.id, NEW.title, NEW.author);
END ;;
/* UPDATE : After UPDATE table, UPDATE search table */
DROP TRIGGER IF EXISTS `item_detail_after_update`;;
CREATE DEFINER=CURRENT_USER TRIGGER `item_detail_after_update` AFTER UPDATE ON `item_detail` 
FOR EACH ROW BEGIN
  UPDATE item_detail_search SET 
    item_detail_search.title = NEW.title, 
    item_detail_search.author = NEW.author 
  WHERE item_detail_search.item_detail_id = NEW.id;
END ;;
/* DELETE : After DELETE table, DELETE search table */
DROP TRIGGER IF EXISTS `item_detail_after_delete`;;
CREATE DEFINER=CURRENT_USER TRIGGER `item_detail_after_delete` AFTER DELETE ON `item_detail` 
FOR EACH ROW BEGIN
  DELETE FROM item_detail_search 
  WHERE item_detail_search.item_detail_id = OLD.id;
END ;;
DELIMITER ;
SET SESSION SQL_MODE=@SAVE_SQL_MODE
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

DROP TABLE IF EXISTS user_search
;
CREATE TABLE user_search(
  id INTEGER NOT NULL AUTO_INCREMENT,

  user_id INTEGER NOT NULL COMMENT 'Link to the user table',
  name VARCHAR(255) NOT NULL COMMENT 'User name',
  login VARCHAR(64) NOT NULL COMMENT 'User login',

  PRIMARY KEY(id),
  KEY user_search_name(name),
  KEY user_search_login(login),
  FULLTEXT KEY user_ft_name(name),
  FULLTEXT KEY user_ft_login(login)

)  ENGINE=MyISAM COMMENT 'Search engine for users (MyISAM Format for FULL TEXT SEARCHES)'
;

/* Create trigger on user to copy data into user_search */
/* Create trigger on item_detail to copy data into item_detail_search */
SET @SAVE_SQL_MODE=@@SQL_MODE
;
DELIMITER ;;
SET SESSION SQL_MODE="";;
/* INSERT : After INSERT INTO table, INSERT INTO search table */
DROP TRIGGER IF EXISTS `user_after_insert`;;
CREATE DEFINER=CURRENT_USER TRIGGER `user_after_insert` AFTER INSERT ON `user` 
FOR EACH ROW BEGIN
  INSERT INTO user_search(user_id, name, login) VALUES(NEW.id, NEW.name, NEW.login);
END ;;
/* UPDATE : After UPDATE table, UPDATE search table */
DROP TRIGGER IF EXISTS `user_after_update`;;
CREATE DEFINER=CURRENT_USER TRIGGER `user_after_update` AFTER UPDATE ON `user` 
FOR EACH ROW BEGIN
  UPDATE user_search SET 
    user_search.name = NEW.name, 
    user_search.login = NEW.login 
  WHERE user_search.user_id = NEW.id;
END ;;
/* DELETE : After DELETE table, DELETE search table */
DROP TRIGGER IF EXISTS `user_after_delete`;;
CREATE DEFINER=CURRENT_USER TRIGGER `user_after_delete` AFTER DELETE ON `user` 
FOR EACH ROW BEGIN
  DELETE FROM user_search 
  WHERE user_search.user_id = OLD.id;
END ;;
DELIMITER ;
SET SESSION SQL_MODE=@SAVE_SQL_MODE
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
  /* Can't borrow the same item twice: UNIQUE KEY */
  UNIQUE KEY borrow_user_item(user_id,item_id),
  KEY borrow_begin_date(begin_date),

  CONSTRAINT borrow_fk_item FOREIGN KEY(item_id) REFERENCES item(id)
      ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT borrow_fk_user FOREIGN KEY(user_id) REFERENCES user(id)
      ON UPDATE CASCADE ON DELETE RESTRICT

) ENGINE=INNODB COMMENT 'Borrowing information (link between user and item)'
;
