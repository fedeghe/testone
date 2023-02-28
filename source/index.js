var testone = (function (){
    var DEFAULT_ITERATIONS = 1e3,
        formatSize = formatX({ GB: 2 << 29, MB: 2 << 19, KB: 2 << 9, B: 1 }, 'B'),
        formatTime = formatX({ m: 60e3, s: 1e3, ms: 1, µs: 1e-3, ns: 1e-6 }, 'ns');

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
    function getCode(fn){
        return `const ${fn.name} = ${fn}`
    }
    function now() {return +new Date();}

    function isFunction(f){return typeof f === 'function';}
    function Testone(benchs, strategies, options) {
        this.benchs = benchs;
        this.strategies = (strategies.constructor.name === 'Array') ? strategies : [strategies];
        this.options = options || {};
        this.iterations = this.options.iterations || DEFAULT_ITERATIONS;
        this.userMetrics = this.options.metrics || false;
        this.times = {};
        this.mem = {};
        this.report = {};
        this.pluginsResults = {};
        this.pluginsReportsForMetrics = {};
        this.passing = false;
        this.metrics = null;
        this.globs = [];
        this.strategyMem = {};
        if (this.options.metrics) {
            this.metrics = {};
        }
        if (isFunction(this.options.matcher)) {
            Testone.prototype.matcher = this.options.matcher;
        }
    }
    
    Testone.prototype.preparePluginsReportForMetrics = function(){
        this.pluginsReportsForMetrics = this.pluginsResults
            // flatten
            .reduce(function (acc, ext){
                return acc.concat(ext)
            }, [])
            .reduce(function (acc, el) {
                acc[el.strategyName] = acc[el.strategyName] || {}
                acc[el.strategyName][el.pluginName] = el.results
                return acc
            }, {});
    };
    Testone.prototype.run = function(){
        var self = this
        // first sync run
        this.runStrategies();
        // then async
        

        return this.runPlugins().then(function(results){
            self.pluginsResults = results;
            self.preparePluginsReportForMetrics()
            self.checkMetrics();
            
        }).then(function () {
            return Promise.resolve({
                times: self.times,
                mem: self.mem,
                passing: self.passing,
                report: self.report,
                metrics: self.metrics,
                // pluginsReport: self.pluginsReport
            });
        }).catch(function (e){
            console.log(e.message)
        });
    };

    Testone.prototype.runPlugins = function(){
        var plugins = this.options.plugins,
            self = this;
        this.pluginsReport = null;
        if (this.passing && plugins) {
            return Promise.all(this.strategies.map(function (strategy){
                return self.runPluginsOnStrategy.bind(self)(strategy);
            })); 
        }
        console.warn('WARNING: plugins can run only when all tests pass');
        return Promise.resolve([])
    };

    Testone.prototype.runPluginsOnStrategy = function(strategy){
        var self = this,
            code = getCode(strategy),
            strategyName = strategy.name,
            plugins = this.options.plugins;

        return Promise.all(plugins.map(function (plugin) {
            return self.runPluginOnStrategy(plugin, {
                source: code,
                name: strategyName,
                options: plugin.options
            }).then(function(r) {
                return Object.assign({}, {
                    results: r,
                    strategyName: strategyName,
                    pluginName : plugin.fn.name
                })
            } );
        }))
    };

    Testone.prototype.runPluginOnStrategy = function(plugin, params){return plugin.fn(params);};

    Testone.prototype.runStrategies = function(){
        var self = this;
        this.strategies.forEach(function (strategy, i){
            self.runStrategy.call(self, strategy, i);
        });
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
            strategyTimeSingle,
            res = this.benchs.map(function (bench, j) {
                return self.runBench.call(self, bench, j, strategy)
            }),
            m, ms;

        endTime = now();
        strategyTime = endTime - startTime;
        strategyTimeSingle = strategyTime / this.iterations;
        passing = res.every(function (r) {return r.passing;});

        if (passing) {
            this.times[name] = {
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
            //abs here needed for gc occurrences
            m = parseFloat(Math.abs(memEnd - memStart), 10);
            ms = m / this.iterations;
            this.mem[name] = {
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
        this.report[name] = passing || res;
        this.passing = passing;
    };

    Testone.prototype.matcher = function(a) { return JSON.stringify(a.received) === JSON.stringify(a.expected)};

    Testone.prototype.runBench = function(io, i, strategy) {
        var ret = {
                passing: false,
                time: 0
            },
            isFuncInput = isFunction(io.in),
            isFuncOut = isFunction(io.out),
            j = 0, received, expected, input,
            ranOnce = false,

        //================================
            ioStart = now(),
            ioEnd = 0,
            matcher = isFunction(io.matcher) ? io.matcher : this.matcher;

        while (j++ < this.iterations) {
            input = isFuncInput ? io.in({benchIndex: i, iteration: j}) : io.in;
            received = strategy.apply(null, input);
            expected = isFuncOut ? io.out({received: received, benchIndex: i, iteration: j}) : io.out;
            if (!ranOnce) {
                ret.passing = matcher({received: received, expected: expected});
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
            ret.err = {
                ioIndex: i,
                received: received,
                expected: expected,
            };
        }
        return ret;
    };
    
    Testone.prototype.checkMetrics = function(){
        var self = this,
            strategiesNames = Object.keys(this.times);
        if (this.passing && this.userMetrics) {
            this.metrics = Object.entries(this.userMetrics).reduce(
                function (acc, [metricName, metricFunc]) {
                    acc[metricName] = strategiesNames.reduce(
                        function(iacc, strategyName){
                            var param = {
                                mem: self.mem[strategyName].raw,
                                time: self.times[strategyName].raw,
                            };
                            // if (metricName in self.pluginsReportsForMetrics && strategyName in self.pluginsReportsForMetrics[metricName]) {
                            //     param.pluginsResults  = self.pluginsReportsForMetrics[metricName][strategyName]
                            // } else
                            param.pluginsResults  = self.pluginsReportsForMetrics[strategyName]

                            iacc[strategyName] = metricFunc(param);
                            return iacc;
                        }, {}
                    );
                    return acc;
                }, {}
            );
        }
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