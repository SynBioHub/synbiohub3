#!/bin/bash

cd tests

source ./testutil.sh

message "Running synbiohub test suite."

message "pulling backend image"

docker pull synbiohub/sbh3backend:snapshot

# Clone the SBOLTestRunner for necessary files
message "pulling mehersam/SBOLTestRunner"
if cd SBOLTestRunner; then
    git pull;
    cd ..;
else
    git clone --recurse-submodules https://github.com/mehersam/SBOLTestRunner;
fi

#clone libSBOLj
message "pulling libSBOLj"
if cd libSBOLj; then
    git pull;
    cd ..;
else
    git clone https://github.com/SynBioDex/libSBOLj;
    cd libSBOLj;
    git submodule update --init --recursive;
    mvn package;
    cd ..;
fi

#!/bin/sh

bash ./start_containers.sh

for var in "$@"
do
    if [[ $var == "--stopafterstart" ]]
    then
	echo "Exiting after starting up test server."
	exit 1
    fi
done

bash ./upload_data.sh

message "Running test suite."

# run the set up script

python3 test_suite.py "$@"
exitcode=$?
if [ $exitcode -ne 0 ]; then
    message "Exiting with code $exitcode."
    exit $exitcode
fi

bash ./stop_containers.sh

message "finished running tests"
