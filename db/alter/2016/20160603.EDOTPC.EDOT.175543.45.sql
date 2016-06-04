/* Reduce index size to avoid error "1071 (42000) at line 302: Specified key was too long; max key length is 1000 bytes" */
ALTER TABLE user
DROP INDEX user_category,
DROP INDEX user_last_first_name,
DROP INDEX user_first_last_name,
DROP INDEX user_phone
;
ALTER TABLE user
ADD INDEX user_category(category(128)),
ADD INDEX user_last_first_name(last_name(128),first_name(128)),
ADD INDEX user_first_last_name(first_name(128),last_name(128)),
ADD INDEX user_phone(phone(10))
;
