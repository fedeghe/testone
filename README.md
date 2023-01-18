[![Coverage Status](https://coveralls.io/repos/github/fedeghe/testone/badge.svg?branch=master)](https://coveralls.io/github/fedeghe/testone?branch=master)
## testone (v. 0.0.10)

Quickly test one or more functions against a benchmarking set.  

If more than a function is provided then the result will show a ranked list (time based) of all successful implementations.  

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
var res = testone(benchs, pow);
```
giving in console
```
› Testing `pow`
Passed 2 | Failed 0
Total time 3 ms
Consuming ~1.21 MB
```
and returns (here `res` will look like)
``` json 
{
  "times": { "pow": 1 },
  "passing": { "pow": true },
  "mem": { "pow": "64.4 B" },
  "rank": [ "pow" ]
}
```
to disable the automatic output pass `{verbose: false}` in the 3rd param options

### Compare more functions

``` js
// more than one function
testone(benchs, [pow, powN]);

// by default runs 1k times to get a better time evaluation
testone(benchs, [pow, powN], {iterations: 1});  

// in case it fails somehwere, it is useful
// to show which test fails; in this case it always does 1 single iteration
var res = testone(benchs, [pow, powN], {stepDetail: true});
```
giving in `res`

``` json
{
  "times": { "powN": 1, "pow": 2 },
  "passing": { "pow": true, "powN": true },
  "mem": { "pow": "64.4 B", "powN": "13.76 B" },
  "rank": [ "powN", "pow" ]
}
```
and (if `verbose:false` is not passed)

```
› Testing `pow`
Passed 2 | Failed 0
Total time 3 ms
Consuming ~1.29 MB

› Testing `powN`
Passed 2 | Failed 0
Total time 8 ms
Consuming ~2.15 MB

∆ PODIUM
1st place to `pow`: 3 ms
2nd place to `pow2`: 8 ms
```
