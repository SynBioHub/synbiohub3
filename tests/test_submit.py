import requests
from unittest import TestCase
from test_arguments import test_print
from test_functions import compare_get_request, compare_post_request, get_request, post_request

class TestSubmit(TestCase):
    def test_submit(self):
        test_type = "Submit"
        headers = {'Accept':'text/plain'}

        test_print("test_get_submit_submissions_empty starting")

        # working curl request
        #curl -X POST -H "Accept: text/plain" -H "X-authorization: e35054aa-04e3-425c-afd2-66cb95ff66e1" -F id=green -F version="3" -F name="test" -F description="testd" -F citations="none" -F overwrite_merge="0" -F file=@"./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/BBa_I0462.xml" http://localhost:7777/submit"""

        test_print("test_get_submit_submissions_empty completed")

        #TODO: can uncomment when works in sbh3
        test_print("test_create_id_missing starting")

        data = {'version' : (None, '1'),
                'name' : (None, 'testcollection'),
                'description':(None, 'testdescription'),
                'citations':(None, ''),
                'overwrite_merge':(None, '0')}

        files = {'file':("./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/BBa_I0462.xml",
                                              open('./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/BBa_I0462.xml', 'rb'))}
        with self.assertRaises(requests.exceptions.HTTPError):
            #compare_post_request("submit", data, headers = {"Accept": "text/plain"}, files = files, test_name = "missing_id", test_type = test_type)
                post_request("submit", 1, data, headers = headers, route_parameters = [], files = files)

        test_print("test_create_id_missing completed")

        test_print("test_create_and_delete_collections starting")
        # create the collection
        data = {'id':(None, 'testid'),
                'version' : (None, '1'),
                'name' : (None, 'testcollection'),
                'description':(None, 'testdescription'),
                'citations':(None, ''),
                'overwrite_merge':(None, '0')}

        files = {'file':("./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/BBa_I0462.xml",
                                              open('./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/BBa_I0462.xml', 'rb'))}

        #compare_post_request("submit", data, headers = {"Accept": "text/plain"}, files = files, test_name = "submit_test_BBa", test_type = test_type)
        post_request("submit", 1, data, headers = headers, route_parameters = [], files = files)
        with self.assertRaises(requests.exceptions.HTTPError):
            #compare_post_request("submit", data, headers = {"Accept": "text/plain"}, files = files, test_name = "submit_already_in_use", test_type = test_type)
            post_request("submit", 1, data, headers = headers, route_parameters = [], files = files)

#        self.create_collection2()

        #compare_get_request("manage", test_name = "two_submissions", test_type = test_type)
        #compare_get_request("submit", test_name = "two_submissions", test_type = test_type)


        # now remove the collections
        #compare_get_request('/user/:userId/:collectionId/:displayId/:version/removeCollection', route_parameters = ["testuser", "testid", "testid_collection", "1"], test_type = test_type)
        #compare_get_request('/user/:userId/:collectionId/:displayId/:version/removeCollection', route_parameters = ["testuser", "testid2", "testid2_collection", "1"], test_name = 'remove_second', test_type = test_type)
        get_request('user/:userId/:collectionId/:displayId/:version/removeCollection', 1, headers = headers, route_parameters = ["testuser", "testid", "testid_collection", "1"])
        #TODO: make sure this is okay -> didn't work forbidden#get_request('user/:userId/:collectionId/:displayId/:version/removeCollection', 1, headers = headers, route_parameters = ["testuser", "testid2", "testid2_collection", "1"])
        
        #compare_get_request("manage", test_name = "no_submissions", test_type = test_type)

        test_print("test_create_and_delete_collections completed")

        test_print("create_collection2 starting")
        data = {'id':(None, 'testid2'),
                'version' : (None, '1'),
                'name' : (None, 'testcollection2'),
                'description':(None, 'testdescription'),
                'citations':(None, ''),
                'overwrite_merge':(None, '0')}

        files = {'file':("./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/BBa_I0462.xml",
                                              open('./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/BBa_I0462.xml', 'rb'))}

        #compare_post_request("submit", data, headers = {"Accept": "text/plain"}, files = files, test_name = "create_2", test_type = test_type)
        post_request("submit", 1, data, headers = headers, route_parameters = [], files = files)

        # delete collection
        #compare_get_request("/user/testuser/testid2/testid_collection2/1/removeCollection", test_type = test_type)

        test_print("create_collection2 completed")

        test_print("make_new_collection starting")
        # create the collection
        data = {'id':(None, 'testid1'),
                'version' : (None, '1'),
                'name' : (None, 'testcollection1'),
                'description':(None, 'testdescription1'),
                'citations':(None, ''),
                'overwrite_merge':(None, '0')}

        files = {'file':("./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/toggle.xml",
                                              open('./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/toggle.xml', 'rb'))}

        #compare_post_request("submit", data, headers = {"Accept": "text/plain"}, files = files, test_name = "generic_collection1", test_type = test_type)
        post_request("submit", 1, data, headers = headers, route_parameters = [], files = files)

        test_print("make_new_collection completed")

#    """ def test_bad_make_public(self):
#        data = self.make_new_collection("1")
#
#        data['tabState'] = 'new'
#
#        # try to remove the collection but don't enter a id
#        del data['id']
#        with self.assertRaises(requests.exceptions.HTTPError):
#            compare_post_request("/user/:userId/:collectionId/:displayId/:version/makePublic", route_parameters = ["testuser", "testid1", "testid_collection1", "1"], data = data)
#    TODO: uncomment when this does raise an HTTPError in synbiohub
#        """

        test_print("test_make_public starting")

        # get the view
        #compare_get_request("/user/:userId/:collectionId/:displayId/:version/makePublic", route_parameters = ["testuser", "testid0", "testid0_collection", "1"])
        get_request("user/:userId/:collectionId/:displayId/:version/makePublic", 1, headers = headers, route_parameters = ["testuser", "testid0", "testid0_collection", "1"])

        data['tabState'] = 'new'

        # make the collection public
        #compare_post_request("/user/:userId/:collectionId/:displayId/:version/makePublic", route_parameters = ["testuser", "testid1", "testid1_collection", "1"], data = data)
        post_request("user/:userId/:collectionId/:displayId/:version/makePublic", 1, data, headers = headers, route_parameters = ["testuser", "testid1", "testid1_collection", "1"], files = None)
        
        #make collection 2 public --> can prob delete when sbh3 submit is done ******
        #get_request("user/:userId/:collectionId/:displayId/:version/makePublic", 1, headers = headers, route_parameters = ["testuser", "testid0", "testid0_collection", "1"])

        #data['tabState'] = 'new'

        #post_request("user/:userId/:collectionId/:displayId/:version/makePublic", 1, data, headers = headers, route_parameters = ["testuser", "testid2", "testid2_collection", "1"], files = None)
        #*************to here
        
        # try to delete the collection
        # with self.assertRaises(requests.exceptions.HTTPError):
        #     compare_get_request("/public/:collectionId/:displayId/:version/removeCollection", route_parameters = ["testid1", "testid1_collection", "1"], test_name = 'remove')

        test_print("test_make_public completed")

        # test_print("creating new collection for test_attachment")
        # data = {'id':(None, 'test_attachment'),
        #         'version' : (None, '1'),
        #         'name' : (None, 'test_attachment'),
        #         'description':(None, 'used for tesitng the attachment endpoints'),
        #         'citations':(None, ''),
        #         'overwrite_merge':(None, '0')
        #         }

        # files = {'file':("./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/toggle.xml", open('./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/toggle.xml', 'rb'))}

        # #compare_post_request("submit", data, headers = {"Accept":"text/plain"}, files = files, test_name = "collection_for_test_attachment", test_type = test_type)
        # post_request("submit", 1, data, headers = headers, route_parameters = [], files = files)

        # test_print("completed")

        # test_print("creating new collection for test_hash")
        # data = {'id':(None, 'test_hash'),
        #         'version' : (None, '2'),
        #         'name' : (None, 'test_hash'),
        #         'description':(None, 'used for testing endpoints with hash built in.'),
        #         'citations':(None, ''),
        #         'overwrite_merge':(None, '0')
        #         }

        # files = {'file':("./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/Measure.xml", open('./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/Measure.xml', 'rb'))}

        # #compare_post_request("submit", data, headers = {"Accept":"text/plain"}, files = files, test_name = "collection_for_test_hash", test_type = test_type)
        # post_request("submit", 1, data, headers = headers, route_parameters = [], files = files)

        # test_print("completed")


#    def make_new_private_collection(self, uniqueid):
        # create the collection
#        data = {'id':(None, 'testid1'),
#                'version' : (None, '1'),
#                'name' : (None, 'testcollection1'),
#                'description':(None, 'testdescription'),
#                'citations':(None, ''),
#                'overwrite_merge':(None, '0')
#                }
#
#        files = {'file':("./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/toggle.xml", open('./SBOLTestRunner/src/main/resources/SBOLTestSuite/SBOL2/toggle.xml', 'rb'))}
#
#        compare_post_request("submit", data, headers = {"Accept": "text/plain"}, files = files, test_name = "second_generic_collection", test_type = test_type)
#
