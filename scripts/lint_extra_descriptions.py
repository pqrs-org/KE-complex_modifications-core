#!/usr/bin/python3

'''Lint public/extra_descriptions'''

import json
import os
import pathlib
import re
import sys


def lint_extra_descriptions(public_directory):
    '''Lint public/extra_descriptions'''

    html_pattern = re.compile(r'<\s*/?\s*(html|body)', re.I)
    data_image_pattern = re.compile(r'data:image/', re.I)

    with open(f"{public_directory}/groups.json", encoding='utf-8') as groups_json_file:
        groups_json = json.load(groups_json_file)

        for group_name in groups_json:
            for category in groups_json[group_name]:
                for file in category['files']:
                    if 'extra_description_path' in file:
                        path = f"{public_directory}/{file['extra_description_path']}"
                        html = pathlib.Path(path).read_text("utf-8", "ignore")
                        if html_pattern.search(html):
                            print('')
                            print('----------------------------------------')
                            print('ERROR:')
                            print(
                                f"Do not include <html> or <body> in {file['extra_description_path']}")
                            print('----------------------------------------')
                            print('')
                            sys.exit(1)

                        if data_image_pattern.search(html):
                            print('')
                            print('----------------------------------------')
                            print('ERROR:')
                            print(
                                f"Do not include data:image/* in {file['extra_description_path']}")
                            print('----------------------------------------')
                            print('')
                            sys.exit(1)


if __name__ == "__main__":
    PUBLIC_DIRECTORY = sys.argv[1] if len(sys.argv) > 1 else ""
    if not os.path.isdir(PUBLIC_DIRECTORY):
        print(f'"{PUBLIC_DIRECTORY}" is not found')
        sys.exit(1)

    lint_extra_descriptions(PUBLIC_DIRECTORY)
