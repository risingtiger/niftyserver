async function Misc_Add() {
    return new Promise(async (res, _rej)=>{
        let token = process.env.PWT_INFLUXDB;
        const obj = {
            method: "POST",
            headers: {
                'Authorization': `Token ${token}`,
                'Content-type': 'application/vnd.flux',
                'Accept': 'application/csv'
            },
            body: `MTR,id=1100010 Store=30,Pure1=80 1716463920`
        };
        const r = await fetch(`https://us-central1-1.gcp.cloud2.influxdata.com/api/v2/write?org=accounts@risingtiger.com&bucket=PWT&precision=s`, obj);
        const rd = await r.text();
        console.log(rd);
    });
}
const Misc_Delete = async ()=>{
    let token = process.env.PWT_INFLUXDB;
    const obj = {
        method: "POST",
        headers: {
            'Authorization': `Token ${token}`,
            'Content-type': 'application/vnd.flux',
            'Accept': 'application/csv'
        },
        body: `{ 
      "start": "2023-01-02T23:00:00Z", 
      "stop": "2023-03-31T14:00:00Z",
      "predicate": "_measurement=MTR AND chip=0001"
    }`
    };
    fetch(`https://us-central1-1.gcp.cloud2.influxdata.com/api/v2/delete?org=accounts@risingtiger.com&bucket=PWT`, obj).then((response)=>response.text()).then((_data)=>{
    //
    }).catch((er)=>{
        console.error(er);
    });
};
const Admin_InfluxDB = {
    Misc_Add,
    Misc_Delete
};
export default Admin_InfluxDB;
