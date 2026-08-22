"""Tests for scripts/preview_server.py"""

import pathlib
import subprocess
import sys
import unittest
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / "scripts"))

import preview_server  # pylint: disable=wrong-import-position


class PreviewServerTest(unittest.TestCase):
    """Tests for preview server helpers."""

    @mock.patch("preview_server.subprocess.run")
    def test_run_update_dist_uses_absolute_paths(self, run):
        """The updater does not depend on the current working directory."""
        preview_server.run_update_dist()

        run.assert_called_once_with(
            ["bash", str(preview_server.UPDATE_DIST_SCRIPT)],
            cwd=preview_server.CORE_DIRECTORY,
            check=True,
        )
        self.assertTrue(preview_server.UPDATE_DIST_SCRIPT.is_absolute())
        self.assertTrue(preview_server.DIST_DIRECTORY.is_absolute())

    @mock.patch("preview_server.subprocess.run")
    def test_run_update_dist_propagates_failure(self, run):
        """An update failure is not silently ignored."""
        run.side_effect = subprocess.CalledProcessError(1, "update-dist.sh")

        with self.assertRaises(subprocess.CalledProcessError):
            preview_server.run_update_dist()


if __name__ == "__main__":
    unittest.main()
