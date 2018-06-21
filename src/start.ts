import * as fs from 'fs-extra'
import * as path from 'path'
import * as Rx from 'rx'
import { execScraping } from './scraping'
const SCRAPING_LIST_PATH = path.join(__dirname, '../config/scrapingList.csv')
const CSV_PATH = path.join(__dirname, '../db/db.csv')

const toObjectTable = [
	'q',
	'max',
	'min',
	'entr_nm'
]

fs.readFile(SCRAPING_LIST_PATH)
	.then(buf => {
		const data = buf.toString()
			.split('\n')
			.slice(1)
			.map(line =>
				line.split(',')
					.reduce((acc, cur, i) => ({
						...acc,
						[toObjectTable[i]]: cur
					}), {} as SearchObject)
			)
		const csv = fs.createWriteStream(CSV_PATH)
		Rx.Observable.from(data)
			.concatMap(q => execScraping(q))
			.subscribe(
				val => {
					console.log(val)
					csv.write(val)
				},
				err => console.error(err),
				() => console.log('Completed!')
			)
	})
