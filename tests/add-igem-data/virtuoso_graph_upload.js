var fs = require('fs');
var request = require('request');

var MAX_ATTEMPTS = 10;
var REQUEST_TIMEOUT_MS = 120000;

function postRdf(url, filename, instanceLabel, attempt, onComplete) {
    var body = fs.readFileSync(filename) + '';
    request({
        method: 'POST',
        url: url,
        auth: {
            user: 'dba',
            pass: 'dba',
            sendImmediately: false
        },
        headers: {
            'Content-Type': 'application/rdf+xml'
        },
        body: body,
        timeout: REQUEST_TIMEOUT_MS
    }, function (err, response, responseBody) {
        var status = response ? response.statusCode : undefined;
        var ok = !err && response && status >= 200 && status < 300;

        if (ok) {
            console.log('submitted ' + filename + ' to ' + instanceLabel + ' (HTTP ' + status + ')');
            if (responseBody) {
                console.log(responseBody);
            }
            onComplete(null);
            return;
        }

        var detail;
        if (err) {
            detail = err.message || String(err);
            if (err.code) {
                detail += ' (code=' + err.code + ')';
            }
        } else if (response) {
            detail = 'HTTP ' + status;
        } else {
            detail = 'no response';
        }

        console.log('upload failed for ' + filename + ' to ' + instanceLabel +
            ' attempt ' + attempt + '/' + MAX_ATTEMPTS + ': ' + detail);

        if (attempt >= MAX_ATTEMPTS) {
            onComplete(new Error('Failed after ' + MAX_ATTEMPTS + ' attempts: ' + filename + ' — ' + detail));
            return;
        }

        var delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 20000);
        setTimeout(function () {
            postRdf(url, filename, instanceLabel, attempt + 1, onComplete);
        }, delayMs);
    });
}

function uploadGraph(url, filename, instanceLabel, onComplete) {
    postRdf(url, filename, instanceLabel, 1, onComplete);
}

module.exports = uploadGraph;
