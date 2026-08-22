"""Tests for directly callable lint helpers."""

import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / "scripts"))

from lib.lint_groups import lint_groups  # pylint: disable=wrong-import-position
from lib.lint_public_json import (  # pylint: disable=wrong-import-position
    lint_public_json,
)


class LintGroupsTest(unittest.TestCase):
    """Tests for groups validation without invoking the command."""

    def test_duplicate_entry_is_rejected(self):
        """A file may appear in only one category."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / "groups.json").write_text(
                '{"categories": [{"files": [{"path": "json/a.json"}, '
                '{"path": "json/a.json"}]}]}',
                encoding="utf-8",
            )

            with self.assertRaisesRegex(ValueError, "duplicated entries"):
                lint_groups(root / "groups.json")

    def test_orphan_entries_are_sorted_in_error(self):
        """Missing paths are reported deterministically."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / "json").mkdir()
            (root / "groups.json").write_text(
                '{"categories": [{"files": [{"path": "json/z.json"}, '
                '{"path": "json/a.json"}]}]}',
                encoding="utf-8",
            )

            with self.assertRaises(ValueError) as context:
                lint_groups(root / "groups.json")

            self.assertLess(
                str(context.exception).index("json/a.json"),
                str(context.exception).index("json/z.json"),
            )


class LintPublicJsonTest(unittest.TestCase):
    """Tests for public JSON validation without invoking the command."""

    def test_valid_source_is_accepted(self):
        """A valid package completes without an exception."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / "example.json").write_text(
                '{"title":"Example","rules":[]}', encoding="utf-8"
            )

            lint_public_json(root)

    def test_invalid_source_names_the_file(self):
        """A source validation failure contains its path."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            source = root / "example.json"
            source.write_text('{"title":1,"rules":[]}', encoding="utf-8")

            with self.assertRaisesRegex(
                ValueError, f"{source} error: `title` is not string"
            ):
                lint_public_json(root)


if __name__ == "__main__":
    unittest.main()
