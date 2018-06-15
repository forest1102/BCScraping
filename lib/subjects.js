"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scraping_1 = require("./scraping");
const fs = require("fs-extra");
execScrapingSubject
    .doOnNext(q => console.log(q))
    .filter(val => !!val)
    .flatMap(queries => {
    const csv = fs.createWriteStream('./db/data.csv');
    return scraping_1.execScraping(queries);
})
    .subscribe(() => console.log('saved JSON'), (err) => console.error(err), () => {
    console.log('All Complete');
});
// .flatMap(val => Rx.Observable.fromPromise(
// 	fs.readJSON(jsonDir)
// 		.then((json: {}[]) => fs.outputJson(jsonDir, [...json, val]))))
// .subscribeOnNext(() => console.log('saved json'))
// .dispose()
//# sourceMappingURL=subjects.js.map