#!/usr/bin/python3

'''Sort file entries in public/groups.json.'''

import json
import pathlib
import sys


def sort_groups(groups_json_file_path):
    '''Sort each category's files by path without changing category order.'''
    path = pathlib.Path(groups_json_file_path)
    groups_json = json.loads(path.read_text(encoding='utf-8'))

    for categories in groups_json.values():
        for category in categories:
            category['files'].sort(
                key=lambda file: (file['path'].casefold(), file['path']))

    path.write_text(
        f'{json.dumps(groups_json, ensure_ascii=False, indent=2)}\n',
        encoding='utf-8')


if __name__ == '__main__':
    GROUPS_JSON_FILE_PATH = (
        sys.argv[1] if len(sys.argv) > 1 else '../public/groups.json')
    sort_groups(GROUPS_JSON_FILE_PATH)
