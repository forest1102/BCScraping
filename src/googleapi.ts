import * as fs from 'fs-extra'
import * as path from 'path'
import * as googlesheets from 'google-sheets-manager'
import * as utils from 'google-sheets-manager/dist/utils/type_alias'

import { Observable } from 'rx'

const cred = require('../config/scrapingBigCamera-eb546c29942b.json')

class GoogleSheetWithObservable extends googlesheets.GoogleSheet {
	setDataObservable(data: string[][], options?: utils.ISheetDataOptions) {
		return Observable.create(obs => {
			this.setData(data, (err, res) => {
				if (err) return obs.onError(err)
				obs.onNext(res)
				obs.onCompleted()
			})
		})
	}

	getObservable(request) {
		return Observable.create(obs => {
			this.api.get(request, (err, res) => {
				if (err) return obs.onError(err)

				obs.onNext(res)
				obs.onCompleted()
			})
		})
	}

	batchUpdateObservable(request) {
		return Observable.create(obs => {
			this.api.batchUpdate(request, (err, res) => {
				if (err) return obs.onError(err)

				obs.onNext(res)
				obs.onCompleted()
			})
		})
	}

	getSheetsList() {
		return this
			.getObservable({
				spreadsheetId: this.spreadsheetId,
				includeGridData: false,
			})
			.flatMap(res =>
				(res['sheets'] as { properties: { sheetId: number, title: string } }[] || [])
					.filter(sheet => !!sheet && !!sheet.properties)
			)
	}

	getSheetId() {
		return this.getSheetsList()
			.first()
			.map(val => val.properties.sheetId)
	}
}

class GoogleAPI {
	private static _instance: GoogleAPI

	private _sheets: GoogleSheetWithObservable

	private oAuth = new googlesheets.ServiceAccount(cred as utils.IServiceAccountCreds)

	private _spreadsheetId: string

	private _spreadsheetsList: { sheetId: string, title: string }[]

	private constructor() { }

	static get instance() {
		if (!this._instance) {
			this._instance = new GoogleAPI()
		}
		return this._instance
	}

	set spreadsheetId(spreadsheetId: string) {
		this.spreadsheetId = spreadsheetId
		this._sheets.spreadsheetId = spreadsheetId
	}

	get sheets(): GoogleSheetWithObservable {
		if (this._sheets) {
			return this._sheets
		}
		if (!this.oAuth) {
			return null
		}

		return (this._sheets = new GoogleSheetWithObservable(this.oAuth, this._spreadsheetId))
	}

	getSheetsList() {

		return this.sheets.getObservable({
			spreadsheetId: this.sheets.spreadsheetId,
			includeGridData: false,
		})
			.map(res =>
				(res['sheets'] as { properties: { sheetId: number, title: string } }[])
					.filter(sheet => !!sheet && !!sheet.properties)
			)
	}

}

export default GoogleAPI
