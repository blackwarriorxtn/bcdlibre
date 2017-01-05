/* Improve performance by adding an INDEX */  
ALTER TABLE user_search
ADD INDEX user_search_user_id(user_id)
;  

ALTER TABLE item_detail_search
ADD INDEX item_detail_search_item_detail_id(item_detail_id)
;  
