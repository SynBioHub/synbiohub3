fs = require('fs');
path = require('path');
var postGraphCrud = require('./common-upload').postGraphCrud;

function walk(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
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

walk('./out', function (filename) {
    files.push(filename);
});

var i = 0;
var len = files.length;

function next() {
    if (i == len) {
        return;
    }
    var filename = files[i];
    i++;

    console.log('reading file ' + filename);

    postGraphCrud(
        {
            method: 'POST',
            url: 'http://localhost:8891/sparql-graph-crud-auth/?graph-uri=https://synbiohub.org/public',
            auth: {
                user: 'dba',
                pass: 'dba',
                sendImmediately: false
            },
            headers: {
                'Content-Type': 'application/rdf+xml'
            },
            body: fs.readFileSync(filename) + '',
            label: 'virtuoso3',
            filename: filename
        },
        function (err, response, body) {
            var sc = response && response.statusCode !== undefined ? response.statusCode : 'no-response';
            console.log(
                'submitted ' + filename + ' to virtuoso3 with err ' + err + ' and response ' + sc
            );
            console.log(body);

            if (err) {
                console.log('error! ' + err);
            } else {
                fs.writeFileSync('last', i + '');
            }

            next();
        }
    );
}

next();
