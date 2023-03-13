import requests
from unittest import TestCase
from test_functions import compare_get_request, compare_post_request, get_request, post_request
from test_arguments import test_print

# "/manage" is tested within test_submit.py

class TestSearch(TestCase):

    def test_search(self):
        headers = {"Accept": "text/plain"}
        test_type = "Search"

        # test_searchQuery(self):
        # test_print("test_search starting")
        # #compare_get_request("/search/:query?", route_parameters = ["I0462"])
        # compare_get_request("/search/:query?", headers = headers, route_parameters = ["BBa_B00"], test_type = test_type)
        # test_print("test_search completed")

        # test_searchCount(self):
        test_print("test_searchCount starting")
        # #compare_get_request("/searchCount/:query?", route_parameters = ["I0462"]) 
        compare_get_request("/searchCount/:query?", headers = headers, route_parameters = ["BBa_B00"], test_type = test_type)
        test_print("test_searchCount completed")

#TODO: NONDETERMINISTIC
        test_print("test_rootCollections starting")
        compare_get_request("/rootCollections", headers = {"Accept":"text/plain"}, route_parameters = [], test_type = test_type)
        test_print("test_rootCollections completed")

        # #test_sparql(self):
        # test_print("test_sparql starting")
        # #compare_get_request("/sparql", headers = {"Accept": "application/json"}, route_parameters = [])
        # #->commented bc huge print compare_get_request("/sparql?query=SELECT%20%3Fs%20%3Fp%20%3Fo%20%0AWHERE%20%7B%0A%09%3Fs%20%3Fp%20%3Fo%20.%0A%7D", headers = {"Accept": "application/json"}, route_parameters = [])
        # test_print("test_sparql completed")

        test_print("test_subcollections_public starting")
        compare_get_request("/public/:collectionId/:displayId/:version/subCollections", route_parameters = ["testid1","testid1_collection", "1"], headers = {"Accept":"text/plain"}, test_type = test_type)
        #https://synbiohub.org/public/igem/categories/1/subCollections
        #compare_get_request("/public/:collectionId/:displayId/:version/subCollections", route_parameters = ["igem","categories", "1"], headers = {"Accept":"text/plain"}, test_name="subCollectionsCategories", test_type = test_type)
        test_print("test_subcollections_public completed")

        # test_print("test_uses starting")
        # # need user - compare_get_request("user/:userId/:collectionId/:displayId/:version/uses", route_parameters = ["testuser1","testid2", "BBa_B0015", "1"],headers = {"Accept": "text/html"}, test_type = test_type)
        # # need accounts to work first - compare_get_request("public/:collectionId/:displayId/:version/uses", route_parameters = ["testid2", "BBa_B0015", "1"],headers = {"Accept": "text/html"}, test_type = test_type)
        # compare_get_request("public/:collectionId/:displayId/:version/uses", test_name = "uses2", route_parameters = ["igem", "BBa_B0034", "1"],headers = {"Accept": "text/plain"}, test_type = test_type)
        # test_print("test_uses completed")

        test_print("test_count starting")
        compare_get_request(":type/count", route_parameters = ["ComponentDefinition"], headers = {"Accept":"text/plain"}, test_type = test_type)
        test_print("test_count completed")

        # test_print("test_subcollections_private starting")
        # compare_get_request("/user/:userId/:collectionId/:displayId/:version/subCollections", route_parameters = ["testuser","testid2","testid2_collection", "1"],headers = {"Accept":"text/plain"}, test_name="privateSubCollection")
        # test_print("test_subcollections_private completed")
        


