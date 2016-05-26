
/* Test auto-alter-on-update */
ALTER TABLE test
ADD COLUMN newer_label VARCHAR(255) NULL AFTER new_label
;
