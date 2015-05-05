/**
 * This machine represents a stop light that is a circular state machine with
 * no accepting or terminal states.  Without the `circular` and `maxHistory`
 * options, the list of past states would grow infinitely.  The `maxHistory`
 * forces the machine's history to act more like a FIFO queue where each new
 * state past the max length will push an item out of history.
 *
 * The input in this machine actually does not matter, it just triggers the
 * state machine to transition to the next state.  The `red` and `green` states
 * have only one catch-all transition, but the yellow state determines its next
 * state by inspecting the previous state.
 *
 */

var AwesomeAutomata = require('../lib/AwesomeAutomata');

var stoplight = new AwesomeAutomata({
  name: 'stoplight',
  debug: true,
  maxHistory: 3
});

stoplight.addStates([
  {
    name: 'red',
    isInitial: true,

    outgoingTransitions: [
      {state: 'yellow', criteria: function () { return true; }}
    ]
  },

  // The yellow state inspects the previous state to determine what the next
  // state should be

  {
    name: 'yellow',
    outgoingTransitions: [
      {state: 'green', criteria: function (input, previousState) {
        return (previousState.getName() === 'red');
      }},
      {state: 'red', criteria: function (input, previousState) {
        return (previousState.getName() === 'green');
      }}
    ]
  },
  {
    name: 'green',
    outgoingTransitions: [
      {state: 'yellow', criteria: function () { return true; }}
    ]
  }
]);


// Setup event callbacks
stoplight.on('change', function (transition) {
  console.log('> Changing state:', transition, '\n');
});

stoplight.on('reset', function (info) {
  console.log('> Resetting machine:', info, '\n');
});

stoplight.on('return', function (value) {
  console.log('> Hit an accepting state, got:', value, '\n');
});


var count = 0;
var intervalId = setInterval(function () {
  stoplight.next(new Date());
  count++;

  if (count > 10) {
    clearInterval(intervalId);
  }
}, 100);
