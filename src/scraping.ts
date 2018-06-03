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
		.map<{}>($ => {
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
			const dataKeys = [
				'商品コード',
				'JANコード',
				'商品名',
				'型番'
			]

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
			if (err['statusCode'] === 404) return Rx.Observable.return({})
			else return Rx.Observable.throw(err)
		})

export const scrapingStockObservable = (id: string) =>
	Rx.Observable.of(new BCStockURL(id))
		.flatMap(url => url.scrapingObservable())
		.flatMap($ => {
			const shopLength = $(' [name=realshop_name_list_jp]').length

			return Rx.Observable.range(0, shopLength)
				.map(i => $(`#shopList_jp_${i}`))
				.reduce((acc, cur) => {
					const key = $('.pc_dtb', cur).first().text()
					const value = $('.bcs_KST_Stock', cur).first().text()
					return {
						[key]:
							+(value === '◎ 在庫あり' || value === '○ 在庫残少'),
						...acc
					}
				}, {})
		})
		.catch((err) => {
			if (err['statusCode'] === 404) return Rx.Observable.return({})
			else return Rx.Observable.throw(err)
		})
