from unittest import TestCase

from test_functions import get_address
from test_arguments import args
from test_arguments import test_print


class TestTests(TestCase):

    def test_get_address(self):
        test_print("test_get_address starting")
        #make sure the adresses are fethced properly before testing starts

        # test no parameters
        #SBH1
        self.assertEqual(args.sbh1serveraddress +"test/url", get_address("test/url", [], 1))
        with self.assertRaises(Exception):
            get_address("test/:green/notparam", ["two", "params"], 1)
        with self.assertRaises(Exception):
            get_address("test/:green/notparam", [], 1)

        self.assertEqual(args.sbh1serveraddress +"test/green", get_address("test/:one", ["green"], 1))

        self.assertEqual(args.sbh1serveraddress +"test/green/second", get_address("test/:one/:gewotri", ["green", "second"], 1))

        self.assertEqual(args.sbh1serveraddress +"test/green/second/", get_address("test/:one/:gewotri/", ["green", "second"], 1))

        #SBH3
        self.assertEqual(args.sbh3serveraddress +"test/url", get_address("test/url", [], 3))
        with self.assertRaises(Exception):
            get_address("test/:green/notparam", ["two", "params"], 3)
        with self.assertRaises(Exception):
            get_address("test/:green/notparam", [], 3)

        self.assertEqual(args.sbh3serveraddress +"test/green", get_address("test/:one", ["green"], 3))

        self.assertEqual(args.sbh3serveraddress +"test/green/second", get_address("test/:one/:gewotri", ["green", "second"], 3))

        self.assertEqual(args.sbh3serveraddress +"test/green/second/", get_address("test/:one/:gewotri/", ["green", "second"], 3))

        test_print("test_get_address completed")
