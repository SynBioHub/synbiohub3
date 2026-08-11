#!/bin/bash

source ./testutil.sh

COMPOSE_FILE="docker-compose.yml"
PROJECT="testsuiteproject"

# Prefer Compose V2 (`docker compose`); fall back to legacy `docker-compose`.
if docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose)
else
    COMPOSE=(docker-compose)
fi

wait_http() {
    local url="$1"
    local label="$2"
    message "Waiting for ${label} (${url})"
    until curl -s -o /dev/null -w "%{http_code}" "$url" | grep -Eq '200|301|302|401|404'; do
        sleep 3
        message "Waiting for ${label}..."
    done
}

message "Starting SynBioHub from Containers"
"${COMPOSE[@]}" -f "$COMPOSE_FILE" -p "$PROJECT" up -d

# synbiohubbackend has no healthcheck; wait until SBH3 HTTP answers (401 on / is OK).
wait_http "http://localhost:6789/" "synbiohubbackend"

# SBH1 is used by first_time_setup; wait until it answers too.
wait_http "http://localhost:7777/" "synbiohub"

message "Started successfully"
