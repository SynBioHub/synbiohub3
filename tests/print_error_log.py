try:
    from test_functions import get_end_of_error_log
except ImportError:
    get_end_of_error_log = None


def print_entire_log():
    if get_end_of_error_log is None:
        print("Could not import get_end_of_error_log; skipping error log dump.")
        return
    try:
        print(get_end_of_error_log(-1))
    except Exception as e:
        print(f"Could not print error log: {e}")


print_entire_log()
