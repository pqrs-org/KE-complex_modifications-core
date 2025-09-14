#!/usr/bin/python3

'''HTTP server for test'''

from http.server import HTTPServer, SimpleHTTPRequestHandler
from functools import partial
import subprocess
from urllib.parse import urlparse


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
            print('update-dist.sh')
            subprocess.run(['bash', 'scripts/update-dist.sh'])

    def do_GET(self):
        self.update_dist()
        super().do_GET()


print('http://localhost:8000')

handler = partial(RequestHandler, directory="../dist")
httpd = HTTPServer(('localhost', 8000), handler)
httpd.serve_forever()
