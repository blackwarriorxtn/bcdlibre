

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
  series_title VARCHAR(255) NULL COMMENT 'Item Series Title',
  classification TEXT NULL COMMENT 'Item Classification (free text, can include Dewey Decimal Classification)',

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
      ON UPDATE CASCADE ON DELETE CASCADE

) ENGINE=INNODB COMMENT 'Items in the inventory (one row per instance)'
;

DROP TABLE IF EXISTS item_detail_search
;
CREATE TABLE item_detail_search(
  id INTEGER NOT NULL AUTO_INCREMENT,

  item_detail_id INTEGER NOT NULL COMMENT 'Link to the item_detail table',
  title VARCHAR(255) NOT NULL COMMENT 'Item Title',
  author VARCHAR(255) NOT NULL COMMENT 'Item Author',
  description TEXT NULL COMMENT 'Item Description (synopsis)',
  isbn13 VARCHAR(13) NULL COMMENT 'International Standard Book Number (ISBN13)',
  series_title VARCHAR(255) NULL COMMENT 'Item Series Title',
  classification TEXT NULL COMMENT 'Item Classification (free text, can include Dewey Decimal Classification)',

  PRIMARY KEY(id),
  KEY item_detail_search_title(title),
  KEY item_detail_search_author(author),
  KEY item_detail_search_isbn13(isbn13),
  KEY item_detail_search_description(description(64)),
  KEY item_detail_search_series_title(series_title),
  KEY item_detail_search_classification(classification(64)),
  FULLTEXT KEY item_ft_title(title),
  FULLTEXT KEY item_ft_author(author),
  FULLTEXT KEY item_ft_description(description),
  FULLTEXT KEY item_ft_isbn13(isbn13),
  FULLTEXT KEY item_ft_series_title(series_title),
  FULLTEXT KEY item_ft_classification(classification)

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
  INSERT INTO item_detail_search(item_detail_id, title, author, description, isbn13, series_title, classification) VALUES(NEW.id, NEW.title, NEW.author, NEW.description, NEW.isbn13, NEW.series_title, NEW.classification);
END ;;
/* UPDATE : After UPDATE table, UPDATE search table */
DROP TRIGGER IF EXISTS `item_detail_after_update`;;
CREATE DEFINER=CURRENT_USER TRIGGER `item_detail_after_update` AFTER UPDATE ON `item_detail`
FOR EACH ROW BEGIN
  UPDATE item_detail_search SET
    item_detail_search.title = NEW.title,
    item_detail_search.author = NEW.author,
    item_detail_search.description = NEW.description,
    item_detail_search.isbn13 = NEW.isbn13,
    item_detail_search.series_title = NEW.series_title,
    item_detail_search.classification = NEW.classification
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


DROP TABLE IF EXISTS item_classification
;
CREATE TABLE item_classification(
  id INTEGER NOT NULL AUTO_INCREMENT,
  label VARCHAR(4096) NOT NULL,

  PRIMARY KEY(id),
  UNIQUE KEY item_classification_label(label(300)),
  FULLTEXT KEY item_classification_ft_label(label)
  
) ENGINE=MyISAM COMMENT 'Item Classification (autocompletion for free text, can include Dewey Decimal Classification)'
;


INSERT INTO item_classification(label)
VALUES
('ROMAN'),
('ALBUM'),
('ALBUM - Animaux'),
('ALBUM - Découverte'),
('ALBUM - Première Lecture'),
('BD'),
('DOCUMENTAIRE'),
('POESIE ET CONTES')
;


DROP TABLE IF EXISTS user
;
CREATE TABLE user(
  id INTEGER NOT NULL AUTO_INCREMENT,

  last_name VARCHAR(255) NOT NULL COMMENT 'User last name',
  first_name VARCHAR(255) NULL COMMENT 'User First name',
  category VARCHAR(255) NOT NULL COMMENT 'User category (classroom, level...)',
  phone VARCHAR(64) NULL COMMENT 'Phone number',
  comment TEXT NULL COMMENT 'User Comment',

  PRIMARY KEY(id),
  KEY user_category(category),
  KEY user_last_first_name(last_name,first_name),
  KEY user_first_last_name(first_name,last_name),
  KEY user_phone(phone)

) ENGINE=INNODB COMMENT 'User description'
;

DROP TABLE IF EXISTS user_search
;
CREATE TABLE user_search(
  id INTEGER NOT NULL AUTO_INCREMENT,

  user_id INTEGER NOT NULL COMMENT 'Link to the user table',
  last_name VARCHAR(255) NOT NULL COMMENT 'User last name',
  first_name VARCHAR(255) NULL COMMENT 'User First name',
  category VARCHAR(64) NULL COMMENT 'User category',
  comment TEXT NULL COMMENT 'User Comment',

  PRIMARY KEY(id),
  KEY user_search_last_first_name(last_name(128),first_name(128)),
  KEY user_search_first_last_name(first_name(128),last_name(128)),
  KEY user_search_category(category),
  KEY user_search_comment(comment(64)),
  FULLTEXT KEY user_ft_last_name(last_name),
  FULLTEXT KEY user_ft_first_name(first_name),
  FULLTEXT KEY user_ft_first_last_name(first_name,last_name),
  FULLTEXT KEY user_ft_category(category),
  FULLTEXT KEY user_ft_comment(comment)

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
  INSERT INTO user_search(user_id, last_name, first_name, category, comment) VALUES(NEW.id, NEW.last_name, NEW.first_name, NEW.category, NEW.comment);
END ;;
/* UPDATE : After UPDATE table, UPDATE search table */
DROP TRIGGER IF EXISTS `user_after_update`;;
CREATE DEFINER=CURRENT_USER TRIGGER `user_after_update` AFTER UPDATE ON `user`
FOR EACH ROW BEGIN
  UPDATE user_search SET
    user_search.last_name = NEW.last_name,
    user_search.first_name = NEW.first_name,
    user_search.category = NEW.category,
    user_search.comment = NEW.comment
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





DROP TABLE IF EXISTS log
;
CREATE TABLE log(
  id INTEGER NOT NULL AUTO_INCREMENT,
  date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time of operation', 
  type ENUM('START','STOP','SETUP','WEBSERVICE') NOT NULL DEFAULT 'START' COMMENT 'Type of operation',
  label TEXT NOT NULL COMMENT 'Associated label',
  request TEXT NOT NULL COMMENT 'Associated request (URL/Location/Path)',
  result BLOB NULL COMMENT 'Associated result (COMPRESSED BLOB)',

  PRIMARY KEY(id),
  KEY log_dt_type_request(date_time,type,request(64))
  
) ENGINE=MyISAM COMMENT 'Web Log'
;
