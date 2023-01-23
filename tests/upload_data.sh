#!/bin/bash

source ./testutil.sh

message "Uploading igem data"

cd ../../igem-to-sbol-script
node upload1.js
node upload3.js

cd ../synbiohub3/tests

message "Done uploading igem data"
