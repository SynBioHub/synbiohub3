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

python3 test3_suite.py "$@"
exitcode=$?
if [ $exitcode -ne 0 ]; then
    message "Exiting with code $exitcode."
    exit $exitcode
fi

#


# now stop containers and run just persistance tests
# message "Persistance test"
# bash ./stop_containers.sh
# bash ./start_containers_persist.sh

# python3 test_docker_persist.py "$@"
# exitcode=$?
# if [ $exitcode -ne 0 ]; then
#     message "Exiting with code $exitcode."
#     exit $exitcode
# fi


# stop after test suite if the command line option is present
# for var in "$@"
# do
#     if [[ $var == "--stopaftertestsuite" ]]
#     then
# 	echo "Stopping after test suite ran."
# 	exit 0
#     fi
# done

# bash ./run_sboltestrunner.sh
# exitcode=$?
# if [ $exitcode -ne 0 ]; then
#     message "Exiting with code $exitcode."
#     exit $exitcode
# fi

bash ./stop_containers.sh


message "finished running tests"

# test for sbh3
#ideas 
#1. run 1's tests, save files, run 3's tests (same as 1), save files, compare -> final result
#2. run 1, run3, send test, compare.. till one fails or done
#Chris: start 1 and 3


# test for sbh3 
#Currently: need SBH1 and 3 running at the same time because you can't submit on 3 yet, submit through 1 read in 3 to verify results