'''Tests for scripts/make_distjson.py'''

import os
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / 'scripts'))

from make_distjson import check_safe_path, extract_text_from_html  # pylint: disable=wrong-import-position


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


if __name__ == '__main__':
    unittest.main()
