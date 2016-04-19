var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities

// ******************************************************************************** borrow
// GET borrow menu
router.get('/', function(req, res, next) {
  res.render('borrow/index', { title: req.app.locals.title, subtitle: "Emprunts", menus:[{text:"Menu principal",link:"/"}] });
});
// Get list of borrowing
router.get('/list', function(req, res, next) {

  db.runsql('SELECT borrow.begin_date, user.*, item.*, item_detail.* \n\
  FROM borrow \n\
  JOIN user ON user.id = borrow.user_id \n\
  JOIN item ON item.id = borrow.item_id \n\
  LEFT OUTER JOIN item_detail ON item.item_detail_id = item_detail.id \n\
  GROUP BY borrow.id \n\
  ; \n\
', function(err, rows, fields) {
    if (err) throw err;
    res.render('borrow/list', { title: req.app.locals.title, subtitle: "Liste", menus:[{text:"Menu principal",link:"/"},{text:"Emprunts",link:"/borrow/"}], borrows:rows });
  });

});

// TODO new, search, delete

module.exports = router;
