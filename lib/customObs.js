"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rx_1 = require("rx");
const RETRY_DEFAULT = 100;
const SEC_DEFAULT = 10;
exports.withDelay = (errs, MAX = RETRY_DEFAULT, sec = SEC_DEFAULT) => errs
    .doOnNext(err => console.error(JSON.stringify(err)))
    .zip(rx_1.Observable.range(1, MAX + 1), (n, i) => ({ n, i }))
    .flatMap(({ n, i }) => rx_1.Observable.if(() => i > MAX, rx_1.Observable.throw(n), rx_1.Observable.timer(sec)))
    .doOnNext(() => console.log('リトライします。'));
//# sourceMappingURL=customObs.js.map