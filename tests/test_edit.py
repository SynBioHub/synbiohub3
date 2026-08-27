from unittest import TestCase
from test_arguments import test_print, SETUP_URI_PREFIX
from test_functions import compare_post_request, login_with

# Same private collection as test_collection.py / test_attachment.py (owned by setup user testuser).
PRIVATE_TOP_LEVEL_URI = f"{SETUP_URI_PREFIX}user/testuser/testid2/testid2_collection/1"


class TestEdit(TestCase):

    def test_edit(self):
        login_with({'email': 'test@user.synbiohub', 'password': 'test'}, 1)

        # test_update_mutableDescription
        test_print("test_update_mutableDescription starting")
        data = {
            'uri': PRIVATE_TOP_LEVEL_URI,
            'value': 'testUpdateMutableDescription',
        }
        compare_post_request("updateMutableDescription", data, headers={"Accept": "text/plain"}, test_name="test_update_mutableDescription")
        test_print("test_update_mutableDescription completed")

        # test_update_mutableNotes
        test_print("test_update_mutableNotes starting")
        data = {
            'uri': PRIVATE_TOP_LEVEL_URI,
            'value': 'testUpdateMutableNotes',
        }
        compare_post_request("updateMutableNotes", data, headers={"Accept": "text/plain"}, test_name="test_update_mutableNotes")
        test_print("test_update_mutableNotes completed")

        # test_update_mutableSource
        test_print("test_update_mutableSource starting")
        data = {
            'uri': PRIVATE_TOP_LEVEL_URI,
            'value': 'testUpdateMutableSource',
        }
        compare_post_request("updateMutableSource", data, headers={"Accept": "text/plain"}, test_name="test_update_mutableSource")
        test_print("test_update_mutableSource completed")

        # test_edit_citations
        test_print("test_edit_citations starting")
        data = {
            'uri': PRIVATE_TOP_LEVEL_URI,
            'value': '1234',
        }
        compare_post_request("updateCitations", data, headers={"Accept": "text/plain"}, test_name="test_edit_mutable_citations")
        test_print("test_edit_citations completed")
