# 3DAY Server application

This is a rework of the original 3-day application, which provides a REST API for
a mobile application.

This update runs on node.js 4.x and uese ES6 language features and moves to the koa framework replacing express.  It uses the following ES6 language features:

* generators
* promises
* arrow-functions
* string interpolation
* constants
* for-of loops

Modules used include:

* koa (replacing express)
* mongoose
* gridfs
* gulp (replacing grunt)

Automated testing uses:

* mocha
* should.js
* supertest

To install and run tests:
```sh
npm install
npm install -g gulp-cli
gulp
```

Copyright (C) Ian Kelly 2014-16
