'''Tests for scripts/sort_groups.py'''

import json
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / 'scripts'))

from sort_groups import sort_groups  # pylint: disable=wrong-import-position


class SortGroupsTest(unittest.TestCase):
    '''Tests for groups.json sorting.'''

    def test_sorts_files_without_changing_category_order(self):
        '''File paths are sorted case-insensitively within each category.'''
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / 'groups.json'
            path.write_text(
                json.dumps({
                    'index': [
                        {
                            'id': 'first',
                            'files': [
                                {'path': 'json/z.json'},
                                {'path': 'json/B.json'},
                                {'path': 'json/a.json'},
                            ],
                        },
                        {
                            'id': 'second',
                            'files': [{'path': 'json/c.json'}],
                        },
                    ],
                }),
                encoding='utf-8')

            sort_groups(path)

            result = json.loads(path.read_text(encoding='utf-8'))
            self.assertEqual(
                ['first', 'second'],
                [category['id'] for category in result['index']])
            self.assertEqual(
                ['json/a.json', 'json/B.json', 'json/z.json'],
                [file['path'] for file in result['index'][0]['files']])


if __name__ == '__main__':
    unittest.main()
