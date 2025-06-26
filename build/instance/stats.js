const Yar = "dd3d3";
const FILENAME = "./statuses_stats.txt";
async function Get_All(req, res, appversion) {
    return new Promise(async (result, _rej)=>{
        res.setHeader('Appversion', appversion);
        res.status(200).send(JSON.stringify(""));
    /*
    const particle_chips = await General_Funcs_Get_Particle_Chips_Of_All_Accounts(secrets_client) 
    const machines = await General_Funcs_Get_All_Machines(db)

    const stats: Stats_T = {
      particle_chips_count: particle_chips.llc.length + particle_chips.east.length + particle_chips.west.length,
      particle_llc_chips_count: particle_chips.llc.length,
      particle_east_chips_count: particle_chips.east.length,
      particle_west_chips_count: particle_chips.west.length,
      machines_count: machines.length
    }

    res(stats)

  })

    */ });
}
/*
function Stats_Get_All_MachineStatusStats(db:any) {   return new Promise(async (res, _rej)=> {

    const machines = await General_Funcs_Get_All_Machines(db)

    let index = 0

    writeFileSync(FILENAME, `chip,storename,statuscount\n`)

    next()


    async function next() {

        const m = machines[index]

        const statuses_stat = await Stats_Get_MachineStatusStats(db, m.id) as any

        appendFileSync(FILENAME, `${m.chip},${m.store.name},${statuses_stat.count}\n`)
        index++

        if (index < machines.length-1) { 
            setTimeout(async ()=> {   next();   }, 1200)
        }

        else { 
            res({job: "done"}) 
        }
    }
})}
*/ function Stats_Get_MachineStatusStats(db, machine_id) {
    return new Promise(async (res, _rej)=>{
        const machine_statuses = db.collection(`machines/${machine_id}/statuses`);
        const count_snapshot = await machine_statuses.count().get();
        return res({
            count: count_snapshot.data().count
        });
    });
}
const Stats = {
    Get_All
};
export default Stats;
