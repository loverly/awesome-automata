var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var AwesomeAutomata = require('../lib/AwesomeAutomata');

describe('AwesomeAutomata', function () {
  describe('The constructor', function () {

    it('Should inherit from the EventEmitter library', function () {
      var EventEmitter = require('events').EventEmitter;
      var fsm = new AwesomeAutomata();
      expect(fsm instanceof EventEmitter).to.equal(true);
    });

    it('Should set the debug function to an empty function if debugging is disabled', function () {
      var fsm = new AwesomeAutomata();
      expect(fsm.debug.toString() === 'function () {}').to.equal(true);
    });

    it('Should set the debug function to a custom function from the config if set', function () {
      var fn = function test() {};
      var fsm = new AwesomeAutomata({
        name: 'my-machine',
        debug: fn
      });

      // Make sure that the function referenced points to the same spot in memory
      expect(fsm.debug === fn).to.equal(true);
    });
  });

  describe('getCurrentState()', function () {
    it('Should return an object describing the state of the machine and the history of the current run', function () {
      var fsm = new AwesomeAutomata( {
        name: 'test-machine',
        debug: false
      });
      var currentState;

      fsm.addState({name: 'initialState', isInitial: true, criteria: ''});
      currentState = fsm.getCurrentState();

      expect(currentState).to.have.ownProperty('state');
      expect(currentState.state).to.be.a('String');
      expect(currentState).to.have.ownProperty('history');
      expect(currentState.history).to.be.an('Array');
    });

    it('Should return the initial state when no input has been received', function() {
      var fsm = new AwesomeAutomata({
        name: 'test-machine',
        debug: false
      });
      var currentState;

      fsm.addState({name: 'initialState', isInitial: true, criteria: 'a simple test'});
      currentState = fsm.getCurrentState();

      expect(currentState.state).to.equal('initialState');
    });

    it('Should return the correct state based on the input sequence', function() {
      var fsm = new AwesomeAutomata({
        name: 'test-machine',
        debug: false
      });
      var currentState;

      fsm.addStates([
        {
          name: 'initialState',
          isInitial: true,
          outgoingTransitions: [
            {
              state: 'secondState',
              criteria: function () {
                return true;
              }
            }
          ]
        },
        {
          name: 'secondState',
          outgoingTransitions: [
            {
              state: 'finalState', criteria: function () {
                return true;
              }
            }
          ]
        },
        {
          name: 'finalState'
        }
      ]);

      fsm.next();

      currentState = fsm.getCurrentState();
      expect(currentState.state).to.equal('secondState');

      fsm.next();

      currentState = fsm.getCurrentState();
      expect(currentState.state).to.equal('finalState');
    });

  });

  describe('getState(name)', function () {
    it('Should retrieve a State instance by name from the graph', function() {
      var fsm = new AwesomeAutomata({
        name: 'test-machine',
        debug: false
      });

      fsm.addStates([
        {
          name: 'initialState',
          isInitial: true
        },
        {
          name: 'secondState'
        },
        {
          name: 'finalState'
        }
      ]);

      expect(fsm.getState('initialState')._name).to.equal('initialState');
      expect(fsm.getState('secondState')._name).to.equal('secondState');
      expect(fsm.getState('finalState')._name).to.equal('finalState');
      expect(fsm.getState('nonExistentState')).to.be.undefined;
    });

  });

  describe('_throwFatalError(msg)', function () {
    it('Should throw an Error exception', function() {
      var fsm = new AwesomeAutomata({
        name: 'test-machine',
        debug: false
      });
      var errorFunc = function() {
        fsm._throwFatalError('test error message');
      };

      expect(errorFunc).to.throw(Error, '[AwesomeAutomata:test-machine] test error message');
    });
  });

  describe('_emitError(msg)', function () {
    it('Should emit an error event with an Error object', function() {
      var spy = sinon.spy();
      var fsm = new AwesomeAutomata({
        name: 'test-machine',
        debug: false
      });

      fsm.on('error', spy);
      fsm._emitError('test error message');

      expect(spy.called).to.equal(true);
      expect(spy.calledWith(new Error('[AwesomeAutomata:test-machine] test error message'))).to.equal(true);
    });
  });

  describe('addStates(states)', function () {
    it('Should add an array of states into the state machine', function() {
      var fsm = new AwesomeAutomata({
        name: 'test-machine',
        debug: false
      });

      fsm.addStates([
        {
          name: 'initialState',
          isInitial: true
        },
        {
          name: 'secondState'
        },
        {
          name: 'finalState'
        }
      ]);

      expect(fsm._states).to.have.ownProperty('initialState');
      expect(fsm._states['initialState']).to.be.an('Object');
      expect(fsm._states).to.have.ownProperty('secondState');
      expect(fsm._states['secondState']).to.be.an('Object');
      expect(fsm._states).to.have.ownProperty('finalState');
      expect(fsm._states['finalState']).to.be.an('Object');
    });
  });

  describe('addState(state)', function () {
    it('Should create a state based on a configuration object', function() {
      var fsm = new AwesomeAutomata({
        name: 'test-machine',
        debug: false
      });
      var testState;

      fsm.addState({
        name: 'initialState',
        isInitial: true,
        isTerminal: false,
        outgoingTransitions : [
          {state: 'secondState', criteria: 'something to test'},
          {state: 'finalState', criteria: 'something else to test'}
        ]
      });

      testState = fsm.getState('initialState');

      expect(testState).to.exist;
      expect(testState._name).to.equal('initialState');
      expect(testState._isInitial).to.equal(true);
      expect(testState._isTerminal).to.equal(false);
      expect(testState._outgoingTransitions).to.be.an('Array');
      expect(testState._outgoingTransitions).to.have.length(2);
    });

    it('Should add that state to the graph', function() {
      var fsm = new AwesomeAutomata({
        name: 'test-machine',
        debug: false
      });

      expect(fsm._states['initialState']).to.be.undefined;

      fsm.addState({
        name: 'initialState',
        isInitial: true
      });

      expect(fsm._states['initialState']).to.exist;

    });

    it('Should prevent duplicate states from being added', function() {
      var fsm = new AwesomeAutomata({
        name: 'test-machine',
        debug: false
      });
      var addFn = function() {
        fsm.addState({
          name: 'initialState'
        });
      };

      addFn();

      expect(addFn).to.throw(Error);

    });
  });

  describe('next(input[, callback])', function () {
    var fsm = new AwesomeAutomata({
      name: 'test-machine',
      debug: false
    });

    before(function() {
      fsm.addStates([
        {
          name: 'initialState',
          isInitial: true,
          outgoingTransitions: [
            {
              state: 'middleState',
              criteria: 'middleState'
            },
            {
              state: 'branchingState',
              criteria: 10
            }
          ]
        },
        {
          name: 'middleState',
          accept: function() {},
          outgoingTransitions: [
            {
              state: 'finalState', criteria: function () {
                return true;
              }
            }
          ]
        },
        {
          name: 'branchingState',
          outgoingTransitions: [
            {
              state: 'finalState', criteria: function () {
                return true;
              }
            }
          ]
        },
        {
          name: 'finalState',
          isTerminal: true
        }
      ]);
    });

    afterEach(function() {
      fsm.reset();
    });

    it('Should transition to the next state based on the input', function() {
      expect(fsm.getCurrentState().state).to.equal('initialState');

      fsm.next('middleState');

      expect(fsm.getCurrentState().state).to.equal('middleState');

      fsm.reset();
      fsm.next(10);

      expect(fsm.getCurrentState().state).to.equal('branchingState');
    });

    it('Should fire a "return" event for any accepting states', function() {
      var spy = sinon.spy();

      fsm.on('return', spy);

      fsm.next(10);
      expect(spy.called).to.equal(false);

      fsm.reset();
      fsm.next('middleState');
      expect(spy.called).to.equal(true);
    });

    it('Should reset the machine when a terminal state is reached', function() {
      expect(fsm.getCurrentState().state).to.equal('initialState');

      fsm.next(10);
      fsm.next();

      expect(fsm.getCurrentState().state).to.equal('initialState');
    });

    it('Should emit an "error" when no valid transitions are found', function() {
      var spy = sinon.spy();

      fsm.on('error', spy);
      fsm.next('invalidInput');

      expect(spy.called).to.equal(true);
    });

    it('Should call the callback asynchronously', function(done) {
      var callbackFn = function() {
        done();
      };
      fsm.next(10, callbackFn);
    });
  });

  describe('_findNextState(input, currentState, previousState)', function () {
    var fsm = new AwesomeAutomata({
      name: 'test-machine',
      debug: false
    });

    before(function () {
      fsm.addStates([
        {
          name: 'initialState',
          isInitial: true,
          outgoingTransitions: [
            {
              state: 'firstMatchingState',
              criteria: 10
            },
            {
              state: 'secondMatchingState',
              criteria: 10
            },
            {
              state: 'anotherState',
              criteria: 20
            }
          ]
        },
        {
          name: 'firstMatchingState'
        },
        {
          name: 'secondMatchingState'
        },
        {
          name: 'anotherState',
          outgoingTransitions: [
            {
              state: 'nonExistentState',
              criteria: 15
            }
          ]
        }
      ]);
    });

    afterEach(function () {
      fsm.reset();
    });

    it('Should loop through the transitions of the current state and compare the input with the criteria functions', function() {
      var next = fsm._findNextState(10, fsm.getState('initialState'), null);

      expect(next.state._name).to.equal('firstMatchingState');

      next = fsm._findNextState(20, fsm.getState('initialState'), null);

      expect(next.state._name).to.equal('anotherState');
    });

    it('Should emit an "error" when a transition uses a non-existent state', function() {
      var spy = sinon.spy();

      fsm.on('error', spy);
      fsm._findNextState(15, fsm.getState('anotherState'), null);

      expect(spy.called).to.equal(true);
    });

    it('Should return the first state with matching criteria (short-circuit)', function() {
      var next = fsm._findNextState(10, fsm.getState('initialState'), null);

      expect(next.state._name).to.equal('firstMatchingState');
    });
  });

  describe('_transition(input, nextState)', function () {
    var fsm = new AwesomeAutomata({
      name: 'test-machine',
      debug: false,
      maxHistory: 3
    });

    before(function () {
      fsm.addStates([
        {
          name: 'initialState',
          isInitial: true,
          outgoingTransitions: [
            {
              state: 'firstMatchingState',
              criteria: 10
            }
          ]
        },
        {
          name: 'firstMatchingState',
          outgoingTransitions: [
            {
              state: 'secondMatchingState',
              criteria: 10
            }
          ]
        },
        {
          name: 'secondMatchingState',
          outgoingTransitions: [
            {
              state: 'thirdMatchingState',
              criteria: 10
            }
          ]
        },
        {
          name: 'thirdMatchingState',
          isTerminal: true
        }
      ]);
    });

    afterEach(function () {
      fsm.reset();
    });

    it('Should update the current state to the given next state', function() {
      var transition = fsm.getState('initialState')._outgoingTransitions[0];

      expect(fsm.getCurrentState().state).to.equal('initialState');

      fsm._transition('', fsm.getState('firstMatchingState'), transition);

      expect(fsm.getCurrentState().state).to.equal('firstMatchingState');
    });

    it('Should add the state to be visited to the history', function() {
      var transition = fsm.getState('initialState')._outgoingTransitions[0];

      expect(fsm._previouslyVisitedStates).to.have.length(0);

      fsm._transition(10, fsm.getState('firstMatchingState'), transition);
      expect(fsm._previouslyVisitedStates).to.have.length(1);
      expect(fsm._previouslyVisitedStates[0].state).to.equal('firstMatchingState');

      transition = fsm.getState('firstMatchingState')._outgoingTransitions[0];
      fsm._transition('', fsm.getState('secondMatchingState'), transition);
      expect(fsm._previouslyVisitedStates).to.have.length(2);
      expect(fsm._previouslyVisitedStates[1].state).to.equal('secondMatchingState');

    });

    it('Should curate the history if the "maxHistory" option is set', function() {
      var transition = fsm.getState('initialState')._outgoingTransitions[0];

      fsm._transition(10, fsm.getState('firstMatchingState'), transition);
      transition = fsm.getState('firstMatchingState')._outgoingTransitions[0];
      fsm._transition('', fsm.getState('secondMatchingState'), transition);
      transition = fsm.getState('secondMatchingState')._outgoingTransitions[0];
      fsm._transition('', fsm.getState('thirdMatchingState'), transition);

      expect(fsm._previouslyVisitedStates).to.have.length(3);
      expect(fsm._previouslyVisitedStates[0].state).to.equal('firstMatchingState');
      expect(fsm._previouslyVisitedStates[1].state).to.equal('secondMatchingState');
      expect(fsm._previouslyVisitedStates[2].state).to.equal('thirdMatchingState');

      transition = fsm.getState('initialState')._outgoingTransitions[0];
      fsm._transition('', fsm.getState('firstMatchingState'), transition);

      expect(fsm._previouslyVisitedStates).to.have.length(3);
      expect(fsm._previouslyVisitedStates[0].state).to.equal('secondMatchingState');
      expect(fsm._previouslyVisitedStates[1].state).to.equal('thirdMatchingState');
      expect(fsm._previouslyVisitedStates[2].state).to.equal('firstMatchingState');
    });

    it('Should emit the change event', function() {
      var spy = sinon.spy();
      var transition = fsm.getState('initialState')._outgoingTransitions[0];

      fsm.on('change', spy);

      fsm._transition(10, fsm.getState('firstMatchingState'), transition);

      expect(spy.called).to.equal(true);
    });

    describe('The "change" event', function () {
      it('Should describe the source and target states of the transition', function() {
        var changeResult;
        var changeFn = function(changeObj) {
          changeResult = changeObj;
        };
        var transition = fsm.getState('initialState')._outgoingTransitions[0];

        fsm.on('change', changeFn);

        fsm._transition(10, fsm.getState('firstMatchingState'), transition);

        expect(changeResult.from).to.equal('initialState');
        expect(changeResult.to).to.equal('firstMatchingState');
        expect(changeResult.input).to.equal(10);
      });
      it('Should contain the history of the machine so far', function() {
        var changeResult;
        var changeFn = function (changeObj) {
          changeResult = changeObj;
        };
        var transition = fsm.getState('initialState')._outgoingTransitions[0];

        fsm.on('change', changeFn);

        fsm._transition(10, fsm.getState('firstMatchingState'), transition);

        expect(changeResult.history).to.be.an('Array');
        expect(changeResult.history).to.have.length(1);
        expect(changeResult.history[0].state).to.equal('firstMatchingState');
      });
    });
  });

  describe('_accept(state)', function () {
    var fsm = new AwesomeAutomata({
      name: 'test-machine',
      debug: false
    });

    before(function() {
      fsm.addStates([
        {
          name: 'initialState',
          isInitial: true,
          outgoingTransitions: [
            {
              state: 'firstMatchingState',
              criteria: 10
            }
          ]
        },
        {
          name: 'firstMatchingState',
          accept: function (input, history) {
            return { value: 'someValue' };
          }
        }
      ]);
    });

    it('Should fire the "return" event', function() {
      var spy = sinon.spy();

      fsm.on('return', spy);
      fsm._accept('firstMatchingState');

      expect(spy.called).to.equal(true);
    });

    it('Should use the given state object to determine the returned value', function() {
      var nextState = fsm._findNextState(10, fsm.getState('initialState'), null).state;
      var acceptValue;
      var returnFn = function(returnValue) {
        acceptValue = returnValue;
      };

      fsm.on('return', returnFn);
      fsm._accept(nextState.accept(fsm._currentState, fsm._previouslyVisitedStates));

      expect(acceptValue).to.exist;
      expect(acceptValue.value).to.equal('someValue');
    });
  });

  describe('reset()', function () {
    var fsm = new AwesomeAutomata({
      name: 'test-machine',
      debug: false
    });

    before(function () {
      fsm.addStates([
        {
          name: 'initialState',
          isInitial: true,
          outgoingTransitions: [
            {
              state: 'middleState',
              criteria: 'middleState'
            },
            {
              state: 'branchingState',
              criteria: 10
            }
          ]
        },
        {
          name: 'middleState',
          accept: function () {
          },
          outgoingTransitions: [
            {
              state: 'secondToLastState', criteria: function () {
              return true;
            }
            }
          ]
        },
        {
          name: 'branchingState',
          outgoingTransitions: [
            {
              state: 'secondToLastState', criteria: function () {
              return true;
            }
            }
          ]
        },
        {
          name: 'secondToLastState',
          outgoingTransitions: [
            {
              state: 'finalState',
              criteria: function() {
                return true;
              }
            }
          ]
        },
        {
          name: 'finalState',
          isTerminal: true
        }
      ]);
    });

    afterEach(function () {
      fsm.reset();
    });

    it('Should set the current state to the initial node', function() {
      fsm.next('middleState');

      fsm.reset();

      expect(fsm.getCurrentState().state).to.equal('initialState');
    });

    it('Should reset the history to an empty array', function() {
      fsm.next(10);
      fsm.next();

      expect(fsm._previouslyVisitedStates).to.have.length(2);

      fsm.reset();

      expect(fsm._previouslyVisitedStates).to.have.length(0);
    });

    it('Should emit a "reset" event', function() {
      var spy = sinon.spy();

      fsm.on('reset', spy);

      fsm.reset();
      expect(spy.called).to.equal(true);
    });

    describe('the "reset" event', function () {
      it('Should have the name of the final state', function() {
        var finalState;
        var resetFn = function(state) {
          finalState = state.finalState;
        };
        var spy = sinon.spy(resetFn);

        fsm.on('reset', spy);
        fsm.next(10);
        fsm.next();
        fsm.reset();

        expect(finalState).to.equal('secondToLastState');
      });
      it('Should have an array of the history of the machine since the last reset', function() {
        var finalHistory;
        var resetFn = function (state) {
          finalHistory = state.path;
        };
        var spy = sinon.spy(resetFn);

        fsm.on('reset', spy);
        fsm.next(10);
        fsm.next();
        fsm.reset();

        expect(finalHistory).to.have.length(2);
        expect(finalHistory[0].state).to.equal('branchingState');
        expect(finalHistory[1].state).to.equal('secondToLastState');
      });
    });
  });
});