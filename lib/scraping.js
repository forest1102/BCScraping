"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client = require("cheerio-httpcli");
const serialize_1 = require("./serialize");
const Rx = require("rx");
const customObs_1 = require("./customObs");
client.set('headers', null);
client.set('timeout', 36000000);
var StockType;
(function (StockType) {
    StockType[StockType["\u25B3\u00A0\u304A\u53D6\u308A\u5BC4\u305B"] = 0] = "\u25B3\u00A0\u304A\u53D6\u308A\u5BC4\u305B";
    StockType[StockType["\u25CB\u00A0\u5728\u5EAB\u6B8B\u5C11"] = 1] = "\u25CB\u00A0\u5728\u5EAB\u6B8B\u5C11";
    StockType[StockType["\u25CE\u00A0\u5728\u5EAB\u3042\u308A"] = 2] = "\u25CE\u00A0\u5728\u5EAB\u3042\u308A";
    StockType[StockType["\u5728\u5EAB\u7121\u3057"] = 3] = "\u5728\u5EAB\u7121\u3057";
})(StockType || (StockType = {}));
exports.dataKeys = [
    '商品コード',
    'JANコード',
    '商品名',
    '型番'
];
const dataTitle = [
    '商品コード',
    'JANコード',
    '商品名',
    '型番',
    '価格（税込）',
    'ポイント'
];
const shopLists = [
    "ビックカメラ 池袋本店",
    "ビックカメラ 池袋本店パソコン館",
    "ビックカメラ 池袋東口カメラ館",
    "ビックカメラ 池袋西口店",
    "ビックカメラ アウトレット池袋東口店",
    "ビックカメラ 有楽町店",
    "ビックカメラ 赤坂見附駅店",
    "ビックカメラ AKIBA",
    "ソフマップAKIBA1号店 サブカル・モバイル館",
    "ソフマップAKIBA2号店 パソコン総合館",
    "ビックカメラ 新宿西口店",
    "ビックロ　ビックカメラ新宿東口店",
    "ビックカメラ 新宿東口駅前店",
    "ビックドラッグ シダックス新宿セントラルロード店",
    "ビックカメラセレクト原宿店",
    "ビックカメラ 渋谷東口店",
    "ビックカメラ 渋谷ハチ公口店",
    "ビックカメラ 立川店",
    "ビックカメラ JR八王子駅店",
    "ビックカメラ 京王調布店",
    "ビックカメラ 聖蹟桜ヶ丘駅店",
    "ビックカメラ セレクト町田店",
    "ビックカメラ ラゾーナ川崎店",
    "ビックカメラ 横浜西口店",
    "ビックカメラ 新横浜店",
    "ビックカメラ 藤沢店",
    "ビックカメラ 相模大野駅店",
    "ビックカメラ 柏店",
    "ビックカメラ 船橋駅FACE店",
    "ビックカメラ 船橋東武店",
    "ビックカメラ 大宮西口そごう店",
    "ソフマップ川越店",
    "ビックカメラ 高崎東口店",
    "ビックカメラ 水戸駅店",
    "ビックカメラ 札幌店",
    "ビックカメラ 新潟店",
    "ビックカメラ 浜松店",
    "ビックカメラ 名古屋駅西店",
    "ビックカメラ 名古屋JRゲートタワー店",
    "ビックトイズ プライムツリー赤池店",
    "ビックカメラ JR京都駅店",
    "ビックカメラ なんば店",
    "ビックカメラ あべのキューズモール店",
    "ソフマップ神戸ハーバーランド店",
    "ビックカメラ 岡山駅前店",
    "ビックカメラ 広島駅前店",
    "ビックカメラ 天神１号館",
    "ビックカメラ 天神２号館",
    "ビックカメラ 鹿児島中央駅店",
    "Air BIC CAMERA羽田空港国際線店※",
    "Air BIC CAMERA アクアシティお台場店※",
    "Air BIC CAMERA 成田空港第２ターミナル店※",
    "Air BIC CAMERA 中部国際空港セントレア店(国際線出発ゲート内)※"
];
const shopLength = shopLists.length;
const defaultStock = new Array(shopLength).fill('0');
exports.scrapingItemListObservable = (queries) => Rx.Observable.if(() => (!!queries && !!queries.q), Rx.Observable.of(Object.assign({}, queries, { rowPerPage: 100, type: 1, p: 1 })))
    .flatMap((searchObject) => Rx.Observable.just(new serialize_1.BCItemListURL(searchObject)))
    .flatMap(startPage => startPage.scrapingObservable()
    .catch(e => (e['statusCode'] == 404) ? Rx.Observable.empty() : Rx.Observable.throw(e))
    .retryWhen(errs => customObs_1.withDelay(errs))
    .flatMap($ => Rx.Observable.range(2, Math.ceil((parseInt($('#bcs_resultTxt')
    .find('em')
    .text()) || 3 - 2) / startPage.searchObject.rowPerPage))
    .map(p => new serialize_1.BCItemListURL(Object.assign({}, startPage.searchObject, { p })))
    .flatMap(url => url.scrapingObservable()
    .retryWhen(errs => customObs_1.withDelay(errs)))
    .startWith($)))
    .map($ => $('.bcs_boxItem .prod_box')
    .toArray()
    .map(el => el.attribs['data-item-id']));
exports.scrapingDetailObservable = (id) => Rx.Observable.of(new serialize_1.BCDetailURL(id))
    .flatMap(url => url.scrapingObservable())
    .map($ => {
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
    return Object.assign({}, $('#bcs_detail')
        .find('tr')
        .toArray()
        .map((e) => ({
        key: $('th', e).text().trim(),
        val: $('td', e).text().trim()
    }))
        .filter(e => exports.dataKeys.indexOf(e.key) !== -1)
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
})
    .catch((err) => {
    if (err['statusCode'] === 404)
        return Rx.Observable.return({
            '商品名': '',
            '価格（税込）': '',
            'ポイント': '',
            '型番': '',
            'メーカー': '',
            'JANコード': ''
        });
    else
        return Rx.Observable.throw(err);
})
    .map(obj => dataTitle.map(key => `"${obj[key]}"`));
exports.scrapingStockObservable = (id) => Rx.Observable.of(new serialize_1.BCStockURL(id))
    .flatMap(url => url.scrapingObservable())
    .flatMap($ => Rx.Observable.range(0, shopLength)
    .map(i => $(`#shopList_jp_${i}`))
    .map(cur => $('.bcs_KST_Stock', cur).first().text())
    .map(value => +(value === '◎ 在庫あり' || value === '○ 在庫残少') + '')
    .toArray()
// .reduce((acc, cur) => {
// 	const key = $('.pc_dtb', cur).first().text()
// 	const value = $('.bcs_KST_Stock', cur).first().text()
// 	return {
// 		[key]:
// 			+(value === '◎ 在庫あり' || value === '○ 在庫残少'),
// 		...acc
// 	}
// }, {})
)
    .catch((err) => {
    if (err['statusCode'] === 404)
        return Rx.Observable.return(defaultStock);
    else
        return Rx.Observable.throw(err);
});
exports.execScraping = (queries) => exports.scrapingItemListObservable(queries)
    .filter(_val => !!_val.length)
    .flatMap(_val => Rx.Observable.fromArray(_val))
    .filter(id => !!id)
    .concatMap(_val => Rx.Observable.zip(exports.scrapingDetailObservable(_val)
    .retryWhen(customObs_1.withDelay), exports.scrapingStockObservable(_val)
    .retryWhen(customObs_1.withDelay), (detail, stock) => ([
    ...detail,
    ...stock
])))
    .startWith([...dataTitle, ...shopLists]);
// .map(_val => JSON.stringify(_val, null, 2))
// .toArray()
// .map(arr => `[${arr.join(',\n')}]`)
// .doOnNext(() => console.log('data saving...'))
// .flatMap((_val) =>
// 	fs.outputFile(jsonDir, _val)
// )
//# sourceMappingURL=scraping.js.map