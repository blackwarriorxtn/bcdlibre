CREATE
  OR REPLACE
  DEFINER = CURRENT_USER
  SQL SECURITY INVOKER
  VIEW item_list
AS
  SELECT 
	COUNT(1) AS counter, COUNT(borrow.id) AS borrowed, 
    IF (COUNT(item.id) <= COUNT(borrow.id), 'warning', NULL) AS `__cssclass_counter`, IF (COUNT(item.id) <= COUNT(borrow.id), 'warning', NULL) AS `__cssclass_borrowed`, 
    item_detail.*
  FROM item
  JOIN item_detail ON item_detail.id = item.item_detail_id
  LEFT OUTER JOIN borrow ON borrow.item_id = item.id   
  GROUP BY item_detail.id
;
