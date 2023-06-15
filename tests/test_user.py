from unittest import TestCase
from test_arguments import test_print
from test_functions import compare_post_request, compare_get_request, login_with

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

        test_print("test_post_login starting")
        #not registered user
        logininfo = {'email' : 'test7@user.synbiohub',
                      'password' : 'test'}
        login_with(logininfo, 0)

        #bad password
        logininfo = {'email' : 'test1@user.synbiohub',
                      'password' : 'password'}
        login_with(logininfo, 0)

        #correct login
        logininfo = {'email' : 'test1@user.synbiohub',
                      'password' : 'test'}
        login_with(logininfo, 1)
        test_print("test_post_login completed")
        
        test_print("test_post_register starting")
        compare_get_request("/profile", headers = headers, route_parameters = [], test_type = test_type, comparison_type="json", fields=["name", "username", "email", "affiliation", "graphUri"])

        data={
             'name': 'ronnie',
             'affiliation' : 'notcovid',
             'email' : 'ronnie@user.synbiohub',
             'password1' : 'test',
             'password2' : 'test'
        }

        compare_post_request("profile", data, test_name = "profile2", headers = headers, route_parameters = [], files = None, test_type = test_type)

        #login as admin to tes profile endpoint for an admin user
        logininfo = {'email' : 'test@user.synbiohub',
                      'password' : 'test'}
        login_with(logininfo, 1)
        
        compare_get_request("/profile", headers = headers, route_parameters = [], test_type = test_type, comparison_type = "json", test_name="admin_get_profile", fields=["name", "username", "password", "email", "affiliation", "graphUri", "isAdmin", "isCurator", "isMember"])

        #log back in as a regular user
        logininfo = {'email' : 'test1@user.synbiohub',
                      'password' : 'test'}
        login_with(logininfo, 1)
        test_print("test_post_login completed")

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

