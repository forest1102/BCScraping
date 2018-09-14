import { proxyRouting } from './lumi-proxy'

proxyRouting()
	.subscribe(
		e => console.log(e)
	)
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


