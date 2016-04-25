var OperationHelper = require('apac').OperationHelper;
 
var opHelper = new OperationHelper({
    awsId:     'AKIAJ7R5TX3DPO3IAPBA',
    awsSecret: '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',
    assocId:   'bibliopucedem-20'
});
 
opHelper.execute('ItemLookup', {
    'IdType': 'ISBN',
    'ItemId': '9782070656875',
    'SearchIndex': 'Books'
}, function(error, results) {
    if (error) { console.log('Error: ' + error + "\n") }
    console.log("Results: %j\n", results);
});
