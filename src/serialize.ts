import * as encode from './encoding'
import { withDelay } from './customObs'
import { Observable } from 'rx'
import * as SECRET from '../config/amazon-secret.json'
import { proxyRouting, } from './lumi-proxy'
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import * as iconv from 'iconv-lite'
import * as cheerio from 'cheerio'
import * as tunnel from 'tunnel'
import { detect } from './auto-detect'

import { HmacSHA256 } from 'crypto-js'
import * as Base64 from 'crypto-js/enc-base64'

import * as moment from 'moment'
process.env.UV_THREADPOOL_SIZE = '128'


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
	]
})

const BCAxios = axios.create({
	baseURL: 'https://www.biccamera.com/bc/',
	responseType: 'arraybuffer',
	proxy: false,
	transformResponse: [
		(data) => {
			const enc = detect(data).toLowerCase()
			if (/^utf\-?8$/i.test(enc)) {
				return data.toString()
			}

			return iconv.decode(data, enc)
		},
	]
})

export const axiosGetObs = (axiosIns: AxiosInstance, url: string, conf?: AxiosRequestConfig) =>
	Observable.create<CheerioStatic>(o => {
		axiosIns.get(url, conf)
			.then(
				(response) => {
					console.log(response.config.url)
					o.onNext(cheerio.load(response.data))
				},
				err => {
					console.log(err)
					o.onError(err)
				})

	})

export const fetchBase = (axiosIns: AxiosInstance, url: string, isDelayed = true, routingProxy = true) =>
	Observable.if(
		() => routingProxy,

		proxyRouting()
			.concatMap(agent => axiosGetObs(axiosIns, url, {
				httpsAgent: agent
			}))
		,
		axiosGetObs(axiosIns, url)
	)
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

	return fetchBase(AWSAxios, `2011-10-01?` + encodedParams + '&' + serialize({ Signature }, 'utf8'), false, false)
}
