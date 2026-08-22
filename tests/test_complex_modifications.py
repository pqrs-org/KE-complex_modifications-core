"""Tests for complex_modifications source helpers."""

import json
import pathlib
import stat
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / "scripts"))

from lib.build_dist import (  # pylint: disable=wrong-import-position
    build_rule_files,
    ruleset_json_path,
)
from lib.complex_modifications import (  # pylint: disable=wrong-import-position
    collect_public_sources,
    collect_sources,
    evaluate_javascript,
    json_output_file_name,
    normalize_complex_modifications,
)


class ComplexModificationsTest(unittest.TestCase):
    """Tests for source normalization."""

    def test_ruleset_is_preserved(self):
        """The established title/rules format remains supported."""
        ruleset = {"title": "Ruleset", "rules": []}
        self.assertIs(ruleset, normalize_complex_modifications(ruleset))

    def test_single_rule_is_wrapped(self):
        """A single rule gets a title from its description."""
        rule = {"description": "Rule", "manipulators": []}
        self.assertEqual(
            {"title": "Rule", "rules": [rule]},
            normalize_complex_modifications(rule),
        )

    def test_single_rule_metadata_is_moved_to_ruleset(self):
        """Attribution metadata remains visible after wrapping a rule."""
        rule = {
            "description": "Rule",
            "maintainers": ["maintainer"],
            "author": "Author",
            "manipulators": [],
        }
        self.assertEqual(
            {
                "title": "Rule",
                "maintainers": ["maintainer"],
                "author": "Author",
                "rules": [
                    {"description": "Rule", "manipulators": []},
                ],
            },
            normalize_complex_modifications(rule),
        )
        self.assertIn("maintainers", rule)
        self.assertIn("author", rule)

    def test_invalid_single_rule_is_rejected(self):
        """Single rules require description and manipulators."""
        with self.assertRaisesRegex(ValueError, "`manipulators` is not found"):
            normalize_complex_modifications({"description": "Rule"})

    def test_json_output_file_names(self):
        """JSON and JavaScript sources produce normalized JSON names."""
        self.assertEqual("a.json", json_output_file_name("a.json"))
        self.assertEqual("a.json", json_output_file_name("a.js"))
        self.assertEqual("a.json.json", json_output_file_name("a.json.js"))

    def test_javascript_ruleset_json_path_uses_a_descriptive_suffix(self):
        """JavaScript ruleset output remains beside its source."""
        self.assertEqual("js/a.ruleset.json", ruleset_json_path("js/a.js"))

    def test_output_collision_is_rejected(self):
        """Two source files may not produce the same public URL."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / "a.json").write_text("{}", encoding="utf-8")
            (root / "a.js").write_text("{}", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "both produce a.json"):
                collect_sources(root)

    def test_public_sources_use_separate_distribution_directories(self):
        """JSON and JavaScript with the same stem do not collide."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            json_directory = root / "json"
            javascript_directory = root / "js"
            json_directory.mkdir()
            javascript_directory.mkdir()
            (json_directory / "a.json").write_text("{}", encoding="utf-8")
            (javascript_directory / "a.js").write_text("main()", encoding="utf-8")
            self.assertEqual(
                ["js/a.js", "json/a.json"],
                sorted(
                    output_path
                    for _, output_path in collect_public_sources(
                        json_directory, javascript_directory
                    )
                ),
            )

    def test_public_source_directories_enforce_file_types(self):
        """JSON and JavaScript files must be placed in their own directories."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            json_directory = root / "json"
            javascript_directory = root / "js"
            json_directory.mkdir()
            javascript_directory.mkdir()
            (json_directory / "misplaced.js").write_text("main()", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "public/json directory"):
                collect_public_sources(json_directory, javascript_directory)

    def test_public_javascript_directory_rejects_json(self):
        """The public JavaScript directory accepts only .js files."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            json_directory = root / "json"
            javascript_directory = root / "js"
            json_directory.mkdir()
            javascript_directory.mkdir()
            (javascript_directory / "misplaced.json").write_text("{}", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "public/js directory"):
                collect_public_sources(json_directory, javascript_directory)

    def test_javascript_uses_json_output_option(self):
        """The source is passed directly to the JSON output option."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            source = root / "example.js"
            source.write_text("main()", encoding="utf-8")
            cli = root / "karabiner_cli"
            cli.write_text(
                "#!/bin/sh\n"
                'test "$1" = "--eval-js-to-json" || exit 1\n'
                'test "$2" = "' + str(source) + '" || exit 1\n'
                "printf '%s\\n' "
                '\'{"description":"returned","manipulators":[]}\'\n',
                encoding="utf-8",
            )
            cli.chmod(cli.stat().st_mode | stat.S_IXUSR)

            self.assertEqual(
                {"description": "returned", "manipulators": []},
                json.loads(evaluate_javascript(source, cli)),
            )

    def test_javascript_uses_node_without_karabiner_cli(self):
        """JavaScript can be evaluated on non-macOS build hosts."""
        with tempfile.TemporaryDirectory() as directory:
            source = pathlib.Path(directory) / "example.js"
            source.write_text(
                "({ description: 'returned', manipulators: [] })",
                encoding="utf-8",
            )

            self.assertEqual(
                {"description": "returned", "manipulators": []},
                json.loads(evaluate_javascript(source, None)),
            )

    @unittest.skipUnless(sys.platform == "darwin", "karabiner_cli requires macOS")
    def test_node_matches_karabiner_cli_javascript_result(self):
        """The Cloudflare Node evaluator matches karabiner_cli output."""
        with tempfile.TemporaryDirectory() as directory:
            source = pathlib.Path(directory) / "example.js"
            source.write_text(
                """
const keys = ['h', 'j', 'k', 'l'];

function makeManipulator(key) {
    return {
        type: 'basic',
        from: { key_code: key },
        to: [{ key_code: 'escape' }],
    };
}

function main() {
    return {
        description: 'Evaluator comparison',
        description_notes: ['Generated by a helper function.'],
        maintainers: ['example'],
        manipulators: keys.map(makeManipulator),
    };
}

main();
""",
                encoding="utf-8",
            )
            karabiner_cli = pathlib.Path(__file__).parent.parent / "bin/karabiner_cli"

            node_value = json.loads(evaluate_javascript(source, None))
            karabiner_cli_value = json.loads(evaluate_javascript(source, karabiner_cli))

            self.assertEqual(karabiner_cli_value, node_value)

    def test_build_evaluates_javascript_and_normalizes_result(self):
        """JavaScript output is converted to an importable JSON ruleset."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            json_directory = root / "json"
            javascript_directory = root / "js"
            output = root / "output"
            json_directory.mkdir()
            javascript_directory.mkdir()
            (javascript_directory / "example.js").write_text("main()", encoding="utf-8")
            cli = root / "karabiner_cli"
            cli.write_text(
                "#!/bin/sh\n"
                "printf '%s\\n' "
                '\'{"description":"JS rule","manipulators":[]}\'\n',
                encoding="utf-8",
            )
            cli.chmod(cli.stat().st_mode | stat.S_IXUSR)

            javascript_rulesets = build_rule_files(
                json_directory, javascript_directory, output, cli
            )

            self.assertEqual(
                {
                    "title": "JS rule",
                    "rules": [
                        {"description": "JS rule", "manipulators": []},
                    ],
                },
                javascript_rulesets["js/example.js"],
            )
            self.assertEqual("main()", (output / "js/example.js").read_text("utf-8"))
            self.assertEqual(
                javascript_rulesets["js/example.js"],
                json.loads((output / "js/example.ruleset.json").read_text("utf-8")),
            )

    def test_build_replaces_single_json_with_ruleset_json(self):
        """A single JSON rule is distributed in ruleset form at the same path."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            json_directory = root / "json"
            javascript_directory = root / "js"
            output = root / "output"
            json_directory.mkdir()
            javascript_directory.mkdir()
            source = '{"description":"Single rule","manipulators":[]}'
            (json_directory / "example.json").write_text(source, encoding="utf-8")

            build_rule_files(json_directory, javascript_directory, output, None)

            self.assertEqual(
                {
                    "title": "Single rule",
                    "rules": [
                        {"description": "Single rule", "manipulators": []},
                    ],
                },
                json.loads((output / "json/example.json").read_text("utf-8")),
            )
            self.assertFalse((output / "json/example.ruleset.json").exists())

    def test_build_rejects_javascript_ruleset(self):
        """Public JavaScript must produce a single rule, not a ruleset."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            json_directory = root / "json"
            javascript_directory = root / "js"
            output = root / "output"
            json_directory.mkdir()
            javascript_directory.mkdir()
            (javascript_directory / "example.js").write_text("main()", encoding="utf-8")
            cli = root / "karabiner_cli"
            cli.write_text(
                '#!/bin/sh\nprintf \'%s\\n\' \'{"title":"JS ruleset","rules":[]}\'\n',
                encoding="utf-8",
            )
            cli.chmod(cli.stat().st_mode | stat.S_IXUSR)

            with self.assertRaisesRegex(ValueError, "must return a single rule"):
                build_rule_files(json_directory, javascript_directory, output, cli)

    def test_build_propagates_complex_modifications_lint_failure(self):
        """Generated rule files must pass karabiner_cli validation."""
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            json_directory = root / "json"
            javascript_directory = root / "js"
            output = root / "output"
            json_directory.mkdir()
            javascript_directory.mkdir()
            (json_directory / "example.json").write_text(
                '{"title":"Example","rules":[]}', encoding="utf-8"
            )
            cli = root / "karabiner_cli"
            cli.write_text(
                "#!/bin/sh\nprintf 'lint failed\\n' >&2\nexit 1\n",
                encoding="utf-8",
            )
            cli.chmod(cli.stat().st_mode | stat.S_IXUSR)

            with self.assertRaisesRegex(ValueError, "lint failed"):
                build_rule_files(json_directory, javascript_directory, output, cli)


if __name__ == "__main__":
    unittest.main()
