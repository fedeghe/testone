[![Coverage Status](https://coveralls.io/repos/github/fedeghe/testone/badge.svg?branch=master)](https://coveralls.io/github/fedeghe/testone?branch=master)
## testone (v. $PACKAGE.version$)

Quickly test performance and correctness of one or more functions against input/output data.  

```
var outcome = testone(
    *ios <[literal object]>,
    *strategies <ƒn OR [ƒn]>,
    options <literal object>
);
```
where:
- `ios` must be an array of object literal keyed as follows:  
    - **`in`** keyed element which can be either
        - array for the function inputs 
        - a function supposed to return an array to be used as input values
    - **`out`** keyed element which can be either
        - a static value  
        - a function that will receive what is returned from the strategy (plus io index and iteration)  
        and it's supposed to return a _boolean_ representing the test outcome
    - _`matcher`_ (optional)  
        by default _testone_ compares the expected output with the result using the exact match between the stringyfication of the two as:  
        ``` js
        JSON.stringify(expected) === JSON.stringify(received)
        ```   
        but there might be anyway cases where a bit more flexibility is needed for a specific bechmark element, with this option is possible to override the matching function (which is anyway expected to return a boolean), e.g.:
        ``` js
        matcher: ({expected, received}) => received < expected 
        ```  

- `strat` the function or the array of functions one wants to test & check


### What do it get in the `outcome`?  
- check of the correctness
- some relevant numberical performance informations

    <details>
    <summary>an out come will look like this</summary>

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
    <summary>in case of errors instead something like this</summary>

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
This works exactly as in the case of the single benchmark but the matcher will be used globally, sill the single case matcher can be overridden.
### _**iterations**_  
To get a more accurate times & memory measurerements by default _testone_ runs each function 1k times; clearly enough this could not fit some cases (exactly as above). 
For this reason is possible to specify in the third `options` literal object an **integer** parameter keyed `iterations`

### _**metrics**_  
when provided in the options the result will contain some additional data one might want to compute out of the results:  
for example a mixed indication fo the _memory consumption_ and _time spent_ in **one single value**:

``` js
{ // in metrics
    /* will be invoked passing 
    {
        time: { single, total },
        mem: { single, total }
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

---

🤟 last build on __DATE__  
