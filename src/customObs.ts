import { Observable } from 'rx'
const RETRY_DEFAULT = 100
const SEC_DEFAULT = 10
export const withDelay = (errs: Observable<{}>, MAX = RETRY_DEFAULT, sec = SEC_DEFAULT) =>
	errs
		.doOnNext(err => console.error(JSON.stringify(err)))
		.zip(
			Observable.range(1, MAX + 1),
			(n, i) => ({ n, i }))
		.flatMap(({ n, i }) =>
			Observable.if(
				() => i > MAX,
				Observable.throw(n as Error),
				Observable.timer(sec)
			))
		.doOnNext(() => console.log('リトライします。'))
