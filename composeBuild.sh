docker compose -f docker-compose-dev.yml down --rmi all && \
docker compose -f docker-compose-dev.yml build --no-cache --parallel && \
docker compose -f docker-compose-dev.yml up --force-recreate
