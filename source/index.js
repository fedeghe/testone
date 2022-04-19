'use strict';
/*
  __          __
 / /____ ___ / /____  ___  ___
/ __/ -_|_-</ __/ _ \/ _ \/ -_)
\__/\__/___/\__/\___/_//_/\__/  v 0.0.5
*/
function formatX(map, base) {
    return function (s, prec = 2) {
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

function testone(bs, imp, options = {}) {
    var stepDetail = !!options.stepDetail,
        iterations = stepDetail ? 1 : (options.iterations || 1e3),
        impls = (imp.constructor.name === 'Array') ? imp : [imp],
        globs = [];
    impls.forEach(function (impl) {
        var name = impl.name;
        console.log('› Testing \`' + name + '\`');
        var out = { ok: 0, ko: 0 },
            times = [],
            sym = ['\u2717', '\u2713'],
            upStart = now();

        bs.forEach(function (b, i) {
            var start = now(),
                j = 0, r;
            while (j++ < iterations) r = impl.apply(null, b.in);
            var end = now();
            times[i] = end - start;

            var func = typeof b.out === 'function',
                spent = formatTime(times[i] / iterations),
                res = func
                    ? b.out(r)
                    : b.out;
            if (JSON.stringify(r) === JSON.stringify(res)) {
                stepDetail && console.log(sym[1] + ' test #' + (i + 1) + ' passed ' + spent);
                out.ok++;
            } else {
                if (stepDetail) {
                    console.log(sym[0] + ' test #' + (i + 1) + ' failed ' + spent);
                    if (func) {
                        console.log('| expected: true');
                        console.log('| received:', res, ' (ƒ)');
                    } else {
                        console.log('| expected:', res);
                        console.log('| received:', r);
                    }
                    console.log('\'+-------');
                }
                out.ko++;
            }
        });

        var upEnd = now(),
            globTime = upEnd - upStart;
        console.log('Passed ' + out.ok + ' | Failed ' + out.ko);
        console.log('Total time ' + formatTime(globTime, 1));
        if (!out.ko) globs.push({ name, time: globTime });
        console.log('Consuming ~' + formatSize(process.memoryUsage().heapUsed));
        console.log('');
    });

    if (globs.length > 1) {
        console.log('∆ PODIUM');
        globs.sort(
            function (a, b) { return a.time - b.time }
        ).forEach(function (impl, i) {
            console.log(`${i + 1}${['st', 'nd', 'rd',][i] || 'th'} place to \`${impl.name}\` : ${formatTime(impl.time)}`)
        });
    }
};

module.exports = testone;