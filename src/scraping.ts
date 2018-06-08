import * as client from 'cheerio-httpcli'
import * as moment from 'moment'
import { BCDetailURL, BCItemListURL, BCStockURL } from './serialize'
import * as Rx from 'rx'

client.set('browser', 'chrome')
client.set('headers', {
	family: '4'
})

type detailObject = {
	'商品名': string
	'価格（税込）': string
	'ポイント': string
	'型番': string
	'メーカー': string
	'JANコード': string
}

enum StockType {
	'△ お取り寄せ',
	'○ 在庫残少',
	'◎ 在庫あり',
	'在庫無し'
}
export const dataKeys = [
	'商品コード',
	'JANコード',
	'商品名',
	'型番'
]

const dataTitle = [
	'商品コード',
	'JANコード',
	'商品名',
	'型番',
	'価格（税込）',
	'ポイント'
]


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
]
const shopLength = shopLists.length
const defaultStock = new Array(shopLength).fill('0')

export const scrapingItemListObservable = (queries: SearchObject) =>
	Rx.Observable.if(
		() => (!!queries && !!queries.q),
		Rx.Observable.of({
			...queries,
			rowPerPage: 100,
			type: 1,
			p: 1
		})
	)
		.flatMap((searchObject: SearchObject) =>
			Rx.Observable.create<string[]>(async (observer) => {
				try {
					const url = new BCItemListURL(searchObject)
					let { $ } = await url.scraping()
					if ($('#searchNotFound').length) {
						Rx.Observable.empty()
					}
					const lastIndex = Math.ceil((parseInt($('#bcs_resultTxt')
						.find('em')
						.text()) || 1) / searchObject.rowPerPage)

					for (let i = 1; i <= lastIndex; i++) {

						if (i > 1) {

							url.searchObject.p = i
							$ = (await url.scraping()).$
						}

						observer.onNext(
							$('.bcs_boxItem .prod_box')
								.toArray()
								.map(el => el.attribs['data-item-id']))
					}
				}
				catch (e) {
					if (e['statusCode'] === 404) return observer.onNext([])
					else return observer.onError(e)
				}
				finally {
					observer.onCompleted()
				}

			}))

export const scrapingDetailObservable = (id: string) =>
	Rx.Observable.of(new BCDetailURL(id))
		.flatMap(url => url.scrapingObservable())
		.map<{ [key: string]: string }>($ => {
			if (!id) {
				return {
					'商品名': '',
					'価格（税込）': '',
					'ポイント': '',
					'型番': '',
					'メーカー': '',
					'JANコード': ''
				}
			}

			return ({
				...$('#bcs_detail')
					.find('tr')
					.toArray()
					.map((e) => ({
						key: $('th', e).text().trim(),
						val: $('td', e).text().trim()
					}))
					.filter(e => dataKeys.indexOf(e.key) !== -1)
					.reduce((acc, cur) => {
						const {
							key,
							val
						} = cur
						switch (key) {
							case 'メーカー':
								return {
									[key]: val
										.replace(/（メーカーサイトへ）/, '')
										.trim()
								}
							default:
								return {
									[key]: val,
									...acc
								}
						}
					}, {}),

				'価格（税込）': $('.tax_cell li')
					.last()
					.text()
					.replace(/円（税込）/, '')
				,
				'ポイント': $('.bcs_point')
					.first()
					.text()
					.replace('ポイント', '')
					.replace(/（.*?）/, '')
					.trim()
			} as detailObject)
		})
		.catch((err) => {
			if (err['statusCode'] === 404) return Rx.Observable.return({
				'商品名': '',
				'価格（税込）': '',
				'ポイント': '',
				'型番': '',
				'メーカー': '',
				'JANコード': ''
			})
			else return Rx.Observable.throw(err)
		})
		.map(obj => dataTitle.map(key => obj[key]))

export const scrapingStockObservable = (id: string) =>
	Rx.Observable.of(new BCStockURL(id))
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
				return Rx.Observable.return(defaultStock)
			else return Rx.Observable.throw(err)
		})
export const execScraping = (queries: SearchObject) =>
	scrapingItemListObservable(queries)
		.filter(_val => !!_val.length)
		.flatMap(_val => Rx.Observable.fromArray(_val))
		.filter(id => !!id)
		.flatMap(_val =>
			Rx.Observable.zip(
				scrapingDetailObservable(_val)
					.retry()
				,
				scrapingStockObservable(_val)
					.retry()
				,
				(detail, stock) => ([
					...detail,
					...stock
				])
			)
		)
		.startWith([...dataTitle, ...shopLists])
			// .map(_val => JSON.stringify(_val, null, 2))
			// .toArray()
			// .map(arr => `[${arr.join(',\n')}]`)
			// .doOnNext(() => console.log('data saving...'))
			// .flatMap((_val) =>
			// 	fs.outputFile(jsonDir, _val)
			// )
