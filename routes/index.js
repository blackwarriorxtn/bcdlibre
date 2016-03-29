var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities

var strTitle = "Bibliopuce";

/* ******************************************************************************** GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: strTitle, subtitle: "", menus:[] });
});

// ******************************************************************************** borrow
// GET borrow menu
router.get('/borrow', function(req, res, next) {
  res.render('borrow/index', { title: strTitle, subtitle: "Emprunts", menus:[{text:"Menu principal",link:"/"}] });
});
// Get list of borrowing
router.get('/borrow/list', function(req, res, next) {

  db.runsql('SELECT borrow.begin_date, user.*, item.*, book.* \n\
  FROM borrow \n\
  JOIN user ON user.id = borrow.user_id \n\
  JOIN item ON item.id = borrow.item_id \n\
  LEFT OUTER JOIN book ON item.book_id = book.id \n\
  GROUP BY borrow.id \n\
  ; \n\
', function(err, rows, fields) {
    if (err) throw err;
    res.render('borrow/list', { title: strTitle, subtitle: "Liste", menus:[{text:"Menu principal",link:"/"},{text:"Emprunts",link:"/borrow/"}], borrows:rows });
  });

});

// ******************************************************************************** user
// GET users menu
router.get('/user', function(req, res, next) {
  res.render('user/index', { title: strTitle, subtitle: "Lecteur", menus:[{text:"Menu principal",link:"/"}] });
});
// GET list of users
router.get('/user/list', function(req, res, next) {

  db.runsql('SELECT * FROM user', function(err, rows, fields) {
    if (err) throw err;
    res.render('user/list', { title: strTitle, subtitle: "Liste", menus:[{text:"Menu principal",link:"/"},{text:"Lecteurs",link:"/user/"}], users:rows });
  });

});
// GET new user (form)
router.get('/user/new', function(req, res, next) {

  var arrFields = [
    {name:"name",label:"Nom",type:"String",required:true,validation:null},
    {name:"login",label:"Compte",type:"String",required:true,validation:null},
    {name:"phone",label:"Téléphone",type:"String",required:false,validation:null},
    {name:"comment",label:"Commentaire",type:"String",required:false,validation:null},
  ];
  res.render('user/new', { title: strTitle, subtitle: "Lecteur", menus:[{text:"Menu principal",link:"/"},{text:"Lecteurs",link:"/user/"}], fields:arrFields });

});
// POST new user (form validation)
router.post('/user/new', function(req, res, next) {

  var arrFields = [
    {name:"name",label:"Nom",type:"String",required:true,validation:null},
    {name:"login",label:"Compte",type:"String",required:true,validation:null},
    {name:"phone",label:"Téléphone",type:"String",required:false,validation:null},
    {name:"comment",label:"Commentaire",type:"String",required:false,validation:null},
  ];
  res.render('user/new', { title: strTitle, subtitle: "Lecteur", menus:[{text:"Menu principal",link:"/"},{text:"Lecteurs",link:"/user/"}], fields:arrFields });

});

// ******************************************************************************** item/book
// GET menu
router.get('/item', function(req, res, next) {
  res.render('item/index', { title: strTitle, subtitle: "Inventaire", menus:[{text:"Menu principal",link:"/"}] });
});
// Get list
router.get('/item/list', function(req, res, next) {

  db.runsql('SELECT * \n\
  FROM item \n\
  LEFT OUTER JOIN book ON item.book_id = book.id \n\
  GROUP BY item.id \n\
  ; \n\
', function(err, rows, fields) {
    if (err) throw err;
    res.render('item/list', { title: strTitle, subtitle: "Liste", menus:[{text:"Menu principal",link:"/"},{text:"Inventaire",link:"/item/"}], items:rows });
  });

});


module.exports = router;
