var testone = (function (){
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
    
    var formatSize = formatX({ /* no we will not need more :D  */GB: 2 << 29, MB: 2 << 19, KB: 2 << 9, B: 1 }, 'B'),
        formatTime = formatX({ m: 60e3, s: 1e3, ms: 1, µs: 1e-3, ns: 1e-6 }, 'ns');
    
    function __testone(ios, imp, options = {}) {
        var ret = {
                times:{},
                passing:{},
                mem:{},
                rank:[],
            },
            iterations = options.iterations || 1e3,
            metrics = options.metrics || false,
            impls = (imp.constructor.name === 'Array') ? imp : [imp],
            globs = [];

        if (metrics) ret.metrics = {};
        
        // strategies
        impls.forEach(function (impl) {
            var name = impl.name,
                out = { pass: 0, fail: 0 },
                times = [],
                mem = {
                    start: process.memoryUsage().heapUsed
                },
                strategyStart = now(),
                strategyEnd = 0,
                strategyPassingFlag = false,
                strategyPassing = false,
                strategyTime;

            // test case
            ios.forEach(function (io, i) {
                var isFuncInput = isFunction(io.in),
                    isFuncOut = isFunction(io.out),
                    j = 0, r, output, input,
                    ranOnce = false,

                //================================
                    ioStart = now(),
                    ioEnd = 0;

                while (j++ < iterations) {
                    input = isFuncInput ? io.in(i, j) : io.in;
                    r = impl.apply(null, input);
                    output = isFuncOut ? io.out(r, i, j) : io.out;
                    if (!ranOnce) {
                        strategyPassingFlag = ((isFuncOut && output ) || JSON.stringify(r) === JSON.stringify(output));
                        ranOnce = true;
                    }
                    // if the test fail prevent further itertions
                    if (!strategyPassingFlag) {
                        j = iterations;
                    }
                }
                ioEnd = now();
                times[i] = ioEnd - ioStart;
                //================================

                // spent = formatTime(times[i] / iterations);
                if (strategyPassingFlag) {
                    out.pass++;
                } else {
                    out.fail++;
                    ret.err = ret.err || {};
                    ret.err[name] = ret.err[name] || [];
                    ret.err[name].push({
                        ioIndex: i,
                        received: isFuncOut ? output : r,
                        expected: isFuncOut ? true : output,
                    });
                }//reset it for next
                strategyPassingFlag = false
            });

            strategyEnd = now();
            strategyTime = strategyEnd - strategyStart;
            strategyPassing = !!(out.pass && !out.fail);

            if (strategyPassing) {
                globs.push({ name, time: strategyTime });
            }
            mem.end = process.memoryUsage().heapUsed;
            ret.mem[name] = Math.abs(mem.end - mem.start) / iterations;
            ret.passing[name] = strategyPassing;
        });
    
        globs.sort(
            function (a, b) { return a.time - b.time; }
        ).forEach(function (impl, i) {
            var name = impl.name;
            var singleTime = impl.time / iterations;
            ret.times[name] = {
                withLabel: formatTime(singleTime),
                raw: singleTime
            };
            ret.rank.push(name);
            const tmp = ret.mem[name]
            ret.mem[name] = {
                withLabel: formatSize(tmp),
                raw: tmp
            };

            if (metrics) {
                ret.metrics[name] = {}
                ret.metrics = Object.entries(metrics).reduce((acc, [metricName, metricFunc]) => {
                    const params = {
                        time: ret.times[name].raw,
                        passing: ret.passing[name],
                        mem: ret.mem[name].raw,
                        rank: ret.rank.indexOf(name),
                    }
                    acc[name][metricName] = metricFunc(params)
                    return acc
                }, ret.metrics);
            }
            
            
        });
        
        return ret;
    };

    __testone.formatSize = formatSize;
    __testone.formatTime = formatTime;

    return __testone;
})();

/* istanbul ignore next */
if (typeof exports === 'object' &&
    typeof module !== 'undefined') {
    module.exports = testone;
}