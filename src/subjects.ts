import { itemListScrapingObservable, detailScrapingObservable } from './scraping'
import * as Rx from 'rx'
import * as fs from 'fs-extra'
import * as path from 'path'
export const execScrapingSubject = new Rx.Subject<SearchObject>()

const jsonDir = path.join(__dirname, '../db/data.json')

execScrapingSubject

	.filter(val => !!val)
	.subscribe(val =>
		itemListScrapingObservable(val)
			.flatMap(_val =>
				detailScrapingObservable(_val.ids)
					.map(a => ({ value: a, i: _val.i })))
			.do(
				value => {
					console.log(`${value.i}: ${JSON.stringify(value.value)}\n`)
				},
				error => console.log(`onError:${error}`),
				() => console.log('onCompleted')
			)
			.map(_val => _val.value)
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
