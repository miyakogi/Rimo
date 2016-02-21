---
title: Options
---

Rimo.js provides some options to help developing your app.
All available option values are prefixed by `RIMO_`.
Option values must be defined as global variables before onload events.

Example to define in html.

```html
<body>
<script src="/path/to/rimo.js"></script>
<script type="text/javascript">
  var RIMO_<OPTION_VALUE> = ...
</script>
</body>
```

# Application Configuration

## Debug Flag (`RIMO_DEBUG`)

(This option is not available now.)

## WebSocket URL (`RIMO_WS_URL`)

`RIMO_WS_URL` defines URL of WebSocket connection to control DOM or send events.
When loaded `rimo.js`, rimo tries to connect this websocket and make connection.
After that, all control and events are passed by this connection.

#### Default Value

```js
var RIMO_WS_URL = 'ws://' + location.host + '/rimo_ws'
```

# Logging Options

Rimo provides logging feature for development phase.
Both logging on browser console and sending log to server are supported.

## Log on Console (`RIMO_LOG_CONSOLE`)

If this value is set to `true`, logs are shown on browser console.
This option should be enabled only on development environment.

#### Default Value

```js
var RIMO_LOG_CONSOLE = false
```

## Log Level (`RIMO_LOG_LEVEL`)

Define lowest log level to report.
Available levels are `FATAL`, `ERROR`, `WARN`, `INFO`, and `DEBUG` (lefter is higher).

For instance, when log level is set to `WARN`, rimo reports `FATAL`, `ERROR`, and `WARN`, but not reports logs whose level is set to `INFO` or `DEBUG`.

#### Default Value

```js
var RIMO_LOG_LEVEL = 'WARN'
```

## Log Prefix (`RIMO_LOG_PREFIX`)

Defines prefix used in log messages, both on console and sent to server.

#### Default Value

```js
var RIMO_LOG_PREFIX = 'rimo: '
```

# Auto Reload

Rimo.js supports auto-reload for development.
If this options is enabled, rimo tries to reload page when websocket connection is closed.
This feature is useful when developing server side application with auto restart, watching file changes.

## Enable Auto Reload (`RIMO_AUTORELOAD`)

Enables auto-reload if `true`.

#### Default Value

```js
var RIMO_AUTORELOAD = false
```

## Reload Wait (`RIMO_RELOAD_WAIT`)

How long wait before reload page. Unit is milliseconds.

#### Default Value

```js
var RIMO_RELOAD_WAIT = 500   // Reload 500 msec after connection closed
```
