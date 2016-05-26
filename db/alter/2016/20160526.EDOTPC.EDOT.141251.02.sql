/* Test auto-alter-on-update */
ALTER TABLE test
ADD COLUMN code VARCHAR(32) AFTER id,
ADD INDEX code(code)
;
