#!/usr/bin/python3

"""Build and atomically replace the distribution directory."""

import argparse
import pathlib
import sys

from lib.build_dist import build_dist_atomically

CORE_DIRECTORY = pathlib.Path(__file__).resolve().parent.parent
REPOSITORY_DIRECTORY = CORE_DIRECTORY.parent


def main():
    """Build the distribution from repository sources."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output-directory",
        default=REPOSITORY_DIRECTORY / "dist",
        type=pathlib.Path,
    )
    args = parser.parse_args()

    try:
        build_dist_atomically(
            args.output_directory,
            REPOSITORY_DIRECTORY / "public",
            CORE_DIRECTORY / "react/dist",
            CORE_DIRECTORY / "bin/karabiner_cli",
            CORE_DIRECTORY / "files/generator.sb",
        )
    except (OSError, ValueError) as error:
        print(error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
