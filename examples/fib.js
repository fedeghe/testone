const testone = require('../dist/index')
// 
// 0 1 1 2 3 5 8 13 21 34 54
//
const fibRecursive = n => {
        if (n <= 1) return n
        return fibRecursive(n - 1) + fibRecursive(n - 2);
    },
    fibIterative = n => {
        if( n <= 1) return n; // base case
     
        var prev2 = 0,
            prev1 = 1,
            next = prev1 + prev2;
     
        for (var i=2; i<=n; ++i) {
            next = prev1 + prev2;
            prev2 = prev1;
            prev1 = next;
        }        // return final calculated value
        return next;
    },
    ios = [
        { in: [0], out: 0 },
        { in: [1], out: 1 },
        { in: [4], out: 3 },
        { in: [10], out: 55 },
        { in: [25], out: 75025 },
    ];

    // one or an array of function to test
 testone(
    ios,
    [fibRecursive, fibIterative],
    {
        metrics: {
            fk: ({time: {single: time}, mem: {single: mem}}) => time * mem,
            fkk: ({time: {single: time}, mem: {single: mem}}) => time * mem**2
        }
    }
).then(r => console.log(JSON.stringify(r, null, 2)));

