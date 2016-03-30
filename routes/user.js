var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities

var arrFields = [
  {name:"name",label:"Nom",type:"String",required:true,validation:null},
  {name:"login",label:"Compte",type:"String",required:true,validation:null},
  {name:"phone",label:"Téléphone",type:"String",required:false,validation:null},
  {name:"comment",label:"Commentaire",type:"String",required:false,validation:null},
];
var arrExceptFields = [
  "OK",
  "CANCEL"
];

// ******************************************************************************** user
// GET users menu
router.get('/', function(req, res, next) {
  res.render('user/index', { title: req.app.locals.title, subtitle: "Lecteur", menus:[{text:"Menu principal",link:"/"}] });
});
// GET list of users
router.get('/list', function(req, res, next) {

  db.runsql('SELECT * FROM user', function(err, rows, fields) {
    if (err) throw err;
    res.render('user/list', { title: req.app.locals.title, subtitle: "Liste", menus:[{text:"Menu principal",link:"/"},{text:"Lecteurs",link:"/user/"}], users:rows });
  });

});
// GET new user (form)
router.get('/new', function(req, res, next) {

  res.render('user/new', { title: req.app.locals.title, subtitle: "Lecteur", menus:[{text:"Menu principal",link:"/"},{text:"Lecteurs",link:"/user/"}], fields:arrFields });

});
// POST new user (form validation)
router.post('/new', function(req, res, next) {

/* DEBUG
  res.setHeader('Content-Type', 'text/plain');
  res.write('you posted:\n');
  res.end(JSON.stringify(req.body, null, 2));
*/
/* DEBUG */

  // Must be something in the body
  if (!req.body) return res.sendStatus(400);

  var arrSQLNames = new Array();
  var arrSQLValues = new Array();
  for (var strSentName in req.body)
  {
    // DEBUG
    console.log("strSentName=\""+strSentName+"\"\n");
    // Dont look for excluded fields, like "OK" or "CANCEL"
    if (arrExceptFields.indexOf(strSentName) == -1)
    {

      var objField = null;
      for (var intField = 0; intField < arrFields.length; intField++)
      {
        var strFieldName = arrFields[intField].name;
        if (strFieldName)
        {
          // DEBUG
          console.log("strFieldName=\""+strFieldName+"\"\n");
          if (strSentName == strFieldName.valueOf())
          {
            // Known field : store attributes to check value and prepare storage
            objField = arrFields[intField];
          } // if (strSentName == strFieldName.valueOf())
        } // if (strFieldName)
      } // for (var intField = 0; intField < arrFields; intField++)
      if (objField == null)
      {
        // Unknown field: error!
        throw new Error("ERROR: field \""+strSentName+"\" is unknown!");
      } // if (objField == null)
      else
      {
        var strSQLValue = db.check_field_value(req.body[strSentName],objField);
        arrSQLNames.push(objField.name); // TODO handle name translation from HTML FORM to SQL TABLE COLUMN
        arrSQLValues.push(strSQLValue);
      } // else if (objField == null)
    } // if (arrExceptFields.indexOf(strSentName) == -1)
  } // for (var objField in req.body)

/* DEBUG */
    res.write('SQL:\n');
    res.write("INSERT INTO user("+arrSQLNames.join(",")+")\n");
    res.write("VALUES("+arrSQLValues.join(",")+")\n");
    res.end(";");

  // TODO res.render('user/record'...);

});

// TODO search, delete

module.exports = router;
