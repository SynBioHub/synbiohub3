import requests
from unittest import TestCase
from test_arguments import test_print
from test_functions import compare_get_request, compare_post_request

class TestTwins(TestCase):
    def test_twins(self):
        test_print("test_twins starting")

        #Can add back when submit works on 3
        # data = {'id':(None, 'testid1'),
        #            'version' : (None, '1'),
        #            'name' : (None, 'testcollection1'),
        #            'description':(None, 'testdescription'),
        #            'citations':(None, ''),
        #            'overwrite_merge':(None, '0')}
        # files = {'file':("./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/BBa_I0462.xml",
        #                                  open('./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/BBa_I0462.xml', 'rb'))}
        # compare_post_request("submit", data, headers = {"Accept": "text/plain"}, files = files, test_name = "create_1_twins")

        # compare_get_request("user/:userId/:collectionId/:displayId/:version/twins", route_parameters = ["testuser","testid1","BBa_I0462","1"])

        #http://localhost:6789/public/igem/BBa_B0034/1/twins
        #TODO: didn't work on 3 last time I tested
        compare_get_request(":userId/:collectionId/:displayId/:version/twins", headers = {"Accept": "text/plain"}, route_parameters = ["public","igem","BBa_B0034","1"])
        test_print("test_twins completed")
