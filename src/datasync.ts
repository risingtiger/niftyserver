


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

    if (!db) {
        console.error("ProcessPendingSyncOperations: Firestore database instance is not available.");
        resolve(null); 
        return;
    }

    for (const op of operations) {
        try {
            const docRef = db.collection(op.target_store).doc(op.docId);

            if (op.operation_type === 'add') {
                const existingDocSnapshot = await docRef.get();
                
                if (existingDocSnapshot.exists()) {
                    const existingData = existingDocSnapshot.data() as { ts?: num } | undefined;

                    if (existingData && typeof existingData.ts === 'number' && existingData.ts > op.oldts) {
                        unsuccessfulOperations.push({ 
                            collection: op.target_store, 
                            id: op.docId, 
                            reason: `Skipped add: existing document ts (${existingData.ts}) > operation oldts (${op.oldts})` 
                        });
                        continue;
                    }

                    if (existingData && typeof existingData.ts === 'number' && op.ts <= existingData.ts) {
                        unsuccessfulOperations.push({ 
                            collection: op.target_store, 
                            id: op.docId, 
                            reason: `Skipped add: operation ts (${op.ts}) is not newer than existing ts (${existingData.ts})` 
                        });
                        continue;
                    }
                }
                const dataToAdd = { ...op.payload, ts: op.ts };
                await docRef.set(dataToAdd);

            } else if (op.operation_type === 'patch') {
                const existingDocSnapshot = await docRef.get();

                if (!existingDocSnapshot.exists()) {
                    unsuccessfulOperations.push({ 
                        collection: op.target_store, 
                        id: op.docId, 
                        reason: "Skipped patch: document does not exist" 
                    });
                    continue;
                }

                const existingData = existingDocSnapshot.data() as { ts?: num } | undefined;

                if (existingData && typeof existingData.ts === 'number' && existingData.ts > op.oldts) {
                    unsuccessfulOperations.push({ 
                        collection: op.target_store, 
                        id: op.docId, 
                        reason: `Skipped patch: existing document ts (${existingData.ts}) > operation oldts (${op.oldts})` 
                    });
                    continue;
                }
                
                const dataToPatch = { ...op.payload, ts: op.ts };
                await docRef.update(dataToPatch);

            } else if (op.operation_type === 'delete') {
                const existingDocSnapshot = await docRef.get();

                if (!existingDocSnapshot.exists()) {
                    continue; 
                }

                const existingData = existingDocSnapshot.data() as { ts?: num } | undefined;

                if (existingData && typeof existingData.ts === 'number' && existingData.ts > op.oldts) {
                    unsuccessfulOperations.push({ 
                        collection: op.target_store, 
                        id: op.docId, 
                        reason: `Skipped delete: existing document ts (${existingData.ts}) > operation oldts (${op.oldts})` 
                    });
                    continue;
                }
                
                await docRef.delete();
            }
        } catch (error: any) {
            console.error(`ProcessPendingSyncOperations: Error processing operation for ${op.target_store}/${op.docId}:`, error);
            unsuccessfulOperations.push({ 
                collection: op.target_store, 
                id: op.docId, 
                reason: `Firestore operation failed: ${error.message || String(error)}` 
            });
        }
    }

    resolve(unsuccessfulOperations);
})




const DataSync = { ProcessPendingSyncOperations }
export { DataSync }



