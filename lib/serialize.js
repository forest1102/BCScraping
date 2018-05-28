"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encode = require("./encoding");
const client = require("cheerio-httpcli");
client.set('timeout', 100000);
class ScrapingURL {
    static serialize(obj) {
        const str = [];
        for (const p in obj)
            if (obj.hasOwnProperty(p)) {
                // Logger.log(encode.EscapeSJIS(String(obj[p])))
                str.push(encode.EscapeSJIS(String(p)) + "=" + encode.EscapeSJIS(String(obj[p])));
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
        const str = [];
        for (const p in this.searchObject)
            if (this.searchObject.hasOwnProperty(p)) {
                // Logger.log(encode.EscapeSJIS(String(obj[p])))
                str.push(encode.EscapeSJIS(String(p)) + "=" + encode.EscapeSJIS(String(this.searchObject[p])));
            }
        return str.join("&");
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