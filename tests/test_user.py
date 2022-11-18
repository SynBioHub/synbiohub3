from unittest import TestCase
from test_arguments import test_print
from test_functions import compare_request, login_with, post_request, get_request

class TestUser(TestCase):

    def test_post_register(self):
        test_print("test_post_register starting")
        data={
            'username': 'testuser2',
            'name' : 'ronald',
            'affiliation' : 'synbiohubtester',
            'email' : 'test2@user.synbiohub',
            'password1' : 'test1',
            'password2' : 'test1'
        }
        #compare_post_request("register", data, headers = {"Accept": "text/plain"}, test_name = "register1")
        compare_request(post_request("register", 1, data, headers = {"Accept": "text/plain"}, route_parameters = [], files = None), post_request("register", 3, data, headers = {"Accept": "text/plain"}, route_parameters = [], files = None), "register", "post request", [], "")
        #post_request("register", 1, data, headers = {"Accept": "text/plain"}, route_parameters = [], files = None)
        #post_request("register", 3, data, headers = {"Accept": "text/plain"}, route_parameters = [], files = None)

        logininfo = {'email' : 'test2@user.synbiohub',
                     'password' : 'test1'}
        login_with(logininfo, 1)
        login_with(logininfo, 3)

        #compare_get_request("/profile")
        get_request("profile", 1, headers = {"Accept": "text/plain"}, route_parameters = [], re_render_time = 0)
        get_request("profile", 3, headers = {"Accept": "text/plain"}, route_parameters = [], re_render_time = 0)
        compare_request(get_request("profile", 1, headers = {"Accept": "text/plain"}, route_parameters = [], re_render_time = 0), get_request("profile", 3, headers = {"Accept": "text/plain"}, route_parameters = [], re_render_time = 0), "profile", "get request", [], "")

        data={
             'name': 'ronnie',
             'affiliation' : 'notcovid',
             'email' : 'ronnie@user.synbiohub',
             'password1' : 'test',
             'password2' : 'test'
         }
        #compare_post_request("profile", data, headers = {"Accept": "text/plain"}, test_name = "profile2")
        post_request("profile", 1, data, headers = {"Accept": "text/plain"}, route_parameters = [], files = None)
        post_request("profile", 3, data, headers = {"Accept": "text/plain"}, route_parameters = [], files = None)
        compare_request(post_request("profile", 1, data, headers = {"Accept": "text/plain"}, route_parameters = [], files = None),post_request("profile", 3, data, headers = {"Accept": "text/plain"}, route_parameters = [], files = None) , "profile", "post request", [], "")

        #compare_get_request("/logout")
        test_print("logout started")
        data={
        }
        
        post_request("logout", 1, data, headers = {"Accept": "text/plain"}, route_parameters = [], files = None)
        #post_request("logout", 3, data, headers = {"Accept": "text/plain"}, route_parameters = [], files = None)
        test_print("logout completed")

        test_print("test_post_register completed")

        test_print("test_post_login_token starting")
        logininfo = {'email' : 'test@user.synbiohub',
                      'password' : 'test'}
        login_with(logininfo, 1)
        #login_with(logininfo, 3)
        test_print("test_post_login_token completed")

