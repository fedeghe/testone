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
    fac4 = () => 1 * 2 * 3;

function j(json) {
    console.log(JSON.stringify(json, null, 2))
}

describe('basic testone', () => {

    

    const fields1 = ['mem', 'times'],
          fields2 = ['raw', 'withLabel'];

    it('should return the expected values, single strategy', async () => {
        var res = await testone([{
            in: [10],
            out: 3628800
        },{
            in: [4],
            out: ({received}) => received
        },{
            in: [4],
            out: () => 24
        }], fac1, {iterations:1e3})
        
        fields1.forEach(k => {
            assert.ok('fac1' in res[k]);
            fields2.forEach(j => {
                assert.ok(j in res[k].fac1)
            });
        });
        assert.ok(res.report.fac1);
        assert(res.passing);
        
    });

    it('should return the expected values, more strategies', async () => {
        var fns = [fac1, fac2],
            res = await testone([{
                in: [10],
                out: 3628800
            },{
                in: [4],
                out: 24
            }], fns, {iterations:1e3})
        
        fns.forEach(fn => {
            var name = fn.name;
            
            fields1.forEach(n => {
                assert.ok(name in res[n]);
                fields2.forEach(k => 
                    assert.ok(k in res[n][name])
                );
            });
            assert.ok(res.report[name]);
        });
        assert.ok(res.passing);
    });

    it('should fail as expected', async () => {
        var fns = [fac1, fac2],
            res = await testone([{
                in: [10],
                out: 1
            },{
                in: [3],
                out: 6
            }], fns);

        fns.forEach(fn => {
            assert(res.report[fn.name][0].passing === false)
            assert(res.report[fn.name][1].passing)
        });
        assert(!res.passing);        
    });

    it('should work as expected when using functions', async () => {
        var fns = [fac1, fac2, fac3, fac4],
            res = await testone([{
                in: [3],
                out: 6
            },{
                in: [3],
                out: n => 6
            },{
                in: () => [3],
                out: 6
            },{
                in: () => [3],
                out: n => 6
            }], fns);
        fns.forEach(fn => assert.ok(res.report[fn.name]));
        assert(res.passing);
    });

    it('should work as expected when fails using functions', async () => {
        var strats = [fac1, fac2, fac3, fac4],
            ios = [{
                    in: [3],
                    out: 3
                }
                ,{
                    in: [3],
                    out: n => 6
                }
                ,{
                    in: () => [3],
                    out: 6
                },{
                    in: () => [3],
                    out: n => 3
                }
            ],
            res = await testone(ios, strats);

        strats.forEach(strat => {
            var name = strat.name,
                fields = ['received', 'expected', 'ioIndex'];
        
            fields.forEach(k => {
                assert(res.report[name][0].passing === false)
                assert(res.report[name][0].err.ioIndex === 0)
                assert(res.report[name][0].err.received !== res.report[name][0].err.expected)
                assert(res.report[name][1].passing)
                assert(res.report[name][2].passing)
                assert(res.report[name][3].passing === false)
                assert(res.report[name][3].err.ioIndex === 3)
                assert(res.report[name][3].err.received !== res.report[name][3].err.expected)
            });
        });
        assert(!res.passing);
    });

    it('should work as expected when using metrics', async () => {
        var fns = [fac1, fac2],
            res = await testone([{
                in: [3],
                out: 6
            },{
                in: [3],
                out: ({result, out}) => 6
            },{
                in: () => [3],
                out: 6
            },{
                in: () => [3],
                out: () => 6
            }],
            fns,
            {
                metrics: {
                    x : ({time:{single: time}, mem: {single: mem}}) =>  time * mem,
                    y : ({mem: {single: mem}}) => mem * 2
                }
            });
        
        fns.forEach(fn => 
            assert.ok(res.report[fn.name])
        );
        Object.entries(res.metrics.x).forEach(([name, value]) => {
            assert(value === res.mem[name].raw.single * res.times[name].raw.single) 
        });
        Object.entries(res.metrics.y).forEach(([name, value]) => {
            assert(value === res.mem[name].raw.single * 2) 
        });
        assert(res.passing);
    });
});

describe('matcher overriding', () => {
    it('should work as expected when using a global matcher', async () => {
        var fn = (...n) => `${n.join('')}`,
            res = await testone([{
                in: [3],
                out: '3'
            },{
                in: [3,4,5],
                out: '345'
            }],
            fn,
            {
                matcher: ({received, expected}) => `${received}` === `${expected}`
            });
    
        assert.ok(res.report[fn.name]);
        assert(res.passing);
    });

    it('should work as expected when using a benchmark matcher', async () => {
        var fn = (...n) => `${n.join('')}`,
            res = await testone([
                    {
                        in: [3],
                        out: '3.1',
                        matcher: ({received, expected}) => `${Math.round(received)}` === `${Math.round(expected)}`
                    },{
                        in: [3,4,5],
                        out: '345'
                    }
                ],
                fn,
                {
                    matcher: ({received, expected}) => `${received}` === `${expected}`
                }
            );
        
        assert.ok(res.report[fn.name]);
        assert(res.passing);
    });
});

describe('static testone', () => {
    it('should work as expected testone.formatTime', async () => {
        //just to have a name
        function fn(x) {return testone.formatTime(x)}
        var res = await testone([{
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
            }], [fn]);    
        assert.ok(res.report.fn);
        assert(res.passing);
    });

    it('should work as expected testone.formatSize', async () => {
        //just to have a name
        function fn(x) {return testone.formatSize(x)}
        var res = await testone([{
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
            
        assert.ok(res.report.fn);
        assert(res.passing);
    });
});
