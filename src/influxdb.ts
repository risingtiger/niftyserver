

import { bool, str, num } from './defs.js'




type Series = { 
    field: str,
    tag: {name:str, val:str}
    points: {   
        val: num, 
        date: Date 
    }[]
}


const PWTT = process.env.PWT_INFLUXDB || ""
const XENT = process.env.XEN_INFLUXDB || ""




function Retrieve_Series(bucket:str, begins:num[], ends:num[], msrs:str[], fields:str[], tags:str[], intrv:num[]) { 

    return new Promise<Series[][]>(async (res, _rej) => {

        let token = "";

        if (bucket === "PWT")	   token = PWTT
        else if (bucket === "XEN") token = XENT

        const fluxstrs:str[] = []

        for(let i = 0; i < begins.length; i++) {
            fluxstrs.push(setcomplexfluxstr(i, bucket, msrs[i], fields[i], tags[i], begins[i], ends[i], intrv[i]))
        }

        const data = await callserver(fluxstrs.join("\n"), token)

        const parsed_data = parseit_for_series(begins.length, data, fields, tags)

        res(parsed_data) 
    })
}




function Retrieve_Points(bucket:str, begins:num[], ends:num[], msrs:str[], fields:str[], tags:str[]) {   

    return new Promise<Series[]>(async (res, _rej)=> { 

        let token = bucket === "PWT" ? PWTT : XENT

        let bodystr = ""

        for(let i = 0; i < begins.length; i++) {
            bodystr += `from(bucket: "${bucket}")
                        |> range(start: ${begins[i]}, stop: ${ends[i]})
                        |> filter(fn: (r) => r["_measurement"] == "${msrs[i]}")
                        |> filter(fn: (r) => ${get_fieldstr(fields[i])})
                        ${get_tagstr(tags[i])}
                        |> yield(name: "yield${ i }")
                        \n`
        }

        const data = await callserver(bodystr, token)

        const parsed_data = parseit_for_points(data)

        res(parsed_data) 
    })
}




function Retrieve_Medians(bucket:str, begins:num[], ends:num[], dur_amounts:num[], dur_units:str[], msrs:str[], fields:str[], tags:str[], aggregate_fn:str[]) {   

    return new Promise<{field:str,median:num}[][]>(async (res, _rej)=> { 

        let token = bucket === "PWT" ? PWTT : XENT

        let bodystr = ""

        for(let i = 0; i < begins.length; i++) {
            bodystr += `from(bucket: "${bucket}")
                        |> range(start: ${begins[i]}, stop: ${ends[i]})
                        |> filter(fn: (r) => r["_measurement"] == "${msrs[i]}")
                        |> filter(fn: (r) => ${get_fieldstr(fields[i])})
                        ${get_tagstr(tags[i])}
                        |> aggregateWindow(every: ${dur_amounts[i]}${dur_units[i]}, fn:${aggregate_fn[i]}, timeSrc:"_start")
                        |> yield(name: "yield${ i }")
                        \n`
        }

        const data = await callserver(bodystr, token)

        const yields = begins.map(_b=> []) as {field:str,median:num}[][]

        data.split("\n").forEach((r:str)=> {
            if (r.includes("result") || r.length < 20)   return

            const c = r.split(",");
            const index = Number(c[1].substring(5))
            const field = c[5]
            const median = Number(c[8])
            yields[index].push({field, median})
        })

        res(yields) 
    })
}




function Retrieve(bucket:str, fluxstr:str) {   return new Promise<str>(async (res, _rej)=> {
    let token = bucket === "PWT" ? PWTT : XENT
    const r = await callserver(fluxstr, token)
    res(r)
})}






function setcomplexfluxstr(index:num, bucket:str, msr: str, fields:str, tags:str, begin:num, end:num, intrv:num) {   

    const fieldstr = get_fieldstr(fields)
    const tagstr = get_tagstr(tags)

    return `from(bucket: "${bucket}")
                    |> range(start: ${begin}, stop: ${end})
                    |> filter(fn: (r) => r["_measurement"] == "${msr}")
                    |> filter(fn: (r) => ${fieldstr})
                    ${tagstr}
                    |> aggregateWindow(every: ${intrv}s, fn:mean, createEmpty: true, timeSrc:"_start")
                    |> yield(name: "index${index}")
                    \n`
}




function callserver(fluxstr:str, token:str) {   return new Promise<str>(async (res, _rej)=> {

    const obj:any = {
        method: "POST",
        headers: {
            'Authorization': `Token ${token}`,
            'Content-type':  'application/vnd.flux',
            'Accept':		 'application/csv'
        },
        body: fluxstr
    }

    const response = await fetch(`https://us-central1-1.gcp.cloud2.influxdata.com/api/v2/query?org=accounts@risingtiger.com`, obj)
    const d = await response.text()

    if (d.length < 20) {   res("");    } else {    res(d);   }
})}




function parseit_for_series(queries_length:num, data_str:str, fields:str[], tags:str[]) : Series[][] {

    const queries_list:Series[][] = []
    let   last_tag_name = ""

    for(let i = 0; i < queries_length; i++) {
        queries_list.push([])
        const q = queries_list[i]

        fields[i].split(',').forEach((f:str)=> {
            tags[i].split(',').forEach((t:str)=> {
                const tagobj = t.split(':')
                q.push({ field: f, tag: { name: tagobj[0], val: tagobj[1] }, points: [] })
            })
        })
    }

    data_str.split("\n").forEach((data_row:str)=> {
        if (data_row.length < 20)
            return

        const c = data_row.split(",");

        if (c[1] === 'result') {
            last_tag_name = c[9] ? c[9].trim() : ""
            return
        }

        const yieldstr = c[1]
        const fieldn   = c[7]
        const tag = c[9] ? { name: last_tag_name, val: c[9].trim() } : null
        if (!tag) return

        const date = new Date(c[5])
        const val = c[6] ? Number(c[6]) : 0

        const query_index = Number(yieldstr.substring(5))

        const query = queries_list[query_index]
        if (!query)   
            return null

        let series = query.find(s=> s.field === fieldn && s.tag.name === tag.name && s.tag.val === tag.val)
        if (!series)
            return null

        series.points.push({val, date})
    })

    return queries_list
}




function parseit_for_points(data_str:str) : any[] {

    const points_list:any[]= []

    data_str.split("\n").forEach((data_row:str)=> {
        if (data_row.length < 20)
            return

        const c = data_row.split(",");

        if (c[1] === 'result') {
            return
        }

        const tag  = c[9]?.trim()
        const date = new Date(c[5])

        points_list.push({field:c[7],tag,val:c[6],date})
    })

    return points_list
}




function get_fieldstr(fields_str:str) {

    const fields_split = fields_str.split(",")
    let fieldstr = "";

    for(let i = 0; i < fields_split.length; i++) {
        fieldstr += `r["_field"] == "${fields_split[i]}" or `
    }
    fieldstr = fieldstr.substring(0, fieldstr.length-4)

    return fieldstr
}




function get_tagstr(tags_str:str) {

    let tagstr = ""
    const tags_split = tags_str.split(",")

    for(let i = 0; i < tags_split.length; i++) {
        const tag_split = tags_split[i].split(":")
        tagstr += `r["${tag_split[0]}"] == "${tag_split[1]}" or `
    }

    tagstr = tagstr.substring(0, tagstr.length-4)
    tagstr = tagstr ? `|> filter(fn: (r) => ` + tagstr + ')' : ''

    return tagstr
}





const InfluxDB = { Retrieve_Series, Retrieve_Points, Retrieve_Medians, Retrieve }
export { InfluxDB }


