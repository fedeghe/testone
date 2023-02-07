const assert = require('assert'),
    testone = require('../source/index.js'),
    fib1 = n => {
        if (n === 1) return 1;
        else return n * fib1(n - 1);
    },
    fib2 = n => {
        let r = n
        while (n > 1) r *= --n;
        return r;
    },
    fib3 = () => 6,
    fib4 = () => 6;

describe('basic testone', () => {

    const fields1 = ['mem', 'times'],
          fields2 = ['raw', 'withLabel'];

    it('should return the expected values, single strategy', () => {
        var res = testone([{
            in: [10],
            out: 3628800
        },{
            in: [4],
            out: r => r === 24
        }], fib1, {iterations:1e3});

        assert.ok(res.rank.includes('fib1'));
        // console.log(JSON.stringify(res, null, 2))
        fields1.forEach(k => {
            assert.ok('fib1' in res[k]);
            fields2.forEach(j => {
                assert.ok(j in res[k].fib1)
            });
        });
        assert.ok(res.passing.fib1);
        assert(!('err' in res));
    });

    it('should return the expected values , more strategies', () => {
        var fns = [fib1, fib2],
            res = testone([{
                in: [10],
                out: 3628800
            },{
                in: [4],
                out: r => r === 24
            }], fns, {iterations:1e3});
        fns.forEach(fn => {
            var name = fn.name;
            assert.ok(res.rank.includes(name));
            fields1.forEach(n => {
                assert.ok(name in res[n]);
                fields2.forEach(k => 
                    assert.ok(k in res[n][name])
                );
            });
            assert.ok(res.passing[name]);
        });
        assert(!('err' in res));
    });

    it('should fail as expected', () => {
        var fns = [fib1, fib2],
            res = testone([{
                in: [10],
                out: 1
            }], fns);
        fns.forEach(fn =>
            assert.ok(!res.passing[fn.name])
        );
        assert('err' in res);
    });

    it('should work as expected when using functions', () => {
        var res = testone([{
            in: [3],
            out: 6
        },{
            in: [3],
            out: n => n ===6
        },{
            in: () => [3],
            out: 6
        },{
            in: () => [3],
            out: n => n ===6
        }], [fib1, fib2, fib3, fib4]);
        assert(!('err' in res));
        assert.ok(res.passing.fib1);
    });

    it('should work as expected when fails using functions', () => {
        var strats = [fib1, fib2, fib3, fib4],
            ios = [{
                in: [3],
                out: 3
            },{
                in: [3],
                out: n => n === 3
            },{
                in: () => [3],
                out: 3
            },{
                in: () => [3],
                out: n => n === 3
            }],
            res = testone(ios, strats);
            
        assert('err' in res);
        strats.forEach(strat => {
            var name = strat.name,
                fields = ['received', 'expected', 'ioIndex'];
            assert.ok(!res.passing[name]);
            ios.forEach((io, i) => {
                fields.forEach(
                    k => assert(k in res.err[name][i])
                );
                assert(res.err[name][i].ioIndex === i);
                assert(res.err[name][i].received !== res.err[name][i].expected);
            })
        });
    });

    it('should work as expected when using metrics', () => {
        var fns = [fib1, fib2],
            res = testone([{
                in: [3],
                out: 6
            },{
                in: [3],
                out: n => n ===6
            },{
                in: () => [3],
                out: 6
            },{
                in: () => [3],
                out: n => n === 6
            }],
            fns,
            {
                metrics: {
                    x : ({time, mem}) =>  time * mem,
                    y : ({mem}) => mem * 2
                }
            });
        fns.forEach(fn => 
            assert.ok(res.passing[fn.name])
        );
    });
});

describe('static testone', () => {
    it('should work as expected testone.formatTime', () => {
        //just to have a name
        function fn(x) {return testone.formatTime(x)}
        var res = testone([{
            in: [1e4],
            out: '10 s'
        },{
            in: [10],
            out: '10 ms'
        },{
            in: [0.001],
            out: '1 µs'
        },{
            in: [0.000001],
            out: '1 ns'
        },{
            in: [0],
            out: '0 ns'
        }], [fn])
        assert(!('err' in res))
        assert.ok(res.passing.fn);
    });

    it('should work as expected testone.formatSize', () => {
        //just to have a name
        function fn(x) {return testone.formatSize(x)}
        var res = testone([{
            in: [2 ** 30],
            out: '1 GB'
        },{
            in: [2 ** 20],
            out: '1 MB'
        },{
            in: [1025],
            out: '1.001 KB'
        },{
            in: [1024],
            out: '1 KB'
        },{
            in: [1023],
            out: '1023 B'
        },{
            in: [0],
            out: '0 B'
        }], [fn])
    
        assert(!('err' in res))
        assert.ok(res.passing.fn);
    });
});
