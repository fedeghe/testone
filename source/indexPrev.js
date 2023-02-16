var testone = (function (){
    var DEFAULT_ITERATIONS = 1e3;

    function formatX(map, base) {
        return function (s, prec = 4) {
            if (s == 0) return '0 ' + base;
            var n = 0, nInt = 0;
            for (var i in map) {
                if (s >= map[i] || i === base) {
                    n = parseFloat((s / map[i]).toFixed(prec), 10);
                    nInt = parseInt(n, 10);
                    n = n == nInt ? nInt : n;
                    return [n, i].join(' ');
                }
            }
        };
    }
    function now() {return +new Date();}
    function isFunction(f){return typeof f === 'function';}
    var formatSize = formatX({ GB: 2 << 29, MB: 2 << 19, KB: 2 << 9, B: 1 }, 'B'),
        formatTime = formatX({ m: 60e3, s: 1e3, ms: 1, µs: 1e-3, ns: 1e-6 }, 'ns');

    

    function Testone(benchs, strategies, options) {
        this.benchs = benchs;
        this.strategies = (strategies.constructor.name === 'Array') ? strategies : [strategies];
        this.options = options || {};
        this.iterations = this.options.iterations || DEFAULT_ITERATIONS;
        this.metrics = this.options.metrics || false;
        this.ret = {
            times:{},
            mem:{},
            outcome :{},
        };
        this.globs = [];
        this.strategyMem = {};
        if (this.options.metrics) {
            this.ret.metrics = {};
        }
    }
    
    Testone.prototype.run = function(){ return this.runStrategies().checkMetrics().ret; };

    Testone.prototype.runStrategies = function(){
        var self = this;
        this.strategies.forEach(function (strategy, i){
            self.runStrategy.call(self, strategy, i);
        });
        return this;
    };

    Testone.prototype.runStrategy = function(strategy){
        var self = this,
            name = strategy.name,
            memStart = process.memoryUsage().heapUsed,
            memEnd = 0,
            startTime = now(),
            endTime = 0,
            passing = false,
            strategyTime,
            strategyTimeSingle;
        var res = this.benchs.map(function (bench, j){
            return self.runBench.call(self, bench, j, strategy)
        });

        endTime = now();
        strategyTime = endTime - startTime;

      	strategyTimeSingle = strategyTime / self.iterations
        
        passing = res.every(function (r) {return r.passing;});

        if (passing) {
            self.ret.times[name] = {
            	raw: {
                  single: strategyTimeSingle,
                  total: strategyTime,
                },
              	withLabel: {
              	 single: formatTime(strategyTimeSingle),
              	 total: formatTime(strategyTime),
        		}
            };
            
            memEnd = process.memoryUsage().heapUsed;
            var m = parseFloat(memEnd - memStart, 10),
                ms = m / self.iterations;
            self.ret.mem[name] = {
                raw: {
                    single: ms,
                    total: m
                },
                withLabel: {
                    single: formatSize(ms),
                    total: formatSize(m)
                },
            };
        }
        this.ret.outcome[name] = passing || res;
    };

    Testone.prototype.runBench = function(io, i, strategy) {
        var ret = {
                passing: false,
                details: {},
                time: 0
            },
            isFuncInput = isFunction(io.in),
            isFuncOut = isFunction(io.out),
            j = 0, r, output, input,
            ranOnce = false,

        //================================
            ioStart = now(),
            ioEnd = 0;

        while (j++ < this.iterations) {
            input = isFuncInput ? io.in(i, j) : io.in;
            r = strategy.apply(null, input);
            output = isFuncOut ? io.out(r, i, j) : io.out;
            if (!ranOnce) {
                ret.passing = ((isFuncOut && output ) || JSON.stringify(r) === JSON.stringify(output));
                ranOnce = true;
            }
            // when failing prevent further iterations
            if (!ret.passing) {
                j = this.iterations;
            }
        }
        ioEnd = now();
        ret.time = ioEnd - ioStart;
        //================================

        if (!ret.passing) {
            ret.details.err = {
                ioIndex: i,
                received: isFuncOut ? output : r,
                expected: isFuncOut ? true : output,
            };
        }
        return ret;
    };
    
    Testone.prototype.checkMetrics = function(){
        var self = this,
            strategiesNames = Object.keys(this.ret.times);
        if (this.metrics) {
            this.ret.metrics = Object.entries(this.metrics).reduce(function (acc, [metricName, metricFunc]) {
                acc[metricName] = strategiesNames.reduce(function(iacc, strategyName){
                    var param = {
                        mem: self.ret.mem[strategyName].raw,
                        time: self.ret.times[strategyName].raw,
                    }
                    iacc.push({
                        name: strategyName,
                        value: metricFunc(param) 
                    })
                    return iacc
                }, []).sort(function(a, b) {return a.value - b.value})
                return acc
            }, {});
        }
        return this;
    };

    function tx(b, s, o) {
        var t = new Testone(b, s, o);
        return t.run();
    };

    tx.formatSize = formatSize;
    tx.formatTime = formatTime;
    return tx;
})();

/* istanbul ignore next */
if (typeof exports === 'object' &&
    typeof module !== 'undefined') {
    module.exports = testone;
}


