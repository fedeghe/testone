[![Coverage Status](https://coveralls.io/repos/github/fedeghe/testone/badge.svg?branch=master)](https://coveralls.io/github/fedeghe/testone?branch=master)
## testone (v. 0.0.29)

Quickly test performance and correctness of one or more functions against input/output data.  

``` js  
const factorial1 = n => {if (n === 1) return 1; else return n * factorial1(n - 1)};
const factorial2 = n => {let r = n; while (n > 1) r *= --n; return r};
const factorialSum1 = (...a) => a.reduce((acc, e) => acc + factorial1(e), 0);
const factorialSum2 = (...a) => a.reduce((acc, e) => acc + factorial2(e), 0);
testone([{
        in: [4, 5],
        out: 144
    }, {
        in: [6, 7],
        out: () => 2*3*4*5*6 + 2*3*4*5*6*7
    }, {
        in: ({iteration}) => [iteration+1],
        out: ({iteration}) => {let r = 1, i = iteration + 1; while(i > 0)r *= i--; return r;}
    }],
    [factorial1, factorial2]
)
```
where:
- **1<sup>st</sup> parameter** (mandatory): an array of object literal keyed as follows:  
    - **`in`** keyed element which can be either
        - array for the function inputs 
        - a function supposed to return an array to be used as input values (invoked passing `{benchIndex, iteration}`)
    - **`out`** keyed element which can be either
        - a static value  
        - a function invoked passing `{received, benchIndex, iteration}` supposed to return a _boolean_ representing the test outcome
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
            "pow": {
                "raw": {
                    "single": 0.000313,
                    "total": 313
                },
                "withLabel": {
                    "single": "313 ns",
                    "total": "313 ms"
                }
            },
            "powN": {
                "raw": {
                    "single": 0.000316,
                    "total": 316
                },
                "withLabel": {
                    "single": "316 ns",
                    "total": "316 ms"
                }
            }
        },
        "mem": {
            "pow": {
                "raw": {
                    "single": 0.122656,
                    "total": 122656
                },
                "withLabel": {
                    "single": "0.1227 B",
                    "total": "119.7813 KB"
                }
            },
            "powN": {
                "raw": {
                    "single": 0.117752,
                    "total": 117752
                },
                "withLabel": {
                    "single": "0.1178 B",
                    "total": "114.9922 KB"
                }
            }
        },
        "passing": true,
        "report": {
            "pow": true,
            "powN": true
        },
        "metrics": {
            "x": {
                "pow": 0.000038391328,
                "powN": 0.000037209632
            }
        }
    }
    ```
    </details>

    <details>
    <summary>in case of errors instead</summary>

    ``` js  
    {
        "times": {},
        "mem": {},
        "passing": false,
        "report": {
            "pow": [
                {
                    "passing": true,
                    "time": 103
                },
                {
                    "passing": false,
                    "time": 0,
                    "err": {
                        "ioIndex": 1,
                        "received": 64,
                        "expected": 65
                    }
                },
                {
                    "passing": true,
                    "time": 104
                }
            ],
            "powN": [
                {
                    "passing": true,
                    "time": 101
                },
                {
                    "passing": false,
                    "time": 0,
                    "err": {
                        "ioIndex": 1,
                        "received": 64,
                        "expected": 65
                    }
                },
                {
                    "passing": true,
                    "time": 95
                }
            ]
        },
        "metrics": {
            "x": {}
        }
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
    "pow": 0.00012342,
    "powN": 0.00923412
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
> - the _escomplex_ results directly in the _testone_ output
> - consume the results also in the _metrics_ functions.  
>  ``` js
> import complex from './complex'
> // ...
> 
> const res = testone(benchs, fns, {
>     plugins: [{
>         fn: complex,
>         options: {/* here the options you want to be passed in the adapter*/}
>     }],
>     metrics: {
>         cyclocplx: ({plugins: {complex}}) =>
>           complex.aggregate.cyclomatic /*
>                 |
>                 `-> this comes out of escomplex.analyse */
>    }
> }
> ```
> and all we have to do is to write an adapter for that `complex` plugin:    
> ``` js
> // complex.js 🤣
> export default ({source, options}) => escomplex.analyse(source, options)
> ```  
>
> Cleary in that specific lucky case we could have used directly `escomplex.analyse` within the _testone_ options;  
> this cannot cleary always fit the lib we are exploiting since _testone_ will always calls the `plugin.fn` passing one literal object containing:  
> ```
> {
>     source: '<the source code of the strategy>',
>     options: '<the options object passed in the plugin.options>'
> }
> ```
> first parameter the strategy code and as second parameter the `plugin.options`.

---

🤟 last build on 18/2/2023  
