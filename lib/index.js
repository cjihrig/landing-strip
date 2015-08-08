var Hoek = require('hoek');
var NpmPublishStream = require('npm-publish-stream');
var Wreck = require('wreck');
var packageTemplate = 'https://www.npmjs.org/package/{module}';
var userTemplate = 'https://www.npmjs.com/~{user}';

function noop () {}

module.exports = function LandingStrip (options) {
  Hoek.assert(options !== null && typeof options === 'object',
              'options must be an object');

  Hoek.assert(typeof options.hook === 'string', 'hook must be a string');

  Hoek.assert(options.startTime === undefined ||
              options.startTime instanceof Date,
              'startTime must be a Date');

  Hoek.assert(options.onError === undefined ||
              typeof options.onError === 'function',
              'onError must be a function');

  Hoek.assert(options.filter === undefined ||
              Array.isArray(options.filter) ||
              typeof options.filter === 'function',
              'filter must be an array or function');

  var startTime = options.startTime || new Date();
  var onError = options.onError || noop;
  var filter = options.filter;
  var hook = options.hook;
  var username = options.username;
  var emoji = options.emoji;
  var stream = new NpmPublishStream({startTime: startTime});

  stream.on('error', onError);

  stream.on('data', function (data) {
    var module = data.id;

    if ((Array.isArray(filter) && filter.indexOf(module) === -1) ||
        (typeof filter === 'function' && filter(data) === false)) {
      return;
    }

    var version = data.doc['dist-tags'].latest;
    var publisher = data.doc.versions[version]._npmUser.name;
    var packageLink = packageTemplate.replace('{module}', module);
    var userLink = userTemplate.replace('{user}', publisher);
    var txt = '<' + userLink + '|' + publisher +
              '> published <' + packageLink + '|' + module + '@' + version +
              '> at ' + data.key;
    var payload = {
      payload: JSON.stringify({
        username: username,
        icon_emoji: emoji,
        text: txt
      })
    };

    Wreck.post(hook, payload, function (err, res, payload) {
      if (err) {
        return onError(err);
      }

      if (res.statusCode !== 200) {
        return onError(payload);
      }
    });
  });

  return stream;
};
