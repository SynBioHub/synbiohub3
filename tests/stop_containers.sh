#!/bin/bash

source ./testutil.sh

COMPOSE_FILE="docker-compose.yml"
PROJECT="testsuiteproject"

if docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose)
else
    COMPOSE=(docker-compose)
fi

message "Stopping containers"
"${COMPOSE[@]}" -f "$COMPOSE_FILE" -p "$PROJECT" stop
