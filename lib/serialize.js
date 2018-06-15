"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encode = require("./encoding");
const client = require("cheerio-httpcli");
const rx_1 = require("rx");
client.set('timeout', 100000);
process.env.UV_THREADPOOL_SIZE = '128';
class ScrapingURL {
    serialize(obj) {
        const str = Object.keys(obj);
        for (let i = 0, len = str.length; i < len; i++) {
            const key = str[i];
            str[i] = encode.EscapeSJIS(key) + '=' + encode.EscapeSJIS(String(obj[key]));
        }
        return str.join("&");
    }
    scraping() {
        return client.fetch(this.toURL, 'sjis');
    }
    scrapingObservable() {
        return rx_1.Observable.fromPromise(client.fetch(this.toURL, 'sjis'))
            .catch(err => {
            err.message += '\nurl:' + this.toURL;
            return rx_1.Observable.throw(err);
        })
            .map((result) => result.$);
    }
}
exports.ScrapingURL = ScrapingURL;
class BCItemListURL extends ScrapingURL {
    constructor(searchObject) {
        super();
        this.searchObject = searchObject;
    }
    serialize() {
        return super.serialize(this.searchObject);
    }
    get toURL() {
        return `https://www.biccamera.com/bc/category/?${this.serialize()}#bcs_resultTxt`;
    }
}
exports.BCItemListURL = BCItemListURL;
class BCDetailURL extends ScrapingURL {
    constructor(id) {
        super();
        this.id = id;
    }
    get toURL() {
        return `https://www.biccamera.com/bc/item/${this.id}`;
    }
}
exports.BCDetailURL = BCDetailURL;
class BCStockURL extends ScrapingURL {
    constructor(id) {
        super();
        this.id = id;
    }
    get toURL() {
        return `https://www.biccamera.com/bc/tenpo/CSfBcToriokiList.jsp?GOODS_NO=${this.id}`;
    }
}
exports.BCStockURL = BCStockURL;
//# sourceMappingURL=serialize.js.map