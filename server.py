#!/usr/bin/env python3
"""
Very simple HTTP server in python for logging requests
Usage::
    ./server.py [<port>]
"""
from http.server import SimpleHTTPRequestHandler, BaseHTTPRequestHandler, HTTPServer
from os import curdir, sep
from stat import * 
import logging, sys, os
import json
from ClassCentralDataRetriever import *
from datetime import datetime, timedelta

class S(BaseHTTPRequestHandler):
    def _set_response(self, length, content_type):
        self.send_response(200)
        self.send_header('Content-type', content_type)
        self.send_header("Content-length", length)
        self.end_headers()

    def do_GET(self):
        logging.info("GET request,\nPath: %s\nHeaders:\n%s\n", str(self.path), str(self.headers))
        end = self.path.split('.')[-1]
        
        if self.path == "/":
            end = 'html'
            self.path = "/index.html"

        if end in ["html", "css", "js", "ico"]:
            path = curdir + sep + self.path
            f = open(path, "rb")
            self._set_response(os.stat(path).st_size, 'text/' + end)
            self.wfile.write(f.read())
            f.close()

        

    def do_POST(self):
        content_length = int(self.headers['Content-Length']) # <--- Gets the size of data
        post_data = self.rfile.read(content_length) # <--- Gets the data itself
        
        logging.info("POST request,\nPath: %s\nHeaders:\n%s\n\nBody:\n%s\n",
                str(self.path), str(self.headers), post_data.decode('utf-8'))

        url = json.loads(post_data.decode("utf-8"))["url"]
        print(url)

        if 'class-central' in url:
            txt = 'classcentralstructure.txt'
        elif 'mooc-list' in url:
            txt = 'moocliststructure.txt'
        else:
            raise #send error

        ccdr = ClassCentralDataRetriever(url, txt)
        ccdr.read()

        if 'class-central' in url:
            try:
                format_cc(ccdr.data_json)
            except ValueError as ve:
                print(ve)
                ccdr.data_json.start_dates = []
            # else:
            finally:
                pass
        elif 'mooc-list' in url:
            try:
                format_ml(ccdr.data_json)
            except ValueError as ve:
                print(ve)
                ccdr.data_json.start_dates = []
            # else:
            finally:
                pass

        data = json.dumps(ccdr.data_json.__dict__)
        self._set_response(len(data), 'text/json')
        self.wfile.write(data.encode("utf-8"))

def format_cc(cdata):
    format_general(cdata, '%d %b %Y')

def format_ml(cdata):
    format_general(cdata, '%b %d %Y')

def format_general(cdata, date_format):    
    if cdata.duration is not None:
        dur_str = cdata.duration.upper()
        cdata.duration = None
        duration = [int(s) for s in dur_str.split() if s.isdigit()]

        if duration:
            cdata.duration = duration[0]
            cdata.duration_unit = '?'

        if 'WEEK' in dur_str:
            cdata.duration_unit = 'W'
        elif 'SESSION' in dur_str:
            cdata.duration_unit = 'S'
        elif 'DAY' in dur_str:
            cdata.duration_unit = 'D'
        elif 'HOUR' in dur_str:
            cdata.duration_unit = 'H'

    new_list = []

    if not cdata.start_dates:
        cdata.available = False

    for d in cdata.start_dates:
        print(d)
        if 'SELF PACED' in d.upper():
            cdata.selfpaced = True
            break
        elif 'NOT AVAILABLE' in d.upper():
            cdata.available = False
            break

        new_date = datetime.strptime(d.replace('st', '').replace('nd', '').replace('rd', '').replace('th', '').replace(',',''), date_format)
        new_list.append(new_date.strftime('%Y-%m-%d'))

        if cdata.duration:
            if cdata.duration_unit == 'W':
                cdata.end_dates.append((new_date + timedelta(weeks=cdata.duration)).strftime('%Y-%m-%d'))
            elif cdata.duration_unit == 'S':
                cdata.end_dates.append((new_date + timedelta(weeks=cdata.duration)).strftime('%Y-%m-%d'))
            elif cdata.duration_unit == 'D':
                cdata.end_dates.append((new_date + timedelta(days=cdata.duration)).strftime('%Y-%m-%d'))
            elif cdata.duration_unit == 'H':
                cdata.end_dates.append((new_date + timedelta(hours=cdata.duration)).strftime('%Y-%m-%d'))

    if cdata.selfpaced or not cdata.available:
        cdata.start_dates = []
    else:
        cdata.start_dates = new_list

def run(server_class=HTTPServer, handler_class=S, port=8000):
    os.remove("log.txt")
    logging.basicConfig(filename="log.txt", level=logging.INFO)
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    logging.info('Starting httpd...\n')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    logging.info('Stopping httpd...\n')

if __name__ == '__main__':
    from sys import argv

    if len(argv) == 2:
        run(port=int(argv[1]))
    else:
        run(handler_class=S)