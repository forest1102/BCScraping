import { scrapingStockObservable, execScraping } from './scraping'
import { BCDetailURL, BCItemListURL, BCStockURL } from './serialize'
import * as Hapi from 'hapi'
import * as Rx from 'rx'
import * as fs from 'fs-extra'
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