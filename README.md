# landing-strip

[![Current Version](https://img.shields.io/npm/v/landing-strip.svg)](https://www.npmjs.org/package/landing-strip)
[![Build Status via Travis CI](https://travis-ci.org/continuationlabs/landing-strip.svg?branch=master)](https://travis-ci.org/continuationlabs/landing-strip)
![Dependencies](http://img.shields.io/david/continuationlabs/landing-strip.svg)
![devDependencies](http://img.shields.io/david/dev/continuationlabs/landing-strip.svg)

Slack bot that notifies you when new versions of a module land in npm. Creating a landing strip is as simple as running a file from the `examples` directory. For example, to receive notifications when any of the [hapi](https://github.com/hapijs) repos are published to npm, simply run `node examples/hapi`.

## `LandingStrip(options)`

The contents of `examples/hapi` are shown below. The `LandingStrip()` function uses the [`npm-publish-stream`](https://github.com/rvagg/npm-publish-stream) module to detect `npm publish` events. The `filter` property, if present, is used to determine which events are published to Slack. In this case, hapi modules are detected based on their repository URL.

```javascript
var Hoek = require('hoek');
var LandingStrip = require('../');

LandingStrip({
  username: 'hapijs-bot',
  emoji: ':hapi:',
  hook: 'https://hooks.slack.com/services/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',
  startTime: new Date(Date.now() - (1000 * 60 * 60 * 24 * 2)), // two days in the past
  onError: function(err) {
    console.error(err);
  },
  filter: function(data) {
    var repo = Hoek.reach(data, 'doc.repository.url', {default: ''});

    return /\/\/github\.com\/hapijs\//.test(repo);
  }
});
```

### `username` Option (string)

This is a string that specifies the username that is displayed in Slack when a message is posted. In the hapi example, posts are shown to be from `hapijs-bot`.

### `emoji` Option (string)

This is a string specifying the emoji that is displayed as the `username` avatar. The hapi example uses a custom `:hapi:` emoji, which must be present in your Slack.

### `hook` Option (string)

This is a string specifying the URL of the Slack incoming web hook.

### `filter` Option (array or function) (optional)

`filter` determines which `npm publish` events are turned into Slack notifications. If `filter` is not present, all `npm publish` events are shown in Slack. If `filter` is an array, only modules whose names are included in the array are displayed in Slack (see `examples/hapi-array` for an example). If `filter` is a function, then each `data` event from the npm publish stream is passed to this function. If the function returns `true`, then the event is translated into a Slack notification.

### `startTime` Option (`Date`) (optional)

If present, `startTime` should be a `Date` object that specifies the earliest `npm publish` time that should show up in the event stream. If `startTime` is not specified, it defaults to the current time. In the hapi example, Landing Strip creates notifications for `npm publish` events as far as two days in the past.

### `onError` Option (function) (optional)

If present `onError` should be a function that is used to handle errors. The error is passed as the only argument to this function. If `onError` is not specified, a noop function is used. In the hapi example, all errors simply logged using `console.error()`.
