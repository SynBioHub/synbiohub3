#!/bin/bash

source ./testutil.sh

message "Uploading igem data"

wait_virtuoso_ready 8890 "Virtuoso (SBH1)" || exit 1
wait_virtuoso_ready 8891 "Virtuoso3 (SBH3)" || exit 1

cd add-igem-data
node upload1.js
node upload3.js

cd ..

message "Done uploading igem data"
