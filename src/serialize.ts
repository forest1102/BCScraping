import * as encode from './encoding'
import * as client from 'cheerio-httpcli'

client.set('timeout', 100000)

export abstract class ScrapingURL {

	abstract get toURL(): string

	static serialize(obj: {}) {
		const str = [];
		for (const p in obj)
			if (obj.hasOwnProperty(p)) {
				// Logger.log(encode.EscapeSJIS(String(obj[p])))
				str.push(encode.EscapeSJIS(String(p)) + "=" + encode.EscapeSJIS(String(obj[p])))
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
		const str = [];
		for (const p in this.searchObject)
			if (this.searchObject.hasOwnProperty(p)) {
				// Logger.log(encode.EscapeSJIS(String(obj[p])))
				str.push(encode.EscapeSJIS(String(p)) + "=" + encode.EscapeSJIS(String(this.searchObject[p])))
			}
		return str.join("&")
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

