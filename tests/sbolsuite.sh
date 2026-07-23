#!/bin/bash

set -e

source ./testutil.sh

message "Running synbiohub test suite."

# SBOLTestRunner is often an empty gitlink/submodule checkout in CI.
# Ensure a real clone with pom.xml + nested SBOLTestSuite submodule.
ensure_sboltestrunner() {
    if [ -f SBOLTestRunner/pom.xml ]; then
        message "SBOLTestRunner already present"
        (
            cd SBOLTestRunner
            git pull --ff-only 2>/dev/null || true
            git submodule update --init --recursive 2>/dev/null || true
        )
        return
    fi

    message "SBOLTestRunner missing or empty; cloning mehersam/SBOLTestRunner"
    rm -rf SBOLTestRunner
    git clone --recurse-submodules https://github.com/mehersam/SBOLTestRunner
}

message "pulling mehersam/SBOLTestRunner"
ensure_sboltestrunner

if [ ! -f SBOLTestRunner/pom.xml ]; then
    message "SBOLTestRunner/pom.xml still missing after clone"
    exit 1
fi

bash ./start_containers.sh

message "Running first-time setup"
python3 -c "from first_time_setup import TestSetup; ts = TestSetup(); ts.test_post()"

bash ./run_sboltestrunner.sh
exitcode=$?
if [ $exitcode -ne 0 ]; then
    message "Exiting with code $exitcode."
    exit $exitcode
fi

bash ./stop_containers.sh

message "finished running tests"
