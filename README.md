# Awesome Automata

This is a general purpose [finite state machine](http://en.wikipedia.org/wiki/Finite-state_machine) 
implementation meant to take a stream of input, apply the appropriate transitions,
and reach a set of __final__ or __accepting__ states and terminal states that
reset the machine.


# Don't We Have Enough Robots?

There were two primary motivating factors for creating this utility:

1. Implement a general purpose streaming Finite State Automata (that actually
   implements the Node.js [streams API](https://nodejs.org/api/stream.html)
1. Make specifying the transition function for the machine easier

The reason the streaming portion is so crucial to this implementation is that it
is geared towards a streaming lexer, meant to gather a stream of input and
transform that input stream into an output stream of tokens.  As of this
library's creation (May 2015) no popular Node.js streaming FSM implementations
exist.

More specialized implementations of Finite State Machines include:

* [Machina.js](http://machina-js.org/) - Specializes the machine with transition
  functions with names based on the machine's DSL (`vehicleSignal.pedestrianWaiting();`).


# How is this easier to use?

Focusing on its origins as the basis for a lexer, the basic options for specifying
a state graph for a lexer is simple:


```javascript

var fsm = new AwesomeAutomata({
  mode: 'lexer',
  
  // Lexer specific configuration:
  // Provide a list of final nodes that return tokens
  // The state machine will automatically create intermediate states and create
  // a giant graph that connects all of the nodes
  lexemes: [
    // Describe the terminal and provide a function that will create the appropriate
    // attribute value from the raw string
    {terminal: '_', name: 'em-marker', attributeValue: function (token) { return token; }},
    {terminal: '__', name: 'strong-marker', attributeValue: null},
    {terminal: '*', name: 'em-marker', attributeValue: function (token) { return token; }},
    {terminal: '**', name: 'strong-marker', attributeValue: null},

    // ...
  ]
});

```

Defining a more general purpose state graph is a little more complicated (but is
what the `lexer` mode does for you under the hood) and requires you to explicitly
map the state transitions.

The general mode also allows you to specify an input
 
 
```javascript
var fsm = new AwesomeAutomata({mode: 'generic'});

fsm.addStates([{
  name: 'my-state-name', // For names and for creating the diagram

  // Whether or not the input matches this state
  compare: function (input) {
    return boolean;
  },
  
  // Determines if this state is a final state
  accept: function (aggregateValue, input, visitedStates) {
    this.accept({/* Some object representing the return value */});
  },
  
  // The root node of the graph
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
    {state: 'self'}, // Special state transition to indicate a loop
    {state: 'my-other-state'}
  ]
}]);
```


# How does it work?

As input enters into the machine, the machine consistently looks ahead 1 chunk
to determine what the next state should be.

For each outgoing transition it runs the compare function to understand if the
input element belongs to this state (`true` or `false`).  If the value in
compare is a literal, it does a `===` comparison with the input value to verify
if the state is a match.

For _final_ or _accepting_ states, whenever they are called they fire the `accept()`
method and ultimately the `accept` event or - in the case of using the stream
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
language file that can be used in conjunction with GraphViz.

