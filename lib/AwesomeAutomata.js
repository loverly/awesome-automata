var util = require('util');
var EventEmitter = require('events').EventEmitter;
var State = require('./State');

/**
 * A
 *
 * Note: Throws exceptions for an invalid initial configuration of the machine.
 * If the machine is based off of dynamic input, the caller is responsible for
 * building the necessary validation (or try/catch logic) to successfully build
 * the state machine.
 *
 * Events:
 *   * `error` - Fired for runtime errors that affect a particular state (like
 *     invalid or no outbound transitions)
 *   * `reset` - Emitted whenever the machine is reset to its initial state, either
 *     after an error or after a terminal state
 *   * `return` - Returns a value based on the accepting state's accept method.
 *     Fired whenever the state machine enters an accepting state.
 *   * `change` - Marks a transition between states
 */
function AwesomeAutomata(config) {
  var _this = this;

  // Extend the event emitter interface
  EventEmitter.call(this);

  // Use an instance method to make it easier to mock for testing
  this._ = require('lodash');

  this.name = config.name; // Helpful for debugging purposes

  // Set a max history to store for circular diagrams that may never terminate/
  // reset to prevent a massive memory buildup
  this._maxHistory = config.maxHistory;

  // Whenever the initial state is reached, reset the history
  this._resetAtRoot = config.resetAtRoot;

  /**
   * States are stored in a hash for fast reference and duplicate checks
   */
  this._states = {};

  // Keep track of the starting point which leads to all other nodes in the
  // graph
  this._rootNode = null;

  this._previousState = null;
  this._currentState = null;
  this._previouslyVisitedStates = [];

  // DEBUGGING

  this.debug = function () {}; // No-op for default debugger

  if (!config.debug) {
    return this;
  }

  // Allow for custom debugging methods
  if (typeof config.debug === 'function') {
    this.debug = config.debug;
    return this;
  }

  // Provide a wrapper around console.log()
  this.debug = function debug () {
    var args = arguments.slice(); // Copy args
    args.unshift('[AwesomeAutomata:' + _this.name + ']');

    console.log.apply(console, args);
  };
}

util.inherits(AwesomeAutomata, EventEmitter);

/**
 * Get the current status of the state machine
 */
AwesomeAutomata.prototype.getState = function getState() {
  return {state: this._currentState.getName(), history: this._previouslyVisitedStates};
};

/**
 * Provide a convenient way to throw exceptions with the appropriate library
 * label.  These fatal errors should kill the application because they should
 * be preventable and the FSM will not be able to function if any of these
 * issues go unresolved.
 */
AwesomeAutomata.prototype._throwFatalError = function throwFatalError(msg) {
  throw new Error('[AwesomeAutomata:' + this.name + '] ' + msg);
};

/**
 * Standardize the error emission.  Eventually this could be a custom error class
 * vs just a plain error object.
 */
AwesomeAutomata.prototype._emitError = function emitError(msg) {
  this.emit('error', new Error('[AwesomeAutomata:' + this.name + '] ' + msg));
};

/**
 * Convenience method for adding an array of states to the machine.
 */
AwesomeAutomata.prototype.addStates = function addStates(states) {
  if (!(states instanceof Array)) {
    this._throwFatalError('addStates() must be called with an array of states');
  }

 this._.forEach(states, this.addState.bind(this));
};

/**
 * Create a state instance and add it to the known states.  A given name can
 * only be used once per state machine.
 */
AwesomeAutomata.prototype.addState = function addState(stateConfig) {
  var state = new State(stateConfig);

  if (this._states[state.getName()]) {
    this._throwFatalError('The state "' + state.name + '" has already been defined.');
  }

  this._states[state.getName()] = state;

  // Check if this state is the root node (the starting point whenever the
  // machine is reset)
  if (state.isInitial()) {
    if (this._rootNode) {
      this._throwFatalError('Cannot redefine root node with state: ' + state.getName());
    }

    this._rootNode = state;

    // Set the current state of the machine upon initialization
    this._currentState = this._rootNode;

    // Add a record of the state machine having visited the root node
    this._previouslyVisitedStates = [{
      state: this._rootNode.getName(),
      input: null
    }];
  }

  return this; // Provide chainability
};

/**
 * Receive an input and update the state of the machine appropriately.  Handles
 * special cases like terminal states (which reset the machine) and accepting
 * states that
 */
AwesomeAutomata.prototype.next = function next(input, callback) {
  if (!this._currentState) {
    this._throwFatalError('Cannot start processing data without a starting state.');
  }

  var _this = this;
  var currentState = this._currentState;
  var edge = this._findNextState(input, currentState, this._previousState);
  var nextState = edge.state;
  var transition = edge.transition;
  var resetValue;
  var acceptValue;
  var transitionInfo;

  // No valid transition was found out of this node
  // The machine's state has now become invalid and must be reset
  if (!nextState) {
    this._emitError(
      'Cannot find valid transition from: "' + currentState.getName() + '" ' +
      'with input: ' + JSON.stringify(input)
    );

    resetValue = this.reset();
    return callback({reset: resetValue});
  }

  // Call the accept method of the state to find the return value of this node
  // if it exists
  if (typeof nextState.accept === 'function') {
    acceptValue = this._accept(
      nextState.accept(input, this._previouslyVisitedStates.slice())
    );
  }

  transitionInfo = this._transition(input, nextState, transition); // Visit the next state

  // If this is an end state - reset the FSM
  if (nextState.isTerminal() || (nextState.isInitial() && this._resetAtRoot)) {
    resetValue = this.reset();
  }

  // Make successive calls to next asynchronous - passes all of the emitted
  // event information to the callback so it is possible to rely completely on
  // the callback for making decisions
  if (typeof callback === 'function') {
    setImmediate(function () {
      callback({
        accept: acceptValue,
        reset: resetValue,
        currentState: _this._currentState.getName(),
        history: _this._previouslyVisitedStates,
        transition: transitionInfo
      })
    });
  }

  return this;
};

/**
 * Loops through the outbound transitions and identifies the next state using
 * the input and the next state's compare method.
 *
 * NOTE: States have a short-circuit behavior where they exit without testing
 * all possible outbound transitions.  This may lead to non-deterministic
 * behavior if more than one state matches for a given input.
 *
 * Returns the state and the associated transition
 */
AwesomeAutomata.prototype._findNextState = function findNextState(input, currentState, previousState) {
  var _this = this;
  var next = {state: null, transition: null};

  // Loop through the possible transitions for the current state to find the
  // next state
  this._.forEach(currentState.getTransitions(), function (transition) {
    var state = _this._states[transition.state];

    if (!state) {
      // The machine is broken, an edge leads to a non-existent node
      _this._emitError(
        'The current state: "' + currentState.getName() + '" specified an ' +
          'outbound transition that does not exist: "' + transition.state + '"'
      );

      return false; // Exit early from the loop without setting the next state
    }

    // Use each transition's compare method to ascertain whether or not the value
    // of the input matches the state
    if (transition.criteria(input, previousState)) {
      next.state = state;
      next.transition = transition;
      return false; // Short-circuit the loop
    }
  });

  return next;
};

/**
 * Update the state of the machine.
 *
 * Some transitions have an associated accept action, which should be called
 * when exercising the transition
 */
AwesomeAutomata.prototype._transition = function transition(input, nextState, transition) {
  var previousState = this._currentState;
  var transitionInfo;
  var transitionAction;

  // Check if the transition has an associated action and fire it before updating
  // the state of the machine
  if (typeof transition.accept === 'function') {
    transitionAction = this._accept(
      transition.accept(input, this._previouslyVisitedStates.slice())
    );
  }

  this._previousState = previousState;
  this._currentState = nextState;
  this._previouslyVisitedStates.push({state: nextState.getName(), input: input});

  // Remove elements from the head of the FIFO queue
  if (this._maxHistory && this._previouslyVisitedStates.length > this._maxHistory) {
    this._previouslyVisitedStates.shift();
  }

  transitionInfo = {
    from: previousState.getName(),
    to: nextState.getName(),
    history: this._previouslyVisitedStates,
    action: transitionAction
  };

  this.emit('change', transitionInfo);
  return transitionInfo;
};

/**
 * Emit a returned object from the machine from an accepting state.  Do not emit
 * anything if the value returned was specifically undefined.
 *
 * TODO: In the future an accepting state or transition action should be able to
 * TODO: emit multiple return objects
 */
AwesomeAutomata.prototype._accept = function accept(value) {
  if (typeof value !== 'undefined') {
    this.emit('return', value);
  }

  return value;
};

/**
 * Properly resets the internal state of the machine to match the initial state
 */
AwesomeAutomata.prototype.reset = function reset() {
  var finalState = this._currentState;
  var history = this._previouslyVisitedStates;

  this._previousState = null;
  this._currentState = this._rootNode;
  this._previouslyVisitedStates = [{state: this._rootNode.getName(), input: null}];

  var resetValue = {finalState: finalState.getName(), history: history};
  this.emit('reset', resetValue);
  return resetValue;
};


module.exports = AwesomeAutomata;