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
    {name:"begin_date",label:"Début",type:"DateTime",required:true,validation:null},
    {name:"end_date",label:"Fin",type:"DateTime",required:false,validation:null},
    {name:"item_id",label:"Livre",type:"Integer",required:true,validation:null},
    {name:"user_id",label:"Lecteur",type:"Integer",required:false,validation:null},
  ]
};
// *** PARAMETERS (MENU)
var objMenu = {text:"Emprunts",link:"/borrow/"};

// GET menu
router.get('/', function(req, res, next) {
  res.render('borrow/index', { title: req.app.locals.title, subtitle: objMenu.text, menus:[req.app.locals.main_menu] });
});
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
// GET new (form)
router.get('/new', function(req, res, next) {

  res.render('borrow/new', {req:req, title: req.app.locals.title, subtitle: objMenu.text, menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, message:{text:"Veuillez saisir le livre et le lecteur",type:"info"}});

});
// POST new (form validation then insert new record in database)
router.post('/new', function(req, res, next) {
  if (req.body["CANCEL"] != null)
  {
    // Cancel insert : Redirect to menu
    res.redirect('./');
  } // if (req.body["CANCEL"] != null)
  else if (req.body["OK"] != null)
  {
    db.insert_record(req, res, next, objFormParameters, function(err, result, fields) {
      if (err)
      {
        db.handle_error(err, res, "item/new", { title: req.app.locals.title, subtitle: objMenu.text, menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, message:"Impossible d'emprunter ce livre ("+err+")" });
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

// TODO search, delete

module.exports = router;
