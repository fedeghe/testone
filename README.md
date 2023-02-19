[![Coverage Status](https://coveralls.io/repos/github/fedeghe/testone/badge.svg?branch=master)](https://coveralls.io/github/fedeghe/testone?branch=master)
## testone (v. 0.1.1)

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
const result = testone([{
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

console.log(JSON.stringify(res, null, 2))
// but we could for example have some jest 
// test doing some comparison on `result` 
```
where:
- **1<sup>st</sup> parameter** (mandatory): an array of object literal keyed as follows:  
    - **`in`** keyed element which can be either
        - array for the function inputs 
        - a function supposed to return an array to be used as input values (invoked passing `{benchIndex, iteration}`)
    - **`out`** keyed element which can be either
        - a static value  
        - a function invoked passing `{received, benchIndex, iteration}` supposed to return the expected output
    - _`matcher`_ (optional)  
        by default _testone_ compares the expected output with the result using the exact match between the stringyfication of the two as:  
        ``` js
        JSON.stringify(expected) === JSON.stringify(received)
        ```   
        but there might be anyway cases where a bit more flexibility is needed for a specific bechmark element, with this option is possible to override the matching function (which is anyway expected to return a boolean), e.g.:
        ``` js
        matcher: ({expected, received}) => received < expected 
        ```  

- **2<sup>nd</sup> parameter** (mandatory): the function or the array of functions one wants to test & check
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


### What do it get in the `outcome`?  
- check of the correctness
- some relevant numerical performance informations

    <details>
    <summary>click to see how the output will look alike when everything runs smoothly</summary>

    ``` js  
    {
        "times": {
            "factorialRecursive": {
                "raw": {
                    "single": 0.01,
                    "total": 10
                },
                "withLabel": {
                    "single": "10 µs",
                    "total": "10 ms"
                }
            },
            "factorialIterative": {
                "raw": {
                    "single": 0.003,
                    "total": 3
                },
                "withLabel": {
                    "single": "3 µs",
                    "total": "3 ms"
                }
            },
            "factorialMemoized": {
                "raw": {
                    "single": 0.003,
                    "total": 3
                },
                "withLabel": {
                    "single": "3 µs",
                    "total": "3 ms"
                }
            }
        },
        "mem": {
            "factorialRecursive": {
                "raw": {
                    "single": 1487.856,
                    "total": 1487856
                },
                "withLabel": {
                    "single": "1.453 KB",
                    "total": "1.4189 MB"
                }
            },
            "factorialIterative": {
                "raw": {
                    "single": 1387.976,
                    "total": 1387976
                },
                "withLabel": {
                    "single": "1.3554 KB",
                    "total": "1.3237 MB"
                }
            },
            "factorialMemoized": {
                "raw": {
                    "single": 464.16,
                    "total": 464160
                },
                "withLabel": {
                    "single": "464.16 B",
                    "total": "453.2813 KB"
                }
            }
        },
        "passing": true,
        "report": {
            "factorialRecursive": true,
            "factorialIterative": true,
            "factorialMemoized": true
        },
        "metrics": null,
        "plugins": {}
    }
    ```
    </details>

    <details>
    <summary>in case of errors instead, for example if the expected output for the second benchmark is doubled</summary>

    ``` js  
    {
        "times": {},
        "mem": {},
        "passing": false,
        "report": {
            "factorialRecursive": [
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
                        "expected": 102181884343418880000
                    }
                },
                {
                    "passing": true,
                    "time": 11
                }
            ],
            "factorialIterative": [
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
                        "expected": 102181884343418880000
                    }
                },
                {
                    "passing": true,
                    "time": 2
                }
            ],
            "factorialMemoized": [
                {
                    "passing": true,
                    "time": 0
                },
                {
                    "passing": false,
                    "time": 0,
                    "err": {
                        "ioIndex": 1,
                        "received": 51090942171709440000,
                        "expected": 102181884343418880000
                    }
                },
                {
                    "passing": true,
                    "time": 1
                }
            ]
        },
        "metrics": null,
        "plugins": {}
    }
    ```
    </details>

## Other options  
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
        plugins: {// see next section }
    }
    */
    aLabel: ({time: {single: time}, mem: {single: mem}}) => time * mem
}
```
and now in the returned metrics object we'll find for each metric something like (sorted by ascending value):
``` json
"aLabel": {
    "factorialRecursive": 11.053367999999999,
    "factorialIterative": 1.42704,
    "factorialMemoized": 4.787640000000001
}
```

### _**plugins**_  
One can write a plugin in **2 minutes** (when relying on some library for the heavy lifting) to do much more. A trivial example can clarify better than any _tl;dr_.


> ## Plugin usage example  
> 
> Suppose we want to evaluate also the _cyclomatic complexity_ and find  
> on [npm](http://npmjs.com) one possible solution: [escomplex](https://www.npmjs.com/package/escomplex) (our heavy lifter toward the 5 minutes).  
> 
> We can easily get 
> - the _escomplex_ results for each strategy directly in the _testone_ output  
> - consume the results also in the _metrics_ functions.  
>  ``` js
> import escomplex from 'escomplex'
> const complex = ({source, options}) => escomplex.analyse(source, options)
> /**
>  * .
>  * ...
>  * .
>  */
> const res = testone(benchs, fns, {
>     plugins: [{
>         fn: complex,
>         options: {/*
>           here the options you want to
>           be passed to the adapter */
>         },
>     }],
>     metrics: {
>         cyclocplx: ({plugins: {complex}}) =>
>           complex.aggregate.cyclomatic, /*
>                 |
>                 `-> this comes out of escomplex.analyse */
>         fx: ({
>           mem: {single: mem},
>           time: {single: time}
>         }) => time * mem            
>    }
> }
> ```  
>
> Cleary in that specific lucky case we could have used directly `escomplex.analyse` within the _testone_ options 3<sup>rd</sup> parameter;  
> this cannot cleary always fit the lib we are exploiting since _testone_ will always calls the `plugin.fn` passing one literal object containing:  
> ```
> {
>     source: '<the source code of the strategy>',
>     options: '<the options object passed in the plugin.options>'
> }
> ```
> first parameter the strategy code and as second parameter the `plugin.options`.

---

🤟 last build on 19/2/2023  
