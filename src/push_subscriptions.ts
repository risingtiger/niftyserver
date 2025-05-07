

type str = string; //type int = number; type bool = boolean;

import { FieldValue } from "@google-cloud/firestore"
import { Firestore } from "firebase-admin/firestore";
import { getMessaging }  from "firebase-admin/messaging";




const Add_Subscription = (db:Firestore, fcm_token:str, user_email:str) => new Promise<number|null>(async (promise_res, _rej)=> {

    try {
        await db.collection("users").doc(user_email).update( {
            "fcm_token": fcm_token
        })
		promise_res(1)
    } 

    catch (err) { promise_res(null); }
})




const Remove_Subscription = (db:Firestore, user_email:str) => new Promise<number|null>(async (promise_res, _rej)=> {

    try {
        db.collection("users").doc(user_email).update( {
            "fcm_token": FieldValue.delete()
        })
		promise_res(1)
    } 

    catch (err) { promise_res(null); }
})




async function Send_Msg(db:Firestore, title:str, body:str) {

	return new Promise<number>(async (res, rej)=> {

		try {
			const all_user_docs = await db.collection("users").get()
			const all_users = all_user_docs.docs.map((d:any)=> d.data())

			const regtokens:any[] = []
			all_users.forEach((u:any)=> {
				if (u.fcm_token) {
					regtokens.push(u.notifications.fcm_token)
				}
			})

			const message  =  { data: { title, body }, tokens: regtokens }
			await getMessaging().sendEachForMulticast(message)

			res(1)
		} 

		catch (err) { rej(); }
	})
}




const Notifications = { Add_Subscription, Remove_Subscription, Send_Msg } 

export default Notifications


