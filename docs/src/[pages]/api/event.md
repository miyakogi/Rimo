---
title: Event API Reference
---

# Message Format

When events are emitted, rimo sends a message by JSON format.

The JSON format includes the following fields.

| Field | Value | Type |
|-------|-------|------|
| type  | "event" | string |
| id | ID of the node which emitted the event | string |
| data | Data to be send by the event | object or undefined |

### Data format

Data send with events are object.
The format is varies on which event is emitted.

For example, `onclick` event send empty `{}` or `undefined`.
`onchange` and `oninput` event send `checked` and `value` property of the node.

## Examples

### Click Event

```html
<button id="my-btn" onclick="rimo.onclick(this);">click</button>
```

When this button element is clicked, rimo will send the below message::

```js
{
    "type": "event",
    "id": "my-btn",
    "data": undefined
}
```

### Input Event


```html
<input id="my-input" oninput="rimo.oninput(this);">
```

When any string (for example "abc") is input to this input element, rimo will send the below message::

```js
{
    "type": "event",
    "id": "my-input",
    "data": {
        "checked": false,
        "value": "abc"
    }
}
```

Then press "d", and whole input field becomes "abcd", rimo will send the below message:

```
{
    "type": "event",
    "id": "my-input",
    "data": {
        "checked": false,
        "value": "abcd"
    }
}
```

Note: For every input events, rimo sends whole values, not only newly input values.
