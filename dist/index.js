'use strict';
/*
  __          __
 / /____ ___ / /____  ___  ___
/ __/ -_|_-</ __/ _ \/ _ \/ -_)
\__/\__/___/\__/\___/_//_/\__/  v 0.0.9
*/

var testone = (function (){
    function formatX(map, base) {
        return function (s, prec = 4) {
            if (s == 0) return `0 ${base}`;
            var n = 0, nInt = 0;
            for (var i in map) {
                if (s >= map[i]) {
                    n = parseFloat((s / map[i]).toFixed(prec), 10);
                    nInt = parseInt(n, 10);
                    n = n == nInt ? nInt : n;
                    return [n, i].join(' ');
                }
            }
        }
    }
    
    var formatSize = formatX({ GB: 2 << 29, MB: 2 << 19, KB: 2 << 9, B: 1 }, 'B'),
        formatTime = formatX({ m: 60e3, s: 1e3, ms: 1, µs: 1e-3, ns: 1e-6 }, 'ms'),
        now = function () { return +new Date(); };
    
    function __testone(benchs, imp, options = {}) {
        var ret = {
                times:{},
                passing:{},
                mem:{},
                rank:[]
            },
            verbose = !!options.verbose,
            stepDetail = !!options.stepDetail,
            iterations = stepDetail ? 1 : (options.iterations || 1e3),
            impls = (imp.constructor.name === 'Array') ? imp : [imp],
            globs = [],
            log = verbose ? function () {
                 console.log.apply(null, arguments)
            } : function () {};
        impls.forEach(function (impl) {
            var name = impl.name;
            log('› Testing \`' + name + '\`');
            
            var out = { ok: 0, ko: 0 },
                times = [],
                sym = ['\u2717', '\u2713'],
                upStart = now(),
                mem = {
                    start: process.memoryUsage().heapUsed
                };
    
            benchs.forEach(function (bench, i) {
                var start = now(),
                    j = 0, r;
                while (j++ < iterations) r = impl.apply(null, bench.in);
                var end = now();
                times[i] = end - start;
    
                var isFunc = typeof bench.out === 'function',
                    spent = formatTime(times[i] / iterations),
                    res = isFunc
                        ? bench.out(r)
                        : bench.out;
                
                if ((isFunc && res ) || JSON.stringify(r) === JSON.stringify(res)) {
                    stepDetail && log(sym[1] + ' test #' + (i + 1) + ' passed ' + spent);
                    out.ok++;
                } else {
                    if (verbose && stepDetail) {
                        log(sym[0] + ' test #' + (i + 1) + ' failed ' + spent);
                        if (isFunc) {
                            log('| expected: true');
                            log('| received:', res, ' (ƒ)');
                        } else {
                            log('| expected:', res);
                            log('| received:', r);
                        }
                        log('\'+-------');
                    }
                    out.ko++;
                }
            });
    
            var upEnd = now(),
                globTime = upEnd - upStart;
            
            if (!out.ko) globs.push({ name, time: globTime });
            mem.end = process.memoryUsage().heapUsed
            // console.dir({mem})
            ret.mem[name] = formatSize((mem.end - mem.start) / iterations);
            if (verbose) {
                log('Passed ' + out.ok + ' | Failed ' + out.ko);
                log('Total time ' + formatTime(globTime, 1));
                log('Consuming ~' + ret.mem[name]);
                log('');
            }
    
            ret.passing[name] = out.ok && !out.ko
        });
    
    
        
        globs.length > 1 && log('∆ PODIUM');
        globs.sort(
            function (a, b) { return a.time - b.time }
        ).forEach(function (impl, i) {
            ret.times[impl.name] = impl.time;
            ret.rank.push(impl.name);
            log(`${i + 1}${['st', 'nd', 'rd',][i] || 'th'} place to \`${impl.name}\`: ${formatTime(impl.time)}`)
        });
        return ret;
    };
    
    return __testone;
})();


module.exports = testone;