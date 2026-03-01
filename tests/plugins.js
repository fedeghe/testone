const testone = require('../dist/index.js'),
    fac1 = n => {
        if (n === 1) return 1;
        else return n * fac1(n - 1);
    },
    fac2 = n => {
        let r = n
        while (n > 1) r *= --n;
        return r;
    };

function complexFail({source, options}) {
    return Promise.reject()
}

// this is another dumb plugin counting the number of lines
function chars({source, options}) {
    return Promise.resolve({n: source.split().length})
}

function chars2({source, options}) {
    return Promise.resolve({n2: source.split().length})
}

// function j(json) {
//     console.log(JSON.stringify(json, null, 2))
// }

describe('plugins', () => {
    let warnSpy;

    beforeEach(() => {
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    it('should return the expected values', async () => {
        const res = await testone([{
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
                    fn: chars,
                    options: {},
                },{
                    fn: chars2,
                    options: {},
                    skipReport: true
                }],
                metrics: {
                    cyclocplx: ({
                        pluginsResults: {chars}
                    }) => chars,
                    ch: ({pluginsResults: {chars: {n}}}) => parseInt(n, 10) * 2
                }
            }
        )

        expect(res.metrics.cyclocplx.fac1.n).toBeGreaterThan(0);
        expect(res.metrics.cyclocplx.fac2.n).toBeGreaterThan(0);
        expect(res.metrics.ch.fac1).toBeGreaterThan(0);
        expect(res.metrics.ch.fac2).toBeGreaterThan(0);
        expect(res.pluginsResults.fac1.chars2).toBe('skipped "chars2"')
        expect(res.pluginsResults.fac2.chars2).toBe('skipped "chars2"')

    });

    it('should warn when a plugin fails', async () => {
        const strat = [fac1, fac2],
            res = await testone(
                [{
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
                        options: {},
                    },{
                        fn: chars,
                        options: {},
                    }],
                    metrics: {
                        cyclocplx: ({pluginsResults: {complexFail}, mem: {fac1}}) => fac1 ? 333 : complexFail?.aggregate?.cyclomatic,
                        ch: ({pluginsResults: {n}}) => n,
                    }
                }
            );

        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0][0]).toBe('Error:');
        // both metrics and pluginsResults are empty objs
        expect(res.metrics && Object.keys(res.metrics).length === 0).toBe(true);
        expect(res.pluginsResults && Object.keys(res.pluginsResults).length === 0).toBe(true);

        ['times', 'mem'].forEach(p1 => {
            strat.forEach(s => {
                var p2 = s.name;
                ['raw', 'withLabel'].forEach(p3 => {
                    ['single', 'total'].forEach(p4 => {
                        expect(p4 in res[p1][p2][p3]).toBe(true);
                    })
                })
            })
        })

    });
});
