from unittest import TestCase
from test_functions import compare_get_request, compare_post_request
from test_arguments import test_print


class TestBeforeLogin(TestCase):

    def test_before_login(self):
        headers = {"Accept": "text/plain"}

        # test_post_bad_login(self):
        test_print("test_post_bad_login starting")
        bad_login_info = {'email' : 'bademail',
                          'password' : 'test'}
        compare_post_request("/login", bad_login_info, test_name='bad_email', headers=headers)
        test_print("test_post_bad_login completed")

        test_print("test_post_login starting")
        not_registered_email = {'email' : 'test7@user.synbiohub',
                      'password' : 'test'}
        compare_post_request("/login", not_registered_email, test_name='not_registered_email', headers=headers)

        #test_no_username_login(self):
        test_print("test_no_username_login starting")
        no_email_info = {'password' : 'test'}
        compare_post_request("/login", no_email_info, test_name='no_email_login', headers = headers)
        test_print("test_no_username_login completed")

        # test_post_login_admin(self):
        # test_print("test_post_login_admin starting")
        # logininfo = {'email' : 'test@user.synbiohub',
        #              'password' : 'test'}
        # compare_post_request("/login", logininfo)
        # test_print("test_post_login_admin completed")
