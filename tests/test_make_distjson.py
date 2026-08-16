'''Tests for scripts/make_distjson.py'''

import os
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / 'scripts'))

from make_distjson import (  # pylint: disable=wrong-import-position
    check_safe_path,
    extract_text_from_html,
    load_search_suggestions,
)


class MakeDistjsonTest(unittest.TestCase):
    '''Tests for dist.json helpers'''

    def test_check_safe_path_rejects_similarly_named_sibling(self):
        '''A common path prefix does not make a sibling safe.'''
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory) / 'public'
            child = root / 'json'
            sibling = pathlib.Path(directory) / 'public_evil'
            child.mkdir(parents=True)
            sibling.mkdir()

            cwd = os.getcwd()
            try:
                os.chdir(root)
                self.assertTrue(check_safe_path(child))
                self.assertFalse(check_safe_path(sibling))
            finally:
                os.chdir(cwd)

    def test_extract_text_removes_style_blocks_individually(self):
        '''Text between multiple style blocks is preserved.'''
        source = (
            '<style>a</style><p>before&nbsp;</p> '
            '<STYLE media="all">b</STYLE><p>after &amp;</p>'
        )
        self.assertEqual('before after &', extract_text_from_html(source))

    def test_load_search_suggestions(self):
        '''Search suggestions are loaded from a JSON file.'''
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / 'search_suggestions.json'
            path.write_text('["Caps Lock", "Mouse"]', encoding='utf-8')

            self.assertEqual(
                ['Caps Lock', 'Mouse'], load_search_suggestions(path))

    def test_load_search_suggestions_rejects_invalid_values(self):
        '''Every search suggestion must be a non-empty string.'''
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / 'search_suggestions.json'
            path.write_text('["Caps Lock", ""]', encoding='utf-8')

            with self.assertRaisesRegex(ValueError, 'non-empty strings'):
                load_search_suggestions(path)


if __name__ == '__main__':
    unittest.main()
