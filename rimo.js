/* rimo v0.0.1 alpha, @lisence MIT, copyright 2016, miyakogi */

;(function(window, undefined){
  'use strict';
  // Define global object
  var rimo = { version: '0.0.1', settings: {}, log: { level: 0 }}
  var config_prefix = 'RIMO_'

  var log_levels = {
    FATAL: 50,
    CRITICAL: 50,
    ERROR: 40,
    WARNING: 30,
    WARN: 30,
    INFO: 20,
    DEBUG: 10,
    NOTSET: 0,
  }

  function get_log_level(level) {
    if (typeof level === 'number'){
      return level
    }

    if (typeof level === 'string') {
      var s = level.toUpperCase()
      if (s in log_levels) {
        return log_levels[s]
      }
    }

    // Get unknown log level
    console.warn(rimo.settings.LOG_PREFIX + 'unknown log level: ', level)
    return 0
  }

  function set_default(key, defval) {
    if (config_prefix + key in window) {
      rimo.settings[key] = window[config_prefix + key]
    } else {
      rimo.settings[key] = defval
    }
  }

  function get_node(id) {
    return document.getElementById(id)
  }

  function ws_onmessage(e) {
    var msg = JSON.parse(e.data)
    var elm = get_node(msg.id)
    if (!elm) {
      // node may not have been mounted yet. retry 100ms later.
      setTimeout(function() {
        var elm = get_node(msg.id)
        if (!elm) {
          // node not found. send warning.
          rimo.log.console('warn', 'gat message to unknown node.\n Message: ' + msg)
          rimo.log.warn('unknown node: id=' + msg.id + ', tag=' + msg.tag + ', method=' + msg.method)
        } else {
          rimo.exec(elm, msg.method, msg.params)
        }
      }, 100)
    } else {
      rimo.exec(elm, msg.method, msg.params)
    }
  }

  function ws_onclose() {
    function reload(){
      location.reload()
    }

    if (rimo.settings.AUTORELOAD) {
      rimo.log.console('info', 'RootWS closed, reloading page...')
      setTimeout(reload, rimo.settings.RELOAD_WAIT)
    } else {
      rimo.log.console('RootWS CLOSED');
    }
  }

  function initialize() {
    // Define default variables
    var __ws_url = 'ws://' + location.host + '/rimo_ws'
    set_default('DEBUG', false)
    set_default('AUTORELOAD', false)
    set_default('RELOAD_WAIT', 500)
    set_default('LOG_LEVEL', 'WARN')
    set_default('LOG_PREFIX', 'rimo: ')
    set_default('LOG_CONSOLE', false)
    set_default('WS_URL', __ws_url)
    rimo.log.set_level(rimo.settings.LOG_LEVEL)

    // Make root WebScoket connection
    rimo.ws = new WebSocket(rimo.settings.WS_URL)
    rimo.ws.onmessage = ws_onmessage
    rimo.ws.onclose = ws_onclose
  }

  rimo.exec = function(node, method, params) {
    // Execute fucntion with msg
    rimo[method](node, params)
  }

  rimo.eval = function(node, params) {
    // Execute fucntion with msg
    eval(params.script)
  }

  // send response
  rimo.send_response = function(node, reqid, data) {
    rimo.log.debug('send_response')
    var msg = JSON.stringify({
      type: 'response',
      id: node.id,
      reqid: reqid,
      data: data
    })
    rimo.log.debug(msg)
    rimo.ws.send(msg)
  }

  /* Event contrall */
  // emit events to python
  // find better name...
  rimo.send_event = function(node, event, data) {
    var msg = JSON.stringify({
      type: 'event',
      id: node.id,
      event: event,
      data: data
    })
    rimo.log.debug(msg)
    rimo.ws.send(msg)
  }

  /* Event handlers */
  rimo.onclick = function(node) {
    rimo.send_event(node, 'click')
  }

  rimo.onchange = function(node) {
    rimo.send_event(
      node,
      'change',
      {
        checked: node.checked,
        value: node.value,
      }
    )
  }

  rimo.oninput = function(node) {
    rimo.send_event(
      node,
      'input',
      {
        checked: node.checked,
        value: node.value,
      }
    )
  }

  rimo.addEventListener = function(node, params) {
    node.addEventListener(params.event, function() {
      rimo['on' + params.event](node)
    })
  }

  /* DOM contrall */
  rimo.insert = function(node, params) {
    var index = Number(params.index)
    if (!node.hasChildNodes() || index >= node.childNodes.length) {
      node.insertAdjacentHTML('beforeend', params.html)
    } else {
      var ref_node = node.childNodes[index]
      if (ref_node.nodeName === '#text') {
        var df = document.createDocumentFragment()
        df.innerHTML = params.html
        ref_node.parentNode.insertBefore(df, ref_node)
      } else {
        ref_node.insertAdjacentHTML('beforebegin', params.html)
      }
    }
  }

  rimo.insertAdjacentHTML = function(node, params) {
    node.insertAdjacentHTML(params.position, params.text)
  }

  rimo.textContent = function(node, params) {
    node.textContent = params.text
  }

  rimo.innerHTML = function(node, params) {
    node.innerHTML = params.html
  }

  rimo.outerHTML = function(node, params) {
    node.outerHTML = params.html
  }

  rimo.removeChild = function(node, params) {
    var child = document.getElementById(params.id)
    if (child){
      node.removeChild(child)
    }
  }

  rimo.replaceChild = function(node, params) {
    var old_child = document.getElementById(params.id)
    if (old_child) {
      old_child.insertAdjacentHTML('beforebegin', params.html)
      old_child.parentNode.removeChild(old_child)
    }
  }

  rimo.removeAttribute = function(node, params) {
    node.removeAttribute(params.attr)
  }

  rimo.setAttribute = function(node, params) {
    var value = params.value
    if (typeof value === 'string'){
      if (value === 'true') {
        value = true
      } else if (value === 'false') {
        value = false
      }
    }
    if (params.attr in node) {
      node[params.attr] = value
    } else {
      node.setAttribute(params.attr, value)
    }
  }

  rimo.addClass = function(node, params) {
    if (node.classList) {
      node.classList.add(params.class)
    } else {
      node.className += ' ' + params.class
    }
  }

  rimo.removeClass = function(node, params) {
    if (node.classList) {
      node.classList.remove(params.class)
    } else {
      node.className = node.className.replace(params.class, '')
    }
  }

  rimo.empty = function(node) {
    node.innerHTML = ''
  }

  rimo.getBoundingClientRect = function(node, params) {
    var reqid = params.reqid
    var rect = node.getBoundingClientRect()
    rimo.send_response(node, reqid, {
      bottom: rect.bottom,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: rect.width
    })
  }

  /* Window Control */
  rimo.scroll = function(node, params){
    window.scrollTo(params.x, params.y)
  }

  rimo.scrollTo = function(node, params){
    window.scrollTo(params.x, params.y)
  }

  rimo.scrollBy = function(node, params){
    window.scrollBy(params.x, params.y)
  }

  rimo.scrollX = function(node, params){
    rimo.send_response(node, params.reqid, {x: window.scrollX})
  }

  rimo.scrollY = function(node, params){
    rimo.send_response(node, params.reqid, {y: window.scrollY})
  }

  rimo.log.log = function(level, message, retry) {
    var msg = JSON.stringify({
      type: 'log',
      level: level,
      message: message
    })

    if (rimo.settings.LOG_CONSOLE) {
      rimo.log.console(level, message)
    }

    if (!rimo.ws.OPEN) { 
      retry = retry ? retry + 1 : 1
      if (retry < 5) {
        setTimeout(function() { rimo.log.log(level, message, retry) }, 200)
      } else {
        setTimeout(function() { rimo.ws.send(msg) }, 200)
      }
    } else {
      rimo.ws.send(msg)
    }
  }

  rimo.log.console = function(level, message) {
    if (rimo.log.level <= get_log_level(level)) {
      console[level](rimo.settings.LOG_PREFIX + message)
    }
  }

  rimo.log.set_level = function(level) {
    rimo.log.level = get_log_level(level)
  }

  rimo.log.error = function(message) {
    rimo.log.log('error', message)
  }

  rimo.log.warn = function(message) {
    rimo.log.log('warn', message)
  }

  rimo.log.info = function(message) {
    rimo.log.log('info', message)
  }

  rimo.log.debug = function(message) {
    rimo.log.log('debug', message)
  }

  // Register object to global
  window['rimo'] = rimo
  window.addEventListener('load', initialize)

})(typeof window != 'undefined' ? window : void 0);
