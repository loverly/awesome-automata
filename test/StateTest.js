var chai = require('chai');
var expect = chai.expect;

var State = require('../lib/State');

describe('State', function () {
  describe('The constructor', function () {
    it('Should call _validateConfig()');
    it('Should replace all primitive criteria values with comparison functions');
    it('Should set the accept() method from the config');
  });

  describe('_validateConfig(config', function () {
    it('Should validate some stuff...');
  });

  describe('getName()', function () {
    it('Should return the name of the state');
  });


  describe('isInitial()', function () {
    it('Should return a boolean value based on whether or not this is the root node');
  });

  describe('isTerminal()', function () {
    it('Should return a boolean value based on whether or not this is a terminal node');
  });

  describe('getTransitions()', function () {
    it('Should return an array of outbound transitions');
  });
});