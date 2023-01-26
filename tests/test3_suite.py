from sys import exit

from test_functions import cleanup_check, show_test_results

if __name__ == '__main__':
    
    import test3_root
    test3_root.test_root()

    # do final check after all tests have run
    cleanup_check()

    show_test_results()

    # if any tests failed, exit with code one
    #if len(result.failures) != 0 or len(result.errors) != 0:
    #    exit(1)
