var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities

/* ******************************************************************************** GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: req.app.locals.title, subtitle: "", menus:[] });
});

module.exports = router;
