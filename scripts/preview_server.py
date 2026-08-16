#!/usr/bin/python3

'''HTTP server for test'''

from http.server import HTTPServer, SimpleHTTPRequestHandler
from functools import partial
import pathlib
import subprocess
from urllib.parse import urlparse

CORE_DIRECTORY = pathlib.Path(__file__).resolve().parent.parent
DIST_DIRECTORY = CORE_DIRECTORY.parent / 'dist'
UPDATE_DIST_SCRIPT = CORE_DIRECTORY / 'scripts/update-dist.sh'


def run_update_dist():
    '''Update dist and raise an exception on failure.'''
    print('update-dist.sh')
    subprocess.run(
        ['bash', str(UPDATE_DIST_SCRIPT)],
        cwd=CORE_DIRECTORY,
        check=True)


class RequestHandler(SimpleHTTPRequestHandler):
    '''
    Provides the following feature:
    - Disable cache.
    '''

    def end_headers(self):
        self.send_header('Cache-Control', 'max-age=0')
        self.send_header('Expires', '0')
        super().end_headers()

    def update_dist(self):
        path = urlparse(self.path).path
        if path == "/" or path == "/index.html":
            run_update_dist()

    def do_GET(self):
        try:
            self.update_dist()
        except subprocess.CalledProcessError:
            self.send_error(500, 'Failed to update dist')
            return
        super().do_GET()


def main():
    '''Run preview server.'''
    print('http://localhost:8000')
    handler = partial(RequestHandler, directory=str(DIST_DIRECTORY))
    httpd = HTTPServer(('localhost', 8000), handler)
    httpd.serve_forever()


if __name__ == '__main__':
    main()
