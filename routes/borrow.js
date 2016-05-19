var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities

// ******************************************************************************** borrow
function module_context(req, res, next)
{
  // *** PARAMETERS (SQL)
  this.objFormParameters = {
    table_name: "borrow",
    primary_key: ["id"],
    autoincrement_column: "id",
    fields:[
      {name:"id",label:"#",type:"String",required:false,validation:null},
      {name:"begin_date",label:req.i18n.__("Début"),type:"DateTime",required:true,validation:function (strValue){return(new Date().toSQL())}},
      {name:"end_date",label:req.i18n.__("Fin"),type:"DateTime",required:false,validation:null},
      {name:"item_id",label:req.i18n.__("Livre"),type:"Integer",required:true,validation:null},
      {name:"user_id",label:req.i18n.__("Lecteur"),type:"Integer",required:true,validation:null},
    ]
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
  // Custom SQL
  db.runsql('SELECT borrow.id, borrow.begin_date, user.last_name, user.first_name, item_detail.title \n\
  FROM borrow \n\
  JOIN user ON user.id = borrow.user_id \n\
  JOIN item ON item.id = borrow.item_id \n\
  LEFT OUTER JOIN item_detail ON item.item_detail_id = item_detail.id \n\
  GROUP BY borrow.id \n\
  ; \n\
', function(err, rows, fields) {
    if (err) throw err;
    // Display records with "list" template
    res.render('borrow/list', { title: req.app.locals.title, subtitle: req.i18n.__("Liste"), menus:[{text:req.i18n.__("Menu principal"),link:"/"},{text:objMyContext.objMenu.text,link:"/borrow/"}], records:rows });
  });

});





// ************************************************************************************* VIEW
// GET view
router.get('/view', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  db.view_record(req, res, next, objMyContext.objFormParameters, function(err, result, fields) {
    if (err) throw err;
    // Display first record with "view" template
    res.render('borrow/view', { title: req.app.locals.title, subtitle: req.i18n.__("Fiche"), menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, record:result[0], message:null });
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
        // Redirect to list
        res.redirect('list'); // TODO res.redirect('view') compute parameters
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

  console.log("/webservice/items:req.query=%j", req.query);
  var strSQLWhere = null;
  if (req.query.text)
  {
    var strValue = db.format_isbn(req.query.text);
    var strSQLText = objSQLConnection.escape(strValue);
    strSQLWhere = " MATCH(item_detail_search.title,item_detail_search.author,item_detail_search.isbn13) AGAINST ("+strSQLText+" IN BOOLEAN MODE)\n";
  }
  if (req.query && req.query.action == "borrow")
  {
    // Custom SQL, list of items not already borrowed (LEFT OUTER JOIN borrow ... WHERE borrow.id IS NULL)
    db.runsql('SELECT item.id AS `id`, CONCAT_WS(\', \', item_detail.title, item_detail.author, item_detail.isbn13) AS `text`  \n\
  FROM item \n\
  JOIN item_detail ON item.item_detail_id = item_detail.id \n\
  JOIN item_detail_search ON item_detail_search.item_detail_id = item_detail.id \n\
  LEFT OUTER JOIN borrow ON borrow.item_id = item.id \n\
  WHERE borrow.id IS NULL \n\
  '+(strSQLWhere == null ? "" : "AND "+strSQLWhere)+'\
  GROUP BY item.id \n\
  ; \n\
  ', function(err, rows, fields, objSQLConnection) {
      if (err)
      {
        // Cleanup
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
      // Return result as JSON
      console.log("/webservice/items:rows=%j", rows);
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
  ', function(err, rows, fields) {
      if (err) throw err;
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
  ', function(err, rows, fields) {
      if (err)
      {
        // Cleanup
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
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
  var strSQLWhere = null;
  if (req.query.text)
  {
    var strSQLText = objSQLConnection.escape(req.query.text);
    strSQLWhere = " MATCH (user_search.last_name, user_search.first_name, user_search.category,user_search.comment) AGAINST ("+strSQLText+" IN BOOLEAN MODE)\n";
  }
  if (req.query && req.query.action == "borrow")
  {
    // Custom SQL, list of users matching a string allowed to borrow (ALL users - no maximum is enforced)
    db.runsql('SELECT user.id AS `id`, CONCAT_WS(\', \', CONCAT(\'#\',user.id), user.last_name, user.first_name, user.category) AS `text`  \n\
  FROM user \n\
  JOIN user_search ON user_search.user_id = user.id \n\
  '+(strSQLWhere == null ? "" : "WHERE "+strSQLWhere)+'\
  ; \n\
  ', function(err, rows, fields) {
      if (err)
      {
        // Cleanup
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
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
  ', function(err, rows, fields) {
      if (err)
      {
        // Cleanup
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
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
  ', function(err, rows, fields) {
      if (err)
      {
        // Cleanup
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
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
  if (req.query.text)
  {
    var strValue = db.format_isbn(req.query.text);
    var strSQLText = objSQLConnection.escape(strValue);
    // Match against items AND users
    strSQLWhere = " MATCH (item_detail_search.title,item_detail_search.author,item_detail_search.isbn13, user_search.last_name, user_search.first_name,user_search.category,user_search.comment) AGAINST ("+strSQLText+" IN BOOLEAN MODE)\n";
  }
  // Custom SQL, list of borrows matching a string
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
', function(err, rows, fields) {
    if (err)
    {
      // Cleanup
      if (objSQLConnection)
      {
        objSQLConnection.end();
      }
      throw err;
    }
    // Return result as JSON
    console.log("/webservice/borrows:rows=%j", rows);
    res.json(rows);
  },
  objSQLConnection);

  if (objSQLConnection)
  {
    objSQLConnection.end();
  }

});

module.exports = router;
