/* Add a new log type: SQL for loggin any SQL modifications */
ALTER TABLE log MODIFY COLUMN type ENUM('START','STOP','SETUP','WEBSERVICE','SQL')
;
