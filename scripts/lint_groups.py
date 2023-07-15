#!/usr/bin/python3

'''Lint public/groups.json'''

import glob
import os
import sys
import json


def lint_groups(groups_json_file_path):
    '''Lint public/groups.json'''

    files_in_groups = set()
    with open(groups_json_file_path, encoding='utf-8') as groups_json_file:
        groups_json = json.load(groups_json_file)

        for group_name in groups_json:
            for category in groups_json[group_name]:
                for file in category['files']:
                    basename = os.path.basename(file['path'])
                    if basename in files_in_groups:
                        print('')
                        print('----------------------------------------')
                        print('ERROR:')
                        print(
                            'There are some duplicated entries in public/groups.json.')
                        print('Please remove them from public/groups.json.')
                        print('----------------------------------------')
                        print('')
                        print(f"- {basename}")
                        print('')
                        sys.exit(1)

                    files_in_groups.add(basename)

        json_files = set()
        for file in glob.glob(f'{os.path.dirname(groups_json_file_path)}/json/*.json'):
            json_files.add(os.path.basename(file))

        orphan_files = files_in_groups - json_files
        if len(orphan_files) > 0:
            print('')
            print('----------------------------------------')
            print('ERROR:')
            print('There are some files in public/groups.json are not found.')
            print('Please add them into public/json.')
            print('----------------------------------------')
            print('')
            for file in orphan_files:
                print(f'- {file}')
            print('')
            sys.exit(1)


if __name__ == "__main__":
    PUBLIC_JSON_FILE_PATH = sys.argv[1] if len(sys.argv) > 1 else ""
    if not os.path.isfile(PUBLIC_JSON_FILE_PATH):
        print(f'"{PUBLIC_JSON_FILE_PATH}" is not found')
        sys.exit(1)

    lint_groups(PUBLIC_JSON_FILE_PATH)
