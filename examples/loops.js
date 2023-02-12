const testone = require('../dist/index')
const fns = require('./loopsFns')

var size = 1e5,
    r = testone(
        [
            {
                in:[Array.from({length: size}, (_, i) => i)],
                out: (size-1) * size / 2
            }
        ],
        fns,
        {
            metrics: {
                f : ({time, mem}) => time * mem
            }
        }
    );
console.log(JSON.stringify(r, null, 2))