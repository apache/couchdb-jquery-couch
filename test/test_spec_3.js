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

// Specs for jquery_couch.js lines 300-411


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

  describe('test_spec_3.js', function () {
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

    describe('removeDoc', function () {
      var doc = {'Name': 'Louanne Katraine', 'Callsign': 'Kat', '_id': '345'},
          savedDoc;

      beforeEach(function (done) {
        db.saveDoc(doc, {
          success: function (resp) {
            savedDoc = resp;
            done();
          },
          error: errorCallback
        });
      });

      it('should result in a deleted document', function (done) {
        db.removeDoc({_id : '345', _rev: savedDoc.rev}, {
          success: function (resp) {
            db.openDoc('345', {
              error: function (status, error, reason) {
                assert.equal(status, 404);
                assert.equal(error, 'not_found');
                assert.equal(reason, 'deleted');
                done();
              },
              success: successCallback
            });
          },
          error: errorCallback
        });
      });

      it('should return ok true, the ID and the revision of the deleted document', function (done) {
        db.removeDoc({_id : '345', _rev: savedDoc.rev}, {
          success: function (resp) {
            assert.ok(resp.ok);
            assert.equal(resp.id, '345');
            assert.equal(typeof resp.rev, 'string');
            done();
          },
          error: errorCallback
        });
      });

      it('should record the revision in the deleted document', function (done) {
        db.removeDoc({_id : '345', _rev: savedDoc.rev}, {
          success: function (resp) {
            db.openDoc('345', {
              rev: resp.rev,
              success: function (resp2) {
                assert.equal(resp2._id, resp.id);
                assert.equal(resp2._rev, resp.rev);
                assert.ok(resp2._deleted);
                done();
              },
              error: errorCallback
            });
          },
          error: errorCallback
        });
      });
    });

    describe('bulkRemove', function () {
      var doc, doc2, doc3, docs;

      beforeEach(function (done) {
        doc  = {'Name': 'Kara Thrace', 'Callsign': 'Starbuck', '_id': '123'};
        doc2 = {'Name': 'Karl C. Agathon', 'Callsign': 'Helo', '_id': '456'};
        doc3 = {'Name': 'Sharon Valerii', 'Callsign': 'Boomer', '_id': '789'};
        docs = [doc, doc2, doc3];

        db.bulkSave({'docs': docs}, {
          ensure_full_commit: true,
          success: function (resp) {
            for (var i = 0; i < docs.length; i++) {
              docs[i]._rev = resp[i].rev;
            }
            done();
          },
          error: errorCallback
        });
      });

      it('should remove all documents specified', function (done) {
        db.bulkRemove({'docs': docs}, {
          ensure_full_commit: true,
          success: function () {
            db.allDocs({
              success: function (resp) {
                assert.equal(resp.total_rows, 0);
                done();
              },
              error: errorCallback
            });
          },
          error: errorCallback
        });
      });

      it('should not remove documents that should not have been deleted', function (done) {
        db.bulkRemove({'docs': [doc3]}, {
          success: function (resp) {
            db.allDocs({
              success: function (resp) {
                assert.equal(resp.total_rows, 2);
                done();
              },
              error: errorCallback
            });
          },
          error: errorCallback
        });
      });

      it('should result in deleted documents', function (done) {
        db.bulkRemove({'docs': docs}, {
          success: function (resp) {
            db.openDoc('123', {
              error: function (status, error, reason) {
                assert.equal(status, 404);
                assert.equal(error, 'not_found');
                assert.equal(reason, 'deleted');
                done();
              },
              success: successCallback
            });
          },
          error: errorCallback
        });
      });

      it('should return the ID and the revision of the deleted documents', function (done) {
        db.bulkRemove({'docs': docs}, {
          success: function (resp) {
            assert.equal(resp[0].id, '123');
            assert.equal(resp[1].id, '456');
            assert.equal(resp[2].id, '789');

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

      it('should record the revision in the deleted documents', function (done) {
        db.bulkRemove({'docs': docs}, {
          success: function (resp) {
            db.openDoc('123', {
              rev: resp[0].rev,
              success: function (resp2) {
                assert.equal(resp2._rev, resp[0].rev);
                assert.equal(resp2._id, resp[0].id);
                assert.ok(resp2._deleted);
                done();
              },
              error: errorCallback
            });
          },
          error: errorCallback
        });
      });
    });

    describe('copyDoc', function () {
      var doc;
      beforeEach(function (done) {
        doc = {'Name': 'Sharon Agathon', 'Callsign': 'Athena', '_id': '123'};
        db.saveDoc(doc, {
          success: function () {
            done();
          },
          error: errorCallback
        });
      });

      it('should result in another document with same data and new id', function (done) {
        db.copyDoc('123', {
          docid: '456',
          success: function (resp) {
            assert.equal(resp.id, '456');
            assert.ok(resp.rev.length > 30);
            db.openDoc('456', {
              success: function (resp) {
                assert.equal(resp.Name, 'Sharon Agathon');
                assert.equal(resp.Callsign, 'Athena');
                done();
              },
              error: errorCallback
            });
          },
          error: errorCallback
        });
      });

      it('should throw an error when trying to overwrite a document' +
          'without providing a revision', function (done) {
        var doc2 = {'Name': 'Louanne Katraine', 'Callsign': 'Kat', '_id': '456'};
        db.saveDoc(doc2, {
          success: function (resp) {
            db.copyDoc('123', {
              docid: '456',
              error: function (status, error, reason) {
                assert.equal(status, 409);
                assert.equal(error, 'conflict');
                assert.equal(reason, 'Document update conflict.');
                done();
              },
              success: successCallback
            });
          },
          error: errorCallback
        });
      });

      it('should overwrite a document with the correct revision', function (done) {
        var doc2 = {'Name': 'Louanne Katraine', 'Callsign': 'Kat', '_id': '456'},
            doc2Rev;

        db.saveDoc(doc2, {
          success: function (resp) {
            doc2Rev = resp.rev;
            next();
          },
          error: errorCallback
        });

        function next () {
          db.copyDoc('123', {
            docid: 456,
            rev: doc2Rev,
            success: function (resp) {
              assert.equal(resp.id, '456');
              assert.ok(resp.rev.length > 30);
              db.openDoc('456', {
                success: function (resp) {
                  assert.equal(resp.Name, 'Sharon Agathon');
                  assert.equal(resp.Callsign, 'Athena');
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

    describe('query', function () {
      var docs, mapFunction, reduceFunction;
      beforeEach(function (done) {
        docs = [
          {'Name': 'Cally Tyrol', 'job': 'deckhand', '_id': '789'},
          {'Name': 'Felix Gaeta', 'job': 'officer', '_id': '123'},
          {'Name': 'Samuel T. Anders', 'job': 'pilot', '_id': '456'},
        ];
        mapFunction = 'function (doc) { emit(doc._id, 1); }';
        reduceFunction = 'function (key, values, rereduce) { return sum(values); }';

        db.bulkSave({'docs': docs}, {
          ensure_full_commit: true,
          success: function (resp) {
            done();
          },
          error: errorCallback
        });
      });

      it('should apply the map function', function (done) {
        db.query(mapFunction, null, null, {
          success: function (resp) {
            assert.equal(resp.rows.length, 3);

            assert.equal(resp.rows[0].id, '123');
            assert.equal(resp.rows[0].key, '123');
            assert.equal(resp.rows[0].value, 1);

            assert.equal(resp.rows[1].id, '456');
            assert.equal(resp.rows[1].key, '456');
            assert.equal(resp.rows[1].value, 1);

            assert.equal(resp.rows[2].id, '789');
            assert.equal(resp.rows[2].key, '789');
            assert.equal(resp.rows[2].value, 1);

            done();
          },
          error: errorCallback
        });
      });

      it('should apply the reduct function', function (done) {
        db.query(mapFunction, reduceFunction, null, {
          success: function (resp) {
            assert.equal(resp.rows.length, 1);
            assert.equal(resp.rows[0].key, null);
            assert.equal(resp.rows[0].value, 3);

            done();
          },
          error: errorCallback
        });
      });

      it('should pass through the options', function (done) {
        db.query(mapFunction, null, null, {
          startkey: '456',
          success: function (resp) {
            assert.equal(resp.rows.length, 2);

            assert.equal(resp.rows[0].id, '456');
            assert.equal(resp.rows[0].key, '456');
            assert.equal(resp.rows[0].value, 1);

            assert.equal(resp.rows[1].id, '789');
            assert.equal(resp.rows[1].key, '789');
            assert.equal(resp.rows[1].value, 1);

            done();
          },
          error: errorCallback
        });
      });

      it('should pass through the keys', function (done) {
        db.query(mapFunction, null, null, {
          keys: ['456', '123'],
          success: function (resp) {
            assert.equal(resp.rows.length, 2);

            assert.equal(resp.rows[0].id, '456');
            assert.equal(resp.rows[0].key, '456');
            assert.equal(resp.rows[0].value, 1);

            assert.equal(resp.rows[1].id, '123');
            assert.equal(resp.rows[1].key, '123');
            assert.equal(resp.rows[1].value, 1);

            done();
          },
          error: errorCallback
        });
      });

      it('should pass through the options and keys', function (done) {
        db.query(mapFunction, null, null, {
          keys: ['456'],
          include_docs: true,
          success: function (resp) {
            assert.equal(resp.rows.length, 1);

            assert.equal(resp.rows[0].id, '456');
            assert.equal(resp.rows[0].key, '456');
            assert.equal(resp.rows[0].value, 1);

            assert.equal(resp.rows[0].doc.job, 'pilot');
            assert.ok(resp.rows[0].doc._rev.length > 30);

            done();
          },
          error: errorCallback
        });
      });
    });
    describe('view', function () {
      var docs, view;
      beforeEach(function (done) {
        docs = [
          {'Name': 'Cally Tyrol', 'job': 'deckhand', '_id': '789'},
          {'Name': 'Felix Gaeta', 'job': 'officer', '_id': '123'},
          {'Name': 'Samuel T. Anders', 'job': 'pilot', '_id': '456'}
        ];
        view = {
          'views': {
            'people': {
              'map': 'function (doc) { emit(doc._id, doc.Name); }'
            }
          },
          '_id': '_design/spec_db'
        };

        db.bulkSave({'docs': docs}, {
          success: function (resp) {
            db.saveDoc(view, {
              success: function () {
                done();
              },
              error: errorCallback
            });

          },
          error: errorCallback
        });
      });

      it('should apply the view', function (done) {
        db.view('spec_db/people', {
          success: function (resp) {
            assert.equal(resp.rows.length, 3);

            assert.equal(resp.rows[0].id, '123');
            assert.equal(resp.rows[0].key, '123');
            assert.equal(resp.rows[0].value, 'Felix Gaeta');

            assert.equal(resp.rows[1].id, '456');
            assert.equal(resp.rows[1].key, '456');
            assert.equal(resp.rows[1].value, 'Samuel T. Anders');

            assert.equal(resp.rows[2].id, '789');
            assert.equal(resp.rows[2].key, '789');
            assert.equal(resp.rows[2].value, 'Cally Tyrol');
            done();
          },
          error: errorCallback
        });
      });

      it('should pass through the options', function (done) {
        db.view('spec_db/people', {
          skip: 2,
          success: function (resp) {
            assert.equal(resp.rows.length, 1);
            assert.equal(resp.rows[0].id, '789');
            assert.equal(resp.rows[0].key, '789');
            assert.equal(resp.rows[0].value, 'Cally Tyrol');
            done();
          },
          error: errorCallback
        });
      });

      it('should pass through the keys', function (done) {
        db.view('spec_db/people', {
          keys: ['456', '123'],
          success: function (resp) {
            assert.equal(resp.rows[0].id, '456');
            assert.equal(resp.rows[0].key, '456');
            assert.equal(resp.rows[0].value, 'Samuel T. Anders');
            assert.equal(resp.rows[1].id, '123');
            assert.equal(resp.rows[1].key, '123');
            assert.equal(resp.rows[1].value, 'Felix Gaeta');
            done();
          },
          error: errorCallback
        });
      });

      it('should pass through the keys', function (done) {
        db.view('spec_db/people', {
          keys: ['456'],
          include_docs: true,
          success: function (resp) {
            assert.equal(resp.rows.length, 1);

            assert.equal(resp.rows[0].id, '456');
            assert.equal(resp.rows[0].key, '456');
            assert.equal(resp.rows[0].value, 'Samuel T. Anders');

            assert.equal(resp.rows[0].doc.job, 'pilot');
            assert.ok(resp.rows[0].doc._rev.length > 30);
            done();
          },
          error: errorCallback
        });
      });

      it('should throw a 404 when the view doesnt exist', function (done) {
        db.view('spec_db/non_existing_view', {
          keys: ['456'],
          include_docs: true,
          error: function (status, error, reason) {
            assert.equal(status, 404);
            assert.equal(error, 'not_found');
            assert.equal(reason, 'missing_named_view');
            done();
          },
          success: successCallback
        });
      });
    });

    describe('setDbProperty', function () {
      it('should return ok true', function (done) {
        db.setDbProperty('_revs_limit', 1500, {
          success: function (resp) {
            assert.ok(resp.ok);
            done();
          },
          error: errorCallback
        });
      });

      it('should set a db property', function (done) {
        db.setDbProperty('_revs_limit', 1500, {
          success: function (resp) {
            db.getDbProperty('_revs_limit', {
              success: function (resp) {
                assert.equal(resp, 1500);
                next();
              },
              error: errorCallback
            });
          },
          error: errorCallback
        });

        function next () {
          db.setDbProperty('_revs_limit', 1200, {
            success: function () {
              db.getDbProperty('_revs_limit', {
                success: function (resp) {
                  assert.equal(resp, 1200);
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

    describe('getDbProperty', function () {
      it('should get a db property', function (done) {
        db.setDbProperty('_revs_limit', 1337, {
          success: function (resp) {
            db.getDbProperty('_revs_limit', {
              success: function (resp) {
                assert.equal(resp, 1337);
                done();
              },
              error: errorCallback
            });
          },
          error: errorCallback
        });
      });

      it('should throw a 404 when the property doesnt exist', function (done) {
        db.getDbProperty('_doesnt_exist', {
          success: successCallback,
          error: function (status, error, reason) {
            assert.equal(status, 404);
            assert.equal(error, 'not_found');
            assert.equal(reason, 'missing');
            done();
          }
        });
      });
    });

  });
})();
