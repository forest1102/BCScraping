import * as jschardet from 'jschardet'

export function detect(buffer: Buffer): string {

	const head = buffer.toString('ascii').match(/<head[\s>]([\s\S]*?)<\/head>/i)
	if (head) {
		const charset = head[1].match(/<meta[^>]*[\s;]+charset\s*=\s*["']?([\w\-_]+)["']?/i)
		if (charset) {
			return charset[1].trim()
		}
	}

	const enc = jschardet.detect(buffer)

	if (enc && enc.encoding && (enc.confidence || 0) >= 0.99) {
		return enc.encoding
	}

	return null
}

