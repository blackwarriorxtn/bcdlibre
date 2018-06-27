/*
      Copyright 2016-2018 Replay SDK (http://www.replay-sdk.com)

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

var express = require('express')
var path = require('path')
// TODO var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var i18n = require('i18n-2')
var expressSession = require('express-session')
var passport = require('passport')
var Strategy = require('passport-local').Strategy
var db = require('./routes/db')

var routes = require('./routes/index')
var routesUser = require('./routes/user')
var routesItem = require('./routes/item')
var routesBorrow = require('./routes/borrow')
var routesManage = require('./routes/manage')
var bcrypt = require('bcryptjs')

// ************************************************************************** SECURITY AND AUTHENTICATION WITH PASSPORT
// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
  function (username, password, cb) {
    db.userFindByUsername(username, function (err, user) {
      if (err) { return cb(err) }
      if (!user) { return cb(null, false) }
      console.log('Found user %s : checking password', username)
      // Compare with hashed password from database
      var blnPasswordOK = bcrypt.compareSync(password, user.user_password)
      if (blnPasswordOK) { return cb(null, false) }
      return cb(null, user)
    })
  }))
// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function (user, cb) {
  cb(null, user.id)
})
passport.deserializeUser(function (id, cb) {
  db.userFindById(id, function (err, user) {
    if (err) { return cb(err) }
    cb(null, user)
  })
})

var app = express()

// Attach the i18n property to the express request object
// And attach helper methods for use in templates
i18n.expressBind(app, {
  // setup some locales - other locales default to 'en' silently
  locales: ['en', 'fr'],
  // change the cookie name from 'lang' to 'locale'
  cookieName: 'bcdlibre_locale'
})

// local variables: title, main menu, etc...
app.locals.config = require('./setup/config')
app.locals.title = app.locals.config.application.title || 'BDC Libre'

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())

app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use('/static', express.static(__dirname + '/public'))
app.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: true }))
// If authentication is enabled, set passport module to handle it
if (app.locals.config.application.authentication === 'true') {
  app.use(passport.initialize())
  app.use(passport.session())
}

// This is how you'd set a locale from req.cookies.
// Don't forget to set the cookie either on the client or in your Express app.
app.use(function (req, res, next) {
  // DEBUG console.log("req.cookies=%j",req.cookies);
  // DEBUG console.log("req.i18n.locales=%j", req.i18n.locales);
  // Check locale cookie
  if (req.cookies.bcdlibre_locale == null) {
    var strLang = 'en'
    // No cookie: try to detect language based on browser's configuration
    var arrAcceptsLanguages = req.acceptsLanguages()
    console.log('req.acceptsLanguages()=%j', arrAcceptsLanguages)
    if (arrAcceptsLanguages) {
      // Check all supported locales to find a matching locale
      for (var intL = 0; intL < arrAcceptsLanguages.length; intL++) {
        var strAL = arrAcceptsLanguages[intL]
        // DEBUG console.log("strAL=%s", strAL)
        if (req.i18n.locales[strAL]) {
          console.log('Picking language %s', strAL)
          strLang = strAL
          break
        }
      }
    } // if (arrAcceptsLanguages)

    console.log('I18N:setLocale: %s', strLang)
    req.i18n.setLocale(strLang)

    // Store lang in cookie for next call
    res.cookie('bcdlibre_locale', strLang)
  } else {
    console.log('I18N:setLocaleFromCookie: req.cookies.bcdlibre_locale=%s', req.cookies.bcdlibre_locale)
    // TODO Check that coockie contains a supported languages (see req.i18n.locales)
    req.i18n.setLocaleFromCookie()
  }
  next()
})

app.use('/', routes)
app.use('/borrow', routesBorrow)
app.use('/manage', routesManage)
app.use('/user', routesUser)
app.use('/item', routesItem)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: err
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    error: {}
  })
})

module.exports = app
