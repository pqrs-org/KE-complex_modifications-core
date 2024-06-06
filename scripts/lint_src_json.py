#!/usr/bin/python3

'''Lint src/json'''

import glob
import pathlib
import os
import re
import sys


def lint_src_json(src_json_directory):
    '''Lint src/json'''

    #
    # Check files
    #

    file_paths = glob.glob(f"{src_json_directory}/*")
    for file_path in file_paths:
        basename = os.path.basename(file_path)

        #
        # Check file extension
        #

        if file_path.endswith('.json'):
            print('')
            print('----------------------------------------')
            print('ERROR:')
            print(
                f"Please move src/json/{basename} to public/json/{basename}")
            print('----------------------------------------')
            print('')
            sys.exit(1)

        elif file_path.endswith('.js'):
            if not file_path.endswith('.json.js'):
                print('')
                print('----------------------------------------')
                print('ERROR:')
                print(
                    f"The file name must end with .json.js. src/json/{basename}")
                print('----------------------------------------')
                print('')
                sys.exit(1)

        else:
            print('')
            print('----------------------------------------')
            print('ERROR:')
            print(
                f"Unsupported file type src/json/{basename}")
            print('----------------------------------------')
            print('')
            sys.exit(1)

        #
        # Check there are no any extra directories
        #

        if os.path.isdir(file_path):
            print('')
            print('----------------------------------------')
            print('ERROR:')
            print(f"An extra directory is found: {file_path}")
            print('----------------------------------------')
            print('')
            sys.exit(1)


if __name__ == "__main__":
    SRC_JSON_DIRECTORY = sys.argv[1] if len(sys.argv) > 1 else ""
    if not os.path.isdir(SRC_JSON_DIRECTORY):
        print(f'"{SRC_JSON_DIRECTORY}" is not found')
        sys.exit(1)

    lint_src_json(SRC_JSON_DIRECTORY)
