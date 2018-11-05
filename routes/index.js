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
var router = express.Router()
var debug = require('debug')('bibliopuce:routes_index')
var passport = require('passport')

/* ******************************************************************************** GET home page. */
router.get('/', function (req, res, next) {
  debug('req.query=%j', req.query)
  // Check requested language
  if (req && req.query && req.query.lang) {
    var strLang = req.query.lang
    res.cookie('bcdlibre_locale', strLang)
    console.log("res.cookie('bcdlibre_locale', %s)", strLang)
    // DEBUG console.log("I18N:setLocale: %s", strLang);
    req.i18n.setLocale(strLang)
  }
  res.render('index', { title: req.app.locals.title, subtitle: '', menus: [] })
})

/* ******************************************************************************** SET language */
router.get('/set', function (req, res, next) {
  debug('req.query=%j', req.query)
  // Check requested language
  if (req && req.query && req.query.lang) {
    var strLang = req.query.lang
    res.cookie('bibliopuce_locale', strLang)
  }
  // Back to home page
  res.redirect('/')
})

/* ******************************************************************************** login */
router.get('/login',
  function (req, res) {
    res.render('login', { title: req.app.locals.title, subtitle: null, menus: [], message: null })
  }
)

router.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/')
  }
)

/* ******************************************************************************** logout */
router.get('/logout',
  function (req, res) {
    req.logout()
    res.redirect('/')
  }
)

/* TODO ?
router.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.render('profile', { user: req.user, title: req.app.locals.title, subtitle: "", menus:[] });
  }
);
*/
module.exports = router
