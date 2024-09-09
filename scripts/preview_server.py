#!/usr/bin/python3

'''HTTP server for test'''

from http.server import HTTPServer, SimpleHTTPRequestHandler


class RequestHandler(SimpleHTTPRequestHandler):
    '''
    Provides the following feature:
    - Disable cache.
    '''

    def end_headers(self):
        self.send_header('Cache-Control', 'max-age=0')
        self.send_header('Expires', '0')
        super().end_headers()


print('http://localhost:8000')

httpd = HTTPServer(('localhost', 8000), RequestHandler)
httpd.serve_forever()
