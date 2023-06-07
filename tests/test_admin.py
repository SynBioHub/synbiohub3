import os
from test_arguments import test_print
from unittest import TestCase
from test_functions import compare_get_request, compare_post_request, login_with

class TestAdmin(TestCase):

    def test_admin1(self):
        headers = {"Accept": "text/plain"}
        test_type = "Administration"

        #login as admin
        logininfo = {'email' : 'test@user.synbiohub',
                      'password' : 'test'}
        login_with(logininfo, 1)
        test_print("test_post_login completed")

        test_print("test_admin_sparql starting")
        compare_get_request("/admin/sparql?query=:query", headers = {"Accept":"application/json"}, route_parameters = ["SELECT+%3Fsubject+%3Fpredicate+%3Fobject+WHERE+%7B+%3Fsubject+%3Fpredicate+%3Fobject+.+FILTER+%28str%28%3Fobject%29+%3D+%22BBa_B0034%22%29%7D"], test_type = test_type, comparison_type="json")
        test_print("test_admin_sparql completed")

        test_print("test_admin_status starting")
        compare_get_request("/admin", headers = {"Accept":"text/plain"}, test_type = test_type, comparison_type="json", fields=["instanceName", "defaultGraph", "graphPrefix"])
        test_print("test_admin_status completed")

        # test_print("test_admin_virtuoso starting")
        # compare_get_request("/admin/virtuoso", headers = {"Accept":"text/plain"}, test_type = test_type)
        # test_print("test_admin_virtuoso completed")

        # test_print("test_admin_graphs starting")
        # compare_get_request("/admin/graphs", headers = {"Accept":"text/plain"}, test_type = test_type, comparison_type="jsonlist", fields=["graphUri", "numTriples"], key='graphUri')
        # test_print("test_admin_graphs completed")

        test_print("test_admin_log starting")
        compare_get_request("admin/log", headers = {"Accept":"text/plain"}, test_type = test_type, comparison_type="jsonlist", fields=["level", "line"], key='line')
        test_print("test_admin_log completed")

        # test_print("test_admin_mail starting")
        # compare_get_request("/admin/mail", headers = {"Accept":"text/plain"}, test_type = test_type, comparison_type="json", fields=["sendGridApiKey", "sendGridFromEmail"])
        # test_print("test_admin_mail completed")

        # test_print("test_post_admin_mail starting")
        # data={
        #     'key': 'SG.Dummy_Token',
        #     'fromEmail' : 'synbiohub@synbiohub.utah.edu',
        # }
        # compare_post_request("/admin/mail", data, headers = {"Accept": "text/plain"}, test_name = "admin_mail", test_type = test_type)
        # test_print("test_post_admin_mail completed")

        test_print("test_admin_plugins starting")
        compare_get_request("/admin/plugins", headers = {"Accept":"text/plain"}, test_type = test_type, comparison_type="json", fields=["rendering", "download", "submit"])
        test_print("test_admin_plgins completed")

        # test_print("test_admin_savePlugin starting")
        # data={
        #     'id': 'New',
        #     'category' : 'download',
        #     'name' : 'test_plugin',
        #     'url' : 'jimmy',
        # }
        # compare_post_request("/admin/savePlugin", data, headers = {"Accept": "text/plain"}, test_name = "admin_savePlugin", test_type = test_type)
        # test_print("test_admin_savePlugin completed")

        # test_print("test_admin_plugins starting")
        # compare_get_request("/admin/plugins", headers = {"Accept":"text/plain"}, test_name="testPluginAfterSave", test_type = test_type, comparison_type="json", fields=["rendering", "download", "submit"])
        # test_print("test_admin_plgins completed")

        # test_print("test_admin_deletePlugin starting")
        # data={
        #     'id': '1',
        #     'category' : 'download',
        # }
        # compare_post_request("/admin/deletePlugin", data, headers = {"Accept": "text/plain"}, test_name = "admin_deletePlugin", test_type = test_type)
        # test_print("test_admin_deletePlugin completed")

        # test_print("test_admin_registries starting")
        # #SBH3 throws error
        # compare_get_request("admin/registries", headers = {"Accept": "text/plain"}, test_type = test_type, comparison_type="json", fields=["registries", "errors"])
        # test_print("test_admin_registries completed")

        # test_print("test_admin_saveRegistry starting")
        # data={
        #     'uri': 'testurl.com',
        #     'url' : 'testurl.com',
        # }
        # compare_post_request("/admin/saveRegistry", data, headers = {"Accept": "text/plain"}, test_name = "admin_saveRegistry", test_type = test_type)
        # test_print("test_admin_saveRegistry completed")

        # test_print("test_admin_deleteRegistry starting")
        # data={
        #     'uri': 'testurl.com',
        # }
        # compare_post_request("/admin/deleteRegistry", data, headers = {"Accept": "text/plain"}, test_name = "admin_deleteRegistry", test_type = test_type)
        # test_print("test_admin_deleteRegistry completed")

        # test_print("test_admin_setAdministratorEmail starting")
        # data={
        #     'administratorEmail': 'test@synbiohub.org',
        # }
        # compare_post_request("/admin/setAdministratorEmail", data, headers = {"Accept": "text/plain"}, test_name = "admin_setAdministratorEmail", test_type = test_type)
        # test_print("test_admin_setAdministratorEmail completed")

        # test_print("test_admin_retrieveFromWebOfRegistries starting")
        # data={
        # }
        # compare_post_request("/admin/retrieveFromWebOfRegistries", data, headers = {"Accept": "text/plain"}, test_name = "admin_retrieveFromWebOfRegistries")
        # test_print("test_admin_retrieveFromWebOfRegistries completed")

        # test_print("test_admin_federate starting")
        # #TODO: We should not have the testing requesting to join web-of-registries.  Likely the test would be done by adding web-of-registries application to our docker-compose and making the request to our local one.
        # #fail case for /federate, need to make a good test
        # data={
        #     'administratorEmail': 'myers@ece.utah.edu',
        #     'webOfRegistries' : 'https://wor.synbiohub.org',
        # }
        # compare_post_request("/admin/federate", data, headers = {"Accept": "text/plain"}, test_name = "admin_federate_problem")
        # test_print("test_admin_federate completed")

        # test_print("test_admin_remotes starting")
        # compare_get_request("/admin/remotes", headers = {"Accept":"text/plain"}, test_type = test_type, comparison_type="json", fields=["remotes", "remoteTypes"])
        # test_print("test_admin_remotes completed")

        # test_print("test_saveRemoteICE starting")
        # data={
        #     'type': 'ice',
        #     'id' : 'test',
        #     'url' : 'test.com',
        #     'iceApiTokenClient' : 'test',
        #     'iceApiToken' : 'test',
        #     'iceApiTokenOwner' : 'test',
        #     'iceCollection' : 'test',
        #     'rejectUnauthorized' : 'True',
        #     'folderPrefix' : 'test',
        #     'sequenceSuffix' : 'test',
        #     'defaultFolderId' : 'test',
        #     'groupId' : 'test',
        #     'pi' : 'test',
        #     'piEmail' : 'test',
        #     'isPublic' : 'True',
        #     'partNumberPrefix' : 'test',
        #     'rootCollectionDisplayId' : 'test',
        #     'rootCollectionName' : 'test',
        #     'rootCollectionDescription' : 'test'
        # }
        # compare_post_request("/admin/saveRemote", data, headers = {"Accept": "text/plain"}, test_name = "admin_saveRemoteICE", test_type = test_type)
        # test_print("test_saveRemoteICE completed")

        # test_print("test_saveRemoteBenchling starting")
        # data={
        #     'type': 'benchling',
        #     'id': '1',
        #     'benchlingApiToken': 'test',
        #     'rejectUnauthorized': 'test',
        #     'folderprefix': 'test',
        #     'defaultFolderId': 'test',
        #     'isPublic': 'True',
        #     'rootCollectionsDisplayId': 'test',
        #     'rootCollectionName': 'test',
        #     'rootCollectionDescription': 'test'
        # }
        # compare_post_request("/admin/saveRemote", data, headers = {"Accept": "text/plain"}, test_name = "admin_saveRemoteBenchling", test_type = test_type)
        # test_print("test_saveRemoteBenchling completed")

        # test_print("test_admin_deleteRemoteBenchling starting")
        # data={
        #     'id': '1',
        # }
        # compare_post_request("/admin/deleteRemote", data, headers = {"Accept": "text/plain"}, test_name = "admin_deleteRemoteBenchling", test_type = test_type)
        # test_print("test_admin_deleteRemoteBenchling completed")

        # test_print("test_admin_deleteRemoteICE starting")
        # data={
        #     'id': 'test',
        # }
        # compare_post_request("/admin/deleteRemote", data, headers = {"Accept": "text/plain"}, test_name = "admin_deleteRemoteICE", test_type = test_type)
        # test_print("test_admin_deleteRemoteICE completed")

        # #TODO: hangs up the code, Need SBOL Explorer ON to test?
        # # test_print("test_admin_explorerlog starting")
        # # compare_get_request("/admin/explorerlog", headers = {"Accept":"text/plain"}, test_type = test_type, comparison_type="json", fields=["instanceName", "frontPageText"])
        # # test_print("test_admin_explorerlog completed")

        # #TODO: Need SBOL Explorer ON to test
        # test_print("test_admin_explorer starting")
        # compare_get_request("/admin/explorer", headers = {"Accept": "text/plain"}, test_type = test_type)
        # test_print("test_admin_explorer completed")

        # #TODO: Need SBOL Explorer ON to test
        # test_print("test_admin_status starting")
        # data={
        #     'useSBOLExplorer': 'True',
        #     'SBOLExplorerEndpoint' : 'http://explorer:13162/',
        #     'useDistributedSearch' : 'True',
        #     'pagerankTolerance' : '.0002',
        #     'uclustIdentity' : '0.9',
        #     'synbiohubPublicGraph' : '',
        #     'elasticsearchEndpoint' : 'http://elasticsearch:9200/',
        #     'elasticsearchIndexName' : 'part',
        #     'sparqlEndpoint' : 'http://virtuoso:8890/sparql?'
        # }
        # compare_post_request("/admin/explorer", data, headers = {"Accept": "text/plain"}, test_name = "admin_updateExplorerConfig", test_type = test_type)
        # test_print("test_admin_status completed")

        # test_print("test_explorerUpdateIndex starting")
        # data={
        # }
        # compare_post_request("/admin/explorerUpdateIndex", data, headers = {"Accept": "text/plain"}, test_name = "admin_explorerUpdateIndex", test_type = test_type)
        # test_print("test_explorerUpdateIndex completed")

        test_print("test_admin_theme starting")
        compare_get_request("/admin/theme", headers = {"Accept":"text/plain"}, test_type = test_type, comparison_type="json", fields=["instanceName", "frontPageText"])
        test_print("test_admin_theme completed")

        # test_print("test_admin_updateTheme starting")
        # logo = os.path.basename('./logo.jpg');
        # data={
        #     'instanceName': 'test_instance',
        #     'frontPageText' : 'test_instance',
        #     'baseColor' : 'A32423',
        #     'showModuleInteractions' : 'ok',
        # }
        # files={
        #     'logo' : (logo, open('./logo.jpg', 'rb')),
        # }
        # compare_post_request("/admin/theme", data, headers = {"Accept": "text/plain"}, files = files, test_name = "admin_setAdministratorEmail", test_type = test_type)
        # test_print("test_admin_updateTheme completed")

        # test_print("test_get_admin_users starting")
        # compare_get_request("/admin/users", headers = {"Accept":"text/plain"}, test_type = test_type, comparison_type="json", fields=["users", "graphUri", "isAdmin"])
        # test_print("test_get_admin_users completed")

        # test_print("test_post_admin_users starting")
        # data={
        #     'allowPublicSignup': 'False',
        # }
        # compare_post_request("/admin/users", data, headers = {"Accept": "text/plain"}, test_name = "admin_updateUsersConfig")
        # test_print("test_post_admin_users completed")

        # test_print("test_newUser POST starting")
        # data = {
        #     'username': 'adminNewUser',
        #     'name' : 'adminNewUser',
        #     'email' : 'adminNewUser@user.synbiohub',
        #     'affiliation' : 'adminNewUser',
        #     'isMember' : '1',
        #     'isCurator' : '1',
        #     'isAdmin' : '1',
        # }
        # compare_post_request("/admin/newUser", data, headers = {"Accept": "text/plain"}, test_name = "admin_newUser1", test_type = test_type)
        # test_print("test_newUser POST completed")

        # test_print("test_updateUser starting")
        # data={
        #     'id': '2',
        #     'name' : 'ronnieUpdated',
        #     'email' : 'ronnieUpdated@user.synbiohub',
        #     'affiliation' : 'updatedAffiliation',
        #     'isMember' : '1',
        #     'isCurator' : '1',
        #     'isAdmin' : '1'
        # }
        # compare_post_request("/admin/updateUser", data, headers = {"Accept": "text/plain"}, test_name = "admin_updateUser", test_type = test_type)
        # test_print("test_updateUser completed")

        # test_print("test_admin_DeleteUser starting")
        # data={
        #     'id': '2',
        # }
        # compare_post_request("/admin/deleteUser", data, headers = {"Accept": "text/plain"}, test_name = "admin_deleteUser", test_type = test_type)
        # test_print("test_admin_DeleteUser completed")




