import { execScrapingSubject } from './subjects'
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
] as Hapi.ServerRoute[]