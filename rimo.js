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

  var element_with_value = ['INPUT', 'TEXTAREA', 'SELECT']
  var event_data_map = {
    'input': ['value'],
    'change': ['checked', 'value']
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
    // return document.getElementById(id)
    return document.querySelector('[rimo_id="#id"]'.replace(/#id/, id))
  }

  function node_mounted(node) {
    rimo.send_event({type: 'mount', target: node, currentTarget: node})
    if (element_with_value.indexOf(node.tagName) >= 0) {
      node.addEventListener('input', rimo.send_event)
      node.addEventListener('change', rimo.send_event)
    }
  }

  function node_unmounted(node) {
    rimo.send_event({type: 'unmount', target: node, currentTarget: node})
  }

  function mutation_handler(m) {
    var i, node
    for (i=0; i < m.addedNodes.length; i++) {
      node = m.addedNodes[i]
      if (node && node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('rimo_id')) {
        node_mounted(node)
      }
    }
    for (i=0; i < m.removedNodes.length; i++) {
      node = m.addedNodes[i]
      if (node && node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('rimo_id')) {
        node_unmounted(node)
      }
    }
  }

  function start_observer() {
    // initialize observer
    var observer = new MutationObserver(
      function(mutations) {
        setTimeout(function() {
          mutations.forEach(mutation_handler)
        }, 0);
      }
    )
    var obs_conf = {
      'subtree': true,
      'childList': true,
    }
    observer.observe(document, obs_conf)
  }

  function ws_onopen() {
    // Send pending events
    rimo.pending_msgs.forEach(function(msg) {
      rimo.send(msg)
    })
    rimo.pending_msgs = []
  }

  function ws_onmessage(e) {
    var data = e.data
    setTimeout(function() {
      var msg = JSON.parse(data)
      var target = msg.target
      if (target === 'node') {
        var node = get_node(msg.id)
        if (!node) {
          // node may not have been mounted yet. retry 100ms later.
          setTimeout(function() {
            var node = get_node(msg.id)
            if (!node) {
              // node not found. send warning.
              rimo.log.console('warn', 'gat message to unknown node.\n Message: ' + msg)
              rimo.log.warn('unknown node: id=' + msg.id + ', tag=' + msg.tag + ', method=' + msg.method)
            } else {
              rimo.exec(node, msg.method, msg.params)
            }
          }, 100)
        } else {
          rimo.exec(node, msg.method, msg.params)
        }
      }
    }, 0)
  }

  function ws_onclose() {
    function reload() {
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
    rimo.ws.addEventListener('open', ws_onopen)
    rimo.ws.addEventListener('message', ws_onmessage)
    rimo.ws.addEventListener('close', ws_onclose)
  }

  rimo.exec = function(node, method, params) {
    // Execute fucntion with msg
    setTimeout(function() {
      var args = [node].concat(params)
      rimo[method].apply(rimo, args)
    }, 0)
  }

  rimo.eval = function(node, script) {
    // Execute fucntion with msg
    setTimeout(function() {
      try {
        eval(script)
      }
      catch (e) {
        rimo.log.error(e.toString())
        rimo.log.console('error', e.toString())
      }
    }.bind(node), 0)
  }

  rimo.pending_msgs = []

  rimo.send = function(msg, retry) {
    if ('ws' in rimo) {
      if (rimo.ws.readyState ===  1) { 
        rimo.ws.send(msg)
      } else {
        retry = retry ? retry + 1 : 1
        if (retry < 5) {
          setTimeout(function() { rimo.send(msg, retry) }, 200)
        } else {
          setTimeout(function() { rimo.send(msg) }, 200)
        }
      }
    } else {
      rimo.pending_msgs.push(msg)
    }
  }

  // send response
  rimo.send_response = function(node, reqid, data) {
    setTimeout(function() {
      var msg = JSON.stringify({
        type: 'response',
        id: node.getAttribute('rimo_id'),
        reqid: reqid,
        data: data
      })
      rimo.log.debug(msg)
      rimo.send(msg)
    }, 0)
  }

  /* Event contrall */
  // emit events to python
  // find better name...
  rimo.send_event = function(e) {
    // Catch currentTarget here. In callback, it becomes different node or null,
    // since event bubbles up.
    var currentTarget = e.currentTarget
    setTimeout(function() {
      var event = {
        'type': e.type,
        'currentTarget': {'id': currentTarget.getAttribute('rimo_id')},
        'target': {'id': e.target.getAttribute('rimo_id')}
      }

      if (e.type in event_data_map) {
        event_data_map[e.type].forEach(function(prop) {
          event.target[prop] = e.target[prop]
          event.currentTarget[prop] = currentTarget[prop]
        })
      }
      if (currentTarget.localName === 'select') {
        var selected = []
        var len = currentTarget.selectedOptions.length
        for (var i=0; i < len; i++) {
          var opt = currentTarget.selectedOptions[i]
          selected.push(opt.getAttribute('rimo_id'))
        }
        event.currentTarget.selectedOptions = selected
      }

      var msg = JSON.stringify({
        type: 'event',
        event: event,
        id: currentTarget.getAttribute('rimo_id')
      })
      rimo.log.debug(msg)
      rimo.send(msg)
    }, 0)
  }

  rimo.addEventListener = function(node, event) {
    node.addEventListener(event, rimo.send_event)
  }

  rimo.removeEventListener = function(node, event) {
    node.removeEventListener(event, rimo.send_event)
  }

  /* DOM contrall */
  rimo.insert = function(node, ind, html) {
    var index = Number(ind)
    if (!node.hasChildNodes() || index >= node.childNodes.length) {
      node.insertAdjacentHTML('beforeend', html)
    } else {
      var ref_node = node.childNodes[index]
      if (ref_node.nodeType !== 1) {
        // There may be better way...
        var _ = document.createElement('template')
        _.innerHTML = html
        // no need to clone contents, since this template is used once
        ref_node.parentNode.insertBefore(_.content, ref_node)
      } else {
        ref_node.insertAdjacentHTML('beforebegin', html)
      }
    }
  }

  rimo.insertAdjacentHTML = function(node, position, html) {
    node.insertAdjacentHTML(position, html)
  }

  rimo.textContent = function(node, text) {
    node.textContent = text
  }

  rimo.innerHTML = function(node, html) {
    node.innerHTML = html
  }

  rimo.outerHTML = function(node, html) {
    node.outerHTML = html
  }

  rimo.removeChildById = function(node, id) {
    var child = get_node(id)
    if (child) { node.removeChild(child) }
  }

  rimo.removeChildByIndex = function(node, index) {
    var child = node.childNodes.item(index)
    if (child) { node.removeChild(child) }
  }

  rimo.replaceChildById = function(node, html, id) {
    var old_child = get_node(id)
    if (old_child) {
      old_child.insertAdjacentHTML('beforebegin', html)
      old_child.parentNode.removeChild(old_child)
    }
  }

  rimo.replaceChildByIndex = function(node, html, index) {
    var old_child = node.childNodes.item(index)
    if (old_child) {
      rimo.insert(node, index, html)
      old_child.parentNode.removeChild(old_child)
    }
  }

  rimo.removeAttribute = function(node, attr) {
    node.removeAttribute(attr)
  }

  rimo.setAttribute = function(node, attr, value) {
    if (attr in node) {
      // some boolean values, like hidden, fail on setAttribute
      node[attr] = value
    } else {
      node.setAttribute(attr, value)
    }
  }

  rimo.addClass = function(node, classes) {
    // I won't support IE and Safari...
    // node.classList.add(...params.classes)
    node.classList.add.apply(node.classList, classes)
  }

  rimo.removeClass = function(node, classes) {
    // I won't support IE and Safari...
    // node.classList.remove(...params.classes)
    node.classList.remove.apply(node.classList, classes)
  }

  rimo.empty = function(node) {
    node.innerHTML = ''
  }

  rimo.getBoundingClientRect = function(node, reqid) {
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

  /* Event Control */
  rimo.click = function(node) {
    node.click()
  }

  /* Window Control */
  rimo.scroll = function(node, x, y){
    window.scrollTo(x, y)
  }

  rimo.scrollTo = function(node, x, y){
    window.scrollTo(x, y)
  }

  rimo.scrollBy = function(node, x, y){
    window.scrollBy(x, y)
  }

  rimo.scrollX = function(node, reqid){
    rimo.send_response(node, reqid, {x: window.scrollX})
  }

  rimo.scrollY = function(node, reqid){
    rimo.send_response(node, reqid, {y: window.scrollY})
  }

  rimo.log.log = function(level, message) {
    setTimeout(function() {
      var msg = JSON.stringify({
        type: 'log',
        level: level,
        message: message
      })

      if (rimo.settings.LOG_CONSOLE) {
        rimo.log.console(level, message)
      }

      rimo.send(msg)
    }, 0)
  }

  rimo.log.console = function(level, message) {
    if (rimo.log.level <= get_log_level(level) && 'console' in window) {
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
  window.addEventListener('load', initialize)
  start_observer()
})(typeof window != 'undefined' ? window : void 0);
