"""Helpers for complex_modifications source files."""

import json
import os
import pathlib
import subprocess


def distributed_file_name(source_path):
    """Return the JSON output name for a source after normalization."""
    name = pathlib.Path(source_path).name
    if name.endswith(".js"):
        return f"{name[:-3]}.json"
    if name.endswith(".json"):
        return name
    raise ValueError(f"unsupported file type: {name}")


# A JSON source or the result of evaluating a JavaScript source may contain a
# single rule. Wrap such values in the packaged JSON format used for
# distribution, while preserving values that are already packages.
def normalize_complex_modifications(value):
    """Validate and return a value in packaged JSON format."""
    if not isinstance(value, dict):
        raise ValueError("top-level value must be an object")

    if "title" in value or "rules" in value:
        if "title" not in value:
            raise ValueError("`title` is not found")
        if not isinstance(value["title"], str):
            raise ValueError("`title` is not string")
        if "rules" not in value:
            raise ValueError("`rules` is not found")
        if not isinstance(value["rules"], list):
            raise ValueError("`rules` is not array")
        result = value
    else:
        if "description" not in value:
            raise ValueError("`description` is not found")
        if not isinstance(value["description"], str):
            raise ValueError("`description` is not string")
        if "manipulators" not in value:
            raise ValueError("`manipulators` is not found")
        if not isinstance(value["manipulators"], list):
            raise ValueError("`manipulators` is not array")
        rule = value.copy()
        result = {
            "title": value["description"],
        }
        for metadata_key in ("maintainers", "author"):
            if metadata_key in rule:
                result[metadata_key] = rule.pop(metadata_key)
        result["rules"] = [rule]

    for rule in result["rules"]:
        if isinstance(rule, dict) and "available_since" in rule:
            raise ValueError(
                "`available_since` is no longer supported. "
                "Please use `description_notes` instead"
            )

    return result


def load_source(
    source_path,
    karabiner_cli=None,
    sandbox_profile=None,
    require_single_rule=False,
):
    """Load JSON directly or evaluate JavaScript with karabiner_cli."""
    source_path = pathlib.Path(source_path)
    if source_path.name.endswith(".js"):
        if karabiner_cli is None:
            raise ValueError("karabiner_cli is required to evaluate JavaScript")
        source = evaluate_javascript(source_path, karabiner_cli, sandbox_profile)
    else:
        source = source_path.read_text(encoding="utf-8")

    value = json.loads(source)
    if (
        require_single_rule
        and isinstance(value, dict)
        and ("title" in value or "rules" in value)
    ):
        raise ValueError(
            "JavaScript files under public/js must return a single rule "
            "containing `description` and `manipulators`"
        )

    return normalize_complex_modifications(value)


def evaluate_javascript(source_path, karabiner_cli, sandbox_profile=None):
    """Evaluate JS and capture its completion value."""
    command = [karabiner_cli, "--eval-js-to-json", source_path]
    if sandbox_profile is not None:
        command = ["sandbox-exec", "-f", sandbox_profile] + command

    result = subprocess.run(command, capture_output=True, check=False, encoding="utf-8")

    if result.returncode != 0:
        detail = result.stderr.strip() or "JavaScript evaluation failed"
        raise ValueError(detail)

    if result.stdout:
        return result.stdout
    raise ValueError("JavaScript did not return JSON")


def collect_sources(source_directory):
    """Collect supported source files and reject collisions."""
    sources = []
    outputs = {}
    for source_path in sorted(pathlib.Path(source_directory).iterdir()):
        if source_path.name == ".gitkeep":
            continue
        if source_path.is_dir():
            raise ValueError(f"An extra directory is found: {source_path}")
        try:
            output_name = distributed_file_name(source_path)
        except ValueError as error:
            path = os.fspath(source_path)
            raise ValueError(
                f"Please rename {path} to {path}.json or {path}.js"
            ) from error
        if output_name in outputs:
            raise ValueError(
                f"{source_path} and {outputs[output_name]} both produce {output_name}"
            )
        outputs[output_name] = source_path
        sources.append((source_path, output_name))
    return sources


def collect_public_sources(json_directory, javascript_directory):
    """Collect public sources with their distribution paths."""
    sources = []
    for source_directory, extension, directory_name in (
        (json_directory, ".json", "json"),
        (javascript_directory, ".js", "js"),
    ):
        if extension == ".js" and not pathlib.Path(source_directory).is_dir():
            continue
        for source_path, json_output_name in collect_sources(source_directory):
            if not source_path.name.endswith(extension):
                raise ValueError(
                    f"{source_path} must be placed in the "
                    f"public/{directory_name} directory"
                )
            output_name = json_output_name if extension == ".json" else source_path.name
            sources.append((source_path, f"{directory_name}/{output_name}"))
    return sources
