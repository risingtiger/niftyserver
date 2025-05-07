

import { str } from './defs.js'




import fs from "fs";
//import { promisify } 		  from 'util';
//import { exec as cpexec } from 'child_process';
import * as path_util from "path";


//const exec = promisify(cpexec);



function runit(fileurl:str, res:any, env:str, static_prefix:str)  {   return new Promise(async (resolve, _reject) => {

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
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')

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

	res.set('Content-Type', 'text/html; charset=UTF-8');
	res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')

    const path_without_extension = jspath.substring(0, jspath.length - jsextension.length)

    res.set('Content-Type', 'application/javascript; charset=UTF-8');

    if (env === "dev") {

        if (jspath.includes("lazy/") && (jspath.includes("views/") || jspath.includes("components/")) ) {

            const htmlpromise = fs.promises.readFile(absolute_path + path_without_extension + ".html", 'utf8')
            const jspromise = fs.promises.readFile(absolute_path + path_without_extension + ".js", 'utf8')

            const linkcsspath = "/assets/" + path_without_extension + ".css"

            let [htmlstr, jsstr] = await Promise.all([htmlpromise, jspromise])

			const css_replace = jspath.includes("views/") ? `<link rel="stylesheet" href="/assets/main.css"><link rel="stylesheet" href="${linkcsspath}">` : `<link rel="stylesheet" href="${linkcsspath}">`

            jsstr = jsstr.replace("{--html--}", `${htmlstr}`)
            jsstr = jsstr.replace("{--css--}", css_replace)

            res.send(jsstr)

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




export default { runit }





