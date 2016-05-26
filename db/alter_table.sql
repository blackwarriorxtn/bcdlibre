CREATE TABLE my_alter (
  id INTEGER NOT NULL AUTO_INCREMENT,
  commit_id VARCHAR(64) NOT NULL COMMENT 'Unique commit identifier for alter script',
  alter_file VARCHAR(255) NOT NULL COMMENT 'Name of alter script file (.sql)',
  commit_timestamp BIGINT(20) NOT NULL COMMENT 'Timestamp of commit',
  alter_date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date/Time of execution',
  PRIMARY KEY (id),
  UNIQUE KEY commit_id (commit_id,alter_file)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COMMENT='Track database structure changes (alter)'
;
