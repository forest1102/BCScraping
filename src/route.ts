import { scrapingStockObservable, execScraping, getAmazonData } from './scraping'
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
	}



] as Hapi.ServerRoute[]