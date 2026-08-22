"""Validate public/groups.json."""

import json
import pathlib

from .complex_modifications import collect_public_sources


def lint_groups(groups_json_file_path):
    """Raise ValueError if public/groups.json is inconsistent."""
    groups_json_file_path = pathlib.Path(groups_json_file_path)
    groups_json = json.loads(groups_json_file_path.read_text(encoding="utf-8"))

    files_in_groups = set()
    for categories in groups_json.values():
        for category in categories:
            for file in category["files"]:
                path = file["path"]
                if path in files_in_groups:
                    raise ValueError(
                        "There are some duplicated entries in "
                        "public/groups.json.\n"
                        "Please remove them from public/groups.json.\n\n"
                        f"- {path}"
                    )
                files_in_groups.add(path)

    distributed_files = {
        output_path
        for _, output_path in collect_public_sources(
            groups_json_file_path.parent / "json",
            groups_json_file_path.parent / "js",
        )
    }
    orphan_files = files_in_groups - distributed_files
    if orphan_files:
        orphan_list = "\n".join(f"- {path}" for path in sorted(orphan_files))
        raise ValueError(
            "There are some files in public/groups.json are not found.\n"
            "Please add them into public/json or public/js.\n\n"
            f"{orphan_list}"
        )
