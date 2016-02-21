# --------------------------------------------------------------------------
# Site Configuration File
# --------------------------------------------------------------------------

# This is a sample site configuration file. You can use this file to
# customise how Ark builds your site. Variables you set here are also
# available to themes and plugins.

# You can safely delete this file if you don't need to change any of
# the default settings.

title = 'Rimo.js'
description = 'Remote interface to manipulate objects on browser'

# --------------------------------------------------------------------------
# Theme Directory
# --------------------------------------------------------------------------

# The name of the active theme directory in your site's 'lib' folder.

theme = "rimo"

# --------------------------------------------------------------------------
# Root URL
# --------------------------------------------------------------------------

# Your root url can be an explicit domain ("http://example.com/) for
# absolute urls, a single forward slash ("/") for site-relative urls, or an
# empty string (the default) for page-relative urls.

root = ""

# --------------------------------------------------------------------------
# File Extension
# --------------------------------------------------------------------------

# You can choose an arbitrary file extension for generated files (".html")
# or pass an empty string ("") to use no extension at all. Specify a single
# forward slash ("/") to generate directory-style urls.

extension = ".html"

# --------------------------------------------------------------------------
# Markdown Extension
# --------------------------------------------------------------------------

markdown = {
    'extensions': ['fenced_code', 'codehilite', 'extra']
}
