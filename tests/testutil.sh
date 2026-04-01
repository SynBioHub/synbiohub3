function message {
    echo "[synbiohub3 test] $1"
}

# Wait until Virtuoso answers SPARQL on the host-mapped port (upload scripts use graph CRUD on same host).
# Args: port, short name for logs
wait_virtuoso_ready() {
    local port="$1"
    local name="$2"
    local max_attempts=90
    local delay=2
    local n=0
    message "Waiting for ${name} (http://localhost:${port}/sparql) ..."
    while [ "$n" -lt "$max_attempts" ]; do
        if curl -sf --max-time 10 -u dba:dba \
            "http://localhost:${port}/sparql?query=SELECT%201" >/dev/null 2>&1; then
            message "${name} is ready"
            return 0
        fi
        n=$((n + 1))
        sleep "$delay"
    done
    message "ERROR: ${name} not ready after $((max_attempts * delay)) seconds"
    return 1
}
