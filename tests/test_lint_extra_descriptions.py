"""Tests for scripts/lint_extra_descriptions.py"""

import json
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / "scripts"))

from lint_extra_descriptions import (  # pylint: disable=wrong-import-position
    lint_extra_descriptions,
    resolve_safe_path,
)


class LintExtraDescriptionsTest(unittest.TestCase):
    """Tests for extra descriptions lint."""

    def test_rejects_invalid_utf8(self):
        """Invalid UTF-8 is not silently discarded."""
        with tempfile.TemporaryDirectory() as directory:
            public_directory = pathlib.Path(directory)
            extra_descriptions = public_directory / "extra_descriptions"
            extra_descriptions.mkdir()
            (public_directory / "groups.json").write_text(
                json.dumps(
                    {
                        "categories": [
                            {
                                "files": [
                                    {
                                        "extra_description_path": "extra_descriptions/invalid.html"
                                    }
                                ]
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )
            (extra_descriptions / "invalid.html").write_bytes(b"\xff")

            with self.assertRaises(UnicodeDecodeError):
                lint_extra_descriptions(public_directory)

    def test_rejects_path_outside_public_directory(self):
        """A relative path must not escape public_directory."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            public_directory = root / "public"
            public_directory.mkdir()
            outside = root / "outside.html"
            outside.write_text("<p>outside</p>", encoding="utf-8")

            with self.assertRaises(PermissionError):
                resolve_safe_path(public_directory, "../outside.html")

    def test_rejects_symlink_outside_public_directory(self):
        """A symlink must not escape public_directory."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            public_directory = root / "public"
            public_directory.mkdir()
            outside = root / "outside.html"
            outside.write_text("<p>outside</p>", encoding="utf-8")
            link = public_directory / "outside.html"
            link.symlink_to(outside)

            with self.assertRaises(PermissionError):
                resolve_safe_path(public_directory, "outside.html")


if __name__ == "__main__":
    unittest.main()
