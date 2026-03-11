

import { Firestore } from "firebase-admin/firestore";
import { str } from './defs.js'



//import { getMessaging }  from "firebase-admin/messaging";




const Send = (messages:any[]) => new Promise<number|null>(async (res, _rej)=> {

    const url = 'https://api.mailjet.com/v3.1/send';
    const username = "2269ce42acdd34698b46f64ac7c66bde";

    let password = process.env["MAILJET_PASS"]

    const auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');

    const data = {
        Messages: messages
    }

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
        },
        body: JSON.stringify(data)
    })
		.then((response:any)=>  {
			if (response.status !== 200) { 
				console.error("Mailjet email failed" + response.status); res(0); 
			} else {
				res(1)
			}
		})
		.catch((_err:any)=> {
			res(null)
		})
})




async function SendNotification(db:Firestore, title:str, body:str, tags:str[]) {

	return new Promise<number|null>(async (promise_res, _rej)=> {

		const all_user_docs = await db.collection("users").get()
		const all_users = all_user_docs.docs.map((d:any)=> { return {...d.data(), id: d.id}; })
		const users_to_send_to:string[] = []

		all_users.forEach((u:any)=> {
			if (!u.notifications?.tags?.some((t:any)=> tags.includes(t))) { return; }

			if (u.notifications?.alwaysnotify) {
				users_to_send_to.push(u);
				return;
			}

			if (calculate_is_now_within_user_schedules(u)) {
				users_to_send_to.push(u);
			}
		})

		if (users_to_send_to.length !== 0) { 
			const tos:any[] = users_to_send_to.map((u:any)=> {
				return { Email: u.id, Name: u.fname + " " + u.lname }
			})

			const emailmsg = {
				From : { Email: "accounts@risingtiger.com", Name:  "Davis Hammon - FreshPure" },
				To   :  tos,
				Subject: title,
				TextPart: body,
				HTMLPart: ''
			}

			const r = await Send([emailmsg])
			if (!r) {   promise_res(null); return; }
		}

		promise_res(1)
	})
}


function calculate_is_now_within_user_schedules(user:any) {

	if (!user.notifications?.schedules) { return false; }

	const now = Math.floor(Date.now() / 1000);

	for (const schedule of user.notifications.schedules) {
		const user_local_now = now + schedule.timezone_offset;
		const seconds_into_interval = user_local_now % schedule.interval;
		const end = schedule.start + schedule.duration;

		if (end > schedule.interval) { // handles wrap-around intervals (e.g. Sat night to Sun morning)
			if (seconds_into_interval >= schedule.start || seconds_into_interval < (end % schedule.interval)) {
				return true;
			}
		} else {
			if (seconds_into_interval >= schedule.start && seconds_into_interval < end) {
				return true;
			}
		}
	}

	return false;
}





const Emailing = { Send, SendNotification }

export default Emailing;


