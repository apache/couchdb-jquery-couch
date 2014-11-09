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

'use strict';

(function () {
  var assert = chai.assert;

  describe('test.js', function () {
    it('should be an object as a jquery function', function () {
      assert.equal(typeof $.couch, 'object');
    });
  });

  describe('ajax', function () {
    var stub;
    before(function () {
      stub = sinon.stub(jQuery, 'ajax').yieldsTo('complete', {
        responseText: '{"ok": true}',
        status: 200
      });
    });
    after(function () {
      stub.restore();
    });

    it('login should call complete if given', function (done) {
      $.couch.login({
        complete: function () { done(); },
        success: function () {}
      });
    });

    it('logout should call complete, if given', function (done) {
      $.couch.login({
        complete: function () { done(); },
        success: function () {}
      });
    });
  });
})();
