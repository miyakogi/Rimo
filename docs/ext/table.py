#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import ark

@ark.hooks.register('page_html')
def add_table_classes(html, page):
    if '<table>' in html:
        html = html.replace('<table>', '<table class="table">')
    return html
