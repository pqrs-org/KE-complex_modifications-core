"""Build the complete distribution from public rule sources."""

import concurrent.futures
import html
import json
import os
import pathlib
import re
import shutil
import subprocess
import tempfile

from .complex_modifications import (
    collect_public_sources,
    load_source,
    normalize_complex_modifications,
)


def ruleset_json_path(distributed_path):
    """Return the ruleset JSON path generated for a JavaScript source."""
    path = pathlib.PurePosixPath(distributed_path)
    return str(path.with_name(f"{path.stem}.ruleset.json"))


def parallel_worker_count(task_count):
    """Return a conservative worker count for independent build tasks."""
    configured_jobs = os.environ.get("BUILD_DIST_JOBS")
    if configured_jobs is not None:
        try:
            jobs = int(configured_jobs)
        except ValueError as error:
            raise ValueError(
                f"BUILD_DIST_JOBS must be a positive integer: {configured_jobs}"
            ) from error
        if jobs < 1:
            raise ValueError(
                f"BUILD_DIST_JOBS must be a positive integer: {configured_jobs}"
            )
    else:
        jobs = min(os.cpu_count() or 1, 8)

    return min(task_count, jobs)


def load_javascript_sources(sources, karabiner_cli, sandbox_profile):
    """Evaluate independent JavaScript sources concurrently."""
    if not sources:
        return {}

    worker_count = parallel_worker_count(len(sources))
    with concurrent.futures.ThreadPoolExecutor(max_workers=worker_count) as executor:
        futures = {
            source_path: executor.submit(
                load_source,
                source_path,
                karabiner_cli,
                sandbox_profile,
                require_single_rule=True,
            )
            for source_path, _ in sources
        }

        values = {}
        for source_path, _ in sources:
            try:
                values[source_path] = futures[source_path].result()
            except (OSError, ValueError, json.JSONDecodeError) as error:
                raise ValueError(f"{source_path} error: {error}") from error

    return values


def lint_rule_files(file_paths, karabiner_cli):
    """Lint independent rule files concurrently in balanced chunks."""
    file_paths = sorted(pathlib.Path(path) for path in file_paths)
    if not file_paths:
        return

    worker_count = parallel_worker_count(len(file_paths))
    chunks = [file_paths[index::worker_count] for index in range(worker_count)]

    def run_lint(chunk):
        return subprocess.run(
            [
                karabiner_cli,
                "--lint-complex-modifications",
                *chunk,
                "--silent",
            ],
            capture_output=True,
            check=False,
            encoding="utf-8",
        )

    with concurrent.futures.ThreadPoolExecutor(max_workers=worker_count) as executor:
        results = list(executor.map(run_lint, chunks))

    errors = [
        result.stderr.strip() or "Complex modifications lint failed"
        for result in results
        if result.returncode != 0
    ]
    if errors:
        raise ValueError("\n".join(errors))


def build_rule_files(
    json_directory,
    javascript_directory,
    output_directory,
    karabiner_cli,
    sandbox_profile=None,
):
    """Build rule files, returning evaluated JavaScript rulesets."""
    output_directory = pathlib.Path(output_directory)
    (output_directory / "json").mkdir(parents=True, exist_ok=True)
    (output_directory / "js").mkdir(parents=True, exist_ok=True)
    javascript_rulesets = {}
    sources = collect_public_sources(json_directory, javascript_directory)
    javascript_sources = [
        source for source in sources if source[0].name.endswith(".js")
    ]
    javascript_values = load_javascript_sources(
        javascript_sources, karabiner_cli, sandbox_profile
    )

    with tempfile.TemporaryDirectory() as lint_directory:
        lint_directory = pathlib.Path(lint_directory)
        for source_path, output_path_string in sources:
            output_path = output_directory / output_path_string
            output_path.parent.mkdir(parents=True, exist_ok=True)

            if source_path.name.endswith(".js"):
                value = javascript_values[source_path]
                shutil.copy2(source_path, output_path)
                ruleset_output_path = output_directory / ruleset_json_path(
                    output_path_string
                )
                ruleset_output_path.parent.mkdir(parents=True, exist_ok=True)
                ruleset_output_path.write_text(
                    f"{json.dumps(value, ensure_ascii=False, indent=2)}\n",
                    encoding="utf-8",
                )
                javascript_rulesets[output_path_string] = value
                lint_json_path = lint_directory / f"{source_path.name}.json"
                lint_json_path.write_text(
                    f"{json.dumps(value, ensure_ascii=False, indent=2)}\n",
                    encoding="utf-8",
                )
                continue

            try:
                source_value = json.loads(source_path.read_text(encoding="utf-8"))
                value = normalize_complex_modifications(source_value)
            except (OSError, ValueError, json.JSONDecodeError) as error:
                raise ValueError(f"{source_path} error: {error}") from error

            if "title" in source_value or "rules" in source_value:
                shutil.copy2(source_path, output_path)
                continue

            output_path.write_text(
                f"{json.dumps(value, ensure_ascii=False, indent=2)}\n",
                encoding="utf-8",
            )

        # The Cloudflare Pages dist build passes no karabiner_cli because its
        # Linux builder cannot run the macOS binary. These files are still
        # linted from the same sources by the macOS GitHub Actions build.
        if karabiner_cli is not None:
            lint_rule_files(
                list((output_directory / "json").glob("*.json"))
                + list(lint_directory.glob("*.json")),
                karabiner_cli,
            )

    return javascript_rulesets


def check_safe_path(path, root_directory=None):
    """Return whether path is contained by root_directory."""
    root = pathlib.Path(root_directory or os.getcwd()).resolve()
    target = pathlib.Path(path).resolve()
    try:
        target.relative_to(root)
    except ValueError:
        return False
    return True


def extract_text_from_html(source):
    """Extract searchable text from an HTML fragment."""
    source = re.sub(
        r"<style\b[^>]*>.*?</style\s*>",
        "",
        source,
        flags=re.IGNORECASE | re.DOTALL,
    )
    source = re.sub(r"</?[^>]*>", "", source, flags=re.MULTILINE)
    source = html.unescape(source)
    source = re.sub(r"\s+", " ", source, flags=re.MULTILINE)
    return source.strip()


def load_search_suggestions(file_path):
    """Load and validate search suggestions."""
    with open(file_path, encoding="utf-8") as search_suggestions_file:
        search_suggestions = json.load(search_suggestions_file)

    if not isinstance(search_suggestions, list) or not all(
        isinstance(suggestion, str) and suggestion for suggestion in search_suggestions
    ):
        raise ValueError(
            "search_suggestions.json must be an array of non-empty strings"
        )

    return search_suggestions


def build_dist_json(
    output_file_path,
    public_directory,
    json_directory,
    javascript_rulesets,
):
    """Build the searchable dist.json index."""
    public_directory = pathlib.Path(public_directory).resolve()
    json_directory = pathlib.Path(json_directory).resolve()
    source_values = {
        f"json/{path.name}": json.loads(path.read_text(encoding="utf-8"))
        for path in json_directory.glob("*.json")
    }
    source_values.update(javascript_rulesets)

    groups_json = json.loads(
        (public_directory / "groups.json").read_text(encoding="utf-8")
    )

    grouped_paths = {
        file["path"]
        for groups in groups_json.values()
        for group in groups
        for file in group["files"]
    }
    orphan_files = sorted(source_values.keys() - grouped_paths)

    for groups in groups_json.values():
        for group in groups:
            if group["id"] == "others":
                group["files"].extend({"path": path} for path in orphan_files)

            for file in group["files"]:
                if "path" in file:
                    distributed_path = file["path"]
                    if (
                        os.path.dirname(distributed_path) not in ("json", "js")
                        or os.path.basename(distributed_path)
                        != distributed_path.split("/", 1)[1]
                    ):
                        raise PermissionError(f"cannot access {distributed_path}")

                    source_value = source_values.get(distributed_path)
                    if source_value is None:
                        raise FileNotFoundError(distributed_path)

                    value = normalize_complex_modifications(source_value)
                    if distributed_path.startswith("js/"):
                        file["ruleset_json_path"] = ruleset_json_path(distributed_path)

                    for rule in value["rules"]:
                        del rule["manipulators"]
                    file["metadata"] = value

                extra_description_text = ""
                if "extra_description_path" in file:
                    extra_description_path = (
                        public_directory / file["extra_description_path"]
                    )
                    if not check_safe_path(
                        extra_description_path, root_directory=public_directory
                    ):
                        raise PermissionError(
                            f"cannot access {file['extra_description_path']}"
                        )
                    extra_description_text = extract_text_from_html(
                        extra_description_path.read_text(encoding="utf-8")
                    )

                file["extra_description_text"] = extra_description_text

    groups_json["search_suggestions"] = load_search_suggestions(
        public_directory / "search_suggestions.json"
    )

    git = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=public_directory,
        capture_output=True,
        check=False,
        encoding="utf-8",
    )
    groups_json["revision"] = git.stdout[0:7]

    git = subprocess.run(
        ["git", "log", "-1", "--format=%at"],
        cwd=public_directory,
        capture_output=True,
        check=False,
        encoding="utf-8",
    )
    groups_json["updatedAt"] = int(git.stdout.strip())

    pathlib.Path(output_file_path).write_text(
        json.dumps(groups_json, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def build_dist_contents(
    output_directory,
    public_directory,
    react_dist_directory,
    karabiner_cli,
    sandbox_profile=None,
):
    """Populate output_directory with all distribution files."""
    output_directory = pathlib.Path(output_directory).resolve()
    public_directory = pathlib.Path(public_directory).resolve()
    react_dist_directory = pathlib.Path(react_dist_directory).resolve()

    output_directory.mkdir(parents=True, exist_ok=True)
    javascript_rulesets = build_rule_files(
        public_directory / "json",
        public_directory / "js",
        output_directory,
        karabiner_cli,
        sandbox_profile,
    )
    build_dist_json(
        output_directory / "dist.json",
        public_directory,
        output_directory / "json",
        javascript_rulesets,
    )

    shutil.copytree(
        public_directory / "extra_descriptions",
        output_directory / "extra_descriptions",
    )
    shutil.copytree(react_dist_directory, output_directory, dirs_exist_ok=True)


def build_dist_atomically(
    output_directory,
    public_directory,
    react_dist_directory,
    karabiner_cli,
    sandbox_profile=None,
):
    """Build and atomically replace output_directory."""
    output_directory = pathlib.Path(output_directory).resolve()
    output_directory.parent.mkdir(parents=True, exist_ok=True)
    staging_directory = pathlib.Path(
        tempfile.mkdtemp(
            prefix=f"{output_directory.name}.tmp.", dir=output_directory.parent
        )
    )
    backup_root = None
    backup_directory = None

    try:
        build_dist_contents(
            staging_directory,
            public_directory,
            react_dist_directory,
            karabiner_cli,
            sandbox_profile,
        )

        if output_directory.exists():
            backup_root = pathlib.Path(
                tempfile.mkdtemp(
                    prefix=f"{output_directory.name}.backup.",
                    dir=output_directory.parent,
                )
            )
            backup_directory = backup_root / output_directory.name
            output_directory.rename(backup_directory)

        try:
            staging_directory.rename(output_directory)
        except OSError:
            if backup_directory is not None and not output_directory.exists():
                backup_directory.rename(output_directory)
            raise

        staging_directory = None
        if backup_root is not None:
            shutil.rmtree(backup_root)
            backup_root = None
    finally:
        if staging_directory is not None:
            shutil.rmtree(staging_directory, ignore_errors=True)
        if backup_root is not None:
            if backup_directory is not None and not output_directory.exists():
                backup_directory.rename(output_directory)
            shutil.rmtree(backup_root, ignore_errors=True)
