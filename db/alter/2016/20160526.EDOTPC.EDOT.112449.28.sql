/* Test auto-alter-on-update */
DROP TABLE IF EXISTS test
;
CREATE TABLE test(
  id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(255)
) COMMENT 'test auto-alter-on-update'
;
