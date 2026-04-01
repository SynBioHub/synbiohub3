'use strict';

const request = require('request');

const DEFAULT_TIMEOUT_MS = 120000;
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 2000;

/**
 * POST RDF to Virtuoso graph CRUD with timeout and exponential backoff retries.
 * Calls done(err, response, body) when a request succeeds (2xx) or retries are exhausted.
 */
function postGraphCrud(opts, done) {
    const url = opts.url;
    const auth = opts.auth;
    const headers = opts.headers;
    const body = opts.body;
    const label = opts.label || 'virtuoso';
    const filename = opts.filename || '(unknown file)';
    const timeout = opts.timeoutMs != null ? opts.timeoutMs : DEFAULT_TIMEOUT_MS;

    function runAttempt(attempt) {
        request(
            {
                method: 'POST',
                url: url,
                auth: auth,
                headers: headers,
                body: body,
                timeout: timeout
            },
            function (err, response, bodyOut) {
                const status = response ? response.statusCode : undefined;
                const ok = !err && response && status >= 200 && status < 300;

                if (!ok) {
                    console.log(
                        '[' +
                            label +
                            '] ' +
                            filename +
                            ' attempt ' +
                            attempt +
                            '/' +
                            MAX_RETRIES +
                            ' failed: err=' +
                            err +
                            ' status=' +
                            (status === undefined ? 'no-response' : status)
                    );
                    if (attempt < MAX_RETRIES) {
                        var backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
                        console.log('[' + label + '] backing off ' + backoff + 'ms before retry...');
                        return setTimeout(function () {
                            runAttempt(attempt + 1);
                        }, backoff);
                    }
                    return done(err || new Error('HTTP ' + String(status)), response, bodyOut);
                }
                done(null, response, bodyOut);
            }
        );
    }

    runAttempt(1);
}

module.exports = {
    postGraphCrud: postGraphCrud,
    DEFAULT_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
    MAX_RETRIES: MAX_RETRIES
};
