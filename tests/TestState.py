import re
from bs4 import BeautifulSoup

from test_arguments import test_print

def clip_request(requeststring):
    if requeststring[0] == '/' and requeststring[-1] == '/':
        requeststring = requeststring[1:-1]
    elif requeststring[0] == '/':
        requeststring = requeststring[1:]
    elif requeststring[-1] == '/':
        requeststring = requeststring[:-1]
    return requeststring
    

class TestState:

    def __init__(self):
        # first create the list of all endpoints that should be checked
        self.all_get_endpoints = []
        self.all_post_endpoints = []
        self.all_all_endpoints = []
        self.all_test_results = {"All": {"pass": 0, "fail": 0}, "User": {"pass": 0, "fail": 0}, "Search": {"pass": 0, "fail": 0}, "Download": {"pass": 0, "fail": 0}}

        # scrape app.js for the endpoints
        with open("app.js", 'r') as appfile:
            line = appfile.readline()
            while line:
                # regex parts:
                # look for any number of any character, then app.get
                # then loop for an open paren followed by either ' or "
                # capture what is in between that and another ' or ", and match it non-greedily
                # then match anything after it
                search = re.search('.*app\.get\((?:\'|")(.*?)(?:\'|").*', line)

                if search:
                    self.all_get_endpoints.append(clip_request(search.group(1)))

                search = re.search('.*app\.post\((?:\'|")(.*?)(?:\'|").*', line)

                if search:
                    self.all_post_endpoints.append(clip_request(search.group(1)))

                search = re.search('.*app\.all\((?:\'|")(.*?)(?:\'|").*', line)

                if search:
                    self.all_all_endpoints.append(clip_request(search.group(1)))

                line = appfile.readline()

        

        # keep track of all the endpoints tested to make sure all endopints are checked
        self.tested_get_endpoints = []
        self.tested_post_endpoints = []

        # keep track of the names of the tests to avoid duplicates
        self.all_tested_paths = []

        # keep track of authetification after logging in
        self.login_authentication_sbh1 = None
        self.login_authentication_sbh3 = None

    def cleanup_check(self):
        nottestedcounter = 0
        
        for e in self.all_get_endpoints:
            if not e in self.tested_get_endpoints:
                nottestedcounter += 1
                test_print("Warning- get endpoint " + e + " was not tested.")

        for e in self.all_post_endpoints:
            if not e in self.tested_post_endpoints:
                nottestedcounter += 1
                test_print("Warning- post endpoint " + e + " was not tested.")

        for e in self.all_all_endpoints:
            if not e in self.tested_get_endpoints and not e in self.tested_post_endpoints:
                nottestedcounter += 1
                test_print("Warning- all endpoint " + e + " was not tested.")

        # test that all the endpoints that were tested were real endpoints
        for e in self.tested_get_endpoints:
            if not e in self.all_get_endpoints and not e in self.all_all_endpoints:
                raise Exception("Endpoint " + str(e) + " does not exist")

        for e in self.tested_post_endpoints:
            if not e in self.all_post_endpoints and not e in self.all_all_endpoints:
                raise Exception("Endpoint " + str(e) + " does not exist")

        if nottestedcounter != 0:
            #test_print(str(nottestedcounter) + " endpoints not tested.") #original keep
            total_number_endpoints = len(self.tested_get_endpoints) + len(self.tested_post_endpoints) + len(self.all_all_endpoints) + len(self.all_get_endpoints) + len(self.all_post_endpoints)
            tested_endpoints = total_number_endpoints - nottestedcounter
            percent_tested = round((tested_endpoints/total_number_endpoints) * 100, 0)
            # test_print(str(nottestedcounter) + " out of " + (str(len(self.tested_get_endpoints))) + " endpoints not tested.")
            # test_print(str(len(self.tested_get_endpoints)) + ": " + str(self.tested_get_endpoints))
            # test_print(str(len(self.tested_post_endpoints)) + ": " + str(self.tested_post_endpoints))
            # test_print(str(len(self.all_all_endpoints)) + ": " + str(self.all_all_endpoints))
            # test_print(str(len(self.all_get_endpoints)) + ": " + str(self.all_get_endpoints))
            # test_print(str(len(self.all_post_endpoints)) + ": " + str(self.all_post_endpoints))
            test_print("Test coverage: " + str(tested_endpoints) + " out of " + (str(total_number_endpoints)) + " endpoints tested.")
            percent_not_tested = round((nottestedcounter/total_number_endpoints) * 100, 0)
            progress_bar = "["
            for i in range(int(percent_tested)//2):
                progress_bar += "="
            for i in range(int(percent_not_tested)//2):
                progress_bar += " "
            progress_bar+= "]"
            test_print(str(percent_tested) + "%" + " of endpoints tested " + progress_bar)
        #show_test_coverage(self.all_all_endpoints, nottestedcounter, tested_endpoints)

    # def show_test_coverage(totalendpoints, endpointsnottested, enpointstested):
    #     percent_tested = endpointstested/totalendpoints
    #     percent_not_tested = endpointsnottested/totalendpoints
    #     progress_bar = "["
    #     for i in range(round(percent_tested, 0)):
    #         progress_bar += "="
    #     for i in range(round(percent_not_tested, 0)):
    #         progress_bar += " "
    #     progress_bar+= "]"
    #     test_print(str(percent_tested) + "%" + " of endpoints tested " + progress_bar)

    def add_post_request(self, request, testpath, test_name):

        # add to the global list of checked endpoints
        if not request in self.tested_post_endpoints:
            self.tested_post_endpoints.append(request)

        # error if it was already registered
        if testpath in self.all_tested_paths:
            if test_name == "":
                test_name = "none specified"
            raise Exception("Duplicate test name for post request " + request + " with test name " + test_name + ". When testing an endpoint multiple times, provide the test_name field to compare_post_request.")
        else:
            self.all_tested_paths.append(testpath)

    def add_get_request(self, request, testpath, test_name):
        # add to the global list of checked endpoints
        if not request in self.tested_get_endpoints:
            self.tested_get_endpoints.append(request)

        if testpath in self.all_tested_paths:
            if test_name == "":
                test_name = "none specified"
            raise Exception("Duplicate test name for get request " + request + " with test name " + test_name + ". When testing an endpoint multiple times, provide the test_name field to compare_get_request.")
        else:
            self.all_tested_paths.append(testpath)

    # saves the result of a login request for future use
    def save_authentication(self, request_result, version):
        soup = BeautifulSoup(request_result, 'lxml')
        ptag = soup.find_all('p')
        if len(ptag)!= 1:
            raise ValueError("Invalid login response received- multiple or no elements in p tag.")
        content = ptag[0].text
        if(version == 1):
            self.login_authentication_sbh1 = content.strip()
            test_print("Logging in with authentication " + str(self.login_authentication_sbh1))
        else:
            self.login_authentication_sbh3 = content.strip()
            test_print("Logging in with authentication " + str(self.login_authentication_sbh3))
        
    def get_authentication(self, version):
        if(version == 1):
            return self.login_authentication_sbh1
        else:
            return self.login_authentication_sbh3

    def add_test_result(self, endpoint, test_pass):
        #endpoint = "user"
        #test_pass = "pass"
        self.all_test_results[endpoint][test_pass] +=1

    def show_test_results(self):
        #for each type of endpoint, make sure to show % of tests passed
        total_tests = self.all_test_results["All"]["pass"] + self.all_test_results["All"]["fail"]

        for test_type in self.all_test_results:
            percent_passed = round((self.all_test_results[test_type]["pass"]/total_tests) * 100, 0)
            percent_failed = round((self.all_test_results[test_type]["fail"]/total_tests) * 100, 0)
            self.print_progress_bar(test_type, percent_passed, percent_failed)

        # test_print("Final Test Results: ")
        
        # percent_passed = round((self.all_test_results["all"]["pass"]/total_tests) * 100, 0)
        # percent_failed = round((self.all_test_results["all"]["fail"]/total_tests) * 100, 0)


        # progress_bar = "["
        # for i in range(int(percent_passed)//2):
        #     progress_bar += "="
        # for i in range(int(percent_failed)//2):
        #     progress_bar += " "
        # progress_bar+= "]"
        # test_print(str(percent_passed) + "%" + " of all tests passed " + progress_bar)

    def print_progress_bar(self, type, percent_passed , percent_failed):
        progress_bar = "["
        for i in range(int(percent_passed)//2):
            progress_bar += "="
        for i in range(int(percent_failed)//2):
            progress_bar += " "
        progress_bar+= "]"
        test_print(str(percent_passed) + "%" + " of " + str(type) + " tests passed " + progress_bar)

