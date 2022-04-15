## testone

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
        out: 1024
    }];

// one or an array of function to test
testone(benchs, pow);
```
giving
```
› Testing `pow`
Passed 2 | Failed 0
Total time 3 ms
Consuming ~1.21 MB
```
or

``` js
// more than one function
testone(benchs, [pow, powN]);

// by default runs 1k times to get a better time evaluation
testone(benchs, [pow, powN], {iterations: 1});  

// in case it fails somehwere, it is useful
// to show which test fails; in this case
// malways does 1 iteration
testone(benchs, [pow, powN], {stepDetail: true});
```
giving
```
› Testing `pow`
Passed 2 | Failed 0
Total time 13 ms
Consuming ~1.29 MB

› Testing `powN`
Passed 2 | Failed 0
Total time 18 ms
Consuming ~2.15 MB

∆ PODIUM
1st place to `anagram`: 43 ms
2nd place to `areAnagrams`: 58 ms
```
