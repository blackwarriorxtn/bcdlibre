var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities

// ******************************************************************************** user

// *** PARAMETERS (SQL)
var objFormParameters = {
  table_name: "user",
  primary_key: ["id"],
  autoincrement_column: "id",
  fields:[
    {name:"name",label:"Nom",type:"String",required:true,validation:null},
    {name:"login",label:"Compte",type:"String",required:true,validation:null},
    {name:"phone",label:"Téléphone",type:"String",required:false,validation:null},
    {name:"comment",label:"Commentaire",type:"String",required:false,validation:null},
  ]
};

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

  res.render('user/new', { title: req.app.locals.title, subtitle: "Lecteur", menus:[{text:"Menu principal",link:"/"},{text:"Lecteurs",link:"/user/"}], fields:objFormParameters.fields });

});
// POST new user (form validation)
router.post('/new', function(req, res, next) {
  var objSQLConnection = db.new_connection();
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
    // DEBUG console.log("strSentName=\""+strSentName+"\"\n");
    // Dont look for excluded fields, like "OK" or "CANCEL"
    if (db.form_ignore_fields.indexOf(strSentName) == -1)
    {
      var objField = null;
      for (var intField = 0; intField < objFormParameters.fields.length; intField++)
      {
        var strFieldName = objFormParameters.fields[intField].name;
        if (strFieldName)
        {
          // DEBUG console.log("strFieldName=\""+strFieldName+"\"\n");
          if (strSentName == strFieldName.valueOf())
          {
            // Known field : store attributes to check value and prepare storage
            objField = objFormParameters.fields[intField];
          } // if (strSentName == strFieldName.valueOf())
        } // if (strFieldName)
      } // for (var intField = 0; intField < objFormParameters.fields; intField++)
      if (objField == null)
      {
        // Unknown field: error!
        throw new Error("ERROR: field \""+strSentName+"\" is unknown!");
      } // if (objField == null)
      else
      {
        var strSQLValue = db.check_field_value(req.body[strSentName],objField,objSQLConnection);
        arrSQLNames.push(objSQLConnection.escapeId(objField.name)); // TODO handle name translation from HTML FORM to SQL TABLE COLUMN
        arrSQLValues.push(strSQLValue);
      } // else if (objField == null)
    } // if (db.form_ignore_fields.indexOf(strSentName) == -1)
  } // for (var objField in req.body)

  var strSQL = "INSERT INTO "+objSQLConnection.escapeId(objFormParameters.table_name)+"("+arrSQLNames.join(",")+")\n"
             + "VALUES("+arrSQLValues.join(",")+")\n"
             + ";"
             ;
  // DEBUG
  console.log(strSQL);

  db.runsql(strSQL, function(err, rows, fields) {
    if (err) throw err;
    res.redirect('list'); // TODO /record
  });

});

// TODO search, delete

module.exports = router;
