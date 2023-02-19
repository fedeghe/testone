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
        return escomplex.analyse(source, options)
    }

    // this is another dumb plugin counting the number of lines
    function chars({source, options}) {
        // console.log({source})
        return source.split().length
    }

function j(json) {
    console.log(JSON.stringify(json, null, 2))
}

describe('plugins', () => {
    it('should return the expected values', () => {
        var res = testone([{
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
                    cyclocplx: ({plugins: {complex}}) => complex.aggregate.cyclomatic,
                    ch: ({plugins: {chars}}) => chars
                }
            }
        );

        // j(res)
        assert(res.metrics.cyclocplx.fac1 > 0);
        assert(res.metrics.cyclocplx.fac2 > 0);
        assert(res.metrics.ch.fac1 > 0);
        assert(res.metrics.ch.fac2 > 0);
        assert('complex' in res.plugins.fac1);
        assert('complex' in res.plugins.fac2);
        assert('chars' in res.plugins.fac1);
        assert('chars' in res.plugins.fac2);
    });
  
});

