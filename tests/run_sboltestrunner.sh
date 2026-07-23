#!/bin/bash

set -e

source ./testutil.sh

message "SBOLTestRunner"

if [ ! -f SBOLTestRunner/pom.xml ]; then
    message "SBOLTestRunner/pom.xml missing; run sbolsuite.sh (or clone SBOLTestRunner) first"
    exit 1
fi

message "pulling mehersam/SynBioHubRunner"
if [ -d SynBioHubRunner/.git ] || [ -f SynBioHubRunner/pom.xml ]; then
    (cd SynBioHubRunner && git pull --ff-only 2>/dev/null || true)
else
    rm -rf SynBioHubRunner
    git clone --recurse-submodules https://github.com/mehersam/SynBioHubRunner
fi

message "Setting up SynBioHubRunner"
cp Emulator_Settings.txt SynBioHubRunner/src/resources/Emulator_Settings.txt
(cd SynBioHubRunner && mvn package)

message "Building TestRunner"
(cd SBOLTestRunner && mvn package)

JAR="SBOLTestRunner/target/SBOLTestRunner-0.0.1-SNAPSHOT-withDependencies.jar"
EMU_JAR="SynBioHubRunner/target/SBHEmulator-0.0.1-SNAPSHOT-withDependencies.jar"
if [ ! -f "$JAR" ] || [ ! -f "$EMU_JAR" ]; then
    message "Expected jars missing after mvn package"
    exit 1
fi

message "Running SBOLTestRunner"

rm -rf Timing Emulated Retrieved Compared
mkdir Timing Emulated Retrieved Compared

set +e
java -jar "$JAR" "java -jar $EMU_JAR" "Compared/" "Retrieved/" "-e" "Emulated/" | tee sbol_testrunner_result
exitcode=${PIPESTATUS[0]}
set -e

rm -f sbol_testrunner_result

if [ $exitcode -ne 0 ]; then
    python3 print_error_log.py "$@" || true
    message "Exiting with code $exitcode."
    exit $exitcode
fi
