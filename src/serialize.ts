import * as encode from './encoding'
import { withDelay } from './customObs'
import * as client from 'cheerio-httpcli'
import { Observable } from 'rx'
import * as SECRET from '../config/amazon-secret.json'

import { HmacSHA256 } from 'crypto-js'
import * as Base64 from 'crypto-js/enc-base64'

import * as moment from 'moment'
client.set('timeout', 3600000)
process.env.UV_THREADPOOL_SIZE = '128'

const MAX_WAIT_SEC = 10 * 1000
const MIN_WAIT_SEC = 5 * 1000

function serialize(obj: {}, encoding: 'utf8' | 'sjis' = 'sjis', sort = false) {
	const str = sort ? Object.keys(obj).sort() : Object.keys(obj)
	for (let i = 0, len = str.length; i < len; i++) {
		const key = str[i]

		switch (encoding) {
			case 'sjis':
				str[i] = encode.EscapeSJIS(key) + '=' + encode.EscapeSJIS(String(obj[key]))
				break
			case 'utf8':
				str[i] = encodeURIComponent(key) + '=' + encodeURIComponent(String(obj[key]))
		}
	}
	return str.join("&")
}

export function fetchObservable(url: string, isDelayed = true) {
	const fetch = Observable.fromPromise(client.fetch(url))
		.map((result) => {
			console.log(url)
			return result.$
		})
		.retryWhen(withDelay)
	return (isDelayed) ?
		fetch
			.delay(Math.random() * (MAX_WAIT_SEC - MIN_WAIT_SEC) + MIN_WAIT_SEC) :
		fetch
}

export function fetchBCItemList(searchObject: SearchObject) {
	const url = `https://www.biccamera.com/bc/category/?${serialize(searchObject)}#bcs_resultTxt`
	return fetchObservable(url)
}

export function fetchBCDetail(id: string | number) {
	const url = `https://www.biccamera.com/bc/item/${id}`
	return fetchObservable(url)
}

export const fetchBCStock = (id: string | number) =>
	fetchObservable(
		`https://www.biccamera.com/bc/tenpo/CSfBcToriokiList.jsp?GOODS_NO=${id}`
	)

export function fetchAmazon(params: { [key: string]: string }) {
	const _params = {
		...params,
		'MarketplaceId': 'A1VC38T7YXB528',
		'AWSAccessKeyId': SECRET.ACCESSKEYID,
		'SellerId': SECRET.SELLERID,
		'SignatureMethod': 'HmacSHA256',
		'SignatureVersion': '2',
		'Timestamp': moment().utc().format(),
		'Version': '2011-10-01',
	}
	const encodedParams = serialize(_params, 'utf8', true)

	const sign = 'GET\nmws.amazonservices.jp\n/Products/2011-10-01\n' + encodedParams

	const Signature = Base64.stringify(HmacSHA256(sign, SECRET.SECRETKEY))

	return fetchObservable(`https://mws.amazonservices.jp/Products/2011-10-01?`
		+ encodedParams + '&' + serialize({ Signature }, 'utf8'), false)
}
