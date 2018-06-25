import * as encode from './encoding'
import * as client from 'cheerio-httpcli'
import { Observable } from 'rx'

client.set('timeout', 3600000)
process.env.UV_THREADPOOL_SIZE = '128'
export abstract class ScrapingURL {

	static readonly MAX_WAIT_SEC = 10 * 1000
	static readonly MIN_WAIT_SEC = 5 * 1000

	abstract get toURL(): string

	serialize(obj: {}) {
		const str = Object.keys(obj)
		for (let i = 0, len = str.length; i < len; i++) {
			const key = str[i]

			str[i] = encode.EscapeSJIS(key) + '=' + encode.EscapeSJIS(String(obj[key]))
		}
		return str.join("&")
	}

	fetchObservable() {
		return Observable.fromPromise(client.fetch(this.toURL, 'sjis'))
			.map((result) => result.$)
			.doOnNext(($) => console.log('delay: ' + $.documentInfo().url))
			.delay(Math.random() * (ScrapingURL.MAX_WAIT_SEC - ScrapingURL.MIN_WAIT_SEC) + ScrapingURL.MIN_WAIT_SEC)
	}
}

export class BCItemListURL extends ScrapingURL {
	constructor(public searchObject: SearchObject) {
		super()
	}

	serialize() {
		return super.serialize(this.searchObject)
	}

	get toURL() {
		return `https://www.biccamera.com/bc/category/?${this.serialize()}#bcs_resultTxt`
	}

}

export class BCDetailURL extends ScrapingURL {
	constructor(private id: string | number) {
		super()
	}

	get toURL() {
		return `https://www.biccamera.com/bc/item/${this.id}`
	}
}

export class BCStockURL extends ScrapingURL {

	constructor(private id: string | number) {
		super()
	}

	get toURL() {
		return `https://www.biccamera.com/bc/tenpo/CSfBcToriokiList.jsp?GOODS_NO=${this.id}`
	}
}
