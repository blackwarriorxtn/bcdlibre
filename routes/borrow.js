var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities

// ******************************************************************************** borrow

// *** PARAMETERS (SQL)
var objFormParameters = {
  table_name: "borrow",
  primary_key: ["id"],
  autoincrement_column: "id",
  fields:[
    {name:"id",label:"#",type:"String",required:false,validation:null},
    {name:"begin_date",label:"Début",type:"DateTime",required:true,validation:function (strValue){return(new Date().toSQL())}},
    {name:"end_date",label:"Fin",type:"DateTime",required:false,validation:null},
    {name:"item_id",label:"Livre",type:"Integer",required:true,validation:null},
    {name:"user_id",label:"Lecteur",type:"Integer",required:false,validation:null},
  ]
};
// *** PARAMETERS (MENU)
var objMenu = {text:"Emprunts",link:"/borrow/"};






// ************************************************************************************* MENU
// GET menu
router.get('/', function(req, res, next) {
  res.render('borrow/index', { title: req.app.locals.title, subtitle: objMenu.text, menus:[req.app.locals.main_menu] });
});





// ************************************************************************************* LIST
// Get list of borrowing
router.get('/list', function(req, res, next) {

  // Custom SQL
  db.runsql('SELECT borrow.begin_date, user.*, item.*, item_detail.* \n\
  FROM borrow \n\
  JOIN user ON user.id = borrow.user_id \n\
  JOIN item ON item.id = borrow.item_id \n\
  LEFT OUTER JOIN item_detail ON item.item_detail_id = item_detail.id \n\
  GROUP BY borrow.id \n\
  ; \n\
', function(err, rows, fields) {
    if (err) throw err;
    // Display records with "list" template
    res.render('borrow/list', { title: req.app.locals.title, subtitle: "Liste", menus:[{text:"Menu principal",link:"/"},{text:objMenu.text,link:"/borrow/"}], borrows:rows });
  });

});





// ************************************************************************************* NEW
// GET new (form)
router.get('/new', function(req, res, next) {

  res.render('borrow/new', {req:req, title: req.app.locals.title, subtitle: objMenu.text, menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, message:{text:"Veuillez saisir le livre et le lecteur",type:"info"}});

});
// POST new (form validation then insert new record in database)
router.post('/new', function(req, res, next) {
  if (req.body["_CANCEL"] != null)
  {
    // Cancel insert : Redirect to menu
    res.redirect('./');
  } // if (req.body["CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    db.insert_record(req, res, next, objFormParameters, function(err, result, fields) {
      if (err)
      {
        db.handle_error(err, res, "borrow/new", { title: req.app.locals.title, subtitle: objMenu.text, menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, message:"Impossible d'emprunter ce livre ("+err+")" });
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

  res.render('borrow/delete', {req:req, title: req.app.locals.title, subtitle: objMenu.text, menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, message:{text:"Veuillez saisir le livre et le lecteur",type:"info"}});

});
// POST delete (form validation then delete record from database)
router.post('/delete', function(req, res, next) {
  if (req.body["_CANCEL"] != null)
  {
    // Cancel insert : Redirect to menu
    res.redirect('./');
  } // if (req.body["CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    db.delete_record(req, res, next, objFormParameters, function(err, result, fields) {
      if (err)
      {
        db.handle_error(err, res, "borrow/delete", { title: req.app.locals.title, subtitle: objMenu.text, menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, message:"Impossible de rendre ce livre ("+err+")" });
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

  var objSQLConnection = db.new_connection();

  console.log("/webservice/items:req.query=%j", req.query);
  var strSQLWhere = null;
  if (req.query.text)
  {
    var strSQLText = objSQLConnection.escape(req.query.text);
    strSQLWhere = " MATCH(item_detail_search.title,item_detail_search.author,item_detail_search.isbn13) AGAINST ("+strSQLText+" IN BOOLEAN MODE)\n";
  }
  if (req.query && req.query.action == "borrow")
  {
    // Custom SQL, list of items not already borrowed (LEFT OUTER JOIN borrow ... WHERE borrow.id IS NULL)
    db.runsql('SELECT item.id AS `id`, CONCAT_WS(\', \', title, author, isbn13) AS `text`  \n\
  FROM item \n\
  JOIN item_detail ON item.item_detail_id = item_detail.id \n\
  JOIN item_detail_search ON item_detail_search.item_detail_id = item_detail.id \n\
  LEFT OUTER JOIN borrow ON borrow.item_id = item.id \n\
  WHERE borrow.id IS NULL \n\
  '+(strSQLWhere == null ? "" : "AND "+strSQLWhere)+'\
  GROUP BY item.id \n\
  ; \n\
  ', function(err, rows, fields) {
      if (err) throw err;
      // Return result as JSON
      console.log("/webservice/items:rows=%j", rows);
      res.json(rows);
    });
  } // if (req.body.action == "borrow")
  else if (req.query && req.query.action == "return")
  {
    // Custom SQL, list of items already borrowed (LEFT OUTER JOIN borrow ... WHERE borrow.id IS NOT NULL)
    db.runsql('SELECT item.id AS `id`, CONCAT_WS(\', \', title, author, isbn13) AS `text`  \n\
  FROM item \n\
  JOIN item_detail ON item.item_detail_id = item_detail.id \n\
  JOIN item_detail_search ON item_detail_search.item_detail_id = item_detail.id \n\
  LEFT OUTER JOIN borrow ON borrow.item_id = item.id \n\
  WHERE borrow.id IS NOT NULL \n\
  '+(strSQLWhere == null ? "" : "AND "+strSQLWhere)+'\
  GROUP BY item.id \n\
  ; \n\
  ', function(err, rows, fields) {
      if (err) throw err;
      // Return result as JSON
      console.log("/webservice/items:rows=%j", rows);
      res.json(rows);
    });
  } // if (req.query && req.query.action == "return")
  else
  {
    // Custom SQL, list of ALL items
    db.runsql('SELECT item.id AS `id`, CONCAT_WS(\', \', title, author, isbn13) AS `text`  \n\
  FROM item \n\
  JOIN item_detail ON item.item_detail_id = item_detail.id \n\
  JOIN item_detail_search ON item_detail_search.item_detail_id = item_detail.id \n\
  '+(strSQLWhere == null ? "" : "WHERE "+strSQLWhere)+'\
  ; \n\
  ', function(err, rows, fields) {
      if (err) throw err;
      // Return result as JSON
      console.log("/webservice/items:rows=%j", rows);
      res.json(rows);
    });
  } // else if (req.query && req.query.action == "return")

  if (objSQLConnection)
  {
    objSQLConnection.end();
  }

});

// Web Service returning users borrowing OR returning a book
router.get('/webservice/users', function(req, res, next) {

  var objSQLConnection = db.new_connection();
  console.log("/webservice/users:req.query=%j", req.query);
  var strSQLWhere = null;
  if (req.query.text)
  {
    var strSQLText = objSQLConnection.escape(req.query.text);
    strSQLWhere = " MATCH (name,login,comment) AGAINST ("+strSQLText+" IN BOOLEAN MODE)\n";
  }
  if (req.query && req.query.action == "borrow")
  {
    // Custom SQL, list of users matching a string allowed to borrow (ALL users - no maximum is enforced)
    db.runsql('SELECT user.id AS `id`, CONCAT_WS(\', \', name, login, comment) AS `text`  \n\
  FROM user \n\
  '+(strSQLWhere == null ? "" : "WHERE "+strSQLWhere)+'\
  ; \n\
  ', function(err, rows, fields) {
      if (err) throw err;
      // Return result as JSON
      console.log("/webservice/users:rows=%j", rows);
      res.json(rows);
    },
  objSQLConnection);
  } // if (req.body.action == "borrow")
  else if (req.query && req.query.action == "return")
  {
    // Custom SQL, list of users having already borrowed (LEFT OUTER JOIN borrow ... WHERE borrow.id IS NOT NULL)
    db.runsql('SELECT user.id AS `id`, CONCAT_WS(\', \', name, login, comment) AS `text`  \n\
  FROM user \n\
  LEFT OUTER JOIN borrow ON borrow.user_id = user.id \n\
  WHERE borrow.id IS NOT NULL \n\
  '+(strSQLWhere == null ? "" : "AND "+strSQLWhere)+'\
  GROUP BY user.id \n\
  ; \n\
  ', function(err, rows, fields) {
      if (err) throw err;
      // Return result as JSON
      console.log("/webservice/users:rows=%j", rows);
      res.json(rows);
    },
  objSQLConnection);
  } // if (req.query && req.query.action == "return")
  else
  {
    // Custom SQL, list of ALL users
    db.runsql('SELECT user.id AS `id`, CONCAT_WS(\', \', name, login, comment) AS `text`  \n\
  FROM user \n\
  '+(strSQLWhere == null ? "" : "WHERE "+strSQLWhere)+'\
  ; \n\
  ', function(err, rows, fields) {
      if (err) throw err;
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

module.exports = router;
