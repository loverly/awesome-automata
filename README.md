# Awesome Automata

This is a general purpose [finite state machine](http://en.wikipedia.org/wiki/Finite-state_machine) 
implementation meant to take a series of inputs, apply the appropriate transitions,
and reach a set of __final__ or __accepting__ states and terminal states that
reset the machine.

For circular machines like stop lights, there is an option to limit the maximum 
history retained to prevent a memory blow-out over time. 

This FSM extends the Node.js EventEmitter core class.  The events and their details
are described in the [API Reference](#api-reference).


# Don't We Have Enough Robots?

I built this library to:

1. Make defining the states of the machine easy but robust enough to handle most
   situations
1. Provide a generic interface for utilizing the machine

As part of the generic interface - there's only a `next(input)` method and I assume
that the states defined know how to deal with the arbitrary input.  This is in
contrast to the popular state machine library [Machina.js](http://machina-js.org/),
which favors code readability by providing custom method names per machine.

My specific motivation was to build an FSM that can support a streaming lexer for
a custom Markdown parser that we have in the works.  Most parsers I found were
not stream-friendly (using a ton of regular expressions) which would be CPU
intensive in a high-traffic environment with decent-sized input files.

That's also why this library is not browser friendly at this time.  In the future
I could see adding a build step that would resolve/remove the lodash dependency and
combine and minify the source files, but I have no use for that currently.  I'd
like to see how the library evolves over time before investing in that step.


# How is this easier to use?

States are defined via objects (and can be added in batch or one-by-one).  They
follow the format:

```javascript
var fsm = new AwesomeAutomata({name: 'generic', debug: true});

fsm.addStates([{
  name: 'my-state-name', // For transition targets - must be unique

  // Determines if this state has a return value
  accept: function (input, history) {
    return {/* Some object representing the return value */};
  },
  
  // The root node of the graph - only one allowed per graph
  isInitial: true, 
  
  // Flag whether or not we should return to the root node upon completion
  // This will throw an error if there are outgoing transitions defined when
  // this is marked as true
  isTerminal: false,
  
  // An array that is traversed in-order to determine the next state.
  // The comparisons exercise short-circuit behavior, exiting whenever the
  // matching state is reached.
  //
  // Ideally the state machine will be deterministic (for every input there is
  // one and only one transition) but there is no way to validate that without
  // actually executing all transitions.
  // 
  // If possible, ordering the most popular states at the top will cause the
  // state machine to be slightly faster (but only marginally so).
  outgoingTransitions: [
    // States can be self-referencing
    {state: 'my-state-name', criteria: 'something'},
     
    // The criteria can be a value (verified by ===) or a custom function that
    // takes the current input and the previous state.  Should return a boolean
    // to say whether or not this is the correct transition
    {state: 'my-other-state', criteria: function (input, previousState) { 
      return !!input; 
    }},
    
    // As part of the outbound transition - fire a `return` event as a transition
    // action
    {state: 'my-return-on-transition-state', criteia: 123, accept: function (input, previousState) {
      return 'something cool';
    }};
  ]
}]);
```

The incremental addition of states via the `addState()` method allows the graph
to be built dynamically by another library (such as a lexer wrapper like 
[lexerific](https://github.com/loverly/lexerific)).


# How does it work?

As input enters into the machine, the machine checks the input against the transitions
defined by the current state.  If it finds a transition that matches the given
input (as well as information about the previous state) then the state machine
updates its current state and history.

For _final_ or _accepting_ states, whenever they are called they fire the `accept()`
method and ultimately the `return` event or - in the case of using the stream
mode - passes the object to the outgoing stream.  These do not necessarily need
to be final states - however, be warned, non-terminating accepting states in a 
lexer does not make any sense, but may make sense in other contexts.

After transitioning states to the current state, state information is updated, 
then the next input value is processed.  The machine emits a `transition` event
whenever the machine changes state and provides information about the current
state of the machine including an array of states previously visited.

An exception (`error` event) is emitted when there are not matching transitions
for a given input.  State machines should be deterministic and should cover
all possible input values for a given state.



# Can I visualize the diagram?

Not yet... you'll have to make-do with debugging for now.

__TODO:__ Create a formatter that visits all possible states and creates a DOT
language file that can be used in conjunction with a lib like GraphViz to create
a visual hierarchy.


# API Reference

# AwesomeAutomata

The main class - what is returned from `require('awesome-automata')`.

`AwesomeAutomata` is a subclass of the Node.js `EventEmitter` library and emits
the following events:

* `error` - Fired for runtime errors that affect a particular state (like
  invalid or no outbound transitions)
* `reset` - Emitted whenever the machine is reset to its initial state, either
             after an error or after a terminal state
* `return` - Returns a value based on the accepting state's accept method.
  Fired whenever the state machine enters an accepting state.
* `change` - Marks a transition between states

For fatal errors - the state machine will throw exceptions (when a state is
defined in an unusable way).  For runtime issues (like a bad input or bad
transition), the machine will emit an `error` event.

If you are dynamically creating a machine on unvalidated input - be careful to
wrap `addState()` or `addStates()` calls in a `try / catch` block or your app
may crash.  OR even better, provide validation so you can ensure that states
are valid.


## constructor(config)

```javascript
var fsm = new AwesomeAutomata({
  name: 'my-machine-name',
  debug: true,
  maxHistory: 10
});
```

Options:

* `name` - For debugging purposes, the name of the state machine
* `debug` - Either `true` to enable console output or a function to handle debug 
  info
* `maxHistory` - Throw away the state transition history after a certain number
  of steps.  Useful for circular machines that may never reset. 


## getState()

Returns the current state of the machine

```javascript
fsm.getState(); // {state: 'my-state', history: [{state: 'other', input: 1}, ... ]}
```

## addState(stateConfig)

Add a node and set of edges to the state machine's graph via a configuration object.

Options:

* `name` - Must be unique.  Used as a key for transitions between states.
* `isIntitial` - This node is the starting node when the state machine is first
  run or when it is reset
* `isTerminal` - When the machine reaches this node, the machine is reset (all
  values and history are erased, state set to the initial node)
* `accept` - A method for a state that emits a returned value
* `outgoingTransitions` - Each state only tracks outbound connections.  This must
  be an array and should contain objects that have the properties:
  * `state` - The name of target state this edge is connecting to
  * `criteria` - Either a primitive (which will be compared with the input via
    `===` strict equality, or a function that accepts `(input, previousState)`
    as parameters and returns a boolean value indicating whether or not this
    transition matches the input and the current state.
  * `accept` - A function that will return a value based on the current state,
    input, and anticipated transition.



## addStates(arrayOfStates)

The same as `addState()` except it accepts an array of state configuration objects
versus a single object.


## next(input[, callback])

Inputs are completely arbitrary, as long as the state definitions can deal with
it, anything goes.  The only caveat is that they must be complete, in the sense
that each input corresponds to one state transition (even if it is self-referencing
to the current state).  Every valid input must have a corresponding transition
from the current state to another target state.  If there is no transition, an
`error` event is emitted.

Optionally a callback can be passed, which will be called after the transition
has occurred.  The callback call will be wrapped in a `setImmediate()` call,
allowing events to be handled before the next input is called (if that matters
to you).

This is especially useful if you are feeding your input from a synchronous source.
Without either passing a callback to use a recursive loop to control your input
flow or explicitly releasing the event loop, your machine will not process any
events until all the input has been entered into the machine.  Causing much
weirdness.


## reset()

You can forcibly reset the machine by calling `fsm.reset()`.  Note, this will
still fire a `reset` event.

Resetting the machine brings it back to the initial node and erases any history
and the previous state.  Terminal states have the same effect.