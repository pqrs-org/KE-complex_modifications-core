"""Tests for dist building helpers."""

import os
import pathlib
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / "scripts"))

from lib.build_dist import (  # pylint: disable=wrong-import-position
    build_dist_atomically,
    check_safe_path,
    extract_text_from_html,
    parallel_worker_count,
    load_search_suggestions,
)


class BuildDistTest(unittest.TestCase):
    """Tests for distribution building helpers."""

    def test_check_safe_path_rejects_similarly_named_sibling(self):
        """A common path prefix does not make a sibling safe."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory) / "public"
            child = root / "json"
            sibling = pathlib.Path(directory) / "public_evil"
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
        """Text between multiple style blocks is preserved."""
        source = (
            "<style>a</style><p>before&nbsp;</p> "
            '<STYLE media="all">b</STYLE><p>after &amp;</p>'
        )
        self.assertEqual("before after &", extract_text_from_html(source))

    def test_load_search_suggestions(self):
        """Search suggestions are loaded from a JSON file."""
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "search_suggestions.json"
            path.write_text('["Caps Lock", "Mouse"]', encoding="utf-8")

            self.assertEqual(["Caps Lock", "Mouse"], load_search_suggestions(path))

    def test_load_search_suggestions_rejects_invalid_values(self):
        """Every search suggestion must be a non-empty string."""
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "search_suggestions.json"
            path.write_text('["Caps Lock", ""]', encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "non-empty strings"):
                load_search_suggestions(path)

    def test_parallel_worker_count_can_be_configured(self):
        """BUILD_DIST_JOBS caps the workers without exceeding task count."""
        with mock.patch.dict(os.environ, {"BUILD_DIST_JOBS": "3"}):
            self.assertEqual(3, parallel_worker_count(10))
            self.assertEqual(2, parallel_worker_count(2))

    def test_parallel_worker_count_rejects_invalid_value(self):
        """BUILD_DIST_JOBS must be a positive integer."""
        with mock.patch.dict(os.environ, {"BUILD_DIST_JOBS": "0"}):
            with self.assertRaisesRegex(ValueError, "positive integer"):
                parallel_worker_count(10)

    @mock.patch("lib.build_dist.build_dist_contents")
    def test_build_failure_preserves_previous_dist(self, build_contents):
        """A failed build leaves the previous dist untouched."""
        build_contents.side_effect = ValueError("build failed")
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            output = root / "dist"
            output.mkdir()
            marker = output / "previous"
            marker.write_text("previous dist\n", encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "build failed"):
                build_dist_atomically(output, "public", "react", "cli")

            self.assertEqual("previous dist\n", marker.read_text("utf-8"))
            self.assertEqual([], list(root.glob("dist.tmp.*")))

    @mock.patch("lib.build_dist.build_dist_contents")
    def test_success_replaces_previous_dist(self, build_contents):
        """A successful build atomically replaces the previous dist."""

        def populate(output, *_args):
            pathlib.Path(output, "dist.json").write_text(
                "new dist json\n", encoding="utf-8"
            )

        build_contents.side_effect = populate
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            output = root / "dist"
            output.mkdir()
            (output / "previous").write_text("previous dist\n", encoding="utf-8")

            build_dist_atomically(output, "public", "react", "cli")

            self.assertFalse((output / "previous").exists())
            self.assertEqual(
                "new dist json\n", (output / "dist.json").read_text("utf-8")
            )
            self.assertEqual([], list(root.glob("dist.tmp.*")))
            self.assertEqual([], list(root.glob("dist.backup.*")))


if __name__ == "__main__":
    unittest.main()
