#!/usr/bin/python3

"""HTTP server for test"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
from functools import partial
import pathlib
import sys
from urllib.parse import urlparse

from lib.build_dist import build_dist_atomically

CORE_DIRECTORY = pathlib.Path(__file__).resolve().parent.parent
REPOSITORY_DIRECTORY = CORE_DIRECTORY.parent
DIST_DIRECTORY = REPOSITORY_DIRECTORY / "dist"
PUBLIC_DIRECTORY = REPOSITORY_DIRECTORY / "public"
REACT_DIST_DIRECTORY = CORE_DIRECTORY / "react/dist"
# Match the Cloudflare Pages dist build when previewing on Linux, where the
# macOS-only karabiner_cli and sandbox-exec are unavailable.
KARABINER_CLI = None
SANDBOX_PROFILE = None
if sys.platform == "darwin":
    KARABINER_CLI = CORE_DIRECTORY / "bin/karabiner_cli"
    SANDBOX_PROFILE = CORE_DIRECTORY / "files/generator.sb"


class RequestHandler(SimpleHTTPRequestHandler):
    """
    Provides the following feature:
    - Disable cache.
    """

    def end_headers(self):
        self.send_header("Cache-Control", "max-age=0")
        self.send_header("Expires", "0")
        super().end_headers()

    def update_dist(self):
        path = urlparse(self.path).path
        if path == "/" or path == "/index.html":
            print("build_dist.py")
            build_dist_atomically(
                DIST_DIRECTORY,
                PUBLIC_DIRECTORY,
                REACT_DIST_DIRECTORY,
                KARABINER_CLI,
                SANDBOX_PROFILE,
            )

    def do_GET(self):
        try:
            self.update_dist()
        except (OSError, ValueError):
            self.send_error(500, "Failed to update dist")
            return
        super().do_GET()


def main():
    """Run preview server."""
    print("http://localhost:8000")
    handler = partial(RequestHandler, directory=str(DIST_DIRECTORY))
    httpd = HTTPServer(("localhost", 8000), handler)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
