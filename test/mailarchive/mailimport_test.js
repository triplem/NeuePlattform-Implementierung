"use strict";

var expect = require('chai').expect;
var sinon = require('sinon');
var sinonSandbox = sinon.sandbox.create();
var moment = require('moment');

var conf = require('../configureForTest');
var membersAPI = conf.get('beans').get('membersAPI');
var Member = conf.get('beans').get('member');
var dummymember = new Member({sessionUser: {identifier: 'hada'}});

var mailimport = require('../../lib/mailarchive/importMails.js');

var fileWithTextAndHtml = 'test/mailarchive/testfiles/mailWithTextAndHtml',
  fileWithTextOnly = 'test/mailarchive/testfiles/mailWithTextOnly',
  fileWithoutDate = 'test/mailarchive/testfiles/mailWithoutDate',
  fileWithReferences = 'test/mailarchive/testfiles/mailWithReferences';

describe('Import of mails from files with mime messages', function () {
  beforeEach(function (done) {
    sinonSandbox.stub(membersAPI, 'getMemberForEMail', function (emails, callback) {
      callback(null, dummymember);
    });
    done();
  });

  afterEach(function (done) {
    sinonSandbox.restore();
    done();
  });

  it('imports plain text from multipart message', function (done) {
    mailimport(fileWithTextAndHtml, 'group', function (err, result) {
      expect(err).to.equal(null);
      expect(result.text).to.contain('Plain text message 1');
      done();
    });
  });

  it('imports plain text from plain text message', function (done) {
    mailimport(fileWithTextOnly, 'group', function (err, result) {
      expect(result.text).to.contain('Plain text message 2');
      done();
    });
  });

  it('imports html from multipart message', function (done) {
    mailimport(fileWithTextAndHtml, 'group', function checkImportedObject(err, result) {
      expect(result.html).to.contain('<div>Html message 1</div>');
      done();
    });
  });

  it('includes member id from member API ', function (done) {
    mailimport(fileWithTextOnly, 'group', function checkImportedObject(err, result) {
      expect(result.from.id).to.equal(dummymember.id);
      done();
    });
  });

  it('imports sender name', function (done) {
    mailimport(fileWithTextOnly, 'group', function checkImportedObject(err, result) {
      expect(result.from.name).to.equal('Heißen');
      done();
    });
  });

  it('imports sender address', function (done) {
    mailimport(fileWithTextOnly, 'group', function checkImportedObject(err, result) {
      expect(result.from.address).to.equal('some@mail.de');
      done();
    });
  });

  it('imports date and time', function (done) {
    mailimport(fileWithTextOnly, 'group', function checkImportedObject(err, result) {
      expect(result.dateUnix).to.equal(moment('Mon, 25 Mar 2013 21:14:14 +0100').unix());
      done();
    });
  });

  it('uses current date and time if date is not available', function (done) {
    var beforeTestRunUnix = moment().unix() - 1;
    mailimport(fileWithoutDate, 'group', function checkImportedObject(err, result) {
      var afterTestRunUnix = moment().unix() + 1;
      expect(result.dateUnix).to.be.greaterThan(beforeTestRunUnix);
      expect(result.dateUnix).to.be.lessThan(afterTestRunUnix);
      done();
    });
  });
  it('assigns given group', function (done) {
    mailimport(fileWithTextOnly, 'group', function (err, result) {
      expect(result.group).to.equal('group');
      done();
    });
  });

  it('imports subject', function (done) {
    mailimport(fileWithTextOnly, 'group', function (err, result) {
      expect(result.subject).to.equal('Mail 2');
      done();
    });
  });

  it('imports references', function (done) {
    mailimport(fileWithReferences, 'group', function (err, result) {
      expect(result.references.toString()).to.equal(["message0@nomail.com", "message1@nomail.com"].toString());
      done();
    });
  });


});
