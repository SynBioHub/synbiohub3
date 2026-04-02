#!/bin/bash

# Wait until Virtuoso HTTP endpoints on the host accept SPARQL (used by add-igem-data uploads).

source "$(dirname "$0")/testutil.sh"

MAX_WAIT_SEC="${VIRTUOSO_WAIT_MAX_SEC:-300}"
INTERVAL_SEC="${VIRTUOSO_WAIT_INTERVAL_SEC:-3}"

sparql_ping() {
    local port="$1"
    curl -sf -u dba:dba -G "http://127.0.0.1:${port}/sparql" \
        --data-urlencode "query=ASK {}" \
        -H "Accept: application/sparql-results+json" \
        -o /dev/null
}

wait_one() {
    local port="$1"
    local name="$2"
    local elapsed=0

    message "Waiting for ${name} (port ${port}) to accept SPARQL"
    while ! sparql_ping "${port}"; do
        if (( elapsed >= MAX_WAIT_SEC )); then
            message "Timed out after ${MAX_WAIT_SEC}s waiting for ${name} on port ${port}"
            exit 1
        fi
        sleep "${INTERVAL_SEC}"
        elapsed=$((elapsed + INTERVAL_SEC))
        message "Still waiting for ${name} (${elapsed}s / ${MAX_WAIT_SEC}s)"
    done
    message "${name} on port ${port} is ready"
}

wait_one 8890 "Virtuoso (sbh1)"
wait_one 8891 "Virtuoso3 (sbh3)"
