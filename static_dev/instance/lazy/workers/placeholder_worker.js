//type str = string; /*type bool = boolean; */ type int = number;
const __ = "YA";
self.onmessage = async (e)=>{
    switch(e.data.command){
        case "init":
            await SomeInit();
            self.postMessage("init done");
            break;
    }
};
async function SomeInit() {
    return new Promise((resolve, _reject)=>{
        resolve(true);
    });
}
