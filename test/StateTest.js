var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var State = require('../lib/State');

describe('State', function () {
  describe('The constructor', function () {
    it('Should call _validateConfig()', function() {
      sinon.spy(State.prototype, '_validateConfig');

      var myState = new State({
        name: 'someName',
        isInitial: true,
        isTerminal: false
      });

      expect(State.prototype._validateConfig.calledOnce).to.equal(true);

      State.prototype._validateConfig.restore();

    });

    it('Should replace all primitive criteria values with comparison functions', function() {
      var firstTransition = {state: 'anotherState', criteria: 'a simple Test'};
      var secondTransition = {state: 'oneMoreState', criteria: 45};
      var myState = new State({
        name: 'someName',
        isInitial: true,
        isTerminal: false,
        outgoingTransitions: [
          firstTransition,
          secondTransition
        ]
      });

      expect(myState._outgoingTransitions[0].name).to.equal(firstTransition.name);
      expect(myState._outgoingTransitions[0].criteria).to.be.a('function');
      expect(myState._outgoingTransitions[0].criteria('a simple Test')).to.equal(true);

      expect(myState._outgoingTransitions[1].name).to.equal(secondTransition.name);
      expect(myState._outgoingTransitions[1].criteria).to.be.a('function');
      expect(myState._outgoingTransitions[1].criteria(45)).to.equal(true);
    });

    it('Should set the accept() method from the config', function() {
      var someFunc = function() {};
      var myState = new State({
        name: 'someName',
        isInitial: true,
        isTerminal: false,
        accept: someFunc
      });

      expect(myState.accept).to.equal(someFunc, true);
    });
  });

  describe('_validateConfig(config', function () {
    it('Should require a name for the state', function() {
      var testFunc = function() {return new State({})};

      expect(testFunc).to.throw(Error);

      testFunc = function() {
        return new State({
          name: 'someName'
        });
      };

      expect(testFunc).to.not.throw(Error);
    });

    it('Should not allow a state to be both a root and a terminal node', function() {
      var testConfig = {
        name: 'someName',
        isInitial: true,
        isTerminal: true
      };
      var testFunc = function() {return new State(testConfig)};

      expect(testFunc).to.throw(Error);

      testConfig = {
        name: 'someName',
        isInitial: true,
        isTerminal: false
      };

      expect(testFunc).to.not.throw(Error);
    });

    it('Should require that any provided outgoing transitions are passed in an array', function() {
      var testFunc = function() {
        return new State({
          name: 'someName',
          outgoingTransitions: {}
        });
      };

      expect(testFunc).to.throw(Error);

      testFunc = function() {
        return new State({
          name: 'someName',
          outgoingTransitions: 'anotherStates'
        });
      };

      expect(testFunc).to.throw(Error);

      testFunc = function () {
        return new State({
          name: 'someName',
          outgoingTransitions: []
        });
      };

      expect(testFunc).to.not.throw(Error);
    });

    it('Should require each outgoing transition to include a state name and a criteria', function() {
      var testFunc = function() {
        return new State({
          name: 'someName',
          outgoingTransitions: [
            {criteria: 'something to test'}
          ]
        });
      };

      expect(testFunc).to.throw(Error);

      testFunc = function() {
        return new State({
          name: 'someName',
          outgoingTransitions: [
            {state: 'anotherState'}
          ]
        });
      };

      expect(testFunc).to.throw(Error);

      testFunc = function () {
        return new State({
          name: 'someName',
          outgoingTransitions: [
            {state: 'anotherState', criteria: 'something to test'}
          ]
        });
      };

      expect(testFunc).to.not.throw(Error);
    });

    it('Should require the accept method for each outgoing transition to be a function', function() {
      var testFunc = function() {
        return new State({
          name: 'someName',
          outgoingTransitions: [
            {state: 'anotherState', criteria: 'something to test', accept: 'acceptanceAction'}
          ]
        });
      };

      expect(testFunc).to.throw(Error);

      testFunc = function () {
        return new State({
          name: 'someName',
          outgoingTransitions: [
            { state: 'anotherState', criteria: 'something to test', accept: function() {return true;} }
          ]
        });
      };

      expect(testFunc).to.not.throw(Error);
    });

    it('Should require a terminal state to have no outgoing transitions', function() {
      var testFunc = function() {
        return new State({
          name: 'someName',
          isTerminal: true,
          outgoingTransitions: [
            { state: 'anotherState', criteria: 'something to test' }
          ]
        });
      };

      expect(testFunc).to.throw(Error);

      testFunc = function() {
        return new State({
          name: 'someName',
          isTermianl: true
        })
      };

      expect(testFunc).to.not.throw(Error);
    });

    it('Should require the accept property to be a function', function() {
      var testFunc = function() {
        return new State({
          name: 'someName',
          accept: 'acceptanceAction'
        });
      };

      expect(testFunc).to.throw(Error);

      testFunc = function () {
        return new State({
          name: 'someName',
          accept: function() {return true;}
        });
      };

      expect(testFunc).to.not.throw(Error);
    });
  });

  describe('getName()', function () {
    it('Should return the name of the state', function() {
      var stateName = 'someName';
      var myState = new State({
        name: stateName
      });

      expect(myState.getName()).to.equal(stateName);
    });
  });


  describe('isInitial()', function () {
    it('Should return a boolean value based on whether or not this is the root node', function() {
      var initialState = new State({
        name: 'initialState',
        isInitial: true
      });
      var nonInitialState = new State({
        name: 'nonInitialState',
        isInitial: false
      });

      expect(initialState.isInitial()).to.equal(true);
      expect(nonInitialState.isInitial()).to.equal(false);
    });
  });

  describe('isTerminal()', function () {
    it('Should return a boolean value based on whether or not this is a terminal node', function() {
      var terminalState = new State({
        name: 'terminalState',
        isTerminal: true
      });
      var nonTerminalState = new State({
        name: 'nonTerminalState',
        isTerminal: false
      });

      expect(terminalState.isTerminal()).to.equal(true);
      expect(nonTerminalState.isTerminal()).to.equal(false);
    });
  });

  describe('getTransitions()', function () {
    it('Should return an array of outbound transitions', function() {
      var outboundTransitions = [
        { state: 'anotherState', criteria: 'something to test'},
        { state: 'furtherState', criteria: 'something else to test'}
      ];
      var myState = new State({
        name: 'someName',
        outgoingTransitions: outboundTransitions
      });

      expect(myState.getTransitions()).to.be.an('Array');
      expect(myState.getTransitions()).to.equal(outboundTransitions);
    });
  });
});