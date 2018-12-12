var OperationHelper = require('apac').OperationHelper;
 
var opHelper = new OperationHelper({
    awsId:     'TODO',
    awsSecret: 'TODO',
    assocId:   'TODO'
});
 
opHelper.execute('ItemLookup', {
    'IdType': 'ISBN',
    'ItemId': '9782070656875',
    'SearchIndex': 'Books'
}, function(error, results) {
    if (error) { console.log('Error: ' + error + "\n") }
    console.log("Results: %j\n", results);
});
