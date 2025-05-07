

import { str } from "./defs.js"




import fs from "fs";



const runit = (req:any, res:any, static_prefix:str, env:str) => new Promise(async (resolve, _reject) => {

	res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')

	if (env === "dev") {

		if (req.path === "/" || req.path === "/index.html") {
			res.set('Content-Type', 'text/html; charset=UTF-8');
			const htmlstr = await fs.promises.readFile(static_prefix + "dev/instance/entry/index.html", 'utf8')
			resolve(htmlstr)
			return
		}

		else if (req.path === "/entry/index.js") {
			res.set('Content-Type', 'application/javascript; charset=UTF-8');
			const jsstr = await fs.promises.readFile(static_prefix + "dev/instance/entry/index.js", 'utf8')
			resolve(jsstr)
			return
		}

		else if (req.path === "/entry/index.css") {
			res.set('Content-Type', 'text/css; charset=UTF-8');
			const cssstr = await fs.promises.readFile(static_prefix + "dev/instance/entry/index.css", 'utf8')
			resolve(cssstr)
			return
		}

		else if (req.path === "/entry/sw.js") {
			res.set('Content-Type', 'application/javascript; charset=UTF-8');
			const swstr = await fs.promises.readFile(static_prefix + "dev/instance/entry/sw.js", 'utf8')
			resolve(swstr)
			return
		}
	}

	else if (env === "dist" || env === "gcloud") {

		if (req.path === "/entry/sw.js") {
			res.set('Content-Type', 'application/javascript; charset=UTF-8');
			const swstr = await fs.promises.readFile(static_prefix + "dist/instance/entry/sw.js", 'utf8')
			resolve(swstr)

		} else if (req.path === "/entry/index.html" || req.path === "/entry/" || req.path === "/" || req.path === "/index.html") {
			const htmlstr = await fs.promises.readFile(static_prefix + "dist/instance/entry/index.html", 'utf8')
			resolve(htmlstr)	
		}
	}
})




export default { runit }





