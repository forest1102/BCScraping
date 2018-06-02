import { scrapingItemListObservable, scrapingDetailObservable, scrapingStockObservable } from './scraping'
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
			.filter(_val => !!_val)
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
				error => console.error(`onError:${error}`),
				() => console.log('onCompleted')
			)
			.map(_val => JSON.stringify(_val, null, 2))
			.toArray()
			.map(arr => `[${arr.join(',\n')}]`)
			.doOnNext(() => console.log('data saving...'))
			.flatMap((_val) =>
				fs.outputFile(jsonDir, _val)
			)
			.subscribeOnNext(() => console.log('saved JSON'))
	)
	// .flatMap(val => Rx.Observable.fromPromise(
	// 	fs.readJSON(jsonDir)
	// 		.then((json: {}[]) => fs.outputJson(jsonDir, [...json, val]))))
	// .subscribeOnNext(() => console.log('saved json'))
	// .dispose()
