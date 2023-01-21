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
    
    var formatSize = formatX({ GB: 2 << 29, MB: 2 << 19, KB: 2 << 9, B: 1 }, 'B'),
        formatTime = formatX({ m: 60e3, s: 1e3, ms: 1, µs: 1e-3, ns: 1e-6 }, 'ns'),
        now = function () { return +new Date(); };
    
    function __testone(ios, imp, options = {}) {
        var ret = {
                times:{},
                passing:{},
                mem:{},
                rank:[],
                fx: {},
            },
            verbose = !!options.verbose,
            iterations = options.iterations || 1e3,
            impls = (imp.constructor.name === 'Array') ? imp : [imp],
            globs = [],
            logs = [],
            log = verbose ? function () {
                 logs.push(arguments);
            } : function () {};

        impls.forEach(function (impl) {
            var name = impl.name;
            log('› Testing \"' + name + '\"');
            var out = { ok: 0, ko: 0 },
                times = [],
                sym = ['\u2717', '\u2713', '\u2200'],
                
                startMs = now(),
                strategyTime,
                mem = {
                    start: process.memoryUsage().heapUsed
                };
    
            ios.forEach(function (io, i) {
                var ioStartMs = now(),
                    isFuncInput = typeof io.in === 'function',
                    isFuncOut = typeof io.out === 'function',
                    passing = true,
                    j = 0,
                    r, res, spent, input;
                while (j++ < iterations) {
                    input = isFuncInput ? io.in(i, j) : io.in;
                    r = impl.apply(null, input);
                    res = isFuncOut ? io.out(r, i, j) : io.out;
                    passing  = passing && ((isFuncOut && res ) || JSON.stringify(r) === JSON.stringify(res));
                    if (!passing) {
                        j = iterations;
                    }
                }

                times[i] = now() - ioStartMs;
                spent = formatTime(times[i] / iterations);
                
                if (passing) {
                    log(sym[1] + ' io #' + (i + 1) + ' passed ' + spent+ ' (' + sym[2] + ')');
                    out.ok++;
                } else {
                    out.ko++;
                    ret.err = ret.err || {};
                    ret.err[name] = ret.err[name] || [];
                    ret.err[name].push({
                        ioIndex: i,
                        received: isFuncOut ? res : r,
                        expected: isFuncOut ? true : res,
                    });
                    if (verbose) {
                        log(sym[0] + ' io #' + (i + 1) + ' failed ' + spent+ ' (' + sym[2] + ')');
                        if (isFuncOut) {
                            log('| expected: true');
                            log('| received:', res, ' (ƒ)');
                        } else {
                            log('| expected:', res);
                            log('| received:', r);
                        }
                        log('\'+-------');
                    }
                }
            });

            strategyTime = now() - startMs;

            if (!out.ko) globs.push({ name, time: strategyTime });
            mem.end = process.memoryUsage().heapUsed;
            ret.mem[name] = Math.abs(mem.end - mem.start) / iterations;
            if (verbose) {
                log('Passed ' + out.ok + ' | Failed ' + out.ko);
                log('Total time ~' + formatTime(strategyTime, 1) + ' ('+iterations+' runs)');
                log('Consuming ~' + ret.mem[name] + ' (' + sym[2] + ')');
                log('');
            }
            ret.passing[name] = out.ok && !out.ko;
        });
    
        globs.length > 1 && log('∆ PODIUM');
        globs.sort(
            function (a, b) { return a.time - b.time; }
        ).forEach(function (impl, i) {
            var singleTime = impl.time / iterations;
            ret.times[impl.name] = formatTime(singleTime);
            ret.rank.push(impl.name);
            ret.fx[impl.name] = parseFloat((singleTime * ret.mem[impl.name]), 10);
            ret.mem[impl.name] = formatSize(ret.mem[impl.name]);
            log((i + 1) + (['st', 'nd', 'rd',][i] || 'th') + " place to '" + impl.name +": " + formatTime(impl.time));
        });

        logs.forEach(function (l) {
            console.log.apply(null, l);
        });
        return ret;
    };
    return __testone;
})();

/* istanbul ignore next */
if (typeof exports === 'object' &&
    typeof module !== 'undefined') {
    module.exports = testone;
}