
CREATE TABLE IF NOT EXISTS my_alter(
  id INTEGER NOT NULL AUTO_INCREMENT,

  commit_id VARCHAR(64) NOT NULL COMMENT 'Unique commit identifier for alter script',
  alter_file VARCHAR(255) NOT NULL COMMENT 'Name of alter script file (.sql)',
  date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time of execution',

  PRIMARY KEY(id),
  UNIQUE KEY(commit_id,alter_file)

) ENGINE=MyISAM COMMENT='Track database structure changes (alter)'
;


INSERT INTO my_alter(commit_id,alter_file) VALUES('4276b6b0c5d4c07607b734da769dddb16971f292','20160525.EDOTPC.EDOT.151924.41.sql')
;

