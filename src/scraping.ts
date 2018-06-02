import * as client from 'cheerio-httpcli'
import * as moment from 'moment'
import { BCDetailURL, BCItemListURL } from './serialize'
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

export const scrapingItemListObservable = (queries: SearchObject) =>
	Rx.Observable.create<string[]>(async (observer) => {
		if (!queries.q) {
			observer.onError('query is not defined')
			return
		}

		try {

			const searchObject: SearchObject = {
				...queries,
				rowPerPage: 100,
				type: 1,
				p: 1
			}
			const url = new BCItemListURL(searchObject)
			let { $ } = await url.scraping()
			if ($('#searchNotFound').length) {
				throw new Error('Sorry, Not Found with the query')
			}
			const lastIndex = Math.ceil((parseInt($('#bcs_resultTxt')
				.find('em')
				.text()) || 1) / searchObject.rowPerPage)

			for (let i = 1; i <= lastIndex; i++) {

				if (i > 1) {

					url.searchObject.p = i
					$ = (await url.scraping()
						.catch(err =>
							observer.onError(`${err}\nurl:${url.toURL}`))).$
				}

				observer.onNext(
					$('.bcs_boxItem .prod_box')
						.toArray()
						.map(el => el.attribs['data-item-id']))
			}
		}
		catch (e) {
			observer.onError(`${e}`)
		}
		finally {
			observer.onCompleted()
		}

	})

export const scrapingDetailObservable = (id: string) =>
	Rx.Observable
		.create<detailObject>(async (observer) => {

			if (!id) {
				observer.onNext({
					'商品名': '',
					'価格（税込）': '',
					'ポイント': '',
					'型番': '',
					'メーカー': '',
					'JANコード': ''
				})
				return
			}

			const dataKeys = [
				'商品コード',
				'JANコード',
				'商品名',
				'型番'
			]
			const url = new BCDetailURL(id)
			try {

				const { $ } = (await url.scraping())

				observer.onNext({
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
				return
			}
			catch (e) {
				observer.onError(`${e}\nurl:${id}`)
			}
			finally {
				observer.onCompleted()
			}
		})


export const scrapingStockObservable = (id: string) =>
	Rx.Observable.of()
