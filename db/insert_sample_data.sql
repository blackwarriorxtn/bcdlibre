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

/* Sample DATA */

USE bibliopuce
;

INSERT IGNORE INTO user(first_name,last_name,category)
VALUES
('Emmanuel','KARTMANN', 'Parent d''élève'),
('Marie-Noëlle','KARTMANN', 'Parent d''élève')
;

INSERT IGNORE INTO item_detail(isbn13, title, author, description)
VALUES
('9782227729254','Le fantôme d''à côté','Robert Lawrence Stine','Anna a toujours pensé que la maison d''à côté était vide. Qui est alors ce garçon qu''elle n''a jamais vu, et qui lui annonce qu''il habite là depuis des années \? Comment se fait-il qu''Anna ne les ait jamais remarqués, lui et sa mère \? Et surtout, d''où lui vient cette pâleur de...fantôme \?'),
('9780596101992','JavaScript - The Definitive Guide','David Flanagan','A guide for experienced programmers demonstrates the core JavaScript language, offers examples of common tasks, and contains an extensive reference to JavaScript commands, objects, methods, and properties.'),
('9782070518630','Au fond des océans','[réalisation de l''édition française, Agence Juliette Blanchot ; traduction, Jean-Philippe Riby].',NULL),
('9782841772292','Apache en action','Ken Coar, Rich Bowen ; trad. de l''am. par Sébastien Blondeel.','Propose des procédures (appelées "recettes") qui couvrent les besoins les plus courants des développeurs et qui fonctionnent sous les plates-formes Unix et Windows. Au sommaire : installation, modules, hôtes virtuels, alias, sécurité, SSL, contenu dynamique, gestion des erreurs, proxies, performances.'),
('9780596527334','CSS : the definitive guide','Eric A. Meyer.',NULL),
('9782916571638','Concevoir un jeu vidéo','Marc Albinet.','Ce guide pratique explique tout ce que vous devez savoir pour élaborer un jeu vidéo. Il offre une synthèse de toutes les connaissances dans ce domaine et propose une méthode efficace qui répond aux questions essentielles que se pose tout créateur de "game concept". Il traite l''ensemble des aspects de la conception et fournit une information complète sur les outils actuels utilisés par les grands studios et éditeurs afin que le lecteur puisse s''en servir, quels que soient le genre et l''envergure du jeu qu''il souhaite créer. Concevoir un jeu vidéo rend ce savoir-faire professionnel compréhensible et utilisable par tous : passionnés, étudiants, spécialistes des jeux et des nouveaux médias, innovateurs ou responsables dans une entreprise ou une organisation qui souhaitent développer un jeu vidéo ou un serious game. Cette seconde édition met à la disposition du lecteur tous les savoirs essentiels sur la manière de créer des jeux sur consoles, ordinateurs, téléphones mobiles, tablettes et réseaux sociaux, en tenant compte des spécificités de chaque support.')
;

/* One instance per item */
INSERT INTO item(item_detail_id) SELECT id FROM item_detail
;

/* Let user 1 borrow item 1 */
INSERT INTO borrow(begin_date,end_date,item_id,user_id)
VALUES(NOW(), NULL, 1, 1)
;


/* TEST INTEGRITY  :

(1) Can't delete USER when he has borrowed an item
This should fail with error : Cannot delete or update a parent row: a foreign key constraint fails (`bibliopuce`.`borrow`, CONSTRAINT `borrow_fk_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE)
DELETE FROM user WHERE id = 1

(2) Can't delete a borrowed item
This should fail with error : Cannot delete or update a parent row: a foreign key constraint fails (`bibliopuce`.`borrow`, CONSTRAINT `borrow_fk_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`id`) ON UPDATE CASCADE)
DELETE FROM item WHERE id = 1

(3) Can't borrow same item twice
This should fail with error : Duplicate entry '1-1' for key 'borrow_user_item'
INSERT INTO borrow(begin_date,end_date,item_id,user_id) VALUES(NOW(), NULL, 1, 1)

*/

/* Borrow list
SELECT *
FROM borrow
JOIN user ON user.id = borrow.user_id
JOIN item ON item.id = borrow.item_id
LEFT OUTER JOIN item_detail ON item.item_detail_id = item_detail.id
GROUP BY borrow.id
*/

/* Count number of books (display title)
SELECT item_detail.title, COUNT(1) AS number
FROM item
JOIN item_detail ON item.item_detail_id = item_detail.id
GROUP BY item.item_detail_id

INSERT INTO `item_detail`(`isbn13`,`title`,`author`,`description`)
VALUES('9780596527334','CSS','Eric Meyer','Demonstrates the control and flexibility Cascading Style Sheets bring to Web design, covering selectors and structure, units, text manipulation, colors, backgrounds, borders, visual formatting, and positioning.')


SELECT * FROM item_detail


Add a copy of book id 1
INSERT INTO item(item_detail_id) VALUES(1)

*/


/* TEST SEARCHES

* Title starting with...
EXPLAIN
SELECT * FROM item_detail_search WHERE title LIKE 'Le fant%'

* Title containing...
EXPLAIN
SELECT * FROM item_detail_search WHERE MATCH (title) AGAINST ('fant�me c�t�' IN BOOLEAN MODE)

EXPLAIN
SELECT * FROM item_detail_search WHERE MATCH (title) AGAINST ('fantome cote' IN BOOLEAN MODE)

EXPLAIN
SELECT * FROM item_detail_search WHERE MATCH (title) AGAINST ('1+1' IN BOOLEAN MODE)

* Description containing...

EXPLAIN
SELECT * FROM item_detail_search WHERE MATCH (title,description) AGAINST ('fantome cote' IN BOOLEAN MODE)

EXPLAIN
SELECT * FROM `item_detail_search` WHERE MATCH (title,description) AGAINST ('pens�' IN BOOLEAN MODE)


*/
