import * as encode from './encoding'
import * as client from 'cheerio-httpcli'
import { Observable } from 'rx'
import * as SECRET from '../config/amazon-secret.json'

import { HmacSHA256 } from 'crypto-js'
import * as Base64 from 'crypto-js/enc-base64'

import * as moment from 'moment'
client.set('timeout', 3600000)
process.env.UV_THREADPOOL_SIZE = '128'
export abstract class ScrapingURL {

	static readonly MAX_WAIT_SEC = 10 * 1000
	static readonly MIN_WAIT_SEC = 5 * 1000

	abstract readonly encoding: 'sjis' | 'UTF-8'

	abstract get toURL(): string

	serialize(obj: {}, sort = false) {
		const str = sort ? Object.keys(obj).sort() : Object.keys(obj)
		for (let i = 0, len = str.length; i < len; i++) {
			const key = str[i]

			switch (this.encoding.toUpperCase()) {
				case 'SJIS':
					str[i] = encode.EscapeSJIS(key) + '=' + encode.EscapeSJIS(String(obj[key]))
					break
				case 'UTF-8':
					str[i] = encodeURIComponent(key) + '=' + encodeURIComponent(String(obj[key]))
			}
		}
		return str.join("&")
	}

	fetchObservable(isDelayed = true) {
		const fetch = Observable.fromPromise(client.fetch(this.toURL))
			.map((result) => result.$)
			.doOnNext(($) => console.log('url: ' + $.documentInfo().url))
		return (isDelayed) ?
			fetch
				.delay(Math.random() * (ScrapingURL.MAX_WAIT_SEC - ScrapingURL.MIN_WAIT_SEC) + ScrapingURL.MIN_WAIT_SEC) :
			fetch
	}
}

export class BCItemListURL extends ScrapingURL {
	readonly encoding = 'sjis'
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

	readonly encoding = 'sjis'

	constructor(private id: string | number) {
		super()
	}

	get toURL() {
		return `https://www.biccamera.com/bc/item/${this.id}`
	}
}

export class BCStockURL extends ScrapingURL {

	readonly encoding = 'sjis'

	constructor(private id: string | number) {
		super()
	}

	get toURL() {
		return `https://www.biccamera.com/bc/tenpo/CSfBcToriokiList.jsp?GOODS_NO=${this.id}`
	}
}

export class AmazonURL extends ScrapingURL {
	readonly encoding = 'UTF-8'

	constructor(private params: { [key: string]: string }) {
		super()
		this.params = {
			...this.params,
			'MarketplaceId': 'A1VC38T7YXB528',
			'AWSAccessKeyId': SECRET.ACCESSKEYID,
			'SellerId': SECRET.SELLERID,
			'SignatureMethod': 'HmacSHA256',
			'SignatureVersion': '2',
			'Timestamp': moment().utc().format(),
			'Version': '2011-10-01',
		}
	}

	get toURL() {
		const encodedParams = this.serialize(this.params, true)

		const sign = 'GET\nmws.amazonservices.jp\n/Products/2011-10-01\n' + encodedParams

		const Signature = Base64.stringify(HmacSHA256(sign, SECRET.SECRETKEY))

		return `https://mws.amazonservices.jp/Products/2011-10-01?`
			+ encodedParams + '&' + this.serialize({ Signature })
	}
}
