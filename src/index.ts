import route from './route'
import * as Hapi from 'hapi'

const server: Hapi.Server = new Hapi.Server({
	host: 'localhost',
	port: process.env.PORT || 5000
})

server.route(route)


async function start() {

	try {
		await server.start()
	}
	catch (err) {
		return Promise.reject(err)
	}
	return Promise.resolve(server.info.uri)
}

start()
	.then((uri) => console.log('Server running at:', uri))
	.catch((e) => {
		console.error('server error' + e)
		process.exit(1)
	})
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


