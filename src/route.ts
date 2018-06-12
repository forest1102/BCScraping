import { scrapingStockObservable, execScraping } from './scraping'
import { BCDetailURL, BCItemListURL, BCStockURL } from './serialize'
import * as Hapi from 'hapi'
import * as Rx from 'rx'
import * as fs from 'fs-extra'
import GoogleAPI from './googleapi'
import * as moment from 'moment'



export default [
	{
		method: 'GET',
		path: '/',
		handler: (request, h) => {
			return 'Hello from Hapi'
		}
	},
	{
		method: 'GET',
		path: '/execScraping',
		handler: (request, h) => {
			const queries = request.query as SearchObject

			const csv = fs.createWriteStream('./db/data.csv')
			execScraping(queries)
				.map(arr => arr.join(',') + '\n')
				.subscribe(
					val => {
						console.log(val)
						csv.write(val)
					},
					err => console.error(err),
					() => console.log('Completed!')
				)
			return queries
		}
	},
	{
		method: 'GET',
		path: '/execScraping/{spreadsheetId}',
		handler: (request, h) => {
			const queries = request.query as SearchObject
			const { spreadsheetId } = request.params
			const sheets = GoogleAPI.instance.sheets
			const dayStr = moment().format('YYYYMMDD')

			sheets.spreadsheetId = spreadsheetId

			let cur = 1
			if (!(spreadsheetId && sheets)) {
				return {
					statusCode: '400',
					error: 'not authorized google account!'
				}
			}
			console.log(JSON.stringify(queries))

			sheets.getObservable({
				spreadsheetId: sheets.spreadsheetId,
				includeGridData: false,
			})
				.map(res => (res['sheets'] as { properties: { sheetId: number, title: string } }[])
					.find(e => {
						return (e.properties && e.properties.title === dayStr)
					})
				)
				.flatMap(sheet =>
					Rx.Observable.if(
						() => !!sheet,
						Rx.Observable.just((sheet || { properties: { sheetId: 0 } }).properties.sheetId),
						sheets.batchUpdateObservable({
							spreadsheetId: sheets.spreadsheetId,
							resource: {
								"requests": [
									{
										"addSheet": {
											"properties": {
												"title": dayStr,
												"gridProperties": {
													"rowCount": 15000,
												}
											}
										}
									}
								]
							}
						})
							.do(
								res => console.log(res),
								err => console.error(err),
								null
							)
							.map(res => res['replies'][0]['addSheet']['properties']['sheetId'] as number)
					)
				)
				.doOnNext(id => sheets.sheetId = id)
				.flatMap(id =>
					execScraping(queries)
					// .toArray()
				)
				.bufferWithCount(10)
				.subscribe(buf => {
					console.log(JSON.stringify(buf))
					sheets.setData(buf, {
						range: {
							startRow: cur,
							startCol: 1,
							endRow: cur + buf.length - 1,
							endCol: buf[0].length
						}
					}, (err, data) => {
						if (err) {
							console.log(err)
							return
						}
						console.log('Saved to Spreadsheet')
					})
					cur += buf.length
				},
					err => console.error(err),
					() => console.log('Completed')
				)


			return queries
		}
	},
	{
		method: 'GET',
		path: '/scrapingStock',
		handler: (request, h) => {
			const { id } = request.query as { id: string }
			if (!id) return 'id'
			Rx.Observable.of(new BCStockURL(id))
				.flatMap(url => url.scrapingObservable())
				.flatMap($ => {
					const shopLength = $(' [name=realshop_name_list_jp]').length

					return Rx.Observable.range(0, shopLength)
						.map(i => $(`#shopList_jp_${i}`))
						.map(cur => $('.pc_dtb', cur).first().text())
						.toArray()
				})
				.flatMap(data => fs.outputFile('./db/sho-list.json', JSON.stringify(data, null, 2)))
				.subscribeOnCompleted(() => console.log('Completed!'))
			return id
		}
	}
] as Hapi.ServerRoute[]