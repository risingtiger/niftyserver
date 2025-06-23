

import { str } from './defs.js'
import fsp from "fs/promises";




import fs from "fs";
//import { promisify } 		  from 'util';
//import { exec as cpexec } from 'child_process';
import * as path_util from "path";


//const exec = promisify(cpexec);



function runit(fileurl:str, res:any, env:str, static_prefix:str, nocache:boolean = true)  {   return new Promise(async (resolve, _reject) => {

	if (nocache)
		res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')

    let path = fileurl.replace("/assets/", "");

    let absolute_prefix = process.cwd() + "/" + static_prefix + (env === "dev" ? "dev/" : "dist/");

    let extension = path_util.extname(path);
    extension = extension === "" ? ".html" : extension;

    if (extension === "" || extension === ".html") {
        extension = ".html"
    }

    switch (extension) {

        case ".html" : // will only ever be index.html

            res.set('Content-Type', 'text/html; charset=UTF-8');

            path = absolute_prefix + "index.html"

            /*
            if (env === "dist") {
                path = path + ".br"
                res.set('Content-Encoding', 'br');
            }
            */

            res.sendFile(path)
            break;

        case ".js":
            js(absolute_prefix, path, extension, env, res)
            break;

        case ".css": 
            css(absolute_prefix, path, extension, env, res)
            break;

        case ".png":
            res.set('Content-Type', 'image/png');
            res.sendFile(absolute_prefix + path)
            break;

        case ".jpg":
            res.set('Content-Type', 'image/jpeg');
            res.sendFile(absolute_prefix + path)
            break;

        case ".svg":
            res.set('Content-Type', 'image/svg+xml');
            res.sendFile(absolute_prefix + path)
            break;

        case ".gif":
            res.set('Content-Type', 'image/gif');
            res.sendFile(absolute_prefix + path)
            break;

        case ".ico":
            res.set('Content-Type', 'image/x-icon');
            res.sendFile(absolute_prefix + path)
            break;

        case ".woff2":
            res.set('Content-Type', 'font/woff2');
            res.sendFile(absolute_prefix + path)
            break;

        case ".webmanifest":
            res.set('Content-Type', 'application/manifest; charset=UTF-8');
            res.sendFile(absolute_prefix + path)
            break;
    }

    resolve(true)
})}




async function js(absolute_path:str, jspath:str, jsextension:str, env:str, res:any) {

    const path_without_extension = jspath.substring(0, jspath.length - jsextension.length)

    res.set('Content-Type', 'application/javascript; charset=UTF-8');

    if (env === "dev") {

		if (jspath.includes("lazy/")) {

			if (jspath.includes("/components/"))  {
				let jsstr = await fleshitout(absolute_path, path_without_extension, false)
				res.send(jsstr)

			} else if (jspath.includes("/views/") && !jspath.includes("/parts/") )  {
				let jsstr = await fleshitout(absolute_path, path_without_extension, true)
				let view_parts_str = await get_view_parts_str(absolute_path, path_without_extension)
				jsstr = view_parts_str + "\n\n\n" + jsstr
				res.send(jsstr)

			} else if (jspath.includes("/views/") && jspath.includes("/parts/") )  {
				let jsstr = await fleshitout(absolute_path, path_without_extension, true)
				res.send(jsstr)
			}

		} else {
			res.sendFile(absolute_path + jspath);
		}

	} else if (env === 'dist' || env === 'gcloud') {   

        let is_br_file = await fs.promises.access(absolute_path + path_without_extension + `${jsextension}.br`).then(()=> true).catch(()=> false)

        if (is_br_file) {
            jspath = path_without_extension + `${jsextension}.br`
            res.set('Content-Encoding', 'br');

        } else {
            jspath = path_without_extension + `${jsextension}`
        }

        res.sendFile(absolute_path + jspath);
	}
}





async function css(absolute_path:str, csspath:str, cssextension:str, env:str, res:any) {

	res.set('Content-Type', 'text/css; charset=UTF-8');

	if (env === "dev") {
		csspath = absolute_path + csspath
		res.sendFile(csspath)
	}

	else if(env === "dist" || env === "gcloud") { 

		const path_without_extension = csspath.substring(0, csspath.length - cssextension.length)

        let is_br_file = await fs.promises.access(absolute_path + path_without_extension + `${cssextension}.br`).then(()=> true).catch(()=> false)

		if (is_br_file) {
			csspath = absolute_path + path_without_extension + `${cssextension}.br`
			res.set('Content-Encoding', 'br');
		} else {
			csspath = absolute_path + path_without_extension + `${cssextension}`
		}

		res.sendFile(csspath);
	}
}




const fleshitout = (absolute_path:str, path_without_extension:str, includemaincss:boolean = false) => new Promise(async (resolve, _reject) => {

	const htmlpromise = fs.promises.readFile(absolute_path + path_without_extension + ".html", 'utf8')
	const jspromise = fs.promises.readFile(absolute_path + path_without_extension + ".js", 'utf8')

	const linkcsspath = "/assets/" + path_without_extension + ".css"
	let   css_replace = ""

	let [htmlstr, jsstr] = await Promise.all([htmlpromise, jspromise])

	if (includemaincss) css_replace += `<link rel = "stylesheet" href = "/assets/main.css">`
	css_replace                 += `<link rel = "stylesheet" href = "${linkcsspath}">`

	jsstr = jsstr.replace("{--html--}", `${htmlstr}`)
	jsstr = jsstr.replace("{--css--}", css_replace)

	resolve(jsstr)
})




const get_view_parts_str = (absolute_path:str, path_without_extension:str) => new Promise<string>(async (resolve, _reject) => {

	debugger
	const parts_dir_fs_path = absolute_path + path_without_extension + "/parts/";
	let   parts_imports_str = ""
	// it seems that fsp.stat() is not working. what other ways exist to check if a directory exists? AI!
	const pstat = await fsp.stat(parts_dir_fs_path).catch(() => false);

	if (pstat) {
		const dir_entries = await fsp.readdir(parts_dir_fs_path, { withFileTypes: true });
		for (const dir_entry of dir_entries) {
			if (dir_entry.isDirectory()) {
				const part_name = dir_entry.name;
				const part_module_web_path = `/assets/${path_without_extension}/parts/${part_name}/${part_name}.js`;
				parts_imports_str += `import '${part_module_web_path}';\n`;
			}
		}
	}
	resolve(parts_imports_str)	
})



export default { runit }





