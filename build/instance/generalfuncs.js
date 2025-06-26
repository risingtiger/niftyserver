async function General_Funcs_Get_Particle_Chips_Of_All_Accounts(secrets_client) {
    return new Promise(async (res, _rej)=>{
        const llc = await General_Funcs_Get_Particle_Chips_Of_One_Account(secrets_client, "ACCOUNTS_RISINGTIGER_COM");
        const east = await General_Funcs_Get_Particle_Chips_Of_One_Account(secrets_client, "RFS_RISINGTIGER_COM");
        const west = await General_Funcs_Get_Particle_Chips_Of_One_Account(secrets_client, "WEST_PWT_RISINGTIGER_COM");
        const nat = await General_Funcs_Get_Particle_Chips_Of_One_Account(secrets_client, "NEWSLETTERS_RISINGTIGER_COM");
        llc.forEach((d)=>d.account = "llc");
        east.forEach((d)=>d.account = "east");
        west.forEach((d)=>d.account = "west");
        nat.forEach((d)=>d.account = "nat");
        return res({
            llc,
            east,
            west
        });
    });
}
async function General_Funcs_Get_Particle_Chips_Of_One_Account(secrets_client, particle_account) {
    return new Promise(async (res, _rej)=>{
        const particleAPIKey = await General_Funcs_Get_Secrets_Key(secrets_client, "PA_" + particle_account);
        const response = await fetch('https://api.particle.io/v1/devices?access_token=' + particleAPIKey, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        let chips = await response.json();
        return res(chips);
    });
}
const General_Funcs_Get_Particle_Device_Info = (particle_account, particle_id, secrets_client)=>{
    return new Promise(async (res, _rej)=>{
        let token = await General_Funcs_Get_Secrets_Key(secrets_client, "pa_" + particle_account);
        const details_req = await fetch(`https://api.particle.io/v1/devices/${particle_id}?access_token=${token}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const details = await details_req.json();
        const return_details = {
            name: details.name,
            last_heard: details.last_heard,
            last_handshake_at: details.last_handshake_at,
            online: details.online,
            system_firmware_version: details.system_firmware_version,
            firmware_version: details.firmware_version
        };
        res(return_details);
    });
};
async function General_Funcs_Get_All_Machines(db) {
    return new Promise(async (res, _rej)=>{
        const machinesCollection = db.collection("machines");
        const allMachineDocs = await machinesCollection.get();
        const machines = allMachineDocs.docs.map((m)=>({
                id: m.id,
                ...m.data()
            }));
        return res(machines);
    });
}
function General_Funcs_Get_Secrets_Key(_secretsClient, nameP) {
    return new Promise(async (resp)=>{
        const g = process.env[nameP];
        resp(g);
    /*
        let n = `projects/purewatertech/secrets/${nameP}/versions/latest`;
        const [accessResponse] = await secretsClient.accessSecretVersion({ name:n });
        resp(accessResponse.payload.data.toString('utf8'));
        */ });
}
export { General_Funcs_Get_Particle_Chips_Of_All_Accounts, General_Funcs_Get_Particle_Chips_Of_One_Account, General_Funcs_Get_Particle_Device_Info, General_Funcs_Get_All_Machines, General_Funcs_Get_Secrets_Key };
