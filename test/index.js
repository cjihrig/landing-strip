var Code = require('code');
var Lab = require('lab');
var NpmPublishStream = require('npm-publish-stream');
var Wreck = require('wreck');
var LandingStrip = require('../lib');

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

var wreckPost = Wreck.constructor.prototype.post;

describe('LandingStrip', function () {
  lab.beforeEach(function (done) {
    // Patch NpmPublishStream.prototype._read so that our tests do not rely
    // on the npm registry
    var fixture = {
      id: 'fixture',
      key: 'package-key',
      doc: {
        'dist-tags': {
          latest: '9.0.0'
        },
        'versions': {
          '9.0.0': {
            _npmUser: {
              name: 'Continuation Labs'
            }
          }
        },
        'repository': {
          url: 'repo-url'
        }
      }
    };

    NpmPublishStream.prototype._read = function () {
      this.push(fixture);
      NpmPublishStream.prototype._read = function () {};
    };
    Wreck.constructor.prototype.post = wreckPost;
    done();
  });

  it('filtered publish events are successfully posted to Slack', function (done) {
    var startTime = new Date(2000, 0);

    Wreck.constructor.prototype.post = function (uri, options, callback) {
      function cb (err, response, payload) {
        callback(err, response, payload);
        done();
      }

      cb(null, {statusCode: 200}, '');
    };

    var stream = LandingStrip({
      username: 'user',
      emoji: ':emo:',
      hook: 'url',
      startTime: startTime,
      onError: function (err) {
        expect(err).to.not.exist();
        expect(false).to.equal(true);
      },
      filter: function (data) {
        expect(data.doc.repository.url).to.equal('repo-url');
        return true;
      }
    });

    expect(stream instanceof NpmPublishStream).to.equal(true);
    expect(stream._lastRefreshTime).to.equal(startTime);
  });

  it('handles errors from Wreck', function (done) {
    Wreck.constructor.prototype.post = function (uri, options, callback) {
      function cb (err, response, payload) {
        callback(err, response, payload);
        done();
      }

      cb(new Error('foo'), {statusCode: 200}, '');
    };

    LandingStrip({
      username: 'user',
      emoji: ':emo:',
      hook: 'url',
      onError: function (err) {
        expect(err.message).to.equal('foo');
      },
      filter: ['fixture']
    });
  });

  it('handles non-200 response codes', function (done) {
    Wreck.constructor.prototype.post = function (uri, options, callback) {
      function cb (err, response, payload) {
        callback(err, response, payload);
        done();
      }

      cb(null, {statusCode: 400}, new Error('foo'));
    };

    LandingStrip({
      username: 'user',
      emoji: ':emo:',
      hook: 'url',
      onError: function (err) {
        expect(err.message).to.equal('foo');
      }
    });
  });

  it('does nothing if published module is not in filter array', function (done) {
    Wreck.constructor.prototype.post = function (uri, options, callback) {
      expect(false).to.equal(true);
    };

    LandingStrip({
      username: 'user',
      emoji: ':emo:',
      hook: 'url',
      onError: function (err) {
        expect(err).to.not.exist();
        expect(false).to.equal(true);
      },
      filter: []
    });

    setTimeout(function () {
      done();
    }, 1000);
  });

  it('does nothing if filter function returns false', function (done) {
    Wreck.constructor.prototype.post = function (uri, options, callback) {
      expect(false).to.equal(true);
    };

    LandingStrip({
      username: 'user',
      emoji: ':emo:',
      hook: 'url',
      onError: function (err) {
        expect(err).to.not.exist();
        expect(false).to.equal(true);
      },
      filter: function () {
        return false;
      }
    });

    setTimeout(function () {
      done();
    }, 1000);
  });

  it('adds a noop error handler by default', function (done) {
    var stream = LandingStrip({
      username: 'user',
      emoji: ':emo:',
      hook: 'url'
    });

    stream.emit('error', new Error('foo'));

    setTimeout(function () {
      done();
    }, 1000);
  });

  it('requires a properly formatted options object', function (done) {
    expect(function () {
      LandingStrip();
    }).throw('options must be an object');

    expect(function () {
      LandingStrip(null);
    }).throw('options must be an object');

    expect(function () {
      LandingStrip({
        hook: null
      });
    }).throw('hook must be a string');

    expect(function () {
      LandingStrip({
        hook: 'foo',
        startTime: null
      });
    }).throw('startTime must be a Date');

    expect(function () {
      LandingStrip({
        hook: 'foo',
        onError: null
      });
    }).throw('onError must be a function');

    expect(function () {
      LandingStrip({
        hook: 'foo',
        filter: null
      });
    }).throw('filter must be an array or function');

    done();
  });
});
