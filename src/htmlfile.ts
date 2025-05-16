

import { str } from './defs.js'
import fs from "fs";


const DIST     = "dist/"
const BASEPATH = process.cwd() + '/'



const allinone = (pathparts:str[], static_prefix:str) => new Promise<string>(async (resolve, reject) => {

	const promises:Promise<string>[] = []

	let r = {} as any

	promises.push(fs.promises.readFile(BASEPATH + static_prefix + DIST + "index.html", 'utf8'))
	promises.push(fs.promises.readFile(BASEPATH + static_prefix + DIST + "main.json", 'utf8'))
	promises.push(fs.promises.readFile(BASEPATH + static_prefix + DIST + "index.css", 'utf8'))

	try   { r = await Promise.all(promises) }
	catch { reject(); return; }
	
	const indexhtml                   = r[0]
	const json                    = JSON.parse(r[1])
	const indexcss                    = r[2]

	const all_lazyloads = [...json.MAIN.LAZYLOADS, ...json.INSTANCE.LAZYLOADS]

	let   this_lazyload		   	      = getlazyload(pathparts, all_lazyloads)
	let   lazyload_js_path			  = getview_fullpath_js_file(pathparts, all_lazyloads)

	const paths_list:string[]  = []

	get_all_lazyload_dependencies(all_lazyloads, this_lazyload, static_prefix, paths_list)

	const lazyload_js_paths = paths_list.map((v) => `<script type="module" src="${v}"></script>`).join('\n')
	
	const main_js_script_str = `
		<script type="module" src="/assets/main.js"></script>
		<script type="module" src="${lazyload_js_path}"></script>
		${lazyload_js_paths}
	`
	const css_link_str       = `
		<link rel="stylesheet" href=""/assets/main.css">
		<style>${indexcss}</style>
	`
	
	const htmlstr = indexhtml.replace('<!--{--js_css--}-->', main_js_script_str + `\n\n\n` + css_link_str)

	resolve(htmlstr)	
})




const getlazyload = (pathparts, all_lazyloads) => {

	// pathparts looks something like: ["machines"] or ["machines", "1234"]
	// all_lazyload array has objects, each having a urlmatch like: "^machines$" or "^machines/:id$"
	// each "/" in urlmatch corresponds to a part in pathparts
	// write code to match the pathparts with the urlmatch
	// AI!
}




const getview_fullpath_js_file = (viewname:str, lazyloads:any[]) => {

	let lazyloadpath = "/assets/"

	const lazyload = lazyloads.find((v:any) => { 
		return (v.type === "view" && v.name == viewname)
	})

	if (lazyload.is_instance) lazyloadpath += "instance/"

	lazyloadpath += "lazy/views/" + lazyload.name + "/" + lazyload.name + ".js"

	return lazyloadpath
}




const get_all_lazyload_dependencies = (all_lazyloads:any, lazyload:any, static_prefix:str, paths_list:string[]) => {

	for (const dep of lazyload.dependencies) {

		const dep_lazyload  = all_lazyloads.find((v:any) =>  v.name == dep.name)

		const typedirectory = dep_lazyload.type === "component" ? "components" : "views"

		let   lazyref_path  = "/assets/" + (dep_lazyload.is_instance ? 'instance/' : '') + "lazy/" + typedirectory + "/" + dep_lazyload.name + "/" + dep_lazyload.name + ".js"

		const is_already_added = paths_list.find((v) => v == lazyref_path) ? true : false
		if (is_already_added) continue

		paths_list.push(lazyref_path)

		if (dep_lazyload.dependencies) {
			get_all_lazyload_dependencies(all_lazyloads, dep_lazyload, static_prefix, paths_list)
		}
	}
}





export default { allinone }





