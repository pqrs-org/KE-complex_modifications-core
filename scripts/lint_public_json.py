#!/usr/bin/python3

"""Lint public/json"""

import pathlib
import sys

from lib.lint_public_json import lint_public_json


def print_error(error):
    """Print a lint error using the command's established format."""
    print("")
    print("----------------------------------------")
    print("ERROR:")
    print(error)
    print("----------------------------------------")
    print("")


if __name__ == "__main__":
    PUBLIC_JSON_DIRECTORY = sys.argv[1] if len(sys.argv) > 1 else ""
    KARABINER_CLI = sys.argv[2] if len(sys.argv) > 2 else None
    SANDBOX_PROFILE = sys.argv[3] if len(sys.argv) > 3 else None
    if not pathlib.Path(PUBLIC_JSON_DIRECTORY).is_dir():
        print(f'"{PUBLIC_JSON_DIRECTORY}" is not found')
        sys.exit(1)

    try:
        lint_public_json(PUBLIC_JSON_DIRECTORY, KARABINER_CLI, SANDBOX_PROFILE)
    except (OSError, ValueError) as error:
        print_error(error)
        sys.exit(1)
