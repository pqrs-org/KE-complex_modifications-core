#!/usr/bin/python3

"""Lint public/groups.json"""

import pathlib
import sys

from lib.lint_groups import lint_groups


def print_error(error):
    """Print a lint error using the command's established format."""
    print("")
    print("----------------------------------------")
    print("ERROR:")
    print(error)
    print("----------------------------------------")
    print("")


if __name__ == "__main__":
    GROUPS_JSON_FILE_PATH = sys.argv[1] if len(sys.argv) > 1 else ""
    if not pathlib.Path(GROUPS_JSON_FILE_PATH).is_file():
        print(f'"{GROUPS_JSON_FILE_PATH}" is not found')
        sys.exit(1)

    try:
        lint_groups(GROUPS_JSON_FILE_PATH)
    except (OSError, ValueError) as error:
        print_error(error)
        sys.exit(1)
