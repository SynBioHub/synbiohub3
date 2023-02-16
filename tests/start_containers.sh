#!/bin/bash

source ./testutil.sh

message "Cleaning old test containers if they exist"

bash ./testcleanup.sh


# message "pulling anjalakaturi/synbiohub-docker"
# if cd synbiohub-docker; then
#     git checkout snapshot;
#     git pull;
#     cd ..;
# else
#     # clone the synbiohub docker compose file in order to run docker containers
#     git clone --single-branch --branch snapshot https://github.com/anjalakaturi/synbiohub-docker
# fi


bash ./start_containers_persist.sh

