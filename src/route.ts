import { scrapingStockObservable, execScraping, getAmazonData } from './scraping'
import { BCDetailURL, BCItemListURL, BCStockURL, AmazonURL } from './serialize'
import * as Hapi from 'hapi'
import * as Rx from 'rx'
import * as fs from 'fs-extra'
import GoogleAPI from './googleapi'
import * as moment from 'moment'
import * as path from 'path'
const BUFFER_SIZE = 10
const MAX_SHEET_SIZE = 10000
const CSV_PATH = path.join(__dirname, '../db/db.csv')

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

			const csv = fs.createWriteStream(CSV_PATH)
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

			sheets.getSheetId()
				.doOnNext(id => sheets.sheetId = id)
				.concatMap(id =>
					execScraping(queries)
					// .toArray()
				)
				// .take(MAX_SHEET_SIZE)
				.bufferWithCount(BUFFER_SIZE)
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
				.flatMap(url => url.fetchObservable())
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
	},
	{
		method: 'GET',
		path: '/amazonAPI/JAN/{janCode}',
		handler: (request, h) => {
			const { janCode } = request.params

			getAmazonData(janCode)
				.subscribe(
					xml => {
						console.log(xml)
					},
					err => {
						console.error(err)
						h.response(err)
					},
					() => console.log('Completed')
				)
			return { janCode }
		}
	},
	{
		method: 'GET',
		path: '/amazonAPI/ASIN/{ASIN}',
		handler: (request, h) => {
			const { ASIN } = request.params

			Rx.Observable.just({
				'ASINList.ASIN.1': ASIN
			})
				.map(asinParam => ({
					...asinParam,
					Action: 'GetLowestOfferListingsForASIN'
				}))
				.map(param => new AmazonURL(param))
				.flatMap(url => url.fetchObservable(false))
				.flatMap($ =>
					$('GetLowestOfferListingsForASINResult')
						.toArray()
						.map(el => ({
							ASIN: $('ASIN', el).first().text(),
							price: parseInt($('LandedPrice', el).first().text()) || null
						}))
				)
				.minBy(val => val.price)
				.subscribe(
					val => console.log(val),
					err => console.error(err),
					() => console.log('Completed')
				)

			// .map($ => $.xml())
			// .subscribe(
			// 	xml => console.log(beautifier(xml)),
			// 	err => console.error(err),
			// 	() => console.log('Completed')
			// )
			return { ASIN }
		}
	}
] as Hapi.ServerRoute[]