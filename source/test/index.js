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
    it('should return the expected values', () => {
        var res = testone([{
            in: [10],
            out: 3628800
        },{
            in: [4],
            out: r => r === 24
        }], [fib1, fib2], {iterations:1e3});

        // rank
        assert.ok(res.rank.includes('fib1'));
        assert.ok(res.rank.includes('fib2'));

        // mem
        assert.ok('fib1' in res.mem);
        assert.ok('withLabel' in res.mem.fib1);
        assert.ok('raw' in res.mem.fib1);
        assert.ok('fib2' in res.mem);
        assert.ok('withLabel' in res.mem.fib2);
        assert.ok('raw' in res.mem.fib2);

        assert.ok('fib1' in res.times);
        assert.ok('withLabel' in res.times.fib1);
        assert.ok('raw' in res.times.fib1);
        assert.ok('fib2' in res.times);
        assert.ok('withLabel' in res.times.fib2);
        assert.ok('raw' in res.times.fib2);

        assert.ok(res.passing.fib1);
        assert.ok(res.passing.fib2);
        assert(!('err' in res));
    });

    it('should return the expected values, single implementaion', () => {
        var res = testone([{
            in: [10],
            out: 3628800
        },{
            in: [4],
            out: r => r === 24
        }], fib1, {iterations:1e3});
        assert.ok(res.rank.includes('fib1'));
        assert.ok('fib1' in res.mem);
        assert.ok('fib1' in res.times);
        assert.ok(res.passing.fib1);
        assert(!('err' in res));
    });

    it('should fail as expected', () => {
        var res = testone([{
            in: [10],
            out: 1
        }], [fib1, fib2]);
        assert.ok(!res.passing.fib1);
        assert.ok(!res.passing.fib2);
        assert('err' in res);
    });

    it('should work as expected when using functions', () => {
        var res = testone([{
            in: [3],
            out: 6
        },{
            in: [3],
            out: function(n){ return n===6}
        },{
            in: function () {return [3]},
            out: 6
        },{
            in: function () {return [3]},
            out: function(n){ return n===6}
        }], [fib1, fib2, fib3, fib4]);
        assert(!('err' in res));
        assert.ok(res.passing.fib1);
    });

    it('should work as expected when fails using functions', () => {
        var ios = [{
                in: [3],
                out: 3
            },{
                in: [3],
                out: function(n){ return n===3}
            },{
                in: function () {return [3]},
                out: 3
            },{
                in: function () {return [3]},
                out: function(n){ return n===3}
            }],
            strats = [fib1, fib2, fib3, fib4],
            res = testone(ios, strats);
        
        assert('err' in res);
        assert.ok(!res.passing.fib1);
        assert.ok(!res.passing.fib2);
        assert.ok(!res.passing.fib3);
        assert.ok(!res.passing.fib4);
        strats.forEach(strat => {
            var name = strat.name;
            ios.forEach((io, i) => {
                assert('received' in res.err[name][i]);
                assert('expected' in res.err[name][i]);
                assert('ioIndex' in res.err[name][i]);
                assert(res.err[name][i].ioIndex === i);
                assert(res.err[name][i].received !== res.err[name][i].expected);
            })
        });
    });

    it('should work as expected when using metrics', () => {
        var res = testone([{
            in: [3],
            out: 6
        },{
            in: [3],
            out: function(n){ return n===6}
        },{
            in: function () {return [3]},
            out: 6
        },{
            in: function () {return [3]},
            out: function(n){ return n===6}
        }],
        [fib1, fib2],
        {
            metrics: {
                x : ({time, mem}) =>  time * mem,
                y : ({mem}) => mem * 2
            }
        })
        
        assert.ok(res.passing.fib1);
        assert.ok(res.passing.fib2);
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
            in: [2**30],
            out: '1 GB'
        },{
            in: [2**20],
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
