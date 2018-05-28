import * as client from 'cheerio-httpcli'
import * as moment from 'moment'
import { BCDetailURL, BCItemListURL } from './serialize'
import * as Rx from 'rx'

client.set('browser', 'chrome')

type detailObject = {
	'商品名': string
	'価格（税込）': string
	'ポイント': string
	'型番': string
	'メーカー': string
	'JANコード': string
}

export const itemListScrapingObservable = (queries: SearchObject) =>
	Rx.Observable.create<{ ids: string[], i: number }>(async (observer) => {
		if (!queries.q) return observer.onError('query is not defined')

		try {

			const searchObject: SearchObject = {
				...queries,
				rowPerPage: 100,
				type: 1,
				p: 1
			}
			let url = new BCItemListURL(searchObject)
			let { $ } = await url.scraping()
			const lastIndex = Math.ceil((parseInt($('#bcs_resultTxt')
				.find('em')
				.text()) || 1) / searchObject.rowPerPage)
			const ids: string[] = []

			for (let i = 1; i <= lastIndex; i++) {

				if (i > 1) {

					url.searchObject.p = i
					$ = (await url.scraping()).$
				}

				observer.onNext({
					ids: $('.bcs_boxItem .prod_box')
						.toArray()
						.map(el => el.attribs['data-item-id']),
					i
				})
			}
		}
		catch (e) {
			observer.onError(e)
		}
		finally {
			observer.onCompleted()
		}

		return observer.onCompleted()
	})

export const detailScrapingObservable = (array: string[]) =>
	Rx.Observable.create<detailObject>(async (observer) => {
		let i = 0
		let id: string
		try {
			for (const len = array.length; i < len; i++) {
				id = array[i]
				const result = (await scrapingDetail(id))
				observer.onNext(result)
			}
			observer.onCompleted()
		}
		catch (e) {
			observer.onError(`at:${id}, error:${e}`)
		}
		finally {
			observer.onCompleted()
		}
	})

async function scrapingDetail(id: string | number): Promise<detailObject> {

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
	const url = new BCDetailURL(id),
		{ $ } = (await url.scraping())

	return {
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
	} as detailObject
}
