var chai = require('chai');
var expect = chai.expect;

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
    it('Should an object describing the state of the machine and the history of the current run');
    it('Should return the initial state when no input has been received');
    it('Should return the correct state based on the input sequence');
  });

  describe('getState(name)', function () {
    it('Should create a state based on a configuration object');

  });

  describe('_throwFatalError(msg)', function () {
    it('Should throw an Error exception');
  });

  describe('_emitError(msg)', function () {
    it('Should emit an error event with an Error object');
  });

  describe('addStates(states)', function () {
    it('Should add an array of states into the state machine');
  });

  describe('addState(state)', function () {
    it('Should create a state based on a configuration object');
    it('Should add that state to the graph');
    it('Should prevent duplicate states from being added');
  });

  describe('next(input[, callback])', function () {
    it('Should transition to the next state based on the input');
    it('Should fire a "return" event for any accepting states');
    it('Should reset the machine when a terminal state is reached');
    it('Should emit an "error" when no valid transitions are found');
    it('Should call the callback asynchronously');
  });

  describe('_findNextState(input, currentState, previousState)', function () {
    it('Should loop through the transitions of the current state and compare the input with the criteria functions');
    it('Should emit an "error" when a transition uses a non-existant state');
    it('Should return the first state with matching criteria (short-circuit)');
  });

  describe('_transition(input, nextState)', function () {
    it('Should update the current state to the given next state');
    it('Should add the state to be visited to the history');
    it('Should curate the history if the "maxHistory" option is set');
    it('Should emit the change event');

    describe('The "change" event', function () {
      it('Should describe the source and target states of the transition');
      it('Should contain the history of the machine so far');
    });
  });

  describe('_accept(state)', function () {
    it('Should fire the "return" event');
    it('Should use the given state object to determine the returned value')
  });

  describe('reset()', function () {
    it('Should set the current state to the initial node');
    it('Should reset the history to an empty array');
    it('Should emit a "reset" event');

    describe('the "reset" event', function () {
      it('Should have the name of the final state');
      it('Should have an array of the history of the machine since the last reset');
    });
  });
});