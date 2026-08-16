'''Tests for update shell scripts.'''

import os
import pathlib
import shutil
import stat
import subprocess
import tempfile
import unittest

CORE_DIRECTORY = pathlib.Path(__file__).parent.parent


class UpdateJsonTest(unittest.TestCase):
    '''Tests for scripts/update-json.sh.'''

    def make_repository(self, directory):
        '''Create a minimal repository for update-json.sh.'''
        root = pathlib.Path(directory)
        core = root / 'core'
        scripts = core / 'scripts'
        scripts.mkdir(parents=True)
        (core / 'bin').mkdir()
        (root / 'src/json').mkdir(parents=True)
        (root / 'public/json').mkdir(parents=True)
        shutil.copy2(CORE_DIRECTORY / 'scripts/update-json.sh', scripts)
        shutil.copy2(CORE_DIRECTORY / 'scripts/apply-lint.sh', scripts)

        karabiner_cli = core / 'bin/karabiner_cli'
        karabiner_cli.write_text(
            '''#!/bin/bash
if [[ "$1" == "--eval-js" ]]; then
  printf 'generated json\n'
  exit "${EVAL_STATUS:-0}"
fi
if [[ "$1" == "--lint-complex-modifications" ]]; then
  exit "${LINT_STATUS:-0}"
fi
exit 1
''',
            encoding='utf-8')
        karabiner_cli.chmod(0o755)

        src = root / 'src/json/test.json.js'
        dst = root / 'public/json/test.json'
        src.write_text('// source\n', encoding='utf-8')
        dst.write_text('previous json\n', encoding='utf-8')
        os.utime(dst, (1_000_000_000, 1_000_000_000))
        os.utime(src, (2_000_000_000, 2_000_000_000))
        return core, dst

    def run_update(self, core, **environment):
        '''Run update-json.sh with fake karabiner_cli settings.'''
        env = os.environ.copy()
        env.update(environment)
        return subprocess.run(
            ['bash', 'scripts/update-json.sh'],
            cwd=core,
            env=env,
            check=False,
            capture_output=True,
            encoding='utf-8')

    def test_evaluation_failure_preserves_previous_json(self):
        '''A failed evaluation does not truncate the destination.'''
        with tempfile.TemporaryDirectory() as directory:
            core, dst = self.make_repository(directory)
            result = self.run_update(core, EVAL_STATUS='1')

            self.assertEqual(1, result.returncode)
            self.assertEqual('previous json\n', dst.read_text('utf-8'))
            self.assertEqual([], list(dst.parent.glob('*.tmp.*')))

    def test_lint_failure_preserves_previous_json(self):
        '''Invalid generated JSON does not replace the destination.'''
        with tempfile.TemporaryDirectory() as directory:
            core, dst = self.make_repository(directory)
            result = self.run_update(core, LINT_STATUS='1')

            self.assertEqual(1, result.returncode)
            self.assertEqual('previous json\n', dst.read_text('utf-8'))
            self.assertEqual([], list(dst.parent.glob('*.tmp.*')))

    def test_failure_does_not_create_destination(self):
        '''A failed first generation does not leave an empty destination.'''
        with tempfile.TemporaryDirectory() as directory:
            core, dst = self.make_repository(directory)
            dst.unlink()
            result = self.run_update(core, EVAL_STATUS='1')

            self.assertEqual(1, result.returncode)
            self.assertFalse(dst.exists())
            self.assertEqual([], list(dst.parent.glob('*.tmp.*')))

    def test_success_replaces_json(self):
        '''Validated JSON atomically replaces the destination.'''
        with tempfile.TemporaryDirectory() as directory:
            core, dst = self.make_repository(directory)
            result = self.run_update(core)

            self.assertEqual(0, result.returncode)
            self.assertEqual('generated json\n', dst.read_text('utf-8'))
            self.assertEqual(0o644, stat.S_IMODE(dst.stat().st_mode))


class UpdateDistTest(unittest.TestCase):
    '''Tests for scripts/update-dist.sh.'''

    def make_repository(self, directory):
        '''Create a minimal repository for update-dist.sh.'''
        root = pathlib.Path(directory)
        scripts = root / 'core/scripts'
        scripts.mkdir(parents=True)
        (root / 'core/react/dist').mkdir(parents=True)
        (root / 'public/json').mkdir(parents=True)
        (root / 'public/extra_descriptions').mkdir()
        (root / 'dist').mkdir()
        shutil.copy2(CORE_DIRECTORY / 'scripts/update-dist.sh', scripts)
        (scripts / 'make_distjson.py').write_text(
            '''import os
import pathlib
import sys

if os.environ.get('MAKE_DIST_FAIL') == '1':
    sys.exit(1)
pathlib.Path(sys.argv[1]).write_text('new dist json\\n', encoding='utf-8')
''',
            encoding='utf-8')
        (root / 'public/json/rule.json').write_text('{}\n', encoding='utf-8')
        (root / 'public/extra_descriptions/rule.html').write_text(
            '<p>rule</p>\n', encoding='utf-8')
        (root / 'core/react/dist/index.html').write_text(
            '<p>index</p>\n', encoding='utf-8')
        marker = root / 'dist/previous'
        marker.write_text('previous dist\n', encoding='utf-8')
        return root, marker

    def run_update(self, root, **environment):
        '''Run update-dist.sh with fake generator settings.'''
        env = os.environ.copy()
        env.update(environment)
        return subprocess.run(
            ['bash', 'core/scripts/update-dist.sh'],
            cwd=root,
            env=env,
            check=False,
            capture_output=True,
            encoding='utf-8')

    def test_generation_failure_preserves_previous_dist(self):
        '''A failed build leaves the previous dist untouched.'''
        with tempfile.TemporaryDirectory() as directory:
            root, marker = self.make_repository(directory)
            result = self.run_update(root, MAKE_DIST_FAIL='1')

            self.assertEqual(1, result.returncode)
            self.assertEqual('previous dist\n', marker.read_text('utf-8'))
            self.assertEqual([], list(root.glob('dist.tmp.*')))

    def test_copy_failure_preserves_previous_dist(self):
        '''A failure after generation also leaves the previous dist untouched.'''
        with tempfile.TemporaryDirectory() as directory:
            root, marker = self.make_repository(directory)
            shutil.rmtree(root / 'public/extra_descriptions')
            result = self.run_update(root)

            self.assertEqual(1, result.returncode)
            self.assertEqual('previous dist\n', marker.read_text('utf-8'))
            self.assertEqual([], list(root.glob('dist.tmp.*')))

    def test_success_replaces_dist(self):
        '''A complete build replaces the previous dist.'''
        with tempfile.TemporaryDirectory() as directory:
            root, marker = self.make_repository(directory)
            result = self.run_update(root)

            self.assertEqual(0, result.returncode)
            self.assertFalse(marker.exists())
            self.assertEqual(
                'new dist json\n',
                (root / 'dist/dist.json').read_text('utf-8'))
            self.assertTrue((root / 'dist/json/rule.json').is_file())
            self.assertTrue((root / 'dist/index.html').is_file())


if __name__ == '__main__':
    unittest.main()
