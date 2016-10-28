/* Improve full-text index to search items */

ALTER TABLE item_detail_search
DROP INDEX ids_all,
ADD FULLTEXT INDEX ids_all(isbn13, title, author, description, classification)
;
