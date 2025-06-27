

import { str } from './defs.js'
import fs from "fs";


const BASEPATH = process.cwd() + '/'



const HandlePath = (viewpath:str, static_prefix:str, nodeenv:str, json_configs:any) => new Promise<{returnstr:string,viewname:str}>(async (resolve, reject) => {

	// THIS BE DONE FUCKED TOO
	if (nodeenv === "gcloud/") nodeenv = "dist/";

	const promises:Promise<string>[] = []

	let r = {} as any

	promises.push(fs.promises.readFile(BASEPATH + static_prefix + nodeenv + "index.html", 'utf8'))

	try   { r = await Promise.all(promises) }
	catch { reject(); return; }
	
	const indexhtml                = r[0]

	const all_lazyloads            = [...json_configs.MAIN.LAZYLOADS, ...json_configs.INSTANCE.LAZYLOADS]

	let   this_lazyload            = getlazyload(viewpath, all_lazyloads)

	if (!this_lazyload) {
		reject(`Lazyload not found for path: ${viewpath}`);
		return;
	}

	let   view_base_path		   = getview_base_path(this_lazyload)

	const dependencies_list:string[]      = []
	get_all_lazyload_dependencies(all_lazyloads, this_lazyload, static_prefix, dependencies_list)
	const dependencies_list_script_strs = dependencies_list.map((v) => `<script type="module" src="${v}" is_lazyload_asset="true"></script>`).join('\n')
	

	const js_scripts_str = `
		<script type="module" src="/assets/main.js"></script>
		${dependencies_list_script_strs}
		<script type="module" src="/assets/${view_base_path}.js" is_lazyload_asset="true"></script>
	`

	const css_link_strs = `<link rel="stylesheet" href="/assets/index.css"></link>`

	const htmlstr = indexhtml.replace('<!--{--js_css--}-->', js_scripts_str + `\n\n\n` + css_link_strs)

	resolve({ returnstr: htmlstr, viewname:this_lazyload.name })	
})








const getlazyload = (path:str, all_lazyloads:any[]) => {

	for (const lazyload of all_lazyloads) {

		if (lazyload.type !== "view") continue;
		
		if (lazyload.urlmatch_regex.test(path)) {
			return lazyload;
		}
	}
	
	return null;
}




const getview_base_path = (lazyload:any) => {

	let view_file_path = ""

	if (lazyload.is_instance) view_file_path += "instance/"

	view_file_path += "lazy/views/" + lazyload.name + "/" + lazyload.name

	return view_file_path
}




const get_all_lazyload_dependencies = (all_lazyloads:any, lazyload:any, static_prefix:str, paths_list:string[]) => {
	debugger

	for (const dep of lazyload.dependencies) {

		const dep_lazyload  = all_lazyloads.find((v:any) =>  v.name == dep.name)

		let resofpath = "views/" // default
		switch (dep_lazyload.type) {
			case "view"       : resofpath = "lazy/views/"  + dep_lazyload.name + "/" + dep_lazyload.name + ".js"; break;
			case "component"  : resofpath = "lazy/components/" + dep_lazyload.name + "/" + dep_lazyload.name + ".js"; break;
			case "thirdparty" : resofpath = "thirdparty/" + dep_lazyload.name + ".js"; break;
		}

		let   lazyref_path  = "/assets/" + (dep_lazyload.is_instance ? 'instance/' : '') + resofpath

		const is_already_added = paths_list.find((v) => v == lazyref_path) ? true : false
		if (is_already_added) continue

		paths_list.push(lazyref_path)

		if (dep_lazyload.dependencies) {
			get_all_lazyload_dependencies(all_lazyloads, dep_lazyload, static_prefix, paths_list)
		}
	}
}


/*
const HandlePath_original = (pathparts:str[], static_prefix:str, nodeenv:str) => new Promise<{returnstr:string,viewname:str}>(async (resolve, reject) => {

	const promises:Promise<string>[] = []

	let r = {} as any

	promises.push(fs.promises.readFile(BASEPATH + static_prefix + nodeenv + "index.html", 'utf8'))
	promises.push(fs.promises.readFile(BASEPATH + static_prefix + nodeenv + "main.json", 'utf8'))

	try   { r = await Promise.all(promises) }
	catch { reject(); return; }
	
	const indexhtml                = r[0]
	const json                     = JSON.parse(r[1])

	const all_lazyloads            = [...json.MAIN.LAZYLOADS, ...json.INSTANCE.LAZYLOADS]

	let   this_lazyload            = getlazyload(pathparts, all_lazyloads)
	let   view_base_path		   = getview_base_path(this_lazyload)
	let   view_js_content          = await getview_js_content(view_base_path, nodeenv, static_prefix)

	const paths_list:string[]      = []

	get_all_lazyload_dependencies(all_lazyloads, this_lazyload, static_prefix, paths_list)

	const lazyload_js_paths = paths_list.map((v) => `<script type="module" src="${v}"></script>`).join('\n')
	
	const view_script_js_str = `<script type="module">${view_js_content}</script>`

	const main_js_script_str = `
		<script type="module" src="/assets/main.js"></script>
		${view_script_js_str}
		${lazyload_js_paths}
	`

	const css_link_str       = `<link rel="stylesheet" href="/assets/index.css"></link>`

	const htmlstr = indexhtml.replace('<!--{--js_css--}-->', main_js_script_str + `\n\n\n` + css_link_str)

	resolve({ returnstr: htmlstr, viewname:this_lazyload.name })	
})
*/




/*
const handle_path__view_dev = (view_base_path:str, static_prefix:str) => new Promise<string>(async (resolve, _reject) => {

	const promises:Promise<any>[] = []
	const p = BASEPATH + static_prefix + "dev/" + view_base_path
	promises.push(fs.promises.readFile(p + ".js", 'utf8'))
	promises.push(fs.promises.readFile(p + ".html", 'utf8'))
	const r = await Promise.all(promises)

	let jsstr = r[0].replace("{--html--}", `${r[1]}`)
	jsstr     = jsstr.replace("{--css--}", `<link rel="stylesheet" href="/assets/main.css"></link><link rel="stylesheet" href="/assets/${view_base_path}.css"></link>`)
	const script_jsstr = `<script type="module">${jsstr}</script>`

	resolve(script_jsstr)	
})




const handle_path__view_dist = (view_base_path:str, static_prefix:str) => new Promise<string>(async (resolve, _reject) => {

	const promises:Promise<any>[] = []
	const p = BASEPATH + static_prefix + "dist/" + view_base_path
	promises.push(fs.promises.readFile(p + ".js", 'utf8'))
	const r = await Promise.all(promises)

	const script_jsstr = `<script type="module">${r[0]}</script>`

	resolve(script_jsstr)	
})
*/
/*
const getview_js_content = (basepath:str, nodeenv:str, static_prefix:str) => new Promise <any>(async (resolve, _reject) => {

	const promises:Promise<any>[] = []

	const p = BASEPATH + static_prefix + nodeenv + basepath

	if (nodeenv === "dev/") {
		promises.push(fs.promises.readFile(p + ".js", 'utf8'))
		promises.push(fs.promises.readFile(p + ".html", 'utf8'))
		const r = await Promise.all(promises)

		let jsstr = r[0].replace("{--html--}", `${r[1]}`)
		jsstr     = jsstr.replace("{--css--}", `<link rel="stylesheet" href="/assets/${basepath}.css"></link>`)
		resolve(jsstr)
	}

	else {
		promises.push(fs.promises.readFile(p + ".js", 'utf8'))
		const r = await Promise.all(promises)
		resolve(r[0])
	}
})
*/








export default { HandlePath }





