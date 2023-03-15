from unittest import TestCase
from test_arguments import test_print
from test_functions import compare_post_request, compare_get_request, login_with, post_request, get_request, compare_get_request_json

class TestUser(TestCase):

    def test_post_register(self):
        headers = {"Accept": "text/plain"}
        test_type = "User"
        test_print("test_post_register starting")

        data={
            'username': 'testuser1',
            'name' : 'Test User',
            'affiliation' : 'synbiohubtester',
            'email' : 'test1@user.synbiohub',
            'password1' : 'test',
            'password2' : 'test'
        }

        compare_post_request("register", data, test_name = "register1", headers = headers, route_parameters = [], files = None, test_type = test_type) #error - account already in use? - FAIL CASE for 1

        #logininfo = {'email' : 'test2@user.synbiohub',
                     #'password' : 'test1'}
        #login_with(logininfo, 1)
        #login_with(logininfo, 3)

        logininfo = {'email' : 'test1@user.synbiohub',
                      'password' : 'test'}
        login_with(logininfo, 1)
        login_with(logininfo, 3)

        compare_get_request_json("/profile", headers = headers, route_parameters = [], test_type = test_type, fields=["name", "username", "email", "affiliation", "graphUri"])

        data={
             'name': 'ronnie',
             'affiliation' : 'notcovid',
             'email' : 'ronnie@user.synbiohub',
             'password1' : 'test',
             'password2' : 'test'
        }

        #uncomment when profile works
        #compare_post_request("profile", data, test_name = "profile2", headers = headers, route_parameters = [], files = None, test_type = test_type)

        #compare_get_request("/logout")
        # test_print("logout started")
        # data={
        # }
        
        #post_request("logout", 1, data, headers = {"Accept": "text/plain"}, route_parameters = [], files = None)
        #post_request("logout", 3, data, headers = {"Accept": "text/plain"}, route_parameters = [], files = None)

        #compare_post_request("logout", data, headers = {"Accept": "text/plain"}, route_parameters = [], files = None, test_type="User")
        #test_print("logout completed")

        #test_print("test_post_register completed")

        # test_print("test_post_login_token starting")
        # logininfo = {'email' : 'test1@user.synbiohub',
        #               'password' : 'test'}
        # login_with(logininfo, 1)
        # login_with(logininfo, 3)
        # test_print("test_post_login_token completed")

