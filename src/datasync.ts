


type str = string; type int = number; type num = number; type bool = boolean;


type OperationTypeT = 'add' | 'patch' | 'delete';
type PendingSyncOperationT = {
    id: str; 
    operation_type: OperationTypeT;
    target_store: str;
    docId: str;
    ts: num; 
    oldts: num; 
    payload: any;   
};


const ProcessPendingSyncOperations = (db:any, operations:PendingSyncOperationT[]) => new Promise<num|null>(async (res, rej) => {

})




const DataSync = { ProcessPendingSyncOperations }
export { DataSync }



