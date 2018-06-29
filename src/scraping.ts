import * as moment from 'moment'
import { BCDetailURL, BCItemListURL, BCStockURL, AmazonURL } from './serialize'
import * as Rx from 'rx'
import { withDelay } from './customObs'
import { shopLength, dataKeys, defaultStock, shopLists, titleKeys } from './titles'

type detailObject = {
	'商品名': string
	'価格（税込）': number
	'ポイント': number
	'型番': string
	'メーカー': string
	'JANコード': string,
	[key: string]: string | number
}

type AmazonData = {
	ASIN: string
	price: number
	rank: number
	[key: string]: string | number
}

enum StockType {
	'△ お取り寄せ',
	'○ 在庫残少',
	'◎ 在庫あり',
	'在庫無し'
}

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
		.map((searchObject: SearchObject) =>
			new BCItemListURL(searchObject))
		.concatMap(startPage =>
			startPage.fetchObservable()
				.map($ => ({ $, searchObject: startPage.searchObject }))
		)
		.retryWhen(err => withDelay(err))
		.catch(e =>
			(e['statusCode'] == 404) ? Rx.Observable.empty() : Rx.Observable.throw(e))
		.concatMap(({ $, searchObject }) =>
			Rx.Observable.range(
				2,
				Math.ceil(
					(parseInt($('#bcs_resultTxt')
						.find('em')
						.text()
					) || 3 - 2) / searchObject.rowPerPage
				)
			)
				.map(p => new BCItemListURL({ ...searchObject, p }))
				.concatMap(url =>
					url.fetchObservable()
						.retryWhen(errs => withDelay(errs))
				)
				.startWith($)
		)
		.flatMap($ => $('.bcs_boxItem .prod_box')
			.toArray()
			.filter(el => $(el).text().indexOf('完売しました') !== -1)
		)
		.map(el => el.attribs['data-item-id'])
		.toArray()

export const scrapingDetailObservable = (id: string) =>
	Rx.Observable.of(new BCDetailURL(id))
		.flatMap(url => url.fetchObservable())
		.map($ => {
			if (!id) {
				return {
					'商品名': '',
					'価格（税込）': 0,
					'ポイント': 0,
					'型番': '',
					'メーカー': '',
					'JANコード': ''
				} as detailObject
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
				'JANコード': ''
			})
			else return Rx.Observable.throw(err)
		})
		.map(detail => ({
			...detail,
			'実質仕入価格': detail['価格（税込）'] - detail['ポイント']
		}))

export const scrapingStockObservable = (id: string) =>
	Rx.Observable.of(new BCStockURL(id))
		.flatMap(url => url.fetchObservable())
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
		.map(arr =>
			arr.reduce((acc, cur, i) => ({
				...acc,
				[shopLists[i]]: cur
			}), {} as { [key: string]: string }))

export const getAmazonData = (janCode: string) =>
	Rx.Observable.just({
		'Action': 'GetMatchingProductForId',
		'IdList.Id.1': janCode,
		'IdType': 'JAN'
	})
		.map(params => new AmazonURL(params))
		.flatMap(url => url.fetchObservable(false))
		.flatMap($ =>
			$('Product')
				.toArray()
				.map((product, i) => ({
					i,
					ASIN: $('ASIN', product).text(),
					rank: parseInt($('Rank', product).text()) || -1
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
						Action: 'GetLowestOfferListingsForASIN'
					}))
					.map(param => new AmazonURL(param))
					.flatMap(url => url.fetchObservable(false))
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
		.defaultIfEmpty({ ASIN: '', rank: -1, price: -1 } as AmazonData)
		.min((a, b) => a.price - b.price)
		.first()
		.map(val => ({
			'Amazon価格': val.price,
			'順位': val.rank
		}))

export const execScraping = (queries: SearchObject) =>
	scrapingItemListObservable(queries)
		.filter(_val => !!_val.length)
		.flatMap(_val => Rx.Observable.fromArray(_val))
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
							.flatMap(_ => scrapingStockObservable(_val)),
						(detail, amazon, stock) =>
							({ ...detail, ...amazon, ...stock })
					)
				)

		)
		.map(val => titleKeys.map(key => val[key]))
		.map(val => val.map(data => String(data)))
		.startWith(titleKeys)
			// .map(_val => JSON.stringify(_val, null, 2))
			// .toArray()
			// .map(arr => `[${arr.join(',\n')}]`)
			// .doOnNext(() => console.log('data saving...'))
			// .flatMap((_val) =>
			// 	fs.outputFile(jsonDir, _val)
			// )
