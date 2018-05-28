"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client = require("cheerio-httpcli");
const serialize_1 = require("./serialize");
const Rx = require("rx");
client.set('browser', 'chrome');
exports.itemListScrapingObservable = (queries) => Rx.Observable.create((observer) => __awaiter(this, void 0, void 0, function* () {
    if (!queries.q)
        return observer.onError('query is not defined');
    try {
        const searchObject = Object.assign({}, queries, { rowPerPage: 100, type: 1, p: 1 });
        let url = new serialize_1.BCItemListURL(searchObject);
        let { $ } = yield url.scraping();
        const lastIndex = Math.ceil((parseInt($('#bcs_resultTxt')
            .find('em')
            .text()) || 1) / searchObject.rowPerPage);
        const ids = [];
        for (let i = 1; i <= lastIndex; i++) {
            if (i > 1) {
                url.searchObject.p = i;
                $ = (yield url.scraping()).$;
            }
            observer.onNext({
                ids: $('.bcs_boxItem .prod_box')
                    .toArray()
                    .map(el => el.attribs['data-item-id']),
                i
            });
        }
    }
    catch (e) {
        observer.onError(e);
    }
    finally {
        observer.onCompleted();
    }
    return observer.onCompleted();
}));
exports.detailScrapingObservable = (array) => Rx.Observable.create((observer) => __awaiter(this, void 0, void 0, function* () {
    let i = 0;
    let id;
    try {
        for (const len = array.length; i < len; i++) {
            id = array[i];
            const result = (yield scrapingDetail(id));
            observer.onNext(result);
        }
        observer.onCompleted();
    }
    catch (e) {
        observer.onError(`at:${id}, error:${e}`);
    }
    finally {
        observer.onCompleted();
    }
}));
function scrapingDetail(id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!id) {
            return {
                '商品名': '',
                '価格（税込）': '',
                'ポイント': '',
                '型番': '',
                'メーカー': '',
                'JANコード': ''
            };
        }
        const dataKeys = [
            '商品コード',
            'JANコード',
            '商品名',
            '型番'
        ];
        const url = new serialize_1.BCDetailURL(id), { $ } = (yield url.scraping());
        return Object.assign({}, $('#bcs_detail')
            .find('tr')
            .toArray()
            .map((e) => ({
            key: $('th', e).text().trim(),
            val: $('td', e).text().trim()
        }))
            .filter(e => dataKeys.indexOf(e.key) !== -1)
            .reduce((acc, cur) => {
            const { key, val } = cur;
            switch (key) {
                case 'メーカー':
                    return {
                        [key]: val
                            .replace(/（メーカーサイトへ）/, '')
                            .trim()
                    };
                default:
                    return Object.assign({ [key]: val }, acc);
            }
        }, {}), { '価格（税込）': $('.tax_cell li')
                .last()
                .text()
                .replace(/円（税込）/, ''), 'ポイント': $('.bcs_point')
                .first()
                .text()
                .replace('ポイント', '')
                .replace(/（.*?）/, '')
                .trim() });
    });
}
//# sourceMappingURL=scraping.js.map