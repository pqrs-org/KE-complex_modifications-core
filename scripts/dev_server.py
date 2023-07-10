#!/usr/bin/python3

'''HTTP server for test'''

from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import posixpath
import make_distjson


class RequestHandler(SimpleHTTPRequestHandler):
    '''
    Provides the following feature:
    - Disable cache.
    - Return ../../public files if the request path is /build or /json,
      otherwise return ../../react/dist files.
    - Update /build/dist.json automatically.
    '''

    def end_headers(self):
        self.send_header('Cache-Control', 'max-age=0')
        self.send_header('Expires', '0')
        super().end_headers()

    def translate_path(self, path):
        # abandon query parameters
        path = path.split('?', 1)[0]
        path = path.split('#', 1)[0]

        trailing_slash = path.rstrip().endswith('/')

        # rebuild dist.json
        if path == '/build/dist.json':
            make_distjson.make_distjson()

        if path.startswith('/build/') or path.startswith('/json'):
            path = f'{os.path.dirname(__file__)}/../../public/{path}'
        else:
            path = f'{os.path.dirname(__file__)}/../react/dist/{path}'
        path = posixpath.normpath(path)

        if trailing_slash:
            path += '/'
        return path


httpd = HTTPServer(('localhost', 8000), RequestHandler)
httpd.serve_forever()
