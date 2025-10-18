
import { promises as fs } from "fs";
import * as path from "path";



const SaveCSVReport = (csv_content_str: string, file_name: string) => new Promise<void>( async (resolve, _reject) => {

	const reports_dir = path.resolve(process.cwd(), "csvreports");

	try   { await fs.mkdir(reports_dir, { recursive: true }); }
	catch { throw new Error("failed to ensure csvreports directory"); }

	try   { await fs.writeFile(path.join(reports_dir, path.basename(file_name)), csv_content_str, "utf8"); }
	catch { throw new Error(`failed to write file in savecsvreport function`); }

	resolve();
})


const SaveCSVRow = (csvrowstr: string, filename: string) => new Promise<void>( async (resolve, _reject) => {

	const reports_dir = path.resolve(process.cwd(), "csvreports");

	try   { await fs.mkdir(reports_dir, { recursive: true }); }
	catch { throw new Error("failed to ensure csvreports directory"); }

	try   { await fs.appendFile(path.join(reports_dir, path.basename(filename)), `${csvrowstr}\n`, "utf8"); }
	catch { throw new Error(`failed to append file in savecsvrow function`); }

	resolve();
})


const GetSetOfExistingIds = (filename: string, column_index: number) => new Promise<Set<string>>( async (resolve, _reject) => {

	const reports_dir = path.resolve(process.cwd(), "csvreports");
	const file_path = path.join(reports_dir, path.basename(filename));

	let file_text = "";
	try   { file_text = await fs.readFile(file_path, "utf8"); }
	catch { resolve(new Set<string>()); return; }

	const set = new Set<string>();
	const rows = file_text.split(/\n/);

	for (const line of rows) {
		if (!line) continue;
		const cols = line.split(",");
		const v = cols[column_index].trim();
		if (!v) continue;
		set.add(v);
	}

	resolve(set);
})


const EnsureCSVFileReady = (filename: string, headerstr?: string) => new Promise<void>( async (resolve, _reject) => {

	const reports_dir = path.resolve(process.cwd(), "csvreports");
	const file_path = path.join(reports_dir, path.basename(filename));

	try   { await fs.mkdir(reports_dir, { recursive: true }); }
	catch { throw new Error("failed to ensure csvreports directory"); }

	let exists = false;
	try   { await fs.access(file_path); exists = true; }
	catch { exists = false; }

	if (exists) { resolve(); return; }

	if (headerstr && headerstr.length > 0) {
		try   { await fs.writeFile(file_path, `${headerstr}\n`, "utf8"); }
		catch { throw new Error("failed to create csv file with header"); }
	} else {
		try   { await fs.writeFile(file_path, "", "utf8"); }
		catch { throw new Error("failed to create empty csv file"); }
	}

	resolve();
})


const CSVUtils = { SaveCSVReport, SaveCSVRow, GetSetOfExistingIds, EnsureCSVFileReady }
export { CSVUtils }
