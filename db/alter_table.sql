/*
      Copyright 2016 Replay SDK (http://www.replay-sdk.com)

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

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
