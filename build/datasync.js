const ProcessPendingSyncOperations = (db, operations)=>new Promise(async (resolve, _reject)=>{
        const unsuccessfulOperations = [];
        for (const op of operations){
            try {
                if (op.operation_type === 'patch' || op.operation_type === 'delete') {
                    const existing_record_snapshot = await db.collection(op.target_store).doc(op.docId).get();
                    const existing_record = existing_record_snapshot.data();
                    if (existing_record.ts > op.oldts) {
                        push_to_unsuccessful_operations(unsuccessfulOperations, op, `Skipped ${op.operation_type}: existing document ts (${existing_record.ts}) > operation oldts (${op.oldts})`);
                        continue;
                    }
                }
                if (op.operation_type === 'add' || op.operation_type === 'patch') {
                    await db.collection(op.target_store).doc(op.docId).set({
                        ...op.payload,
                        ts: op.ts
                    });
                } else if (op.operation_type === 'delete') {
                    await db.collection(op.target_store).doc(op.docId).delete();
                }
            } catch (error) {
                push_to_unsuccessful_operations(unsuccessfulOperations, op, `Failed to ${op.operation_type} document: ${error}`);
            }
        }
        resolve(unsuccessfulOperations);
    });
const push_to_unsuccessful_operations = (unsuccessfulOperations, op, reason)=>{
    unsuccessfulOperations.push({
        collection: op.target_store,
        id: op.docId,
        reason
    });
};
const DataSync = {
    ProcessPendingSyncOperations
};
export { DataSync };
