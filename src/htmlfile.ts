

import { str } from './defs.js'
import fs from "fs";


const DIST = "_dist/"



const allinone = (viewname:str, static_prefix:str) => new Promise(async (resolve, reject) => {

	const promises:Promise<string>[] = []

	let lazyload_js_path = getview_fullpath_js_file(viewname, static_prefix)
	let r = {} as any

	promises.push(fs.promises.readFile(static_prefix + DIST + "index.html", 'utf8'))
	promises.push(fs.promises.readFile(static_prefix + DIST + "main.js", 'utf8'))
	promises.push(fs.promises.readFile(static_prefix + DIST + "main.json", 'utf8'))
	promises.push(fs.promises.readFile(static_prefix + DIST + "main.css", 'utf8'))
	promises.push(fs.promises.readFile(static_prefix + DIST + "index.css", 'utf8'))
	promises.push(fs.promises.readFile(static_prefix + lazyload_js_path, 'utf8'))
	
	try   { r = await Promise.all(promises) }
	catch { reject(); return; }
	
	const indexhtml    = r[0]
	const mainjs       = r[1]
	const json         = r[2]
	const maincss      = r[3]
	const indexcss     = r[4]
	const lazyloadjs   = r[5]

	
	const main_js_script_str = `<script type = "module">${mainjs} \n\n\n\n ${json}</script><script type = "module">${lazyloadjs}</script>`
	const css_link_str       = `<style>${maincss}</style><style>${indexcss}</style>`
	
	const htmlstr = indexhtml.replace('<!--{--js_css--}-->', main_js_script_str + `\n\n\n` + css_link_str)

	resolve(htmlstr)	
})




const getview_fullpath_js_file = (viewname:str, static_prefix:str) => {

	let lazyloadpath = ""

	switch (viewname) {

		case "setup_push_allowance" : lazyloadpath = static_prefix  + DIST + "lazy/views/setup_push_allowance/setup_push_allowance.js"
		case "appmsg" : lazyloadpath = static_prefix  + DIST + "lazy/views/appmsg/appmsg.js"
		case "login" : lazyloadpath = static_prefix  + DIST + "lazy/views/login/login.js"

		case "home" : lazyloadpath = static_prefix  + DIST + "instance/lazy/views/home/home.js"
		case "machines" : lazyloadpath = static_prefix  + DIST + "instance/lazy/views/machines.js"
		case "notifications" : lazyloadpath = static_prefix  + DIST + "instance/lazy/notifications/notifications.js"
	}

	return lazyloadpath
}




export default { allinone }





