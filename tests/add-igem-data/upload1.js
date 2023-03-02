fs = require('fs');
request = require('request');
path = require('path');
function walk(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function(name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walk(filePath, callback);
        }
    });
}

var files = [];

walk('./out', function(filename) {

    //console.log(filename)
    if(filename.includes("BBa_B00") || filename.includes("BBa_J0")){
      files.push(filename);
    }
});

//console.log(JSON.stringify(files, null, 2))

//var i = parseInt(fs.readFileSync('last') + '');
var i = 0;

function next() {

    var filename = files[i];
    i++;

console.log('reading file ' + filename)

    request({
        method: 'POST',
        //url: 'http://biocad.ncl.ac.uk:3030/igem/upload',
        url: 'http://localhost:8890/sparql-graph-crud-auth/?graph-uri=https://synbiohub.org/public',
        //url: 'http://synbiohub.org:8080/openrdf-sesame/repositories/synbiohub/statements',
        auth:  {
            user: 'dba',
            pass: 'dba',
//            pass: 'nyr-Dbt-roh-QW3',
            sendImmediately: false
        },
        /*qs: {
            'context': 'null'
        },*/
        headers: {
            //'Content-Type': 'multipart/form-data'
            'Content-Type': 'application/rdf+xml'
        },
        //formData: {
            //file: fs.createReadStream(filename)
        //}
        body: fs.readFileSync(filename) + ''
    }, function(err, response, body) {

        console.log('submitted ' + filename + ' to virtuoso with err ' + err + ' and response ' + response.statusCode);
        console.log(body)

        if(err) {
            console.log('error! ' + err);
        } else {
            fs.writeFileSync('last', i + '');
        }

        next();

        //callback(null, body);
    });

}

next();
