import { Observable } from 'rx'

export const withDelay = (errs: Observable<{}>, MAX: number, sec: number) =>
	Observable.zip(
		errs,
		Observable.range(1, MAX + 1),
		(n, i) => ({ n, i }))
		.flatMap(({ n, i }) =>
			Observable.if(
				() => i > MAX,
				Observable.throw(n as Error),
				Observable.timer(sec)
			))
