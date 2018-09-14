import * as encode from './encoding'
import { withDelay } from './customObs'
import { Observable } from 'rx'
import * as SECRET from '../config/amazon-secret.json'
import { proxyRouting, proxyReset } from './lumi-proxy'
import axios, { AxiosInstance } from 'axios'
import * as iconv from 'iconv-lite'
import * as cheerio from 'cheerio'
import * as tunnel from 'tunnel'

import { HmacSHA256 } from 'crypto-js'
import * as Base64 from 'crypto-js/enc-base64'

import * as moment from 'moment'
process.env.UV_THREADPOOL_SIZE = '128'

const lumi = tunnel.httpsOverHttp({
	proxy: {
		host: 'zproxy.lum-superproxy.io',
		port: 22225,
		proxyAuth: 'lum-customer-hl_8a91b9b8-zone-zone2-country-ca:7bx2gosdb01o',
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36',
			'Keep-Alive': 'true'
		}
	},
})

const MAX_WAIT_SEC = 15 * 1000
const MIN_WAIT_SEC = 10 * 1000

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

const AWSAxios = axios.create({
	baseURL: 'https://mws.amazonservices.jp/Products/',
	proxy: false,
	responseType: 'text',
	transformResponse: [
		(data) => cheerio.load(data)
	]
})

const BCAxios = axios.create({
	baseURL: 'https://www.biccamera.com/bc/',
	responseType: 'arraybuffer',
	httpsAgent: lumi,
	proxy: false,
	transformResponse: [
		(data) => iconv.decode(data, 'Shift_JIS'),
		(data) => cheerio.load(data)
	]
})

export const fetchBase = (axiosIns: AxiosInstance, url: string, isDelayed = true) =>
	Rx.Observable.fromPromise(axiosIns(url))
		.map(res => res.data as CheerioStatic)
		.retryWhen(withDelay)
		.let(
			obs =>
				(isDelayed) ?
					obs
						.delay(Math.random() * (MAX_WAIT_SEC - MIN_WAIT_SEC) + MIN_WAIT_SEC) :
					obs
		)


export function fetchBCItemList(searchObject: SearchObject) {
	const url = `/category/?${serialize(searchObject)}#bcs_resultTxt`
	return fetchBase(BCAxios, url)
}

export function fetchBCDetail(id: string | number) {
	const url = `/item/${id}#bcs_resultTxt`
	return fetchBase(BCAxios, url)
}

export const fetchBCStock = (id: string | number) =>
	fetchBase(BCAxios, `/tenpo/CSfBcToriokiList.jsp?GOODS_NO=${id}`)

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

	return fetchBase(AWSAxios, `2011-10-01?` + encodedParams + '&' + serialize({ Signature }, 'utf8'))
}
