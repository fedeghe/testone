[![Coverage Status](https://coveralls.io/repos/github/fedeghe/testone/badge.svg?branch=master)](https://coveralls.io/github/fedeghe/testone?branch=master)
## testone (v. 0.0.19)

Quickly test performance and correctness of one or more functions against input/output data.  

```
testone(
    *ios <[literal object]>,
    *strategies <ƒn OR [ƒn]>,
    options <literal object>
);
```
where:
- `io` must be an array of object literal keyed as follows:  
    - `in` keyed element which can be either
        - array for the function inputs 
        - a function supposed to return an array to be used as input values
    - `out` keyed element which can be either
        - a static value  
        - a function that will receive what is returned from the strategy (plus io index and iteration)  
        and it's supposed to return a _boolean_ representing the test outcome
- `strat` the function of the array of functions one wants to check


``` js 
const pow = (d, n) => d ** n,
    powN = (d, n) => Math.pow(d, n),
    ios = [{
        in: [2, 3],
        out: 8
    },{
        in: [4, 3],
        out: 64
    },{
        in: (ioIndex, iteration) => {
            return [ioIndex, iteration]
        },
        // in case a function is specified
        // will receive the whole result (+ io index and iteration)
        // and is expected to return true
        out: (r, ioIndex, iteration) => r === ioIndex ** iteration
    }];

// one function or an array of functions to test
var res = testone(ios, [pow, powN], {iterations: 1e6});
```

and `res` will contain something like: 

``` json 
{
    "times": {
        "powN": {
            "withLabel": "770 ns",
            "raw": 0.00077 // ms
        },
        "pow": {
            "withLabel":"859 ns",
            "raw": 0.000859 // ms
        }
    },
    "passing": { "pow": true, "powN": true },
    "mem": {
        "pow": {
            "withLabel": "0.1533 B",
            "raw": 0.1533 // Bytes
        },
        "powN": {
            "withLabel": "0.3801 B",
            "raw": 0.3801 // Bytes
        },
    },
    "metrics": {}
}
```

---
### Iterations (1k default)
To get a more accurate times & memory measurerements by default _testone_ runs each function 1k times  
but clearly enough this could not fit some all cases (exactly as above). 

For this reason is possible to specify in the third `options` literal object an integer parameter keyed `iterations`  

---
### Metrics

In the results ss an empty object by default but can contain some additional data we might want to compute out of the results:    
for example we could have a mixed indication fo the _memory consumption_ and _time spent_ in **one single value** passing in the options one (or more) function(s):
``` js
{ // in metrics
    /* will be invoked passing 
    {
        time: float ms,
        passing: boolean,
        mem: float in Bytes,
        rank: integer
    }
    */
    aLabel: ({time, mem}) => time * mem
}
```
and now in the returned metrics object we'll find something like:
``` json
"aLabel": {
    "pow": 0.00012342,
    "powN": 0.00923412
} 
```

---

🤟 last build on 9/2/2023  
