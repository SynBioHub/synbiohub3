from unittest import TestCase
from test_arguments import test_print
from test_functions import compare_post_request, compare_get_request, login_with, post_request


def assert_login_status_match(logininfo, headers=None):
    """Compare SBH1 vs SBH3 login by HTTP status only (error bodies may differ)."""
    if headers is None:
        headers = {"Accept": "text/plain"}
    sbh1 = post_request("login", 1, logininfo, headers, [], files=None)
    sbh3 = post_request("login", 3, logininfo, headers, [], files=None)
    if sbh1.status_code != sbh3.status_code:
        raise Exception(
            "RESPONSE CODE TEST FAILED: Status codes don't match; "
            f"SBH1: {sbh1.status_code} SBH3: {sbh3.status_code}"
        )
    print(f"RESPONSE CODE TEST PASSED: Status Code: {sbh3.status_code}")


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
        #not registered user — status codes only (SBH1/SBH3 error bodies differ)
        logininfo = {'email' : 'test7@user.synbiohub',
                      'password' : 'test'}
        assert_login_status_match(logininfo)

        #bad password — status codes only
        logininfo = {'email' : 'test1@user.synbiohub',
                      'password' : 'password'}
        assert_login_status_match(logininfo)

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
        
        compare_get_request("/profile", headers = headers, route_parameters = [], test_type = test_type, comparison_type = "json", test_name="admin_get_profile", fields=["name", "username", "password", "email", "affiliation", "graphUri"])

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

