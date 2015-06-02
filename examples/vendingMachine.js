/**
 * This demo replicates the classic vending machine FSM example.
 *
 * The premise is as follows:
 *   * The FSM models a vending machine that only has $0.10 candy bars
 *   * When $0.10 is reached it will automatically dispense the candy and change
 *   * Input can only be in the form of coins (limited for simplicity) represented
 *     by floating point monetary value:
 *     * $0.10
 *     * $0.05
 *
 * In this example, $0.10 and $0.15 are terminal and accepting states that return
 * the candy bar and the remaining change.  It is then up to the user of the
 * machine to re-use the change after it has reset to continue purchasing
 * candy.
 */

var AwesomeAutomata = require('../lib/AwesomeAutomata');

var vendingMachine = new AwesomeAutomata({
  name: 'vending-machine',
  debug: true,
  maxHistory: 10
});

vendingMachine.addStates([
  {
    name: '$0.00',
    isInitial: true,

    outgoingTransitions: [
      {state: '$0.05', criteria: 0.05},
      {state: '$0.10', criteria: 0.10}
    ]
  },
  {
    name: '$0.05',
    compare: 0.05,
    outgoingTransitions: [
      {state: '$0.10', criteria: 0.05},
      {state: '$0.05', criteria: 0.10, accept: function (input, history) {
        return {candyBars: 1};
      }}
    ]
  },
  {
    name: '$0.10',
    isTerminal: true,

    // The return value will be the new aggregate value
    accept: function (input, history) {
      return {candyBars: 1};
    }
  }
]);


// Setup event callbacks
vendingMachine.on('change', function (transition) {
  console.log('> Changing state:', transition, '\n');
});

vendingMachine.on('reset', function (info) {
  console.log('> Resetting machine:', info, '\n');
});

vendingMachine.on('return', function (value) {
  console.log('> Hit an accepting state, got:', value, '\n');
});


var info = vendingMachine.getCurrentState();
console.log('> Starting state:', info, '\n'); // {state: '$0.00', history: []}

vendingMachine.next(0.05);
vendingMachine.next(0.10);
vendingMachine.next(0.05);
