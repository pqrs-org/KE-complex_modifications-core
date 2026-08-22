"""Tests for update shell scripts."""

import os
import pathlib
import shutil
import stat
import subprocess
import tempfile
import unittest

CORE_DIRECTORY = pathlib.Path(__file__).parent.parent


class UpdateJsonTest(unittest.TestCase):
    """Tests for scripts/update-json.sh."""

    def make_repository(self, directory):
        """Create a minimal repository for update-json.sh."""
        root = pathlib.Path(directory)
        core = root / "core"
        scripts = core / "scripts"
        scripts.mkdir(parents=True)
        (core / "bin").mkdir()
        (root / "src/json").mkdir(parents=True)
        (root / "public/json").mkdir(parents=True)
        shutil.copy2(CORE_DIRECTORY / "scripts/update-json.sh", scripts)
        shutil.copy2(CORE_DIRECTORY / "scripts/apply-lint.sh", scripts)

        karabiner_cli = core / "bin/karabiner_cli"
        karabiner_cli.write_text(
            """#!/bin/bash
if [[ "$1" == "--eval-js" ]]; then
  printf 'generated json\n'
  exit "${EVAL_STATUS:-0}"
fi
if [[ "$1" == "--lint-complex-modifications" ]]; then
  exit "${LINT_STATUS:-0}"
fi
exit 1
""",
            encoding="utf-8",
        )
        karabiner_cli.chmod(0o755)

        src = root / "src/json/test.json.js"
        dst = root / "public/json/test.json"
        src.write_text("// source\n", encoding="utf-8")
        dst.write_text("previous json\n", encoding="utf-8")
        os.utime(dst, (1_000_000_000, 1_000_000_000))
        os.utime(src, (2_000_000_000, 2_000_000_000))
        return core, dst

    def run_update(self, core, **environment):
        """Run update-json.sh with fake karabiner_cli settings."""
        env = os.environ.copy()
        env.update(environment)
        return subprocess.run(
            ["bash", "scripts/update-json.sh"],
            cwd=core,
            env=env,
            check=False,
            capture_output=True,
            encoding="utf-8",
        )

    def test_evaluation_failure_preserves_previous_json(self):
        """A failed evaluation does not truncate the destination."""
        with tempfile.TemporaryDirectory() as directory:
            core, dst = self.make_repository(directory)
            result = self.run_update(core, EVAL_STATUS="1")

            self.assertEqual(1, result.returncode)
            self.assertEqual("previous json\n", dst.read_text("utf-8"))
            self.assertEqual([], list(dst.parent.glob("*.tmp.*")))

    def test_lint_failure_preserves_previous_json(self):
        """Invalid generated JSON does not replace the destination."""
        with tempfile.TemporaryDirectory() as directory:
            core, dst = self.make_repository(directory)
            result = self.run_update(core, LINT_STATUS="1")

            self.assertEqual(1, result.returncode)
            self.assertEqual("previous json\n", dst.read_text("utf-8"))
            self.assertEqual([], list(dst.parent.glob("*.tmp.*")))

    def test_failure_does_not_create_destination(self):
        """A failed first generation does not leave an empty destination."""
        with tempfile.TemporaryDirectory() as directory:
            core, dst = self.make_repository(directory)
            dst.unlink()
            result = self.run_update(core, EVAL_STATUS="1")

            self.assertEqual(1, result.returncode)
            self.assertFalse(dst.exists())
            self.assertEqual([], list(dst.parent.glob("*.tmp.*")))

    def test_success_replaces_json(self):
        """Validated JSON atomically replaces the destination."""
        with tempfile.TemporaryDirectory() as directory:
            core, dst = self.make_repository(directory)
            result = self.run_update(core)

            self.assertEqual(0, result.returncode)
            self.assertEqual("generated json\n", dst.read_text("utf-8"))
            self.assertEqual(0o644, stat.S_IMODE(dst.stat().st_mode))


if __name__ == "__main__":
    unittest.main()
