const assert = require('assert'),
    testone = require('../source/index.js'),

    fib1 = n => {
        if (n === 1) return 1
        else return n * fib1(n - 1)
    },
    fib2 = n => {
        let r = n
        while (n > 1) r *= --n;
        return r
    },
    fib3 = () => 6,
    fib4 = () => 6,
    identity = n => n;


describe('basic testone', () => {

    beforeEach(() => {
        oldConsoleLog = console.log;
        console.log = () => {
            console.log.calls.push([].slice.call(arguments))
        }
        console.log.calls = [];
        console.log.reset = () => {
            console.log.calls = [];
        };
    });

    afterEach(() => {
        console.log.calls = [];
    });

    it('should return the expected values', () => {
        var res = testone([{
            in: [10],
            out: 3628800
        },{
            in: [4],
            out: r => r === 24
        }], [fib1, fib2], {iterations:1e3})
        assert.ok(res.rank.includes('fib1'));
        assert.ok(res.rank.includes('fib2'));
        assert.ok('fib1' in res.mem);
        assert.ok('fib2' in res.mem);
        assert.ok('fib1' in res.times);
        assert.ok('fib2' in res.times);
        assert.ok(res.passing.fib1);
        assert.ok(res.passing.fib2);
    });

    it('should return the expected values, single implementaion', () => {
        var res = testone([{
            in: [10],
            out: 3628800
        },{
            in: [4],
            out: r => r === 24
        }], fib1, {iterations:1e3})
        assert.ok(res.rank.includes('fib1'));
        assert.ok('fib1' in res.mem);
        assert.ok('fib1' in res.times);
        assert.ok(res.passing.fib1);
    });

    it('should fail as expected', () => {
        var res = testone([{
            in: [10],
            out: 1
        }], [fib1, fib2])
        assert.ok(!res.passing.fib1);
        assert.ok(!res.passing.fib2);
        assert.strictEqual(console.log.calls.length, 0);
    });

    it('should be verbose as expected', () => {
        testone([{
            in: [3],
            out: 6
        },{
            in: [3],
            out: function(n){ return n===6}
        }], [fib1, fib2, fib3, fib4], {verbose: true, iterations: 1})
        assert.ok(console.log.calls.length);
    });

    it('should fail verbose as expected', () => {
        testone([{
            in: [3],
            out: 2
        },{
            in: [3],
            out: function(n){ return n===2}
        }], [fib1, fib2, fib3], {verbose: true, iterations: 1})
        assert.ok(console.log.calls.length);
    });

    it('should work as expected when using functions on both input/output', () => {
        testone([{
            in: function (n, j) { return [n*j]},
            out: function (r, n, j) { return r === n*j ? r : null;}
        }], [identity], {verbose: true, iterations: 1})
        assert.ok(console.log.calls.length);
    });
});
