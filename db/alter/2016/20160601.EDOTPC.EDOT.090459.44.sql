INSERT IGNORE INTO item_classification(label)
VALUES 
('ALBUM - Imaginaires'),
('ALBUM - Personnages')
;

UPDATE item_detail SET classification = 'ALBUM - Première Lecture' WHERE classification = 'ALBUM-premiere lecture'
;
UPDATE item_detail SET classification = 'ALBUM - Personnages' WHERE classification IN ('ALBUM - personnages','ALBUM-personnages','ALBUM-Personnages')
;
UPDATE item_detail SET classification = 'ALBUM - Imaginaires' WHERE classification = 'ALBUM-Imaginaires'
;

/* List books without classification */
SELECT * FROM item_detail LEFT OUTER JOIN item_classification ON item_detail.classification = item_classification.label
WHERE item_classification.id IS NULL
;
