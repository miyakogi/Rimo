#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import subprocess
from livereload import Server, shell

subprocess.run(['ark', 'build'])

server = Server()
cmd = shell('ark build')
server.watch('./*.py', cmd)
server.watch('./ext/**/*.py', cmd)
server.watch('./src/**/*.md', cmd)
server.watch('./src/**/**/*.md', cmd)
server.watch('./inc/*.md', cmd)
server.watch('./lib/rimo/resources/js/*.js', cmd)
server.watch('./lib/rimo/resources/css/*.css', cmd)
server.watch('./lib/rimo/templates/*.jinja', cmd)

scss = shell('scss scss/bootstrap.scss ./lib/rimo/resources/css/bootstrap.css')
server.watch('./scss/*.scss', scss)

server.serve(port=8889, root='./out')
