import requests
from unittest import TestCase
from test_functions import compare_get_request, compare_post_request, get_request, post_request, compare_get_request_json, compare_get_request_json_list
from test_arguments import test_print

# "/manage" is tested within test_submit.py

class TestSearch(TestCase):

    def test_search(self):
        headers = {"Accept": "text/plain"}
        test_type = "Search"

        # test_searchQuery(self):
        test_print("test_search starting")
        # #compare_get_request("/search/:query?", route_parameters = ["I0462"])
        compare_get_request_json_list("/search/:query?", headers = headers, route_parameters = ["BBa_B00"], test_type = test_type, fields=["uri", "displayId", "version", "name", "description", "type"])
        test_print("test_search completed")

        # test_searchCount(self):
        test_print("test_searchCount starting")
        # #compare_get_request("/searchCount/:query?", route_parameters = ["I0462"]) 
        compare_get_request("/searchCount/:query?", headers = headers, route_parameters = ["BBa_B00"], test_type = test_type)
        test_print("test_searchCount completed")

        test_print("test_rootCollections starting")
        compare_get_request("/rootCollections", headers = {"Accept":"text/plain"}, route_parameters = [], test_type = test_type)
        test_print("test_rootCollections completed")

        # #test_sparql(self):
        test_print("test_sparql starting")
        compare_get_request_json("/sparql?query=:query", headers = {"Accept":"application/json"}, route_parameters = ["SELECT+%3Fsubject+%3Fpredicate+%3Fobject+WHERE+%7B+%3Fsubject+%3Fpredicate+%3Fobject+.+FILTER+%28str%28%3Fobject%29+%3D+%22BBa_B0034%22%29%7D"])
        test_print("test_sparql completed")

        test_print("test_subcollections_public starting")
        # need user - compare_get_request("/public/:collectionId/:displayId/:version/subCollections", route_parameters = ["testid1","testid1_collection", "1"], headers = {"Accept":"text/plain"}, test_type = test_type)
        compare_get_request("/public/:collectionId/:displayId/:version/subCollections", route_parameters = ["igem","categories", "1"], headers = {"Accept":"text/plain"}, test_name="subCollectionsCategories", test_type = test_type)
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
        


