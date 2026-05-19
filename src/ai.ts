

//import { str } from './defs.js'
import OpenAI from 'openai'




const AskWithSkill = (storage:any, model:string, skill:string, question:string, content?:string ) => new Promise<any>(async (res, rej) => {

	const promises:Promise<any>[] = [];

	if (skill.startsWith('bucket')) promises.push( getFromStorageMDFile(storage, skill) )
	if (content && content.startsWith('bucket')) promises.push( getFromStorageMDFile(storage, content) )

	const results = await Promise.all(promises)

	if (!results[0] || !results[1]) { rej(); return; }

	const skillString = results[0] || skill
	const contentString = results[1] || content || ""

	const input = `
		## Skill
		${skillString}

		${contentString ? '## Content\n' + contentString : ""}

		${question}
	`

	if (model === 'gpt-5.5') {
		const answer = await askOpenAI(input)
		if (!answer) { rej(); return; }
		res(answer)
		return;
	}

	// Unhandled Case: add support for other models as needed.
	rej('Unsupported model: ' + model)
})




const askOpenAI = async (input:string) => new Promise<string|null>(async (res, rej) => {

	const apiKey = process.env.OPENAI_API_KEY
	if (!apiKey) {
		// Unhandled Case: production configuration should ensure OPENAI_API_KEY exists before this module is used.
		rej();
		return 
	}

	const openai = new OpenAI({ apiKey })

	let response:any = null
	try {
		response = await openai.responses.create({
			model: 'gpt-5.5',
			input,
		})
	}
	catch (_err) {
		// Unhandled Case: add retry/backoff handling for rate limits and transient OpenAI failures.
		rej();
		return null
	}

	if (!response || !response.output_text) return null

	res( response.output_text.trim() );
})





const getFromStorageMDFile = (storage:any, filename:string) => new Promise<string|null>(async (res, rej) => {

	let markdownBuffer:any = null;

	if (!filename.startsWith('bucket')) return filename

	const pathParts  = filename.split('/')
	const bucketName = pathParts[1]
	const filePath   = pathParts.slice(2).join('/')

	if (!bucketName || !filePath) {
		rej('Invalid bucket path format. Expected format: bucket/{bucketName}/{filePath}')
		return;
	}

	try {
		const result = await storage.bucket(bucketName).file(filePath).download()
		markdownBuffer = result[0]
	}
	catch (err) {
		rej('Error fetching file from storage: ' + err.message)
		return
	}

	res(markdownBuffer.toString('utf8').trim());
})




const Ai = { 
	AskWithSkill
};

export default Ai;




