import { Subject, Observable } from 'rx'
export class ExecScraping {
	private static _instance: ExecScraping

	private _subject = new Subject<SearchObject>()
	private constructor() { }

	set searchObj(obj: SearchObject) {
		this._subject.onNext(obj)
	}

	get subject() {
		return this._subject
	}

	public static get instance() {
		if (!this._instance) {
			this._instance = new ExecScraping();
		}

		return this._instance;
	}
}