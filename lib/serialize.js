"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encode = require("./encoding");
const client = require("cheerio-httpcli");
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
//# sourceMappingURL=serialize.js.map