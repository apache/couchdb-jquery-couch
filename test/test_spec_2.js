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

// Specs for jquery_couch.js lines 210-299


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

  describe('test_spec_2.js', function () {
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

    beforeEach(function (done) {
      $.couch.urlPrefix = 'http://localhost:5984';
      db = $.couch.db('spec_db');
      createCb(db, done);
    });

    afterEach(function (done) {
      dropCb(db, done);
    });

    describe('info', function () {
      var res;
      beforeEach(function (done) {
        db.info({
          success: function (resp) {
            res = resp;
            done();
          },
          error: errorCallback
        });
      });

      it('should return the name of the database', function () {
        assert.equal(res.db_name, 'spec_db');
      });

      it('should return the number of documents', function () {
        assert.equal(res.doc_count, 0);
      });

      it('should return the start time of the db instance', function () {
        assert.equal(typeof res.instance_start_time, 'string');
      });
    });

    describe('allDocs', function () {
      var res;

      it('should return no docs when there arent any', function (done) {
        db.allDocs({
          success: function (resp) {
            assert.equal(resp.total_rows, 0);
            assert.deepEqual(resp.rows, []);
            done();
          },
          error: errorCallback
        });
      });

      describe('with docs', function () {
        beforeEach(function (done) {
          db.saveDoc({'Name': 'Felix Gaeta', '_id': '123'}, {
            success: function () {
              db.saveDoc({'Name': 'Samuel T. Anders', '_id': '456'}, {
                success: function () {
                  done();
                }
              });
            },
            error: errorCallback
          });
        });

        it('should return all docs', function (done) {
          db.allDocs({
            success: function (resp) {
              assert.equal(resp.total_rows, 2);
              assert.equal(resp.rows.length, 2);
              assert.equal(resp.rows[0].id, '123');
              assert.equal(resp.rows[0].key, '123');
              assert.ok(resp.rows[0].value.rev.length > 30);
              assert.equal(resp.rows[1].id, '456');
              done();
            },
            error: errorCallback
          });
        });

        it('should pass through the options', function (done) {
          db.allDocs({
            'startkey': '123',
            'limit': '1',
            success: function (resp) {
              assert.equal(resp.rows.length, 1);
              assert.equal(resp.rows[0].id, '123');
              done();
            },
            error: errorCallback
          });
        });
      });
    });

    describe('allDesignDocs', function () {
      it('should return nothing when there arent any design docs', function (done) {
        db.saveDoc({'Name': 'Felix Gaeta', '_id': '123'}, {
          success: function () {
            db.allDesignDocs({
              success: function (resp) {
                assert.deepEqual(resp.rows, []);
                done();
              },
              error: errorCallback
            });
          }
        });
      });

      it('should return all design docs', function (done) {
        var designDoc = {
          'views' : {
            'people' : {
              'map' : 'function(doc) { emit(doc._id, doc); }'
            }
          },
          '_id' : '_design/spec_db'
        };
        db.saveDoc(designDoc, {
          success: cb
        });

        function cb () {
          db.saveDoc({'Name': 'Felix Gaeta', '_id': '123'}, {
            success: function () {
              db.allDesignDocs({
                success: function (resp) {
                  db.allDesignDocs({
                    success: function (resp) {
                      assert.equal(resp.total_rows, 2);
                      assert.equal(resp.rows.length, 1);
                      assert.equal(resp.rows[0].id, '_design/spec_db');
                      assert.equal(resp.rows[0].key, '_design/spec_db');
                      assert.ok(resp.rows[0].value.rev.length > 30);
                      done();
                    },
                    error: errorCallback
                  });
                },
                error: errorCallback
              });
            }
          });
        }
      });
    });

    describe('allApps', function () {
      it('should provide a custom function with appName, appPath and design' +
         'document when there is an attachment with index.html', function (done) {

        var designDoc = {'_id' : '_design/with_attachments'};

        designDoc._attachments = {
          'index.html' : {
            'content_type': 'text\/html',
            // this is '<html><p>Hi, here is index!</p></html>', base64 encoded
            'data': 'PGh0bWw+PHA+SGksIGhlcmUgaXMgaW5kZXghPC9wPjwvaHRtbD4='
          }
        };
        db.saveDoc(designDoc, {
          success: function () {
            db.allApps({
              eachApp: function (appName, appPath, ddoc) {
                assert.equal(appName, 'with_attachments');
                assert.equal(appPath, '/spec_db/_design/with_attachments/index.html');
                assert.equal(ddoc._id, '_design/with_attachments');
                assert.equal(ddoc._attachments['index.html'].content_type, 'text/html');
                assert.equal(ddoc._attachments['index.html'].length,
                  '<html><p>Hi, here is index!</p></html>'.length);
                done();
              },
              error: errorCallback
            });
          }
        });
      });

      it('should provide a custom function with appName, appPath' +
         'and design document when there is a couchapp with index file', function (done) {

        var designDoc = {'_id' : '_design/with_index'};
        designDoc.couchapp = {
          'index': 'cylon'
        };
        db.saveDoc(designDoc, {
          success: function () {
            db.allApps({
              eachApp: function (appName, appPath, ddoc) {
                assert.equal(appName, 'with_index');
                assert.equal(appPath, '/spec_db/_design/with_index/cylon');
                assert.equal(ddoc._id, '_design/with_index');
                assert.equal(ddoc.couchapp.index, 'cylon');
                done();
              },
              error: errorCallback
            });
          }
        });
      });
    });

    describe('openDoc', function () {
      var doc = {'Name': 'Louanne Katraine', 'Callsign': 'Kat', '_id': '123'};
      beforeEach(function (done) {
        db.saveDoc(doc, {
          success: function () {
            done();
          }
        });
      });

      it('should open the document', function (done) {
        db.openDoc('123', {
          success: function (resp) {
            assert.deepEqual(resp, doc);
            done();
          },
          error: errorCallback
        });
      });

      it('should raise a 404 error when there is no document with' +
          'the given ID', function (done) {
        db.openDoc('non_existing', {
          success: function (status, error, reason) {

          },
          error: function (status, error, reason) {
            assert.equal(status, 404);
            assert.equal(error, 'not_found');
            assert.equal(reason, 'missing');
            done();
          }
        });
      });

      it('should pass through the options', function (done) {
        doc.name = 'Sasha';
        db.saveDoc(doc, {
          success: function () {
            db.openDoc('123', {
              revs: true,
              success: function (resp) {
                assert.equal(resp._revisions.start, 4);
                assert.equal(resp._revisions.ids.length, 3);
                done();
              },
              error: errorCallback
            });
          }
        });
      });
    });

    describe('saveDoc', function () {
      var doc = {'Name': 'Kara Thrace', 'Callsign': 'Starbuck'};

      it('should save the document and return ok: true', function (done) {
        db.saveDoc(doc, {
          success: function (resp) {
            assert.ok(resp.ok);
            done();
          },
          error: errorCallback
        });
      });

      it('should return ID and revision of the document', function (done) {
        db.saveDoc(doc, {
          success: function (resp) {
            assert.equal(typeof resp.id, 'string');
            assert.equal(typeof resp.rev, 'string');
            assert.ok(resp.rev.length > 30);
            done();
          },
          error: errorCallback
        });
      });

      it('should result in a saved document with generated ID', function (done) {
        db.saveDoc(doc, {
          success: function (resp) {
            db.openDoc(resp.id, {
              success: function (resp2) {
                assert.equal(resp2.Name, 'Kara Thrace');
                assert.equal(resp2.Callsign, 'Starbuck');
                done();
              },
              error: errorCallback
            });
          },
          error: errorCallback
        });
      });

      it('should save the document with the specified ID', function (done) {
        doc._id = '123';
        db.saveDoc(doc, {
          success: function (resp) {
            assert.equal(resp.id, '123');
            done();
          },
          error: errorCallback
        });
      });
    });

    describe('bulkSave', function () {
      var doc  = {'Name': 'Kara Thrace', 'Callsign': 'Starbuck'},
          doc2 = {'Name': 'Karl C. Agathon', 'Callsign': 'Helo'},
          doc3 = {'Name': 'Sharon Valerii', 'Callsign': 'Boomer'},
          docs = [doc, doc2, doc3];

      it('should save all documents', function (done) {
        db.bulkSave({'docs': docs}, {
          success: function (resp) {
            db.allDocs({
              success: function (resp) {
                assert.equal(resp.total_rows, 3);
                done();
              },
              error: errorCallback
            });
          },
          error: errorCallback
        });
      });

      it('should result in saved documents', function (done) {
        doc3._id = '789';
        db.bulkSave({'docs': docs}, {
          success: function (resp) {
            db.openDoc('789', {
              success: function (resp) {
                assert.equal(resp.Name, 'Sharon Valerii');
                assert.equal(resp.Callsign, 'Boomer');
                done();
              },
              error: errorCallback
            });
          },
          error: errorCallback
        });
      });

      it('should return ID and revision of the documents', function (done) {
        db.bulkSave({'docs': docs}, {
          success: function (resp) {
            assert.equal(typeof resp[0].id, 'string');
            assert.equal(typeof resp[1].id, 'string');
            assert.equal(typeof resp[2].id, 'string');

            assert.equal(typeof resp[0].rev, 'string');
            assert.equal(typeof resp[1].rev, 'string');
            assert.equal(typeof resp[2].rev, 'string');

            assert.ok(resp[0].rev.length > 30);
            assert.ok(resp[1].rev.length > 30);
            assert.ok(resp[2].rev.length > 30);
            done();
          },
          error: errorCallback
        });
      });

      it('should return ID and revision of the documents', function (done) {
        doc._id  = '123';
        doc2._id = '456';
        docs = [doc, doc2, doc3];

        db.bulkSave({'docs': docs}, {
          success: function (resp) {
            assert.equal(resp[0].id, '123');
            assert.equal(resp[1].id, '456');
            done();
          },
          error: errorCallback
        });
      });

      it('should pass through the options', function (done) {
        // a lengthy way to test that a conflict can't be created with the
        // all_or_nothing option set to false, but can be when it's true.

        var oldDoc = {'Name': 'Louanne Katraine', 'Callsign': 'Kat', '_id': '123'};
        var newDoc = {'Name': 'Sasha', 'Callsign': 'Kat', '_id': '123'};
        db.saveDoc(oldDoc, {
          success: function (resp) {
            oldDoc._rev = resp.rev;
            db.bulkSave({'docs': [newDoc], 'all_or_nothing': false}, {
              success: function (resp) {
                assert.equal(resp[0].id, '123');
                assert.equal(resp[0].error, 'conflict');
                assert.equal(resp[0].reason, 'Document update conflict.');
                next();
              },
              error: errorCallback
            });
          },
          error: errorCallback
        });

        function next () {
          db.bulkSave({'docs': [newDoc], 'all_or_nothing': true}, {
            success: function (resp) {
              assert.equal(resp[0].id, '123');
              assert.notEqual(resp[0].rev, oldDoc._rev);
              db.openDoc('123', {
                'conflicts': true,
                success: function (resp) {
                  assert.equal(resp._conflicts[0], oldDoc._rev);
                  done();
                },
                error: errorCallback
              });
            },
            error: errorCallback
          });
        }
      });
    });
  });
})();
