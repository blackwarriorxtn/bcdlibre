/* Sample DATA */

USE bibliopuce
;

INSERT IGNORE INTO user(name,login)
VALUES
('Emmanuel KARTMANN', 'emmanuelka'),
('Marie-Noëlle KARTMANN', 'marienoelleka')
;

INSERT IGNORE INTO item_description(isbn13, title, author, description)
VALUES
('9782227729254','Le fantôme d''à côté','Robert Lawrence Stine','Anna a toujours pensé que la maison d''à côté était vide. Qui est alors ce garçon qu''elle n''a jamais vu, et qui lui annonce qu''il habite là depuis des années \? Comment se fait-il qu''Anna ne les ait jamais remarqués, lui et sa mère \? Et surtout, d''où lui vient cette pâleur de...fantôme \?'),
('9780596101992','JavaScript - The Definitive Guide','David Flanagan','A guide for experienced programmers demonstrates the core JavaScript language, offers examples of common tasks, and contains an extensive reference to JavaScript commands, objects, methods, and properties.')
;

/* One instance per item */
INSERT INTO item(item_description_id) SELECT id FROM item_description
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
LEFT OUTER JOIN item_description ON item.item_description_id = item_description.id
GROUP BY borrow.id
*/

/* Count number of books (display title)
SELECT item_description.title, COUNT(1) AS number
FROM item 
JOIN item_description ON item.item_description_id = item_description.id
GROUP BY item.item_description_id
*/