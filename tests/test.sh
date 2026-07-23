#!/bin/bash

cd tests

source ./testutil.sh

message "Running synbiohub test suite."

message "pulling backend image"

#docker pull synbiohub/sbh3backend:snapshot

# Clone the SBOLTestRunner for necessary files (empty gitlink/submodule is common in CI)
message "pulling mehersam/SBOLTestRunner"
if [ -f SBOLTestRunner/pom.xml ]; then
    (
        cd SBOLTestRunner
        git pull --ff-only 2>/dev/null || true
        git submodule update --init --recursive 2>/dev/null || true
    )
else
    rm -rf SBOLTestRunner
    git clone --recurse-submodules https://github.com/mehersam/SBOLTestRunner
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
	echo "Exiting after starting up test servers."
	exit 1
    fi
done

bash ./upload_data.sh

for var in "$@"
do
    if [[ $var == "--stopaftersetup" ]]
    then
    	python3 test_setup.py
	echo "Exiting after starting up test servers and completing setup."
	exit 1
    fi
done

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
