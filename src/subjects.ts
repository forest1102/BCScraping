import { scrapingItemListObservable, scrapingDetailObservable, scrapingStockObservable } from './scraping'
import { NotFoundError, BadRequestError } from './Error'
import * as Rx from 'rx'
import * as fs from 'fs-extra'
import * as path from 'path'
export const execScrapingSubject = new Rx.Subject<SearchObject>()

const jsonDir = path.join(__dirname, '../db/data.json')

execScrapingSubject

	.filter(val => !!val)
	.subscribe(val =>
		scrapingItemListObservable(val)
			.retry()
			.filter(_val => !!_val.length)
			.flatMap(_val => Rx.Observable.fromArray(_val))
			.filter(id => !!id)
			.flatMap(_val =>
				Rx.Observable.zip(
					scrapingDetailObservable(_val)
						.retry(),
					scrapingStockObservable(_val)
						.retry(),
					(detail, stock) => ({
						...detail,
						...stock
					})
				)
			)
			.do(
				value => {
					console.log(`${JSON.stringify(value)}\n`)
				},
				null,
				() => console.log('onCompleted')
			)
			.map(_val => JSON.stringify(_val, null, 2))
			.toArray()
			.map(arr => `[${arr.join(',\n')}]`)
			.doOnNext(() => console.log('data saving...'))
			.flatMap((_val) =>
				fs.outputFile(jsonDir, _val)
			)
			.subscribe(
				() => console.log('saved JSON'),
				(err) => console.error(err),
				() => console.log('All Complete')
			)
	)
	// .flatMap(val => Rx.Observable.fromPromise(
	// 	fs.readJSON(jsonDir)
	// 		.then((json: {}[]) => fs.outputJson(jsonDir, [...json, val]))))
	// .subscribeOnNext(() => console.log('saved json'))
	// .dispose()
