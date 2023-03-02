#!/bin/bash

source ./testutil.sh

message "Uploading igem data"

cd add-igem-data
node upload1.js
node upload3.js

cd ..

message "Done uploading igem data"
