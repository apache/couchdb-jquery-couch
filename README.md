# couchdb-jquery-couch

$.couch is used to communicate with a CouchDB server.

## Tests

Install the dependencies:

```
$ bower install
```

Enable CORS:

```
curl -X PUT http://localhost:5984/_config/httpd/enable_cors -d '"true"'
curl -X PUT http://localhost:5984/_config/cors/origins -d '"*"'
```

Restart CouchDB & open `test/runner.html` in a browser to run the testsuite.
