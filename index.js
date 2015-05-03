var NpmPublishStream = require('npm-publish-stream');
var Wreck = require('wreck');
var Config = require('./config');
var stream = new NpmPublishStream();
var packageTemplate = 'https://www.npmjs.org/package/{module}';

function handleError(err) {
  console.error(err);
}

stream.on('error', handleError);

stream.on('data', function(data) {
  var module = data.id;

  if (Array.isArray(Config.filter) && Config.filter.indexOf(module) === -1) {
    return;
  }

  var version = data.doc['dist-tags'].latest;
  var packageLink = packageTemplate.replace('{module}', module);
  var txt = 'Published <' + packageLink + '|' + module + '@' + version + '>';
  var payload = {
    payload: JSON.stringify({
      username: Config.username,
      icon_emoji: Config.emoji,
      text: txt
    })
  };

  Wreck.post(Config.hook, payload, function(err, res, payload) {
    if (err) {
      return handleError(err);
    }

    if (res.statusCode !== 200) {
      return handleError(payload);
    }
  });
});
