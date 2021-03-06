import * as argv from 'argv'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as Rx from 'rx'
import { execScarpingByArr } from './scraping'
import GoogleAPI from './googleapi'
import * as moment from 'moment'
const SCRAPING_LIST_PATH = path.join(__dirname, '../config/scrapingList.csv')
const CSV_PATH = path.join(__dirname, '../db/db.csv')

const BUFFER_SIZE = 1
const toObjectTable = [
	'q',
	'max',
	'min',
	'entr_nm'
]

argv
	.option([
		{
			name: 'spreadsheetId',
			type: 'string',
			description: '保存先のスプレッドシートのIDを定義します',
			example: `'start.js --id=spreadsheetId'`
		},

		{
			name: 'word',
			short: 'w',
			type: 'list,string',
			description: 'スクレイピングを行う検索ワードを指定します。',
			example: `'start.js --word= value1 value2' or 'start.js -w value1 value2'`
		}
	])

const {
	spreadsheetId,
	word
} = argv.run().options as {
	spreadsheetId: string
	word: string[]
}


if (spreadsheetId) {

	const start = moment()
	const sheets = GoogleAPI.instance.sheets
	const dayStr = moment().format('YYYYMMDD')
	sheets.spreadsheetId = spreadsheetId
	let cur = 1
	Rx.Observable.fromPromise(fs.readFile(SCRAPING_LIST_PATH))
		.map(buf => buf.toString())
		.map(data => data
			.split('\n')
			.slice(1)
			.map(line =>
				line.split(',')
					.reduce((acc, _cur, i) => ({
						...acc,
						[toObjectTable[i]]: _cur
					}), {} as SearchObject)
			)
		)
		.doOnNext(q => console.log(q))
		.flatMap(queries =>
			sheets.getSheetId()
				.doOnNext(id => sheets.sheetId = id)
				.flatMap(id =>
					execScarpingByArr(queries)
					// .toArray()
				)
				.bufferWithCount(BUFFER_SIZE)
		)
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
			() => {
				console.log('Completed!')
				console.log('finished:', moment().diff(start, 'days', true))
			}
		)

}
else if (word) {
	const csv = fs.createWriteStream(CSV_PATH)
	Rx.Observable.from(word)
		.map(w => ({ q: w } as SearchObject))
		.toArray()
		.flatMap(queries => execScarpingByArr(queries))
		.map(arr => arr.join(',') + '\n')
		.do(
			d => console.log(d),
			e => console.error(e),
			() => console.log('Completed to scraping')
		)
		.subscribeOnNext(line => csv.write(line))

}
else {
	const start = moment()
	const csv = fs.createWriteStream(CSV_PATH)
	Rx.Observable.fromPromise(fs.readFile(SCRAPING_LIST_PATH))
		.map(buf => buf.toString())
		.map(data => data
			.split('\n')
			.slice(1)
			.map(line =>
				line.split(',')
					.reduce((acc, cur, i) => ({
						...acc,
						[toObjectTable[i]]: cur
					}), {} as SearchObject)
			)
		)
		.flatMap(queries => {
			return execScarpingByArr(queries)
				.map(arr => arr.join(',') + '\n')
		})
		.subscribe(
			val => {
				console.log(val)
				csv.write(val)
			},
			err => console.error(err),
			() => {
				console.log('Completed!')
				console.log('finished:', moment().diff(start, 'days', true))
			}
		)

}
