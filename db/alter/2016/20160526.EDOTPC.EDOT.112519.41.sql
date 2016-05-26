/* Test auto-alter-on-update */
ALTER TABLE test
ADD COLUMN new_label VARCHAR(255) NULL,
ADD INDEX new_label(new_label)
;
