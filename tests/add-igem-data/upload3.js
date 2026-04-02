var fs = require('fs');
var path = require('path');
var uploadGraph = require('./virtuoso_graph_upload');

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

var GRAPH_URL = 'http://localhost:8891/sparql-graph-crud-auth/?graph-uri=https://synbiohub.org/public';

function next() {
    if (i === len) {
        return;
    }
    var filename = files[i];
    i++;

    console.log('reading file ' + filename);

    uploadGraph(GRAPH_URL, filename, 'virtuoso3', function (err) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        fs.writeFileSync('last', i + '');
        next();
    });
}

next();
