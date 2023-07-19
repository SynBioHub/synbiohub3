# Testing SynBioHub3 for parity with SynBioHub1

## Running the test suite using Docker Desktop

Steps to run the test suite using Docker
1. Download Docker Desktop
2. Download tests folder and open in terminal
3. In terminal: `cd ..`
4. Pull the updated docker image, in terminal: `docker pull synbiohub/sbh3backend:snapshot`
5. In terminal: `tests/test.sh`

## Running the test suite with a local image of the SBH3 backend (for testing new code before it is pushed)

Steps to run the test suite using Docker
1. Download Docker Desktop
2. Clone entire SBH3 repo
3. In terminal, `cd folder_name` until you get to the backend folder
4. Build a docker image of synbiohub3 backend using `docker build -t synbiohub/sbh3backend:snapshot -f Dockerfile`
5. In terminal: `cd ..`
6. In terminal: `tests/test.sh`

## Writing new tests

Tests are written as unittest test cases. Use the compare_get_request and compare_post_request functions previded by test_functions to test endpoints.

The test suite requires that each endpoint in lib/app.js is tested at least once. The tests perform the request and save the result to compare against future requests. If the endpoint is already tested, a "test_name" parameter (e. test_name = "string") needs to be added to differentiate the additional tests.

## Arguments
  -h, --help            show this help message and exit

  --serveraddress SERVERADDRESS
                        specify the synbiohub server to test.

  --resetgetrequests [RESETGETREQUESTS [RESETGETREQUESTS ...]]
                        reset a get request test by saving the result of the
                        request for future comparison. Use this option after
                        verifying that a request works correctly.

  --resetpostrequests [RESETPOSTREQUESTS [RESETPOSTREQUESTS ...]]
                        reset a post request test by saving the result of the
                        request for future comparison. Use this option after
                        verifying that a request works correctly.

  --stopaftertestsuite  stop after the test suite has run in order to keep the
                        test server running. This can be used to view the
                        state of the synbiohub instance after the tests have
                        run but before sboltestrunner has been run.

  --stopafterstart      do not run the test suite, just start up a new test
                        synbiohub instance.
                        
  --stopaftersetup      do not run the test suite, just start up a new test
                        synbiohub instance and run the setup test.




