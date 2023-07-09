#!/usr/bin/python3

from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import posixpath


class RequestHandler(SimpleHTTPRequestHandler, object):
    def translate_path(self, path):
        # abandon query parameters
        path = path.split('?', 1)[0]
        path = path.split('#', 1)[0]

        trailing_slash = path.rstrip().endswith('/')

        if path.startswith('/build/') or path.startswith('/json'):
            path = "{}/../../public/{}".format(
                os.path.dirname(__file__), path)
        else:
            path = "{}/../react/dist/{}".format(
                os.path.dirname(__file__), path)
        path = posixpath.normpath(path)

        if trailing_slash:
            path += '/'
        return path


httpd = HTTPServer(('localhost', 8000), RequestHandler)
httpd.serve_forever()
