const testone = require('../dist/index')

function _forEach (a) {
    var res = 0;
    a.forEach(function (el) { res += el; });
    return res;
}

function _for (a) {
    var res = 0, l = a.length, i = 0;
    for (null; i < l; i++) res += a[i];
    return res;
}

function _forInvert (a) {
    var res = 0, l = a.length;
    for (null; l--; null) res += a[l];
    return res;
}

function _while (a) {
    var res = 0, l = a.length, i = 0;
    while (i < l) res += a[i++];
    return res;
}

function _whileInvert (a) {
    var res = 0, l = a.length;
    while (l--) res += a[l];
    return res;
}

function _forIn (a) {
    var res = 0, i;
    for (i in a) {
        if (a.hasOwnProperty(i)) res += a[i];
    }
    return res;
}

function _forOf (a) {
    var res = 0, i;
    for (i of a) res += i;
    return res;
}

function _map (a) {
    var res = 0;
    a.map(function (el) { res += el; });
    return res;
}

function _iter (a) {
    var res = 0,
        entry,
        items = a.entries();
    while (!(entry = items.next()).done) {
        res += entry.value[1];
    }
    return res;
}

function _eval (a) {
    var res = eval(a.join('+'));
    return res;
}

function _red (a) {
    var res = a.reduce(function (r, item) {
        return r + item;
    }, 0);
    return res;
}

var size = 1e4,
    r = testone(
        [
            {
                in:[Array.from({length: size}, (_, i) => i)],
                out: (size-1) * size / 2
            }
        ],
        [_forEach, _for, _forInvert, _while, _whileInvert, _forIn, _forOf, _map, _iter, _eval, _red],
        {
            metrics: {
                f : ({time, mem}) => time * mem
            }
        }
    );
console.log(JSON.stringify(r, null, 2))