

import { str } from './defs.js'
import fs from "fs";


const DIST = "dist/"



const allinone = (viewname:str, static_prefix:str) => new Promise<string>(async (resolve, reject) => {

	const promises:Promise<string>[] = []

	let lazyload_js_path = getview_fullpath_js_file(viewname, static_prefix)
	let r = {} as any

	const basePath = process.cwd() + '/'
	promises.push(fs.promises.readFile(basePath + static_prefix + DIST + "index.html", 'utf8'))
	promises.push(fs.promises.readFile(basePath + static_prefix + DIST + "main.js", 'utf8'))
	promises.push(fs.promises.readFile(basePath + static_prefix + DIST + "main.json", 'utf8'))
	promises.push(fs.promises.readFile(basePath + static_prefix + DIST + "main.css", 'utf8'))
	promises.push(fs.promises.readFile(basePath + static_prefix + DIST + "index.css", 'utf8'))
	promises.push(fs.promises.readFile(basePath + static_prefix + DIST + lazyload_js_path, 'utf8'))
	
	try   { r = await Promise.all(promises) }
	catch { reject(); return; }
	
	const indexhtml       = r[0]
	const mainjs          = r[1]
	const json            = JSON.parse(r[2])
	const maincss         = r[3]
	const indexcss        = r[4]
	const lazyloadjs      = r[5]


	let lazyref           = json.MAIN.LAZYLOADS.find((v:any)     => v.name == viewname)
	if (!lazyref) lazyref = json.INSTANCE.LAZYLOADS.find((v:any) => v.name == viewname)

	const scriptslist:string[] = []
	const checkedlist:string[] = []
	const combined_lazyloads = json.MAIN.LAZYLOADS.concat(json.INSTANCE.LAZYLOADS)
	await get_all_dependencies_as_script_tag_strings(combined_lazyloads, lazyref, static_prefix, scriptslist, checkedlist)
	
	const main_js_script_str = `<script type="module">${mainjs}</script>\n<script type="module">${lazyloadjs}</script>\n${scriptslist.join('\n')}`
	const css_link_str       = `<style>${maincss}</style><style>${indexcss}</style>`
	
	const htmlstr = indexhtml.replace('<!--{--js_css--}-->', main_js_script_str + `\n\n\n` + css_link_str)

	resolve(htmlstr)	
})




const getview_fullpath_js_file = (viewname:str, static_prefix:str) => {

	let lazyloadpath = ""

	switch (viewname) {
		case "setup_push_allowance": 
			lazyloadpath = "lazy/views/setup_push_allowance/setup_push_allowance.js"
			break
		case "appmsg": 
			lazyloadpath = "lazy/views/appmsg/appmsg.js"
			break
		case "login": 
			lazyloadpath = "lazy/views/login/login.js"
			break
		case "home": 
			lazyloadpath = "instance/lazy/views/home/home.js"
			break
		case "machines": 
			lazyloadpath = "instance/lazy/views/machines.js"
			break
		case "notifications": 
			lazyloadpath = "instance/lazy/notifications/notifications.js"
			break
		default:
			lazyloadpath = "lazy/views/home/home.js" // Default fallback
	}

	return lazyloadpath
}




const get_all_dependencies_as_script_tag_strings = (all_lazyrefs:any, lazyref:any, static_prefix:str, scriptslist:string[], checkedlist:string[]) => new Promise(async (resolve, _reject) => {
	if (!lazyref || !lazyref.dependencies) {
		resolve(1);
		return;
	}

	let dependencies = lazyref.dependencies
	let promises:Promise<string>[] = []
	let paths:string[] = []

	for (let i=0; i<dependencies.length; i++) {
		let dep = dependencies[i]

		// Skip if already processed
		const already_checked = checkedlist.find((v:string) => v === dep.name)
		if (already_checked) continue

		checkedlist.push(dep.name)

		let dep_lazyref = all_lazyrefs.find((v:any) => v.name == dep.name)
		if (!dep_lazyref) continue

		const basePath = process.cwd() + '/'
		let lazyref_path = ''
		
		// Construct path based on the dependency structure
		if (dep_lazyref.type && dep_lazyref.name) {
			lazyref_path = basePath + static_prefix + DIST + 
				(dep_lazyref.is_instance ? 'instance/' : '') + 
				"lazy/" + dep_lazyref.type + "/" + 
				(dep_lazyref.type === 'component' ? dep_lazyref.name : dep_lazyref.name + "/" + dep_lazyref.name) + 
				".js"
		}

		// Only add to promises if the path is valid
		if (lazyref_path) {
			promises.push(fs.promises.readFile(lazyref_path, 'utf8').catch(err => {
				console.warn(`Could not load dependency: ${lazyref_path}`, err.message);
				return '';
			}));
			paths.push(lazyref_path);
		}
	}

	try {
		const rloads = await Promise.all(promises)
		for (let i = 0; i < rloads.length; i++) {
			const rload = rloads[i];
			if (rload) {
				scriptslist.push(`<script type="module">${rload}</script>`);
			}
		}
	} catch (error) {
		console.error("Error loading dependencies:", error);
	}

	for (let i=0; i<dependencies.length; i++) {
		let dep = dependencies[i]
		let dep_lazyref = all_lazyrefs.find((v:any) => v.name == dep.name)
		await get_all_dependencies_as_script_tag_strings(all_lazyrefs, dep_lazyref, static_prefix, scriptslist, checkedlist)
	}

	resolve(1)
})




const get_lazyref_file = (lazyref:any, static_prefix:str) => new Promise<string>(async (resolve, reject) => {
	if (!lazyref) {
		resolve('');
		return;
	}
	
	try {
		const basePath = process.cwd() + '/';
		const lazyref_path = basePath + static_prefix + DIST + 
			(lazyref.is_instance ? 'instance/' : '') + 
			"lazy/" + lazyref.type + "/" + 
			(lazyref.type === 'component' ? lazyref.name : lazyref.name + "/" + lazyref.name) + 
			".js";
			
		const lazyref_contents = await fs.promises.readFile(lazyref_path, 'utf8');
		resolve(lazyref_contents);
	} catch (error) {
		console.warn(`Could not load lazyref file: ${lazyref?.name}`, error.message);
		resolve('');
	}
})



export default { allinone }





