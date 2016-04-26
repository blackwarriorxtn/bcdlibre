// Configuration management : load a json file and export it as a js object
var fs = require('fs');
// Note that the config.json file is created during setup
var strConfigPath = __dirname + '/config.json';
var objConfig = JSON.parse(fs.readFileSync(strConfigPath, 'UTF-8'));
module.exports = objConfig;
