/* Cleanup "fake" images */

UPDATE item_detail 
SET img_url = NULL
WHERE img_url IS NOT NULL
AND img_url != ''
AND img_url LIKE '%/no-img-sm.%' /* Amazon's */
;

UPDATE item_detail 
SET img_url = NULL
WHERE img_url IS NOT NULL
AND img_url != ''
AND img_url LIKE '%/nophoto/%' /* Goodreads */
;
