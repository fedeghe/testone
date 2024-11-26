[![Coverage Status](https://coveralls.io/repos/github/fedeghe/testone/badge.svg?branch=master)](https://coveralls.io/github/fedeghe/testone?branch=master)
## @fedeghe/testone (v. 0.2.15)

Quickly test performance and correctness of one or more functions against input/output data.  

``` js  
// factorial implementation one
const factorialRecursive = n => {
    if (n === 1) return 1;
    else return n * factorialRecursive(n - 1);
}

// factorial implementation two
const factorialIterative = n => {
    let r = n;
    while (n > 1) r *= --n;
    return r
};

// factorial implementation three
const factorialCache = []
const factorialMemoized = n => {
    if (!factorialCache[n]) {
  	    factorialCache[n] = n <= 1 ? 1 : n * factorialMemoized(n - 1);
    }
    return factorialCache[n];
}
 
/**
 * Run the test
 */
const res = await testone([{
        in: [20],
        out: 2432902008176640000
    }, {
        in: [21],
        out: () => 2*3*4*5*6*7*8*9*10*11*12*13*14*15*16*17*18*19*20*21
    }, {
        in: ({iteration}) => [iteration+1],
        out: ({iteration}) => {let r = 1, i = iteration + 1; while(i > 0)r *= i--; return r;}
    }],
    [factorialRecursive, factorialIterative, factorialMemoized]
)

assert(
...
```
where:
- **1<sup>st</sup> parameter**: an array of object literal keyed as follows:  
    - **`in`** keyed element which can be either
        - array for the function inputs 
        - a function supposed to return an array to be used as input values (invoked passing `{benchIndex, iteration}`)
    - **`out`** keyed element which can be either
        - a static value  
        - a function invoked passing `{received, benchIndex, iteration}` supposed to return the expected output
    - _`matcher`_   
        by default _testone_ compares the expected output with the result using the exact match of the parts stringifycation:  
        ``` js
        JSON.stringify(expected) === JSON.stringify(received)
        ```   
        but in some cases where more flexibility is needed for a specific bechmark element, with this option is possible to override the matching function (which is anyway expected to return a boolean), e.g.:
        ``` js
        matcher: ({expected, received}) => received.length === expected.length 
        ```  

- **2<sup>nd</sup> parameter**: the function or the array of functions one wants to test & check  
    **VERY IMPORTANT**: reports as of now need functions to be named; so if the suicide hero in you is urged to beat a function from `_` be sure to wrap the `_` function and name it before running the test. Could be something like:
    ``` js
    function _Clone(o){return _.clone(o))}
    ```
- _3<sup>rd</sup> parameter_:  
    ```
    {
        iterations: <Integer>,
        matcher: <function>,
        metrics: <object literal containing keyed functions>,
        plugins: <Array[{fn: <function>, options: <object literal>}]>
    }  
    ```
    more info below about the 3<sup>rd</sup> and 4<sup>th</sup> optional parameters.

### What out?  
- check of the correctness
- some relevant numerical performance informations

    <details>
    <summary>click to see how the output will look alike when everything runs smoothly</summary>

    ``` js  
    {
        "times": {
            "factorialRecursive": {
                "raw": {
                    "single": 0.0028,
                    "total": 28
                },
                "withLabel": {
                    "single": "2.8 µs",
                    "total": "28 ms"
                }
            },
            "factorialIterative": {
                "raw": {
                    "single": 0.0007,
                    "total": 7
                },
                "withLabel": {
                    "single": "700 ns",
                    "total": "7 ms"
                }
            },
            "factorialMemoized": {
                "raw": {
                    "single": 0.0006,
                    "total": 6
                },
                "withLabel": {
                    "single": "600 ns",
                    "total": "6 ms"
                }
            }
        },
        "mem": {
            "factorialRecursive": {
                "raw": {
                    "single": 101.2392,
                    "total": 1012392
                },
                "withLabel": {
                    "single": "101.2392 B",
                    "total": "988.6641 KB"
                }
            },
            "factorialIterative": {
                "raw": {
                    "single": 81.624,
                    "total": 816240
                },
                "withLabel": {
                    "single": "81.624 B",
                    "total": "797.1094 KB"
                }
            },
            "factorialMemoized": {
                "raw": {
                    "single": 114.0096,
                    "total": 1140096
                },
                "withLabel": {
                    "single": "114.0096 B",
                    "total": "1.0873 MB"
                }
            }
        },
        "ops": {
            "factorialRecursive": 357142.85714285716,
            "factorialIterative": 1428571.4285714286,
            "factorialMemoized": 1666666.6666666667
        },
        "passing": true,
        "report": {
            "factorialRecursive": true,
            "factorialIterative": true,
            "factorialMemoized": true
        },
        "metrics": null,
        "pluginsResults": {}
    }
    ```
    </details>

    <details>
    <summary>in case of errors instead, for example if the expected output for the second benchmark is doubled</summary>

    ``` js  
    {
        "times": {},
        "mem": {},
        "ops": {},
        "passing": false,
        "report": {
            "factorialRecursive": [
                {
                    "passing": true,
                    "time": 6
                },
                {
                    "passing": false,
                    "time": 0,
                    "err": {
                    "ioIndex": 1,
                    "received": 51090942171709440000,
                    "expected": 4865804016353280000
                    }
                },
                {
                    "passing": true,
                    "time": 7
                }
            ],
            "factorialIterative": [
                {
                    "passing": true,
                    "time": 4
                },
                {
                    "passing": false,
                    "time": 0,
                    "err": {
                    "ioIndex": 1,
                    "received": 51090942171709440000,
                    "expected": 4865804016353280000
                    }
                },
                {
                    "passing": true,
                    "time": 0
                }
            ],
            "factorialMemoized": [
                {
                    "passing": true,
                    "time": 1
                },
                {
                    "passing": false,
                    "time": 0,
                    "err": {
                    "ioIndex": 1,
                    "received": 51090942171709440000,
                    "expected": 4865804016353280000
                    }
                },
                {
                    "passing": true,
                    "time": 4
                }
            ]
        },
        "metrics": null,
        "pluginsResults": {}
    }
    ```
    </details>  


## Options  
As third parameter we can pass a literal object containing few additional things that might be usefull in some cases: 

### _**matcher**_  
This works exactly as in the case of the single benchmark but the matcher will be used globally, still the single case matcher can be overridden.
### _**iterations**_  
To get a more accurate times & memory measurerements by default _testone_ runs each function 1k times; clearly enough this could not fit every cases (exactly as above). 
For this reason is possible to specify in the third `options` literal object an **integer** parameter keyed `iterations`

### _**metrics**_  
when provided in the options the result will contain some additional data one might want to compute out of the results:  
for example a mixed indication fo the _memory consumption_ and _time spent_ in **one single value**:

``` js
{ // in metrics
    /* will be invoked passing 
    {
        time: { single, total },
        mem: { single, total },
        pluginsResults: {// see next section }
    }
    */
    aLabel: ({time: {single: time}, mem: {single: mem}}) => time * mem
    operationsPerSecond: ({ops}}) => ops
}
```
and now in the returned metrics object we'll find for each metric something like:
``` json
"aLabel": {
    "factorialRecursive": 11.053367999999999,
    "factorialIterative": 1.42704,
    "factorialMemoized": 4.787640000000001
}
```

### _**plugins**_  
One can write a plugin in **2 minutes** (when relying on some library for the heavy lifting) to do much more. A trivial example can clarify better than any _tl;dr_.

### Available plugins ? 
I just wrote one: 
- [testone-complexity-plugin](https://www.npmjs.com/package/testone-complexity-plugin) : using it you will get a lot if info about code complexity.

... more are coming, anyway, create your is straighforward, 


> ## Plain plugin example  
> 
> Suppose we want to use a library that can crunch our strategies code and we find one possible solution: a fantomatic  _**idothat**_ library (our heavy lifter toward the 2 minutes goal).  
> 
> We can easily get 
> - the _**idothat**_ results for each strategy directly in the _testone_ output  
> - consume the results also in the _metrics_ functions.  
>  ``` js
> import idothat from 'idothat'
>
> // every plugin must return a Promise
> const pleaseDoThatForMe = ({source, options}) =>
>       Promise.resolve(idothat(source)) // resolve with {info: 'done'}
> /**
>  * .
>  * ...
>  * .
>  */
> const res = await testone(benchs, fns, {
>     plugins: [{
>         fn: pleaseDoThatForMe,
>         options: {/*
>           here the options you want to
>           be passed to the adapter / plugin */
>         },
>         resultsLabel: 'pleaseDoThatForMe', 
>         /** some plugins export a named function; e.g. testone-complexity-plugin
>           * exports a function named 'complex' but we could import is with another name
>           * in the case of pleaseDoThatForMe it is not a problem cause it is the real name
>           * but in the case of an external plugin the name differs and
>           * there is no cuik way to know the real name
>           * the point is that this hidden name is the one we need to know
>           * when destructuring the plugin results in the metrics (inside pluginsResults).
>           * This `resultLabel` allows to override the label that will be used shaping the 
>           * object that will be passed to the metric functions 
>           * the testone-complexity-plugin readme example clarifies that better
>           *
>           */
>         skipReport: true // this will prevent the whole result of the plugin
>                          // to be added in the output first-level pluginsResults
>     }],
>     metrics: {
>         cyclocplx: ({
>            pluginsResults: {
>               pleaseDoThatForMe: { info }
>           },
>           time: { single: time }
>         }) => `${info} in ${time}`,
>         fx: ({
>           mem: {single: mem},
>           time: {single: time}
>         }) => time * mem            
>    }
> })
> ```  
>

---

🤟 last build on 26/11/2024  
