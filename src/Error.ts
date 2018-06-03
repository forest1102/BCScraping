import { CustomError } from 'ts-custom-error'
export class BadRequestError extends CustomError {
	static readonly NAME = 'BAD REQUEST'
	constructor(m = 'the query is not properly') {
		super(m)
	}
}
export class NotFoundError extends CustomError {
	static readonly NAME = 'NotFoundResultError'
	constructor(m = `Not Found the result`) {
		super(m)
		this.name = NotFoundError.NAME
	}
}
