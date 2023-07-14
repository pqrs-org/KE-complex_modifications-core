#!/usr/bin/python3

'''Lint public/json'''

import glob
import json
import os
import re
import sys


def lint_public_json(public_json_directory):
    '''Lint public/json'''

    #
    # Check files
    #

    file_paths = glob.glob(f"{public_json_directory}/*")
    for file_path in file_paths:
        #
        # Check file extension
        #

        if not re.search(r'\.json$', file_path):
            path = f"{public_json_directory}/{os.path.basename(file_path)}"
            print('')
            print('----------------------------------------')
            print('ERROR:')
            print(
                f"Please rename {path} to {path}.json")
            print('----------------------------------------')
            print('')
            sys.exit(1)

        #
        # Check json validity
        #

        with open(file_path, encoding='utf-8') as file:
            try:
                j = json.load(file)

                #
                # Check KE-complex_modifications specific format
                #

                if 'title' not in j:
                    raise ValueError('`title` is not found')
                if not isinstance(j['title'], str):
                    raise ValueError('`title` is not string')

                if 'rules' not in j:
                    raise ValueError('`rules` is not found')
                if not isinstance(j['rules'], list):
                    raise ValueError('`rules` is not array')

            except (json.JSONDecodeError, ValueError) as ex:
                print('')
                print('----------------------------------------')
                print('ERROR:')
                print(f"{file_path} error: {ex}")
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
    PUBLIC_JSON_DIRECTORY = sys.argv[1] if len(sys.argv) > 1 else ""
    if not os.path.isdir(PUBLIC_JSON_DIRECTORY):
        print(f'"{PUBLIC_JSON_DIRECTORY}" is not found')
        sys.exit(1)

    lint_public_json(PUBLIC_JSON_DIRECTORY)
