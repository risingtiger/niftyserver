
export type str = string; export type num = number; export type bool = boolean;

export type GenericRowT = { [key:string]: any }

export const enum SSETriggersE { FIRESTORE, FIRESTORE_DOC_ADD, FIRESTORE_DOC_PATCH, FIRESTORE_DOC_DELETE, FIRESTORE_COLLECTION, CUSTOM }

export type ServerMainsT = {
	app:any, 
	db:any, 
	appversion:number, 
	sheets:any, 
	gemini:any, 
	push_subscriptions:any, 
	firestore:any, 
	influxdb:any, 
	emailing:any,
	sse:any,
	validate_request:any
};

export type ServerInstanceT = {
	INSTANCEID:string, 
	PROJECTID:string, 
	KEYJSONFILE:string, 
	IDENTITY_PLATFORM_API:string,
	SHEETS_KEYJSONFILE:string, 
	Set_Server_Mains:(m:ServerMainsT)=>void, 
	Set_Routes:()=>void,
}




