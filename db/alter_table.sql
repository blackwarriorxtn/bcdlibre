ALTER TABLE item_detail
ADD COLUMN classification TEXT NULL COMMENT 'Item Classification (free text, can include Dewey Decimal Classification)'
;

ALTER TABLE item_detail_search
ADD COLUMN classification TEXT NULL COMMENT 'Item Classification (free text, can include Dewey Decimal Classification)',
ADD INDEX item_detail_search_classification(classification(64)),
ADD FULLTEXT KEY item_ft_classification(classification)
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
('ALBUM - D�couverte'),
('ALBUM - Premi�re Lecture'),
('BD'),
('DOCUMENTAIRE'),
('POESIE ET CONTES')
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









ALTER TABLE item_detail_search
ADD FULLTEXT KEY ids_all(title, author, description, classification)
;
TRUNCATE item_classification
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
