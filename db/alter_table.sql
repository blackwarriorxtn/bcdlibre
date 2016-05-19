ALTER TABLE user
CHANGE COLUMN name last_name VARCHAR(255) NOT NULL COMMENT 'User last name',
ADD COLUMN first_name VARCHAR(255) NULL COMMENT 'User First name' AFTER last_name,
ADD INDEX user_last_first_name(last_name,first_name),
ADD INDEX user_first_last_name(first_name,last_name)
;
ALTER TABLE user_search
CHANGE COLUMN name last_name VARCHAR(255) NOT NULL COMMENT 'User last name',
ADD COLUMN first_name VARCHAR(255) NULL COMMENT 'User First name' AFTER last_name,
ADD INDEX user_search_last_first_name(last_name(128),first_name(128)),
ADD INDEX user_search_first_last_name(first_name(128),last_name(128))
;

ALTER TABLE user
CHANGE COLUMN login category VARCHAR(255) NOT NULL COMMENT 'User category (classroom, level...)',
ADD INDEX user_category(category)
;
ALTER TABLE user
DROP INDEX user_login
;
ALTER TABLE user_search
CHANGE COLUMN login category VARCHAR(255) NULL COMMENT 'User category (classroom, level...)',
ADD INDEX user_category(category),
ADD FULLTEXT KEY user_ft_last_name(last_name),
ADD FULLTEXT KEY user_ft_first_name(first_name),
ADD FULLTEXT KEY user_ft_first_last_name(first_name,last_name),
ADD FULLTEXT KEY user_ft_category(category)
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
