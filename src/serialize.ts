import * as encode from './encoding'
import * as client from 'cheerio-httpcli'

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

	scraping() {
		return client.fetch(this.toURL, 'sjis')
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

