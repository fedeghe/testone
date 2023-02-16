const assert = require('assert'),
    testone = require('../source/index.js'),
    fac1 = n => {
        if (n === 1) return 1;
        else return n * fac1(n - 1);
    },
    fac2 = n => {
        let r = n
        while (n > 1) r *= --n;
        return r;
    },
    fac3 = () => 6,
    fac4 = () => 6;

function j(json) {
    console.log(JSON.stringify(json, null, 2))
}

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
        }], fac1, {iterations:1e3});

        fields1.forEach(k => {
            assert.ok('fac1' in res[k]);
            fields2.forEach(j => {
                assert.ok(j in res[k].fac1)
            });
        });
        assert.ok(res.outcome.fac1);
        assert(!('err' in res));
    });

    it('should return the expected values , more strategies', () => {
        var fns = [fac1, fac2],
            res = testone([{
                in: [10],
                out: 3628800
            },{
                in: [4],
                out: r => r === 24
            }], fns, {iterations:1e3});
        fns.forEach(fn => {
            var name = fn.name;
            
            fields1.forEach(n => {
                assert.ok(name in res[n]);
                fields2.forEach(k => 
                    assert.ok(k in res[n][name])
                );
            });
            assert.ok(res.outcome[name]);
        });
        assert(!('err' in res));
    });

    it('should fail as expected', () => {
        var fns = [fac1, fac2],
            res = testone([{
                in: [10],
                out: 1
            },{
                in: [3],
                out: 6
            }], fns);

        // j(res)
        fns.forEach(fn => {
            assert(res.outcome[fn.name][0].passing === false)
            assert(res.outcome[fn.name][1].passing)
        });
        // assert('err' in res);
    });

    it('should work as expected when using functions', () => {
        var fns = [fac1, fac2, fac3, fac4],
            res = testone([{
                in: [3],
                out: 3
            },{
                in: [3],
                out: n => n ===6
            },{
                in: () => [3],
                out: 6
            },{
                in: () => [3],
                out: n => n ===6
            }], fns);
        // j(res)

        fns.forEach(fn => assert.ok(res.outcome[fn.name]));
    });

    it('should work as expected when fails using functions', () => {
        var strats = [fac1, fac2, fac3, fac4],
            ios = [{
                    in: [3],
                    out: 3
                }
                ,{
                    in: [3],
                    out: n => n === 6
                }
                ,{
                    in: () => [3],
                    out: 6
                },{
                    in: () => [3],
                    out: n => n === 3
                }
            ],
            res = testone(ios, strats);

        // assert('err' in res);
        strats.forEach(strat => {
            var name = strat.name,
                fields = ['received', 'expected', 'ioIndex'];
         
            
            fields.forEach(k => {
                assert(res.outcome[name][0].passing === false)
                assert(res.outcome[name][0].details.err.ioIndex === 0)
                assert(res.outcome[name][0].details.err.received !== res.outcome[name][0].details.err.expected)
                assert(res.outcome[name][1].passing)
                assert(res.outcome[name][2].passing)
                assert(res.outcome[name][3].passing === false)
                assert(res.outcome[name][3].details.err.ioIndex === 3)
                assert(res.outcome[name][3].details.err.received !== res.outcome[name][3].details.err.expected)
            });
        });
    });

    it('should work as expected when using metrics', () => {
        var fns = [fac1, fac2],
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
                    x : ({time:{single: time}, mem: {single: mem}}) =>  time * mem,
                    y : ({mem: {single: mem}}) => mem * 2
                }
            });
        fns.forEach(fn => 
            assert.ok(res.outcome[fn.name])
        );
        res.metrics.x.forEach(m => {
            assert(m.value === res.mem[m.name].raw.single * res.times[m.name].raw.single) 
        })
        res.metrics.y.forEach(m => {
            assert(m.value === res.mem[m.name].raw.single * 2) 
        })
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
        assert.ok(res.outcome.fn);
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
        assert.ok(res.outcome.fn);
    });
});
