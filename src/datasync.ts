


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

type UnsuccessfulOperationInfo = {
    collection: str;
    id: str; // This refers to op.docId
    reason: str;
};


const ProcessPendingSyncOperations = (db:any, operations:PendingSyncOperationT[]) => new Promise<UnsuccessfulOperationInfo[] | null>(async (resolve, _reject) => {
    const unsuccessfulOperations: UnsuccessfulOperationInfo[] = [];

    for (const op of operations) {

		try {
			if (op.operation_type === 'patch' || op.operation_type === 'delete') {
				const existing_record_snapshot = await db.collection(op.target_store).doc(op.docId).get();
				const existing_record = existing_record_snapshot.data()

				if (existing_record.ts > op.oldts) {
					push_to_unsuccessful_operations(unsuccessfulOperations, op, `Skipped ${op.operation_type}: existing document ts (${existing_record.ts}) > operation oldts (${op.oldts})`);
					continue;
				}
			}

			if (op.operation_type === 'add' || op.operation_type === 'patch') {
				await db.collection(op.target_store).doc(op.docId).set({ ...op.payload, ts: op.ts });
			}
			else if (op.operation_type === 'delete') {
				await db.collection(op.target_store).doc(op.docId).delete();
			}
		} 
		catch (error) {
			push_to_unsuccessful_operations(unsuccessfulOperations, op, `Failed to ${op.operation_type} document: ${error}`);
		}
    }

    resolve(unsuccessfulOperations);
})




const push_to_unsuccessful_operations = (unsuccessfulOperations: UnsuccessfulOperationInfo[], op: PendingSyncOperationT, reason: str) => {
	unsuccessfulOperations.push({ 
		collection: op.target_store, 
		id: op.docId, 
		reason 
	});
}



const DataSync = { ProcessPendingSyncOperations }
export { DataSync }



