// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

// Specs for jquery_couch.js lines 163-209


(function () {
  'use strict';

  var assert = chai.assert;

  function successCallback (resp) {
    console.log('No error message here unexpectedly, successful response instead.');
    throw('No error message here unexpectedly, successful response instead.');
  }

  function errorCallback (status, error, reason) {
    console.log('Unexpected ' + status + ' error: ' + error + ' - ' + reason);
    throw('Unexpected ' + status + ' error: ' + error + ' - ' + reason);
  }

  describe('test_spec_1.js', function () {
    var db;

    function dropCb (db, done) {
      db.drop({
        success: function () {
          done();
        },
        error: function () {
          done();
        }
      });
    }

    function createCb (db, done) {
      db.create({
        success: function () {
          done();
        },
        error: function () {
          done();
        }
      });
    }

    beforeEach(function () {
      $.couch.urlPrefix = 'http://localhost:5984';
      db = $.couch.db('spec_db');
    });

    describe('constructor', function () {
      it('should set the name', function () {
        assert.equal(db.name, 'spec_db');
      });

      it('should set the uri', function () {
        assert.equal(db.uri, 'http://localhost:5984/spec_db/');
      });
    });

    describe('triggering db functions', function () {
      beforeEach(function (done) {
        createCb(db, done);
      });

      afterEach(function (done) {
        dropCb(db, done);
      });

      describe('compact', function () {
        it('should return ok true', function (done) {
          db.compact({
            success: function (resp) {
              assert.ok(resp.ok);
              done();
            },
            error: errorCallback
          });
        });

        it('retuns a request time', function (done) {
          db.compact({
            success: function (resp, time) {
              assert.equal(typeof time, 'number');
              done();
            },
            error: errorCallback
          });
        });
      });

      describe('viewCleanup', function () {
        it('should return ok true', function (done) {
          db.viewCleanup({
            success: function (resp) {
              assert.ok(resp.ok);
              done();
            },
            error: errorCallback
          });
        });

        it('retuns a request time', function (done) {
          db.viewCleanup({
            success: function (resp, time) {
              assert.equal(typeof time, 'number');
              done();
            },
            error: errorCallback
          });
        });
      });

      describe('compactView', function () {
        beforeEach(function (done) {
          createCb(db, done);
          var designDoc = {
            'views' : {
              'people' : {
                'map' : 'function(doc) { emit(doc._id, doc); }'
              }
            },
            '_id' : '_design/myview'
          };
          db.saveDoc(designDoc);
          db.saveDoc({'Name' : 'Felix Gaeta', '_id' : '123'});
        });

        afterEach(function (done) {
          dropCb(db, done);
        });

        it('should return ok true', function (done) {
          db.compactView('/myview', {
            success: function (resp) {
              assert.ok(resp.ok);
              done();
            },
            error: errorCallback
          });
        });

        it('retuns a request time', function (done) {
          db.compactView('/myview', {
            success: function (resp, time) {
              assert.equal(typeof time, 'number');
              done();
            },
            error: errorCallback
          });
        });

        it('should return raise a 404 error when the design name doesnt exist', function (done) {
          db.compactView('non_existing_design_name', {
            error: function (status, error, reason) {
              assert.equal(status, 404);
              assert.equal(error, 'not_found');
              assert.equal(reason, 'missing');
              done();
            },
            success: function (resp) {
              successCallback(resp);
            }
          });
        });
      });

      describe('create', function () {
        beforeEach(function (done) {
          dropCb(db, done);
        });

        after(function (done) {
          dropCb(db, done);
        });

        it('should return ok true', function (done) {
          db.create({
            success: function (resp) {
              assert.ok(resp.ok);
              done();
            },
            error: function (status, error, reason) {
              errorCallback(status, error, reason);
              done();
            }
          });
        });

        it('should result in a created db', function (done) {
          db.create({
            success: function () {
              db.create({
                error: function (status, error, reason) {
                  assert.equal(status, 412);
                  assert.equal(error, 'file_exists');
                  assert.equal(reason, 'The database could not be created, the file already exists.');
                  done();
                },
                success: function (resp) {
                  successCallback(resp);
                }
              });
            }
          });
        });
      });

      describe('drop', function () {
        beforeEach(function (done) {
          createCb(db, done);
        });

        after(function (done) {
          dropCb(db, done);
        });

        it('should return ok true', function (done) {
          db.drop({
            success: function (resp) {
              assert.ok(resp.ok);
              done();
            },
            error: errorCallback
          });
        });

        it('should result in a deleted db', function (done) {
          db.drop({
            success: function () {
              db.drop({
                error: function (status, error, reason) {
                  assert.equal(status, 404);
                  assert.equal(error, 'not_found');
                  assert.equal(reason, 'missing');
                  done();
                },
                success: function (resp) {
                  successCallback(resp);
                }
              });
            }
          });
        });
      });
    });
  });
})();
