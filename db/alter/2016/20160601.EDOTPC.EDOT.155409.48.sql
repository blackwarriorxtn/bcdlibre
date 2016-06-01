CREATE
  OR REPLACE
  DEFINER = CURRENT_USER
  SQL SECURITY INVOKER
  VIEW item_list
AS 
  SELECT COUNT(1) AS counter, item_detail.*
  FROM item
  JOIN item_detail ON item_detail.id = item.item_detail_id
  GROUP BY item_detail.id
;


CREATE
  OR REPLACE
  DEFINER = CURRENT_USER
  SQL SECURITY INVOKER
  VIEW borrow_list
AS 
  SELECT borrow.*, item.item_detail_id, item_detail.title, item_detail.author, user.first_name, user.last_name, user.category
  FROM borrow
  JOIN item ON borrow.item_id = item.id
  JOIN item_detail ON item_detail.id = item.item_detail_id
  JOIN user ON borrow.user_id = user.id
;

