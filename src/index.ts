import * as _ from 'lodash'
import route from './route'
import * as Hapi from 'hapi'

const server: Hapi.Server = new Hapi.Server({
	host: 'localhost',
	port: 8080
})

server.route(route)

async function start() {

	try {
		await server.start()
	}
	catch (err) {
		console.log(err)
		process.exit(1)
	}

	console.log('Server running at:', server.info.uri)
}

start()
// app
// 	.get('/setSheetID', (req, res) => {
// 		const {
// 			sheetID
// 		} = req.query
// 
// 	})
// 	.get('/execScraping', async (req, res) => {
// 		const queries: SearchObject = req.query,
// 			timestamp = uuidv1()
// 		try {
// 			const result = (await execScraping(queries))
// 			console.log(result)
// 			res.json(result)
// 		}
// 		catch (e) {
// 			console.error(e)
// 		}
// 	})


