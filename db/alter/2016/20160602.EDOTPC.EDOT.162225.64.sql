  
ALTER TABLE item_detail 
ADD COLUMN img_url VARCHAR(255) NULL COMMENT 'URL to book representation',  
ADD INDEX item_detail_img_url(img_url)
;

