/**
 * Represents an automata or state within a Finite State Machine.
 *
 * Provides mechanisms for
 */
function State(config) {
  this._ = require('lodash');

  this._name = config.name;
  this._isInitial = config.isInitial;
  this._isTerminal = config.isTerminal;
  this._outgoingTransitions = config.outgoingTransitions;

  this.accept = config.accept;

  this._validateConfig(config);

  // Transform any value-based transition criteria to be a function
  this._.forEach(this._outgoingTransitions, function (transition) {
    var criteria = transition.criteria;

    // Replace the value-based criteria with a simple comparison function
    if (typeof criteria !== 'function') {
      transition.criteria = function (input) {
        return (input === criteria);
      }
    }
  });
}

/**
 * Ensure that the configuration for this state is valid using a static class
 * method
 */
State.prototype._validateConfig = function validateConfig(config) {
  if (!config.name || typeof config.name !== 'string') {
    throw new Error('[AwesomeAutomata] States must have a name');
  }

  if (config.isInitial && config.isTerminal) {
    throw new Error(
      '[AwesomeAutomata:' + config.name + '] ' +
      'States cannot be both a terminal node and the root node.'
    );
  }

  if (config.outgoingTransitions && !(config.outgoingTransitions instanceof Array)) {
    throw new Error(
      '[AwesomeAutomata:' + config.name + '] ' +
      'A state\'s outgoing transitions must be specified by an array.'
    );
  }

  // Check that all of the outgoing transitions have some sort of comparison to
  // validate input transitioning to the next state
  this._.forEach(config.outgoingTransitions, function (transition) {
    if (!transition.state || typeof transition.state !== 'string') {
      throw new Error(
        '[AwesomeAutomata:' + config.name + '] ' +
        'All outgoing transitions must have a target state ' +
        'specified by name.'
      );
    }

    if (!transition.criteria) {
      throw new Error(
        '[AwesomeAutomata:' + config.name + '] ' +
        'All outgoing transitions must have some criteria for' +
        'transition. The following did not have one transition: ' + transition.state
      );
    }
  });


  if (config.isTerminal && config.outgoingTransitions) {
    throw new Error(
      '[AwesomeAutomata:' + config.name + '] ' +
      'States cannot be terminal and have outgoing transitions'
    );
  }

  if (config.accept && typeof config.accept !== 'function') {
    throw new Error(
      '[AwesomeAutomata:' + config.name + '] ' +
      'Accept methods within a state must be a function'
    );
  }
};

/**
 * Getter for the state name
 */
State.prototype.getName = function getName() {
  return this._name;
};

/**
 * Is this the root node?
 */
State.prototype.isInitial = function isInitial() {
  return this._isInitial;
};

/**
 * Does this node reset the machine?
 */
State.prototype.isTerminal = function isTerminal() {
  return this._isTerminal;
};


/**
 * Return a copy of this state's outgoing transitions
 */
State.prototype.getTransitions = function getTransitions() {
  return this._outgoingTransitions;
};


module.exports = State;

