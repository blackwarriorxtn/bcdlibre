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

var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities
var debug = require('debug')('bibliopuce:routes_borrow');

// ******************************************************************************** borrow
function module_context(req, res, next)
{
  // *** PARAMETERS (SQL)
  this.objFormParameters = {
    table_name: "borrow",
    /* Use a VIEW to list borrows with full information */
    list_table_name: "borrow_list",
    view_table_name: "borrow_list",
    primary_key: ["id"],
    autoincrement_column: "id",
    fields:[
      {name:"id",label:"#",type:"Integer",required:false,validation:null},
      {name:"begin_date",label:req.i18n.__("Début"),type:"DateTime",required:true,validation:function (strValue){return(new Date().toSQL())}},
      {name:"end_date",label:req.i18n.__("Fin"),type:"DateTime",required:false,validation:null},
      {name:"item_id",label:req.i18n.__("Livre #"),type:"Integer",required:true,validation:null, write_only:true},
      {name:"title",label:req.i18n.__("Livre"),type:"String",required:false,validation:null, read_only:true},
      {name:"author",label:req.i18n.__("Auteur"),type:"String",required:false,validation:null, read_only:true},
      {name:"user_id",label:req.i18n.__("Lecteur #"),type:"Integer",required:true,validation:null, write_only:true},
      {name:"last_name",label:req.i18n.__("Nom"),type:"String",required:false,validation:null, read_only:true},
      {name:"first_name",label:req.i18n.__("Prénom"),type:"String",required:false,validation:null, read_only:true},
    ],
    allowed_states:{_ADD:false,_MODIFY:false,_DELETE:true,_VIEW:true},
    sql_counter:null
  };
  // *** PARAMETERS (MENU)
  this.objMenu = {text:req.i18n.__("Emprunts"),link:"/borrow/"};
  this.objMainMenu = {text:req.i18n.__("Menu principal"),link:"/"};
}





// ************************************************************************************* MENU
// GET menu
router.get('/', function(req, res, next) {
  var objMyContext = new module_context(req, res, next);
  res.render('borrow/index', { title: req.app.locals.title, subtitle: objMyContext.objMenu.text, menus:[objMyContext.objMainMenu] });
});





// ************************************************************************************* LIST
// Get list of borrowing
router.get('/list', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  db.list_record(req, res, next, objMyContext.objFormParameters, {order_by:[{name:"begin_date", direction:"ASC"}]} /* objSQLOptions */, function(err, result, fields) {
    if (err) throw err;
    // Display records with "list" template
    res.render('borrow/list', { title: req.app.locals.title, subtitle: req.i18n.__("Liste"), menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, records:result });
  });
});





// ************************************************************************************* VIEW
// GET view
router.get('/view', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  db.view_record(req, res, next, objMyContext.objFormParameters, function(err, result, fields) {
    if (err) throw err;
    // Display first record with "view" template
    res.render('borrow/view', {
      title: req.app.locals.title,
      subtitle: req.i18n.__("Fiche"),
      menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu),
      form:objMyContext.objFormParameters,
      record:result[0],
      message:null,
      form_id:result[0].id,
      form_info:null,
      form_custom_html:null });
  });

});





// ************************************************************************************* NEW
// GET new (form)
router.get('/new', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  res.render('borrow/new', {req:req, title: req.app.locals.title, subtitle: objMyContext.objMenu.text, menus:[objMyContext.objMainMenu,objMyContext.objMenu], form:objMyContext.objFormParameters, message:{text:req.i18n.__("Veuillez saisir le livre et le lecteur"),type:"info"}});

});
// POST new (form validation then insert new record in database)
router.post('/new', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  if (req.body["_CANCEL"] != null)
  {
    // Cancel insert : Redirect to menu
    res.redirect('./');
  } // if (req.body["CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    db.insert_record(req, res, next, objMyContext.objFormParameters, function(err, result, fields) {
      if (err)
      {
        db.handle_error(err, res, req, "borrow/new", { title: req.app.locals.title, subtitle: objMyContext.objMenu.text, menus:[objMyContext.objMainMenu,objMyContext.objMenu], form:objMyContext.objFormParameters, message:"Impossible d'emprunter ce livre ("+err+")" });
      }
      else
      {
        // Redirect to MAIN menu
        res.redirect('../');
      }
    });
  } // else if (req.body["CANCEL"] != null)
  else
  {
    // Neither OK nor CANCEL: error!
    throw new Error("ERROR: Invalid form state (must be OK or CANCEL)");
  }

});






// ************************************************************************************* DELETE
// GET delete (form)
router.get('/delete', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  res.render('borrow/delete', {req:req, title: req.app.locals.title, subtitle: objMyContext.objMenu.text, menus:[objMyContext.objMainMenu,objMyContext.objMenu], form:objMyContext.objFormParameters, message:{text:req.i18n.__("Veuillez saisir le livre et le lecteur"),type:"info"}});

});
// POST delete (form validation then delete record from database)
router.post('/delete', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  if (req.body["_CANCEL"] != null)
  {
    // Cancel insert : Redirect to menu
    res.redirect('./');
  } // if (req.body["CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    // DEBUG
    console.log("req.body=%j", req.body);
    db.delete_record(req, res, next, objMyContext.objFormParameters, function(err, result, fields) {
      if (err)
      {
        db.handle_error(err, res, req, "borrow/delete", { title: req.app.locals.title, subtitle: objMyContext.objMenu.text, menus:[objMyContext.objMainMenu,objMyContext.objMenu], form:objMyContext.objFormParameters, message:"Impossible de rendre ce livre ("+err+")" });
      }
      else
      {
        // Redirect to menu
        res.redirect('/');
      }
    });
  } // else if (req.body["CANCEL"] != null)
  else
  {
    // Neither OK nor CANCEL: error!
    throw new Error("ERROR: Invalid form state (must be OK or CANCEL)");
  }

});

// TODO search







// ************************************************************************************* WEB SERVICES
// Web Service returning items to borrow OR return
router.get('/webservice/items', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  var objSQLConnection = db.new_connection();
  var strSearchValue = null;
  var strSQLSearchValue = null;

  console.log("/webservice/items:req.query=%j", req.query);
  if (req.query.text)
  {
    strSearchValue = db.format_isbn(req.query.text);
    strSQLSearchValue = objSQLConnection.escape(strSearchValue);
    // Match against items AND users
  } // if (req.query.text)
  else
  {
    // No text, list ALL borrows
    strSearchValue = null;
    strSQLSearchValue = null;
  } // if (req.query.text)  
  if (req.query && req.query.action == "borrow")
  {
    // Custom SQL, list of items not already borrowed (LEFT OUTER JOIN borrow ... WHERE borrow.id IS NULL)
    db.runsql('DROP TEMPORARY TABLE IF EXISTS tmp_item_search \n\
; \n\
CREATE TEMPORARY TABLE tmp_item_search( \n\
  id INTEGER NOT NULL PRIMARY KEY, \n\
  relevance DOUBLE NULL, \n\
  KEY(relevance, id) \n\
) \n\
; \n'
+ 
  (strSQLSearchValue == null 
    ? /* No text - list all items */
'INSERT IGNORE INTO tmp_item_search(id, relevance) \n\
SELECT id, 1 FROM item_detail_search \n\
; \n'

    : /* Search text - in three fields with 3 queries to optimize and ensure a proper key is used */ '\
INSERT IGNORE INTO tmp_item_search(id, relevance) \n\
SELECT id, MATCH(item_detail_search.isbn13) AGAINST ('+strSQLSearchValue+' IN BOOLEAN MODE) * 3 /* ISBN is most relevant */ \n\
FROM item_detail_search WHERE MATCH(item_detail_search.isbn13) AGAINST ('+strSQLSearchValue+' IN BOOLEAN MODE) \n\
; \n\
INSERT IGNORE INTO tmp_item_search(id, relevance) \n\
SELECT id, MATCH(item_detail_search.title) AGAINST ('+strSQLSearchValue+' IN NATURAL LANGUAGE MODE) * 2 /* title is very relevant */ \n\
FROM item_detail_search WHERE MATCH(item_detail_search.title) AGAINST ('+strSQLSearchValue+' IN NATURAL LANGUAGE MODE) \n\
; \n\
INSERT IGNORE INTO tmp_item_search(id, relevance) \n\
SELECT id, MATCH(item_detail_search.author) AGAINST ('+strSQLSearchValue+' IN NATURAL LANGUAGE MODE) /* author is less relevant */  \n\
FROM item_detail_search WHERE MATCH(item_detail_search.author) AGAINST ('+strSQLSearchValue+' IN NATURAL LANGUAGE MODE) \n\
; \n\
') + '\
\n\
/* List found items from temporary table */ \n\
SELECT \n\
  IF (borrow.id IS NULL, item.id, NULL) AS `id`, \n\
  CONCAT_WS(", ", CONCAT("#",item.id), item_detail.title, item_detail.author, item_detail.isbn13) AS `text`, \n\
  IF (borrow.id IS NULL, ' + objSQLConnection.escape(req.i18n.__('Disponible')) + ', ' + objSQLConnection.escape(req.i18n.__('ATTENTION : Aucun exemplaire disponible')) + ') AS message, \n\
  IF (borrow.id IS NULL, "success", "warning") AS message_class \n\
FROM tmp_item_search \n\
JOIN item_detail_search ON item_detail_search.id = tmp_item_search.id \n\
JOIN item_detail ON item_detail.id = item_detail_search.item_detail_id \n\
LEFT OUTER JOIN item ON item.item_detail_id = item_detail.id \n\
LEFT OUTER JOIN borrow ON borrow.item_id = item.id \n\
GROUP BY item.id \n\
ORDER BY tmp_item_search.relevance DESC \n\
; \n\
 \n\
DROP TEMPORARY TABLE IF EXISTS tmp_item_search \n\
; \n\
', function(err, arrRows, fields, objSQLConnection) {
      if (err)
      {
        // Cleanup
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
      var rows = db.rows(arrRows);
      if (rows.length == 0 && strSearchValue.match(/^[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]$/))
      {
        // ISBN Search returned no results: display message "unknow book"
        rows = [{id:null, text:strSearchValue+" : LIVRE INCONNU : Ce livre n'est pas dans l'inventaire", message:"LIVRE INCONNU : Ce livre n'est pas dans l'inventaire", message_class:"error"}];
      }
      console.log("/webservice/items:rows=%j", rows ? rows.slice(0,20) : null);
      // Return result as JSON
      res.json(rows);
    }, objSQLConnection);
  } // if (req.body.action == "borrow")
  else if (req.query && req.query.action == "return")
  {
    // Custom SQL, list of items already borrowed (LEFT OUTER JOIN borrow ... WHERE borrow.id IS NOT NULL)
    db.runsql('\
  SELECT item.id AS `id`, \n\
    CONCAT_WS(\', \', item_detail.title, item_detail.author, item_detail.isbn13) AS `text`, \n\
    borrow.user_id AS `borrower_id`,  \n\
    user.category AS `borrower_category`  \n\
  FROM item \n\
  JOIN item_detail ON item.item_detail_id = item_detail.id \n\
  JOIN item_detail_search ON item_detail_search.item_detail_id = item_detail.id \n\
  LEFT OUTER JOIN borrow ON borrow.item_id = item.id \n\
  LEFT OUTER JOIN user ON user.id = borrow.user_id \n\
  WHERE borrow.id IS NOT NULL \n\
  '+(strSQLWhere == null ? "" : "AND "+strSQLWhere)+'\
  GROUP BY item.id \n\
  ; \n\
  ', function(err, arrRows, fields) {
      if (err) throw err;
      var rows = db.rows(arrRows);
      // Return result as JSON
      console.log("/webservice/items:rows=%j", rows);
      res.json(rows);
    }, objSQLConnection);
  } // if (req.query && req.query.action == "return")
  else
  {
    // Custom SQL, list of ALL items
    db.runsql('SELECT item.id AS `id`, CONCAT_WS(\', \', item_detail.title, item_detail.author, item_detail.isbn13) AS `text`  \n\
  FROM item \n\
  JOIN item_detail ON item.item_detail_id = item_detail.id \n\
  JOIN item_detail_search ON item_detail_search.item_detail_id = item_detail.id \n\
  '+(strSQLWhere == null ? "" : "WHERE "+strSQLWhere)+'\
  ; \n\
  ', function(err, arrRows, fields) {
      if (err)
      {
        // Cleanup
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
      var rows = db.rows(arrRows);
      // Return result as JSON
      console.log("/webservice/items:rows=%j", rows);
      res.json(rows);
    });
  } // else if (req.query && req.query.action == "return")

  // Cleanup
  if (objSQLConnection)
  {
    objSQLConnection.end();
  }

});

// Web Service returning users borrowing OR returning a book
router.get('/webservice/users', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  var objSQLConnection = db.new_connection();
  console.log("/webservice/users:req.query=%j", req.query);
  var strSQLWhere1 = null;
  var strSQLWhere2 = null;
  var strSQLWhere3 = null;
  if (req.query.text)
  {
    var strValue = req.query.text;
    var strSQLText = objSQLConnection.escape(strValue);
    var strSQLTextStartWith = objSQLConnection.escape(strValue+"%");
    strSQLWhere1 = " MATCH(user_search.last_name, user_search.first_name, user_search.category,user_search.comment) AGAINST ("+strSQLText+" IN BOOLEAN MODE)\n";
    strSQLWhere2 = " last_name LIKE "+strSQLTextStartWith+"\n";
    strSQLWhere3 = " first_name LIKE "+strSQLTextStartWith+"\n";
  }
  if (req.query && req.query.action == "borrow")
  {
    // Custom SQL, list of users matching a string allowed to borrow (ALL users - no maximum is enforced)

    var arrSQL = ["\
DROP TEMPORARY TABLE IF EXISTS tmp_search\n\
; \n","\
CREATE TEMPORARY TABLE tmp_search(id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY)\n\
; \n","\
INSERT IGNORE INTO tmp_search(id) \n\
SELECT user_search.user_id AS `id` \n\
FROM user_search\
  "+(strSQLWhere1 == null ? "" : "\nWHERE "+strSQLWhere1)+"\
; \n\
"
    ];
    if (strSQLWhere2 != null)
    {
      arrSQL.push("\
INSERT IGNORE INTO tmp_search(id) \n\
SELECT user_search.user_id \n\
FROM user_search \n\
WHERE "+strSQLWhere2+"\
; \n\
");
    } // if (strSQLWhere2 != null)
    if (strSQLWhere3 != null)
    {
      arrSQL.push("\
INSERT IGNORE INTO tmp_search(id) \n\
SELECT user_search.user_id \n\
FROM user_search \n\
WHERE "+strSQLWhere3+"\
; \n\
");
    } // if (strSQLWhere3 != null)
    arrSQL.push("\
SELECT \n\
  tmp_search.id, \n\
  CONCAT_WS(', ', CONCAT('#',user.id), user.last_name, user.first_name, user.category) AS `text`, \n\
  COUNT(borrow.id) AS borrowed, \n\
  CASE COUNT(borrow.id) \n\
    WHEN 0 THEN " + objSQLConnection.escape(req.i18n.__("Aucun emprunt en cours.")) + " \n\
    WHEN 1 THEN " + objSQLConnection.escape(req.i18n.__("ATTENTION: 1 emprunt en cours...")) + " \n\
    WHEN 2 THEN " + objSQLConnection.escape(req.i18n.__("ATTENTION: 2 emprunts en cours...")) + " \n\
    ELSE " + objSQLConnection.escape(req.i18n.__("ALERTE: Plus de 2 emprunts en cours!")) + " \n\
  END AS message, \n\
  CASE COUNT(borrow.id) \n\
    WHEN 0 THEN 'success' \n\
    WHEN 1 THEN 'info' \n\
    WHEN 2 THEN 'warning' \n\
    ELSE 'danger' \n\
  END AS message_class \n\
FROM tmp_search \n\
JOIN user ON user.id = tmp_search.id \n\
LEFT OUTER JOIN borrow ON borrow.user_id = user.id \n\
GROUP BY user.id \n\
;");
    arrSQL.push("\
DROP TEMPORARY TABLE IF EXISTS tmp_search \n\
; \n");

    db.runsql(arrSQL, function(err, arrRows, fields, objSQLConnection) {
      if (err)
      {
        // Cleanup
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
      var rows = db.rows(arrRows);
      // Return result as JSON
      console.log("/webservice/users:rows=%j", rows);
      res.json(rows);
    },
    objSQLConnection);
  } // if (req.body.action == "borrow")
  else if (req.query && req.query.action == "return")
  {
    // Custom SQL, list of users having already borrowed (LEFT OUTER JOIN borrow ... WHERE borrow.id IS NOT NULL)
    db.runsql('SELECT user.id AS `id`, CONCAT_WS(\', \', CONCAT(\'#\',user.id), user.last_name, user.first_name, user.category) AS `text`  \n\
  FROM user \n\
  JOIN user_search ON user_search.user_id = user.id \n\
  LEFT OUTER JOIN borrow ON borrow.user_id = user.id \n\
  WHERE borrow.id IS NOT NULL \n\
  '+(strSQLWhere == null ? "" : "AND "+strSQLWhere)+'\
  GROUP BY user.id \n\
  ; \n\
  ', function(err, arrRows, fields) {
      if (err)
      {
        // Cleanup
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
      var rows = db.rows(arrRows);
      // Return result as JSON
      console.log("/webservice/users:rows=%j", rows);
      res.json(rows);
    },
  objSQLConnection);
  } // if (req.query && req.query.action == "return")
  else
  {
    // Custom SQL, list of ALL users
    db.runsql('SELECT user.id AS `id`, CONCAT_WS(\', \', CONCAT(\'#\',user.id), user.last_name, user.first_name, user.category) AS `text`  \n\
  FROM user \n\
  JOIN user_search ON user_search.user_id = user.id \n\
  '+(strSQLWhere == null ? "" : "WHERE "+strSQLWhere)+'\
  ; \n\
  ', function(err, arrRows, fields) {
      if (err)
      {
        // Cleanup
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
      var rows = db.rows(arrRows);
      // Return result as JSON
      console.log("/webservice/users:rows=%j", rows);
      res.json(rows);
    },
  objSQLConnection);
  } // else if (req.query && req.query.action == "return")

  if (objSQLConnection)
  {
    objSQLConnection.end();
  }

});


// Web Service for returning books (get list of borrows i.e. books+users)
router.get('/webservice/borrows', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  var objSQLConnection = db.new_connection();
  console.log("/webservice/borrows:req.query=%j", req.query);
  var strSQLWhere = null;
  // New code: optimized and using temporary tables
  if (req.query.text)
  {
    var strValue = db.format_isbn(req.query.text);
    var strSQLText = objSQLConnection.escape(strValue);
    // Match against items AND users
    // Custom SQL, list of borrows matching a string, and sorted by RELEVANCE as detected by MySQL full-text search engine
    db.runsql('\
  \
  \
    DROP TEMPORARY TABLE IF EXISTS tmp_item_search \n\
    ; \n\
    CREATE TEMPORARY TABLE tmp_item_search( \n\
      id INTEGER NOT NULL PRIMARY KEY, \n\
      relevance DOUBLE NULL, \n\
      KEY(relevance, id) \n\
    ) \n\
    ; \n\
    INSERT IGNORE INTO tmp_item_search(id, relevance) \n\
    SELECT id, MATCH(item_detail_search.isbn13) AGAINST ('+strSQLText+' IN BOOLEAN MODE) * 3 /* ISBN is most relevant */ \n\
    FROM item_detail_search WHERE MATCH(item_detail_search.isbn13) AGAINST ('+strSQLText+' IN BOOLEAN MODE) \n\
    ; \n\
    INSERT IGNORE INTO tmp_item_search(id, relevance) \n\
    SELECT id, MATCH(item_detail_search.title) AGAINST ('+strSQLText+' IN NATURAL LANGUAGE MODE) * 2 /* title is very relevant */ \n\
    FROM item_detail_search WHERE MATCH(item_detail_search.title) AGAINST ('+strSQLText+' IN NATURAL LANGUAGE MODE) \n\
    ; \n\
    INSERT IGNORE INTO tmp_item_search(id, relevance) \n\
    SELECT id, MATCH(item_detail_search.author) AGAINST ('+strSQLText+' IN NATURAL LANGUAGE MODE) /* author is less relevant */  \n\
    FROM item_detail_search WHERE MATCH(item_detail_search.author) AGAINST ('+strSQLText+' IN NATURAL LANGUAGE MODE) \n\
    ;\n\
    DROP TEMPORARY TABLE IF EXISTS tmp_user_search \n\
    ; \n\
    CREATE TEMPORARY TABLE tmp_user_search( \n\
      id INTEGER NOT NULL PRIMARY KEY \n\
    ) \n\
    ; \n\
    INSERT IGNORE INTO tmp_user_search(id) \n\
    SELECT id FROM user_search WHERE MATCH(user_search.last_name) AGAINST ('+strSQLText+' IN BOOLEAN MODE) \n\
    ; \n\
    INSERT IGNORE INTO tmp_user_search(id) \n\
    SELECT id FROM user_search WHERE MATCH(user_search.first_name) AGAINST ('+strSQLText+' IN BOOLEAN MODE) \n\
    ; \n\
    INSERT IGNORE INTO tmp_user_search(id) \n\
    SELECT id FROM user_search WHERE MATCH(user_search.category) AGAINST ('+strSQLText+' IN BOOLEAN MODE) \n\
    ; \n\
    INSERT IGNORE INTO tmp_user_search(id) \n\
    SELECT id FROM user_search WHERE MATCH(user_search.comment) AGAINST ('+strSQLText+' IN BOOLEAN MODE) \n\
    ; \n\
      \n\
    DROP TEMPORARY TABLE IF EXISTS tmp_borrow \n\
    ; \n\
    CREATE TEMPORARY TABLE tmp_borrow( \n\
      id INTEGER NOT NULL PRIMARY KEY \n\
    ) \n\
    ; \n\
    INSERT IGNORE INTO tmp_borrow(id) \n\
    SELECT borrow.id \n\
      FROM borrow \n\
      JOIN item ON borrow.item_id = item.id \n\
      JOIN item_detail ON item.item_detail_id = item_detail.id \n\
      JOIN item_detail_search ON item_detail_search.item_detail_id = item_detail.id \n\
      JOIN tmp_item_search ON item_detail_search.id = tmp_item_search.id \n\
    ORDER BY tmp_item_search.relevance DESC \n\
    ; \n\
    INSERT IGNORE INTO tmp_borrow(id) \n\
    SELECT borrow.id \n\
      FROM borrow \n\
      JOIN user ON user.id = borrow.user_id \n\
      JOIN user_search ON user_search.user_id = user.id \n\
      JOIN tmp_user_search ON user_search.id = tmp_user_search.id \n\
    ; \n\
    \n\
    SELECT \n\
        tmp_borrow.id AS `id`, \n\
        CONCAT_WS(", ", item_detail.title, item_detail.author, item_detail.isbn13, user.category, user.last_name, user.first_name) AS `text`, \n\
        borrow.user_id AS `borrower_id`, \n\
        user.category AS `borrower_category` \n\
      FROM tmp_borrow \n\
      JOIN borrow ON tmp_borrow.id = borrow.id \n\
      JOIN item ON borrow.item_id = item.id \n\
      JOIN item_detail ON item.item_detail_id = item_detail.id \n\
      JOIN item_detail_search ON item_detail_search.item_detail_id = item_detail.id \n\
      JOIN user ON user.id = borrow.user_id \n\
      JOIN user_search ON user_search.user_id = user.id \n\
      GROUP BY item.id, user.id \n\
    ; \n\
    \n\
    /* Cleanup */ \n\
    DROP TEMPORARY TABLE IF EXISTS tmp_item_search \n\
    ; \n\
    DROP TEMPORARY TABLE IF EXISTS tmp_user_search \n\
    ; \n\
    DROP TEMPORARY TABLE IF EXISTS tmp_borrow \n\
    ; \n\
  ; \n\
  ', function(err, arrRows, fields) {
      if (err)
      {
        // Cleanup
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
      var rows = db.rows(arrRows, null /* objOptions */);
      // Return result as JSON
      console.log("/webservice/borrows:rows=%j", rows);
      res.json(rows);
    },
    objSQLConnection);

  } // if (req.query.text)
  else
  {

    // No text, list ALL borrows
    db.runsql('\
    SELECT borrow.id  AS `id`, \n\
      CONCAT_WS(\', \', item_detail.title, item_detail.author, item_detail.isbn13, user.category, user.last_name, user.first_name) AS `text`, \n\
      borrow.user_id AS `borrower_id`,  \n\
      user.category AS `borrower_category`  \n\
    FROM borrow \n\
    JOIN item ON borrow.item_id = item.id \n\
    JOIN item_detail ON item.item_detail_id = item_detail.id \n\
    JOIN item_detail_search ON item_detail_search.item_detail_id = item_detail.id \n\
    JOIN user ON user.id = borrow.user_id \n\
    JOIN user_search ON user_search.user_id = user.id \n\
  '+(strSQLWhere == null ? "" : "AND "+strSQLWhere)+'\
  GROUP BY item.id, user.id \n\
  ; \n\
  ', function(err, arrRows, fields) {
      if (err)
      {
        // Cleanup
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
      var rows = db.rows(arrRows);
      // Return result as JSON
      console.log("/webservice/borrows:rows=%j", rows);
      res.json(rows);
    },
    objSQLConnection);

  } // else if (req.query.text)

  if (objSQLConnection)
  {
    objSQLConnection.end();
  }

});

module.exports = router;
