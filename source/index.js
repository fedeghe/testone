const gc = require('expose-gc/function');
/**
 * 
 */

const DEFAULT_ITERATIONS = 1e3,
    DEFAULT_MATCHER = a => JSON.stringify(a.received) === JSON.stringify(a.expected),
    formatX = (map, base) => {
        return  (s, prec = 4) => {
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
    },
    formatSize = formatX({ GB: 2 << 29, MB: 2 << 19, KB: 2 << 9, B: 1 }, 'B'),
    formatTime = formatX({ m: 60e3, s: 1e3, ms: 1, µs: 1e-3, ns: 1e-6 }, 'ns'),
    getCode = fn => `var ${fn.name} = ${fn}`,
    now = () => +new Date(),
    isFunction = f => typeof f === 'function';

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
    this.pluginsReport = null;
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


Testone.prototype.run = function(){
    var afterPlugins = this.afterPlugins.bind(this),
        resolveOrCatch = this.resolveOrCatch.bind(this);
    // sync run
    this.runStrategies();
    return this.runPlugins()
        //flatten
        .then(
            r => r.reduce((acc, ext) => [...acc, ...ext], [])
        ).then(afterPlugins)
        .then(() => resolveOrCatch())
        .catch(e => resolveOrCatch(e || true));
};

Testone.prototype.afterPlugins = function(flatResults) {
    const {pluginsResults, pluginsReportsForMetrics} = flatResults
        // group by strategy excuding the skipReported
        .reduce((acc, el) => {
            acc.pluginsResults[el.strategyName] = acc.pluginsResults[el.strategyName] || {};
            acc.pluginsReportsForMetrics[el.strategyName] = acc.pluginsReportsForMetrics[el.strategyName] || {};

            acc.pluginsResults[el.strategyName][el.pluginName] = el.skipReport
                ? `skipped "${el.pluginName}"`
                : el.results; 
            acc.pluginsReportsForMetrics[el.strategyName][el.pluginName] = el.results;
            return acc;
        }, {pluginsResults: {}, pluginsReportsForMetrics: {}});
    
    this.pluginsResults = pluginsResults;
    this.pluginsReportsForMetrics = pluginsReportsForMetrics;
    this.collectMetrics();
};

Testone.prototype.resolveOrCatch = function(err) {
    const res = {
        times: this.times,
        mem: this.mem,
        passing: this.passing,
        report: this.report,
        metrics: this.metrics,
        pluginsResults: this.pluginsResults
    };
    if (err) {
        console.warn('WARNING > plugins can run only when all tests pass');
        res.pluginsResults = this.pluginsResults;
    }
    return Promise.resolve(res);
};

Testone.prototype.runPlugins = function(){
    const runPluginsOnStrategy = this.runPluginsOnStrategy.bind(this);
    return (this.passing && this.options.plugins) 
        ? Promise.all(this.strategies.map(runPluginsOnStrategy))
        : Promise.resolve([]);
};

Testone.prototype.runPluginsOnStrategy = function(strategy){
    const runPluginOnStrategy = this.runPluginOnStrategy.bind(this),
        code = getCode(strategy),
        strategyName = strategy.name,
        plugins = this.options.plugins;

    return Promise.all(plugins.map(plugin =>  
        runPluginOnStrategy(plugin, {
            source: code,
            name: strategyName,
            options: plugin.options
        }).then(r => Object.assign({}, {
                results: r,
                strategyName: strategyName,
                pluginName : plugin.fn.name,
                skipReport: plugin.skipReport
            })
        )
    ));
};

Testone.prototype.runPluginOnStrategy = (plugin, params) => plugin.fn(params);

Testone.prototype.matcher = DEFAULT_MATCHER

Testone.prototype.runStrategies = function(){
    const runStrategy = this.runStrategy.bind(this);
    this.strategies.forEach(runStrategy);
};

Testone.prototype.runStrategy = function(strategy){
    gc();
    var runBench = this.runBench.bind(this),
        name = strategy.name,
        memStart = process.memoryUsage().heapUsed,
        memEnd = 0,
        startTime = now(),
        endTime = 0,
        passing = false,
        strategyTime,
        strategyTimeSingle,
        res = this.benchs.map((bench, j) => runBench(bench, j, strategy)),
        m, ms;

    endTime = now();
    strategyTime = endTime - startTime;
    strategyTimeSingle = strategyTime / this.iterations;
    passing = res.every(r => r.passing);

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

Testone.prototype.getMatcher = function(io) {
    return isFunction(io.matcher) ? io.matcher : this.matcher;
}

Testone.prototype.runBench = function(io, i, strategy) {
    var ret = {
            passing: true,
            time: 0
        },
        isFuncInput = isFunction(io.in),
        isFuncOut = isFunction(io.out),
        j = 0, received, expected, input,
        ranOnce = false,

    //================================
        ioStart = now(),
        ioEnd = 0,
        matcher = this.getMatcher(io);

    while (j++ < this.iterations) {
        input = isFuncInput ? io.in({benchIndex: i, iteration: j}) : io.in;
        received = strategy.apply(null, input);
        expected = isFuncOut ? io.out({received: received, benchIndex: i, iteration: j}) : io.out;
        if (!ranOnce || isFuncInput || isFuncOut) {
            ret.passing = ret.passing && matcher({received: received, expected: expected});
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

Testone.prototype.collectMetrics = function(){
    const collectMetricForStrategies = this.collectMetricForStrategies.bind(this);
    if (this.passing && this.userMetrics) {
        this.metrics = Object.entries(this.userMetrics).reduce(collectMetricForStrategies, {});
    }
};

Testone.prototype.collectMetricForStrategies = function (acc, [metricName, metricFunc]) {
    const strategiesNames = Object.keys(this.times),
        collectMetricForStrategy = this.collectMetricForStrategy.bind(this);
    acc[metricName] = strategiesNames.reduce(
        (iacc, strategyName) => collectMetricForStrategy(iacc, strategyName, metricFunc)
        , {}
    );
    return acc;
};

Testone.prototype.collectMetricForStrategy = function(iacc, strategyName, metricFunc){
    const param = {
        mem: this.mem[strategyName].raw,
        time: this.times[strategyName].raw,
        ops: 1000 / this.times[strategyName].raw.single
    };
    param.pluginsResults  = strategyName in this.pluginsReportsForMetrics
        ? this.pluginsReportsForMetrics[strategyName]
        : {};
    iacc[strategyName] = metricFunc(param);
    return iacc;
};

const tx = (b, s, o) => (new Testone(b, s, o)).run();
tx.formatSize = formatSize;
tx.formatTime = formatTime;
tx.DEFAULT_ITERATIONS = DEFAULT_ITERATIONS;

/* istanbul ignore next */
if (typeof exports === 'object' &&
    typeof module !== 'undefined') {
    module.exports = tx;
}