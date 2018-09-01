import * as Rx from 'rx'
import * as Luminati from 'luminati-proxy'
import * as client from 'cheerio-httpcli'

const luminati = new Luminati({
	username: 'hl_8a91b9b8-zone-zone2',
	password: '7bx2gosdb01o'
})
const url = 'http://lumtest.com/myip.json'
console.log(process.env.HTTP_PROXY)

export const proxyRouting = () =>
	Rx.Observable.fromPromise<string>(luminati.getProxy())
		.doOnNext((proxy: string) => {
			process.env.HTTP_PROXY = proxy
		})

export const proxyReset = () =>
	Rx.Observable.create((obs) => {
		delete process.env.HTTP_PROXY
		obs.onNext(null)
		obs.onCompleted()
	})

