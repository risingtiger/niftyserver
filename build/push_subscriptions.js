import { FieldValue } from "@google-cloud/firestore";
import { getMessaging } from "firebase-admin/messaging";
const Add_Subscription = (db, fcm_token, user_email)=>new Promise(async (promise_res, _rej)=>{
        try {
            await db.collection("users").doc(user_email).update({
                "fcm_token": fcm_token
            });
            promise_res(1);
        } catch (err) {
            promise_res(null);
        }
    });
const Remove_Subscription = (db, user_email)=>new Promise(async (promise_res, _rej)=>{
        try {
            db.collection("users").doc(user_email).update({
                "fcm_token": FieldValue.delete()
            });
            promise_res(1);
        } catch (err) {
            promise_res(null);
        }
    });
async function Send_Msg(db, title, body) {
    return new Promise(async (res, rej)=>{
        try {
            const all_user_docs = await db.collection("users").get();
            const all_users = all_user_docs.docs.map((d)=>d.data());
            const regtokens = [];
            all_users.forEach((u)=>{
                if (u.fcm_token) {
                    regtokens.push(u.notifications.fcm_token);
                }
            });
            const message = {
                data: {
                    title,
                    body
                },
                tokens: regtokens
            };
            await getMessaging().sendEachForMulticast(message);
            res(1);
        } catch (err) {
            rej();
        }
    });
}
const Notifications = {
    Add_Subscription,
    Remove_Subscription,
    Send_Msg
};
export default Notifications;
