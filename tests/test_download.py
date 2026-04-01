from unittest import TestCase
from test_arguments import test_print
from test_functions import compare_get_request, compare_get_request_download, compare_post_request, test_state

class TestDownload(TestCase):

    def test_download(self):
        test_print("test_download started")
        headers = {"Accept": "text/plain"} #{"Accept": "text/html"}
        test_type = "Download"

        submit_collection_id = test_state.get_submit_collection_id()
        if submit_collection_id is None:
            raise Exception("submit_collection_id not set; run test_submit before test_download")
        test_print("using submit collection id for user download paths: " + submit_collection_id)

        compare_get_request_download("/public/:collectionId/:displayId/:version/sbol", route_parameters = ["igem","BBa_B0034", "1"], headers = headers, test_type = test_type)
        # compare_get_request_download("/public/:collectionId/:displayId/:version/sbol", route_parameters = ["testid1","part_pIKE_Toggle_1","1"], test_name = "sbol1", headers = headers, test_type = test_type)
        # compare_get_request_download("/public/:collectionId/:displayId/sbol", route_parameters = ["igem","BBa_B0034"], headers = headers, test_type = test_type)
        # compare_get_request_download("/public/:collectionId/:displayId/sbol", test_name = "sbol1", route_parameters = ["testid1","part_pIKE_Toggle_1"], headers = headers, test_type = test_type) 

        compare_get_request_download("/public/:collectionId/:displayId/:version/sbolnr", route_parameters = ["igem","BBa_B0034", "1"], headers = headers, test_type = test_type)
        # compare_get_request_download("/public/:collectionId/:displayId/:version/sbolnr", test_name = "sbolnr1", route_parameters = ["testid1","part_pIKE_Toggle_1","1"], headers = headers, test_type = test_type)
        # compare_get_request_download("/public/:collectionId/:displayId/sbolnr", route_parameters = ["igem","BBa_B0034"], headers = headers, test_type = test_type)
        # compare_get_request_download("/public/:collectionId/:displayId/sbolnr", test_name = "sbolnr1", route_parameters = ["testid1","part_pIKE_Toggle_1"], headers = headers, test_type = test_type)

        # # user/testuser/testcollection1/testid1/1
        # compare_get_request_download("/user/:userId/:collectionId/:displayId/:version/sbol", route_parameters = ["testuser1", submit_collection_id, "BBa_I0462", "1"], headers = headers)
        # compare_get_request_download("/user/:userId/:collectionId/:displayId/:version/sbolnr", route_parameters = ["testuser1", submit_collection_id, "BBa_I0462", "1"], headers = headers)
        # compare_get_request_download("/user/:userId/:collectionId/:displayId/:version/sbol", route_parameters = ["testuser","test_attachment","part_pIKE_Toggle_1","1"], headers = headers)
        # compare_get_request_download("/user/:userId/:collectionId/:displayId/:version/sbolnr", route_parameters = ["testuser","test_attachment","part_pIKE_Toggle_1","1"], headers = headers)
        
        compare_get_request_download("/public/:collectionId/:displayId/:version/metadata", route_parameters = ["igem","BBa_B0034", "1"], headers = headers, test_type = test_type)
        
        compare_get_request_download("/public/:collectionId/:displayId/:version/gff", route_parameters = ["igem","BBa_B0034", "1"], headers = headers, test_type = test_type)
        compare_get_request_download("/public/:collectionId/:displayId/:version/fasta", route_parameters = ["igem","BBa_B0034", "1"], headers = headers, test_type = test_type)
        compare_get_request_download("/public/:collectionId/:displayId/:version/gb", route_parameters = ["igem","BBa_B0034", "1"], headers = headers, test_type = test_type)

        # compare_get_request_download("/public/:collectionId/:displayId/:version/gff", test_name = "gff1", route_parameters = ["testid1","part_pIKE_Toggle_1","1"], headers = headers, test_type = test_type)
        # compare_get_request_download("/public/:collectionId/:displayId/:version/fasta", test_name = "fasta1", route_parameters = ["testid1","part_pIKE_Toggle_1","1"], headers = headers, test_type = test_type)

        # compare_get_request_download("/user/:userId/:collectionId/:displayId/:version/gff", route_parameters = ["testuser1", submit_collection_id, "BBa_I0462", "1"], headers = headers)
        # compare_get_request_download("/user/:userId/:collectionId/:displayId/:version/fasta", route_parameters = ["testuser1", submit_collection_id, "BBa_I0462", "1"], headers = headers)
        # compare_get_request_download("/user/:userId/:collectionId/:displayId/:version/gb", route_parameters = ["testuser1", submit_collection_id, "BBa_I0462", "1"], headers = headers)

        

        test_print("test_download completed")
        # http://localhost:7777/user/testuser/test_hash/attachment_0ff5d71561d144b7b367765a8c1f2d00/1/download
        # compare_get_request_download("/user/:userId/:collectionId/:displayId/:version/download", route_parameters = ["testuser","test_hash","attachment_0ff5d71561d144b7b367765a8c1f2d00","1"], headers = {"Accept": "text/html"})
