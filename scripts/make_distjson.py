#!/usr/bin/python3

'''Update dist/dist.json'''

import contextlib
import glob
import html
import json
import os
import re
import subprocess


@contextlib.contextmanager
def remember_cwd():
    '''Restore cwd'''
    cwd = os.getcwd()
    try:
        yield
    finally:
        os.chdir(cwd)


def check_safe_path(path):
    '''Check path is under cwd'''
    return os.path.realpath(path).startswith(os.path.realpath(os.getcwd()))


def make_distjson():
    '''Update dist/dist.json'''

    with remember_cwd():
        os.chdir(f'{os.path.dirname(__file__)}/../../public')

        with open('groups.json', encoding='utf-8') as groups_json_file:
            groups_json = json.load(groups_json_file)

            #
            # Collect json files which are not included in groups.json.
            #

            orphan_files = []
            file_paths = glob.glob('json/*.json')
            file_paths.sort()
            for file_path in file_paths:
                found = False
                for group_category_name in groups_json:
                    for group in groups_json[group_category_name]:
                        for file in group['files']:
                            if file['path'] == file_path:
                                found = True
                if not found:
                    orphan_files.append(file_path)

            #
            # Modify groups_json
            #

            for group_category_name in groups_json:
                for group in groups_json[group_category_name]:
                    #
                    # Add orphan files into #others.
                    #

                    if group['id'] == 'others':
                        for orphan_file in orphan_files:
                            group['files'].append({
                                'path': orphan_file
                            })

                    #
                    # Extract json content into groups.json.
                    #

                    for file in group['files']:
                        #
                        # Strip manipulators
                        #

                        if 'path' in file:
                            if not check_safe_path(file['path']):
                                raise PermissionError(
                                    f"cannot access {file['path']}")

                            with open(file['path'], encoding='utf-8') as json_file:
                                j = json.load(json_file)
                                for rule in j['rules']:
                                    del rule['manipulators']
                                file['json'] = j

                        #
                        # Set extra_description_text
                        #

                        extra_description_text = ''
                        if 'extra_description_path' in file:
                            if not check_safe_path(file['extra_description_path']):
                                raise PermissionError(
                                    f"cannot access {file['extra_description_path']}")

                            with open(file['extra_description_path'],
                                      encoding='utf-8') as extra_description_file:
                                extra_description_text = extra_description_file.read()
                                # Remove <style>
                                extra_description_text = re.sub(
                                    '<style.*</style>', '', extra_description_text,
                                    flags=re.MULTILINE | re.DOTALL)
                                # Strip tags
                                extra_description_text = re.sub(
                                    '</?[^>]*>', '', extra_description_text, flags=re.MULTILINE)
                                # Unescape entities
                                extra_description_text = html.unescape(
                                    extra_description_text)
                                # Collapse spaces
                                extra_description_text = re.sub(
                                    r'\s+', ' ', extra_description_text, flags=re.MULTILINE)
                                # Strip
                                extra_description_text = extra_description_text.strip()

                        file['extra_description_text'] = extra_description_text

            #
            # Append git info
            #

            git = subprocess.run(['git', 'rev-parse', 'HEAD'],
                                 capture_output=True, check=False, encoding='utf-8')
            groups_json['revision'] = git.stdout[0:7]

            git = subprocess.run(['git', 'log', '-1', '--format=%at'],
                                 capture_output=True, check=False, encoding='utf-8')
            groups_json['updatedAt'] = int(git.stdout.strip())

            with open('../dist/dist.json', 'w', encoding='utf-8') as build_groups_json_file:
                json.dump(groups_json, build_groups_json_file,
                          ensure_ascii=False, indent=2)


if __name__ == "__main__":
    make_distjson()
