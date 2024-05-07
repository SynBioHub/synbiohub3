from unittest import TestCase
from test_functions import compare_get_request, compare_post_request, post_request, post_json_request
from test_arguments import test_print


class TestSetup(TestCase):

    def test_get(self):

        test_print("test_setup_get starting")

        # get the setup page and test it before setting up
        compare_get_request("setup")

        test_print("test_setup_get completed")

    def test_post(self):

        test_print("test_setup_post starting")

        # fill in the form and submit with test info
        setup = {
            'userName' : 'testuser',
            'userFullName' : 'Test User',
            'userEmail': 'test@user.synbiohub',
            'userPassword': 'test',
            'userPasswordConfirm': 'test',
            'instanceName': 'Test Synbiohub',
            'frontendURL': 'http://localhost:3333',
            'instanceUrl': 'http://localhost:7777/',
            'uriPrefix': 'https://synbiohub.org/',
            'altHome': 'http://testHomepage.org/',
            'color': '#D25627',
            'frontPageText': 'text',
            'virtuosoINI': '/etc/virtuoso-opensource-7/virtuoso.ini',
            'virtuosoDB': '/var/lib/virtuoso-opensource-7/db',
            'allowPublicSignup': 'true',
        }

        #Use to do /setup and test
        # compare_post_json_request('setup', setup, headers = {"Accept": "text/plain"}, route_parameters = [], files = None)

        #Use to do /setup "without" comparing the responses
        post_json_request("setup", 1, setup, headers = {"Accept": "text/plain", "Content-Type": "application/json"}, route_parameters = [], files = None)
        post_json_request("setup", 3, setup, headers = {"Accept": "text/plain", "Content-Type": "application/json"}, route_parameters = [], files = None)

        test_print("test_setup_post completed")



