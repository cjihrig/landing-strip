'use strict';
var Hoek = require('hoek');
var LandingStrip = require('../lib');

LandingStrip({
  username: 'hapijs-bot',
  emoji: ':hapi:',
  hook: 'https://hooks.slack.com/services/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',
  startTime: new Date(Date.now() - (1000 * 60 * 60 * 24 * 2)), // two days in the past
  onError: function (err) {
    console.error(err);
  },
  filter: function (data) {
    var repo = Hoek.reach(data, 'doc.repository.url', {default: ''});

    return /\/\/github\.com\/hapijs\//.test(repo);
  }
});
