[![Coverage Status](https://coveralls.io/repos/github/fedeghe/testone/badge.svg?branch=master)](https://coveralls.io/github/fedeghe/testone?branch=master)
## testone (v. $PACKAGE.version$)

Quickly test performance and correctness of one or more functions against a benchmarking set.  

```
testone(
    benchs <Array of bench>,
    strat <function or Array of functions>
);
```
where:
- `bench` is a simple object literal composed by:  
    - `in` keyed array for the function inputs 
    - `out` keyed element which can be either:  
        - a static value  
        - a function that will receive what is returned from the strategy  
        and it's supposed to return a _boolean_ representing the test outcome
- `strat` the function of the array of functions one wants to check


``` js 
const pow = (d, n) => d ** n,
    powN = (d, n) => Math.pow(d, n),
    benchs = [{
        in: [2, 3],
        out: 8
    },{
        in: [2, 10],
        // in case a function is specified
        // will receive the whole result
        // and is expected to return true
        out: r => r === 1024
    }];

// one or an array of function to test
var res = testone(benchs, [pow, powD], {iterations: 1e6});
```

and `res` will contain something like: 

``` json 
{
  times: { powN: '770 ns', pow: '859 ns' },
  passing: { pow: true, powN: true },
  mem: { pow: '0.1533 B', powN: '0.3801 B' },
  rank: [ 'powN', 'pow' ],
  fx: { powN: 0.00029265544, pow: 0.000131715624 }
}
```

here `fx`   
aims to give an extended quick metric considering the `memory employed * time spent`

---
## Iterations (1k default)
To get a more accurate times & memory measurerements by default _testone_ runs each function 1k times  
but clearly enough this could not fit some all cases (exactly as above). 

For this reason is possible to specify in the third `options` literal object an integer parameter keyed `iterations`  

---

🤟 last build on __DATE__  
