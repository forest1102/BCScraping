import { execScrapingSubject } from './subjects'
import { scrapingStockObservable } from './scraping'
import * as Hapi from 'hapi'
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
			console.log(`q:${queries.q}`)
			execScrapingSubject.onNext(queries)
			return queries
		}
	},
	{
		method: 'GET',
		path: '/scrapingStock',
		handler: (request, h) => {
			const { id } = request.query as { id: string }
			if (!id) return 'id'
			scrapingStockObservable(id)
				.subscribe(
					(stock) => console.log(JSON.stringify(stock)),
					(err: {
						statusCode: number,
						url: string
					}) => console.error(JSON.stringify(err.statusCode)),
					() => console.log('Complete')
				)
			return id
		}
	}
] as Hapi.ServerRoute[]