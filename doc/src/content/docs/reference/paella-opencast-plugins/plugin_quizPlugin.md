---
title: "Quiz Plugin"
description: This plugin displays quizzes in the player, based on a JSON catalog in the event tracks.
---

## org.opencast.paella.quizPlugin

This plugin displays quizzes in the player, based on a JSON catalog in the event tracks.
A quiz consist of a single question which can have multiple correct answers.

The expected flavor type of the catalog is "quizzes" (i.e. "quizzes/source").

The file is of the form:
```json
{
  "start": 2000,
  "question": "Which is a fruit?",
  "answers": [
    {
      "text": "Banana",
      "correct": true
    },
    {
      "text": "Cucumber",
      "correct": false
    },
    {
      "text": "Tomato",
      "correct": true
    }
  ]
}

```

**Exported as** `OpencastQuizPlugin`.

## Configuration

You need to enable the `org.opencast.paella.quizPlugin` plugin.

```json
{
    "org.opencast.paella.quizPlugin": {
        "enabled": true
    }
}
```

## Configuration parameters

- **`enabled`**: Enables or disables the plugin.
  - Valid values: `true` / `false`
