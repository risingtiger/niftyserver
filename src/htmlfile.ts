

import { str } from './defs.js'
import fs from "fs";


const DIST = "_dist/"



const allinone = (viewname:str, static_prefix:str) => new Promise(async (resolve, reject) => {

	const promises:Promise<string>[] = []

	let lazyloadpath = getview_fullpath(viewname, static_prefix)
	let r = {} as any

	promises.push(fs.promises.readFile(static_prefix + DIST + "index.html", 'utf8'))
	promises.push(fs.promises.readFile(static_prefix + DIST + "main.js", 'utf8'))
	promises.push(fs.promises.readFile(static_prefix + DIST + "main.json", 'utf8'))
	promises.push(fs.promises.readFile(static_prefix + DIST + "main.css", 'utf8'))
	promises.push(fs.promises.readFile(static_prefix + DIST + "index.css", 'utf8'))
	promises.push(fs.promises.readFile(static_prefix + lazyloadpath, 'utf8'))
	promises.push(fs.promises.readFile(static_prefix + DIST + "instance/main.js", 'utf8'))
	promises.push(fs.promises.readFile(static_prefix + DIST + "instance/main.json", 'utf8'))
	
	try   { r = await Promise.all(promises) }
	catch { reject(); return; }
	
	const indexhtml    = r[0]
	const mainjs       = r[1]
	const json         = r[2]
	const maincss      = r[3]
	const indexcss     = r[4]
	const lazyloadhtml = r[5]
	const instancemain = r[5]
	const instancejson = r[5]

	// <script type="module" src="/assets/main.js"></script>
	// <link rel="stylesheet" href="/assets/index.css">

	// find a string '<!--{--js_css--}-->' inside of indexhtml. replace with mainjs string AI!

	const htmlstr = r[0]

	resolve(htmlstr)	
})




const getview_fullpath = (viewname:str, static_prefix:str) => {

	let lazyloadpath = ""

	switch (viewname) {

		case "setup_push_allowance" : lazyloadpath = static_prefix  + DIST + "lazy/views/setup_push_allowance/setup_push_allowance.js"
		case "appmsg" : lazyloadpath = static_prefix  + DIST + "lazy/views/appmsg/appmsg.js"
		case "login" : lazyloadpath = static_prefix  + DIST + "lazy/views/login/login.js"

		case "home" : lazyloadpath = static_prefix  + DIST + "instance/lazy/views/home/home.js"
		case "machines" : lazyloadpath = static_prefix  + DIST + "instance/lazy/views/machines.js"
		case "notifications" : lazyloadpath = static_prefix  + DIST + "instance/lazy/notifications/notifications.js"

		default : lazyloadpath = static_prefix  + DIST + "instance/lazy/views/home/home.js"
	}

	return lazyloadpath
}




export default { allinone }





