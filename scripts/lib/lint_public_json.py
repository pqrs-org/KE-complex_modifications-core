"""Validate public/json sources."""

import json

from .complex_modifications import collect_sources, load_source


def lint_public_json(public_json_directory, karabiner_cli=None, sandbox_profile=None):
    """Raise ValueError if a public/json source is invalid."""
    sources = collect_sources(public_json_directory)

    for file_path, _ in sources:
        if file_path.name.endswith(".js"):
            raise ValueError(f"Please move {file_path} to public/js/{file_path.name}")
        try:
            load_source(file_path, karabiner_cli, sandbox_profile)
        except (OSError, json.JSONDecodeError, ValueError) as error:
            raise ValueError(f"{file_path} error: {error}") from error
