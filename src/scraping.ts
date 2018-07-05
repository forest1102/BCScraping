import * as moment from 'moment'
import { fetchAmazon, fetchBCStock, fetchBCDetail, fetchBCItemList, fetchObservable } from './serialize'
import * as Rx from 'rx'
import { withDelay } from './customObs'
import { shopLength, dataKeys, defaultStock, shopLists, titleKeys } from './titles'

type detailObject = {
	'商品名': string
	'価格（税込）': number
	'ポイント': number
	'型番': string
	'メーカー': string
	'JANコード': string
	'商品コード': string
	[key: string]: string | number
}

type AmazonData = {
	ASIN: string
	price: number
	rank: number
	[key: string]: string | number
}

const MAX_PAGE = 100

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
		.concatMap(searchObject =>
			fetchBCItemList(searchObject)
				.map($ => ({ $, searchObject: searchObject }))
		)
		.catch(e =>
			(e['statusCode'] == 404) ? Rx.Observable.empty() : Rx.Observable.throw(e))
		.concatMap(({ $, searchObject }) => {
			const page = Math.min(
				Math.ceil(
					(parseInt($('#bcs_resultTxt')
						.find('em')
						.text()
					) || 3 - 2) / searchObject.rowPerPage
				),
				MAX_PAGE - 1
			)
			return Rx.Observable.if(
				() => page > 2,
				Rx.Observable.range(
					2,
					page
				)
					.map(p =>
						fetchBCItemList({ ...searchObject, p })
					)
			)
				.startWith(Rx.Observable.of($))
		})
		.map(obs =>
			obs
				.flatMap($ => $('.bcs_boxItem .prod_box')
					.toArray()
					.filter(el => $(el).text().indexOf('販売を終了しました') !== -1)
					.map(el => el.attribs['data-item-id'])
				)
		)

export const scrapingDetailObservable = (id: string) =>
	fetchBCDetail(id)
		.map($ => {
			if (!id) {
				return {
					'商品名': '',
					'価格（税込）': 0,
					'ポイント': 0,
					'型番': '',
					'メーカー': '',
					'JANコード': '',
					'商品コード': id
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

				'価格（税込）': parseInt(
					$('.tax_cell li')
						.last()
						.text()
						.replace(/円（税込）/, '')
						.replace(',', '')
				) || 0
				,
				'ポイント': parseInt(
					$('.bcs_point')
						.first()
						.text()
						.replace('ポイント', '')
						.replace(/（.*?）/, '')
						.replace(',', '')
						.trim()
				) || 0
			} as detailObject)
		})
		.catch((err) => {
			if (err['statusCode'] === 404) return Rx.Observable.return({
				'商品名': '',
				'価格（税込）': 0,
				'ポイント': 0,
				'型番': '',
				'メーカー': '',
				'JANコード': '',
				'商品コード': id
			})
			else return Rx.Observable.throw(err)
		})
		.map(detail => ({
			...detail,
			'実質仕入価格': detail['価格（税込）'] - detail['ポイント']
		}))

export const scrapingStockObservable = (id: string) =>
	fetchBCStock(id)
		.flatMap($ =>
			Rx.Observable.range(0, shopLength)
				.map(i => $(`#shopList_jp_${i}`))
				.map(cur => $('.bcs_KST_Stock', cur).first().text())
				.map(value => +(value === '◎ 在庫あり' || value === '○ 在庫残少'))
				.toArray()
		)
		.catch((err) => {
			if (err['statusCode'] === 404)
				return Rx.Observable.return(defaultStock)
			else return Rx.Observable.throw(err)
		})
		.map(arr => ({
			...arr.reduce((acc, cur, i) => ({
				...acc,
				[shopLists[i]]: cur
			}), {} as { [key: string]: string }),
			'在庫': arr.reduce((acc, cur) => acc + cur, 0)
		}))

export const getAmazonData = (janCode: string) =>
	Rx.Observable.just({
		'Action': 'GetMatchingProductForId',
		'IdList.Id.1': janCode,
		'IdType': 'JAN'
	})
		.flatMap(queries => fetchAmazon(queries))
		.flatMap($ =>
			$('Product')
				.toArray()
				.map((product, i) => ({
					i,
					ASIN: $('ASIN', product).first().text(),
					rank: parseInt($('Rank', product).text()) || 0
				}))
		)
		.take(20)
		.share()
		.let(obs =>
			Rx.Observable.zip(

				obs
					.reduce((acc, { ASIN, i }) => ({
						[`ASINList.ASIN.${(i + 1)}`]: ASIN,
						...acc,
					}), null as { [key: string]: string })
					.filter(a => !!a)
					.map(asinParam => ({
						...asinParam,
						Action: 'GetLowestOfferListingsForASIN',
						ItemCondition: 'New'
					}))
					.flatMap(queries => fetchAmazon(queries))
					.doOnNext(
						$ => ($('Error').length > 0) ?
							console.log($('Error').html()) :
							null
					)
					.flatMap($ =>
						$('GetLowestOfferListingsForASINResult')
							.toArray()
							// .filter(el => !$('Error', el).length)
							.map(el => ({
								ASIN: $('ASIN', el).first().text(),
								price: Number($('LandedPrice', el).children('Amount').first().text())
							}))
					),
				obs.map(({ ASIN, rank }) => ({ ASIN, rank })),
				(LowestOfferListing, product) => ({
					...LowestOfferListing,
					...product
				} as AmazonData)
			)
		)
		.filter(val => val.price > 0)
		.catch(err => {
			console.log(JSON.stringify(err))
			return Rx.Observable.empty()
		})
		.defaultIfEmpty({ ASIN: '', rank: 0, price: 0 } as AmazonData)
		.min((a, b) => a.price - b.price)
		.first()
		.map(val => ({
			'Amazon価格': val.price,
			'順位': val.rank
		}))

export const execScraping = (queries: SearchObject) =>
	scrapingItemListObservable(queries)
		.concatMap(itemObs =>
			itemObs
				.filter(_val => !!_val.length)
				.filter(id => !!id)
				.concatMap(_val =>
					scrapingDetailObservable(_val)
						.share()
						.let(obs =>
							Rx.Observable.zip(
								obs,
								obs
									.flatMap(detail =>
										getAmazonData(detail['JANコード'])
									)
								,
								obs
									.flatMap(_ =>
										scrapingStockObservable(_val)
									),
								(detail, amazon, stock) => ({
									...detail,
									...amazon,
									...stock,
									'価格差': amazon.Amazon価格 - detail.実質仕入価格,
									'粗利': ((amazon.Amazon価格 > 0) ? (amazon.Amazon価格 - detail.実質仕入価格) / amazon.Amazon価格 : 0) * 100 + '%'
								})
							)
						)
				)
		)
		.map(val => titleKeys.map(key => val[key]))
		.map(val => val.map(data => String(data)))
// .map(_val => JSON.stringify(_val, null, 2))
// .toArray()
// .map(arr => `[${arr.join(',\n')}]`)
// .doOnNext(() => console.log('data saving...'))
// .flatMap((_val) =>
// 	fs.outputFile(jsonDir, _val)
// )

export const execScarpingByArr = (queryArr: SearchObject[]) =>
	Rx.Observable.from(queryArr)
		.concatMap(q => execScraping(q))
		.startWith(titleKeys)
