---
title: "Textbox Plugin"
description: This plugin displays textboxes in the player, based on a JSON catalog in the event tracks.
---

##  org.opencast.paella.textboxPlugin

This plugin displays textboxes in the player, based on a JSON catalog in the event tracks.

The expected flavor type of the catalog is "textboxes" (i.e. "textboxes/source").

Start time is in milliseconds. The display duration is fixed at 10 seconds.
Text should be kept short, or will be cut off. 20 characters max are recommended.
Optionally, a link can be specified. Clicking on a textbox with a link will
redirect to the specified resource.

The catalog file is of the form:
```json
[
  {
    "start": 2000,
    "text": "My text here"
  },
  {
    "start": 7000,
    "text": "More of my text here",
    "link": "https://opencast.org",
  }
]
```

**Exported as** `OpencastTextboxPlugin`.

## Configuration

You need to enable the `org.opencast.paella.textboxPlugin` plugin.

```json
{
    "org.opencast.paella.textboxPlugin": {
        "enabled": true
    }
}
```

## Configuration parameters

- **`enabled`**: Enables or disables the plugin.
  - Valid values: `true` / `false`
