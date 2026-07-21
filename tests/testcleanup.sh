#!/bin/bash

COMPOSE_FILE="docker-compose.yml"
PROJECT="testsuiteproject"

if docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose)
else
    COMPOSE=(docker-compose)
fi

# Tear down Compose v2 project (hyphenated container names) and volumes.
"${COMPOSE[@]}" -f "$COMPOSE_FILE" -p "$PROJECT" down -v --remove-orphans 2>/dev/null || true
