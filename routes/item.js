var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities

// ******************************************************************************** item/book
// GET menu
router.get('/', function(req, res, next) {
  res.render('item/index', { title: req.app.locals.title, subtitle: "Inventaire", menus:[{text:"Menu principal",link:"/"}] });
});
// Get list
router.get('/list', function(req, res, next) {

  db.runsql('SELECT * \n\
  FROM item \n\
  LEFT OUTER JOIN book ON item.book_id = book.id \n\
  GROUP BY item.id \n\
  ; \n\
', function(err, rows, fields) {
    if (err) throw err;
    res.render('item/list', { title: req.app.locals.title, subtitle: "Liste", menus:[{text:"Menu principal",link:"/"},{text:"Inventaire",link:"/item/"}], items:rows });
  });

});

// TODO new, search, delete

module.exports = router;
