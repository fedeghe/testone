var escomplex = require('escomplex'),
    assert = require('assert'),
    testone = require('../source/index.js'),
    fac1 = n => {
        if (n === 1) return 1;
        else return n * fac1(n - 1);
    },
    fac2 = n => {
        let r = n
        while (n > 1) r *= --n;
        return r;
    };

    
    // this is the full plugin ;) 
    function complex({source, options}) {
        return Promise.resolve(escomplex.analyse(source, options))
    }
    function complexFail({source, options}) {
        return Promise.reject()
    }

    // this is another dumb plugin counting the number of lines
    function chars({source, options}) {
        // console.log({source})
        return Promise.resolve(source.split().length)
    }

function j(json) {
    console.log(JSON.stringify(json, null, 2))
}

describe('plugins', () => {
    beforeEach(() => {
        oldConsoleLog = console.warn;
        console.warn = (...m) => {
            console.warn.calls.push(m)
        }
        console.warn.calls = [];
        console.warn.reset = () => {
            console.warn.calls = [];
        };
    });
    it('should return the expected values', async () => {
        var res = await testone([{
                in: [10],
                out: 3628800
            },{
                in: [4],
                out: ({received}) => received
            },{
                in: [4],
                out: () => 24
            }],
            [fac1, fac2],
            {
                iterations: 1e3,
                plugins: [{
                    fn: complex,
                    options: {}
                },{
                    fn: chars,
                    options: {},
                }],
                metrics: {
                    cyclocplx: ({pluginsResults: {complex}}) => complex.aggregate.cyclomatic,
                    ch: ({pluginsResults: {chars}}) => chars
                }
            }
        )
        
        assert(res.metrics.cyclocplx.fac1 > 0);
        assert(res.metrics.cyclocplx.fac2 > 0);
        assert(res.metrics.ch.fac1 > 0);
        assert(res.metrics.ch.fac2 > 0);
        
    });
    it('should warn when a plugin fails', async () => {
            
            var strat = [fac1, fac2],
                res = await testone([{
                in: [10],
                out: 3628800
            },{
                in: [4],
                out: ({received}) => received
            },{
                in: [4],
                out: () => 24
            }],
            strat,
            {
                iterations: 1e3,
                plugins: [{
                    fn: complexFail,
                    options: {}
                },{
                    fn: chars,
                    options: {},
                }],
                metrics: {
                    cyclocplx: ({pluginsResults: {complexFail}, mem: {fac1}}) => fac1 ? 333 : complexFail?.aggregate?.cyclomatic,
                    ch: ({pluginsResults: {chars}}) => chars,
                }
            }
        )
        
        assert(console.warn.calls.length === 1);
        assert(console.warn.calls[0][0] === 'WARNING: plugins can run only when all tests pass');
        // both metrics and pluginsResults are empty objs
        assert(res.metrics && Object.keys(res.metrics).length === 0);
        assert(res.pluginsResults && Object.keys(res.pluginsResults).length === 0);
        
        
        ['times', 'mem'].forEach(p1 => {
            strat.forEach(s => {
                var p2 = s.name;
                ['raw', 'withLabel'].forEach(p3 => {
                    ['single', 'total'].forEach(p4 => {
                        assert(p4 in res[p1][p2][p3]);
                    })
                })
            })
        })  
        
    });
});

