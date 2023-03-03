
const complex = require('testone-complexity-plugin') // this is not part of @fedeghe/testone deps thus
                                                     // u need that to run this successfully

const testone = require('../dist/index')
const fns = require('./loopsFns')

var size = 1e5;
testone(
    [
        {
            in:[Array.from({length: size}, (_, i) => i)],
            out: (size-1) * size / 2
        }
    ],
    fns,
    {
        plugins:[{
            fn: complex
        }],
        metrics: {
            f : ({time: {single: time}, mem: {single: mem}}) => time * mem,
            cplx: ({pluginsResults: {complex}}) => complex.complexity.methodAggregate.cyclomatic
        },
    }
).then(r => console.log(JSON.stringify(r.metrics.f, null, 2)));
