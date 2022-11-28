import subprocess, shutil, time, os
from requests.exceptions import HTTPError
import requests_html, difflib, sys, requests, json
from bs4 import BeautifulSoup

from test_arguments import args, test_print
from TestState import TestState, clip_request

IGNORE_CLASSES = ["testignore", "buorg"]

test_state = TestState()

# now clip all the requests in the ones to reset
for i in range(len(args.resetgetrequests)):
    args.resetgetrequests[i] = clip_request(args.resetgetrequests[i])

for i in range(len(args.resetpostrequests)):
    args.resetpostrequests[i] = clip_request(args.resetpostrequests[i])


# make html a little more human readable and remove testignore elements
def format_html(htmlstring):
    soup = BeautifulSoup(htmlstring, 'lxml')

    # remove elements with class testignore
    for ignore_class in IGNORE_CLASSES:
        for div in soup.find_all(class_=ignore_class):
            div.decompose()

    return soup.prettify()


# parse the address of the endpoint being tested
def get_address(request, route_parameters, version):
    # stores partial strings
    #version 1 - sbh1 address, version 3/else/default - sbh3 address
    if(version == 1):
        string_build = [args.sbh1serveraddress]
    else:
        string_build = [args.sbh3serveraddress]

    # find parameters and replace them
    i = 0 # current position in request string
    last_i = 0 # the position after the last parameter
    param_i = 0 # the position in route_parameters list
    while i < len(request):
        # loop
        if request[i] == ':':
            string_build.append(request[last_i:i]) # append the last fragment
            while i < len(request) and request[i] != '/':
                i += 1
            string_build.append(route_parameters[param_i]) # add the next param
            param_i += 1
            last_i = i # update the start of the next fragment
        i += 1

    # add the final fragment
    string_build.append(request[last_i:i])

    if param_i < len(route_parameters):
        raise Exception("found more route_parameters than actual parameters in request string")

    return ''.join(string_build)

# perform a get request, and render the javascript
# post requests do not render the javascript
def get_request(request, version, headers, route_parameters):

    # get the current token
    if(version == 1):
        user_token = test_state.get_authentication(1)
    else:
        user_token = test_state.get_authentication(3)

    if user_token != None:
        headers["X-authorization"] = user_token

    address = get_address(request, route_parameters, version)
    print(address)

    session = requests_html.HTMLSession()

    response = session.get(address, headers = headers)

    try:
        response.raise_for_status()
    except HTTPError:
        raise HTTPError("Internal server error. Content of response was \n" + response.text)

    #print("PRINTING VERSION" + str(version) + "\n")

    #print(response.text)
    return response.text

def get_request_download(request, headers, route_parameters, version):
    # get the current token
    if(version == 1):
        user_token = test_state.get_authentication(1)
    else:
        user_token = test_state.get_authentication(3)

    if user_token != None:
        headers["X-authorization"] = user_token

    address = get_address(request, route_parameters, version)

    session = requests_html.HTMLSession()

    response = session.get(address, headers = headers)
    try:
        response.raise_for_status()
    except HTTPError:
        raise HTTPError("Internal server error. Content of response was \n" + response.text)

    return response.text

# data is the data field for a request
def post_request(request, version, data, headers, route_parameters, files):
    # get the current token
    if(version == 1):
        user_token = test_state.get_authentication(1)
    else:
        user_token = test_state.get_authentication(3)

    if user_token != None:
        headers["X-authorization"] = user_token

    address = get_address(request, route_parameters, version)

    session = requests_html.HTMLSession()

    response = session.post(address, data = data, headers = headers, files = files)
        
    try:
        response.raise_for_status()
    except HTTPError:
        raise HTTPError("Internal server error. Content of response was \n" + response.text)

    #print("PRINTING VERSION" + str(version) + "\n")
    #print(response.text)  

    return response.text

# creates a file path for a given request and request type
# testname is a name to avoid collisions between tests testing the same endpoint
def request_file_path(request, requesttype, testname):
    return 'previousresults/' + requesttype.replace(" ", "") + "_" + request.replace("/", "-") + "_" + testname + ".html"

def request_file_path_download(request, requesttype, testname):
    return 'previousresults/' + requesttype.replace(" ", "") + "_" + request.replace("/", "-") + "_" + testname + ".xml"

def compare_request(sbh1requestcontent, sbh3requestcontent, request, requesttype):
    """ Checks a sbh3 request against a sbh1 request.
request is the endpoint requested, such as /setup
requesttype is the type of request performed- either 'get request' or 'post request'"""
    
    if requesttype[0:3] == "get" or requesttype[0:4] == "post":
        file_diff(sbh1requestcontent, sbh3requestcontent, request, requesttype)

def file_diff(sbh1requestcontent, sbh3requestcontent, request, requesttype):
    sbh1data = sbh1requestcontent

    sbh1data = sbh1data.splitlines()
    sbh3data = sbh3requestcontent.splitlines()

    # if(sbh1data == sbh3data):
    #     print("TEST PASSED\n")
    # else:
    #     print("TEST FAILED\n")
    #     print("SBH1\n")
    #     print(sbh1data)
    #     print("SBH3\n")
    #     print(sbh3data)

    changes = difflib.unified_diff(sbh1data, sbh3data)
    
    # change list holds the strings to print in an error message
    changelist = [requesttype, " ", request, " did not match previous results. If you are adding changes to SynBioHub that change this page, please check that the page is correct and update the file using the command line argument --resetgetrequests [requests] and --resetpostrequests [requests].\nThe following is a diff of the new files compared to the old.\n"]

    # temp variable to detect if we need to print the beginning of the error
    numofchanges = 0

    for c in changes:
        numofchanges += 1

        # print the diff
        changelist.append(c)
        changelist.append("\n")

    changelist.append("\n Here is the last 50 lines of the synbiohub error log: \n")
    changelist.append(get_end_of_error_log(50))
    print(numofchanges)
    if numofchanges>0:
        #raise ValueError(''.join(changelist))
        #print(changelist)
        print("TEST FAILED\n")
        print("SBH1\n")
        print(sbh1data)
        print("SBH3\n")
        print(sbh3data)
    else:
        print("TEST PASSED\n")
        print("SBH3\n")

def login_with(data, version, headers = {'Accept':'text/plain'}):
    result = post_request("login", version, data, headers, [], files = None)
    if(version == 1):
        test_state.save_authentication(result, version)
    else:
        test_state.save_authentication(result, version)

def compare_get_request(request, test_name = "", route_parameters = [], headers = {}):
    """Complete a get request and error if it differs from previous results.
page
    request -- string, the name of the page being requested
    route_parameters -- a ordered lists of the parameters for the endpoint
    test_name -- a name to make the request unique from another test of this endpoint
    headers -- a dictionary of headers to include in the request
    re_render_time -- time to wait in milliseconds before rendering javascript again"""

    # remove any leading forward slashes for consistency
    request = clip_request(request)

    #gives filepath for old test for 1 - sbh3 test: now using for checking which endpoints were tested
    testpath = request_file_path(request, "get request", test_name)
    test_state.add_get_request(request, testpath, test_name)
    #get_request("profile", 1, headers = {"Accept": "text/plain"}, route_parameters = [], re_render_time = 0)
    compare_request(get_request(request, 1, headers, route_parameters), get_request(request, 3, headers, route_parameters), request, "get request")

def compare_get_request_download(request, test_name = "", route_parameters = [], headers = {}, re_render_time = 0):
    """Complete a get_file request and error if it differs from previous results.

    request -- string, the name of the page being requested
    route_parameters -- a ordered lists of the parameters for the endpoint
    test_name -- a name to make the request unique from another test of this endpoint
    headers -- a dictionary of headers to include in the request
    re_render_time -- time to wait in milliseconds before rendering javascript again"""

    # remove any leading forward slashes for consistency
    request = clip_request(request)

    testpath = request_file_path_download(request, "get_file", test_name)
    test_state.add_get_request(request, testpath, test_name)

    compare_request(get_request_download(request, headers, route_parameters, re_render_time, 1), get_request_download(request, headers, route_parameters, re_render_time, 3), request, "get_file request")

def compare_post_request(request, data, test_name = "", route_parameters = [], headers = {}, files = None):
    """Complete a post request and error if it differs from previous results.

    request-- string, the name of the page being requested
    data -- data to send in the post request
    route_parameters -- a list of parameters for the url endpoint
    test_name -- a name for the test to make multiple tests for the same endpoint unique"""

    # remove any leading forward slashes for consistency
    request = clip_request(request)

    testpath = request_file_path(request, "post request", test_name)
    test_state.add_post_request(request, testpath, test_name)

#post_request("submit", 1, data, headers = headers, route_parameters = [], files = files)
    compare_request(post_request(request, 1, data, headers, route_parameters, files = files), post_request(request, 3, data, headers, route_parameters, files = files), request, "post request")

# TODO: make checking throw an error when all endpoints are not checked, instead of printing a warning.
def cleanup_check():
    """Performs final checking after all tests have run.
    Checks to make sure all endpoints were tested."""

    test_state.cleanup_check()

def run_bash(command):
    process = subprocess.Popen(command.split(), stdout=subprocess.PIPE)
    output, error = process.communicate()

def file_tail(filename, length):
    return os.popen('tail -n ' + str(length) +' '+filename).read()


def get_end_of_error_log(num_of_lines):
    copy_docker_log()
    directory = os.listdir("./logs_from_test_suite")
    for filename in directory:
        if filename[len(filename)-5:] == "error":
            return file_tail("./logs_from_test_suite/" + filename, num_of_lines)

    raise Exception("Could not find error log")


def copy_docker_log():
    if os.path.isdir("./logs_from_test_suite"):
        shutil.rmtree("./logs_from_test_suite")

    if os.path.isdir("docker_logs"):
        shutil.rmtree("./docker_logs")

    run_bash("docker cp testsuiteproject_synbiohub_1:/mnt/data/logs .")
    run_bash("mv ./logs ./logs_from_test_suite")


