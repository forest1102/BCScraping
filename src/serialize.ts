import * as encode from './encoding'
import * as client from 'cheerio-httpcli'
import { Observable } from 'rx'

client.set('timeout', 100000)
process.env.UV_THREADPOOL_SIZE = '128'
export abstract class ScrapingURL {

	abstract get toURL(): string

	serialize(obj: {}) {
		const str = Object.keys(obj)
		for (let i = 0, len = str.length; i < len; i++) {
			const key = str[i]

			str[i] = encode.EscapeSJIS(key) + '=' + encode.EscapeSJIS(String(obj[key]))
		}
		return str.join("&")
	}

	static BadRequestError = class extends Error { }
	static NotFoundError = class extends Error {
		message = `Not Found the result`
		name = 'NOT FOUND THE RESULT'
	}

	scraping() {
		return client.fetch(this.toURL, 'sjis')
	}

	scrapingObservable() {
		return Observable.fromPromise(client.fetch(this.toURL, 'sjis'))
			.catch(err => {
				err.message += '\nurl:' + this.toURL
				return Observable.throw(err)
			})
			.map((result) => result.$)
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
