"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scraping_1 = require("./scraping");
const Rx = require("rx");
const fs = require("fs-extra");
const path = require("path");
exports.execScrapingSubject = new Rx.Subject();
const jsonDir = path.join(__dirname, '../db/data.json');
exports.execScrapingSubject
    .filter(val => !!val)
    .subscribe(val => scraping_1.itemListScrapingObservable(val)
    .flatMap(_val => scraping_1.detailScrapingObservable(_val.ids).map(a => ({ value: a, i: _val.i })))
    .do(value => {
    console.log(`${value.i}: ${JSON.stringify(value.value)}\n`);
}, error => console.log(`onError: ${error}`), () => console.log('onCompleted'))
    .map(_val => _val.value)
    .toArray()
    .map((_val) => {
    fs.outputJSON(jsonDir, _val, { spaces: 2 });
})
    .subscribeOnNext(() => console.log('saved JSON')));
// .flatMap(val => Rx.Observable.fromPromise(
// 	fs.readJSON(jsonDir)
// 		.then((json: {}[]) => fs.outputJson(jsonDir, [...json, val]))))
// .subscribeOnNext(() => console.log('saved json'))
// .dispose()
//# sourceMappingURL=subjects.js.map