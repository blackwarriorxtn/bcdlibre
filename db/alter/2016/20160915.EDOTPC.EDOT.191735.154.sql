/* Create table for handling security and access control */
CREATE TABLE user_account(
  id INTEGER NOT NULL AUTO_INCREMENT,

  user_id INTEGER NULL COMMENT 'Link to user.id',

  user_login VARCHAR(64) NOT NULL COMMENT 'User login',
  user_password VARCHAR(255) NOT NULL COMMENT 'User password (encrypted)',

  user_role ENUM('GUEST','BORROWER','TEACHER','MANAGER'),

  PRIMARY KEY(id),
  KEY(user_login,user_password)

)
;
INSERT INTO user_account(user_id,user_login,user_password,user_role)
VALUES(NULL,'admin','$2a$10$5lZ6gXYFK97P1fUSmyJEIuOvsNUPYlL3I92hYBrvXz2FZH1FMTUJu','MANAGER')
;
