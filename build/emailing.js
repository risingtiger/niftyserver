//import { getMessaging }  from "firebase-admin/messaging";
const Send = (messages)=>new Promise(async (res, _rej)=>{
        const url = 'https://api.mailjet.com/v3.1/send';
        const username = "2269ce42acdd34698b46f64ac7c66bde";
        let password = process.env["MAILJET_PASS"];
        const auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
        const data = {
            Messages: messages
        };
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': auth
            },
            body: JSON.stringify(data)
        }).then((response)=>{
            if (response.status !== 200) {
                console.error("Mailjet email failed" + response.status);
                res(0);
            } else {
                res(1);
            }
        }).catch((_err)=>{
            res(null);
        });
    });
async function SendNotification(db, title, body, tags) {
    return new Promise(async (promise_res, _rej)=>{
        const all_user_docs = await db.collection("users").get();
        const all_users = all_user_docs.docs.map((d)=>{
            return {
                ...d.data(),
                id: d.id
            };
        });
        const users_to_send_to = [];
        all_users.forEach((u)=>{
            if (u.notifications.tags.some((t)=>tags.includes(t))) {
                users_to_send_to.push(u);
            }
        });
        if (users_to_send_to.length !== 0) {
            const tos = users_to_send_to.map((u)=>{
                return {
                    Email: u.id,
                    Name: u.fname + " " + u.lname
                };
            });
            const emailmsg = {
                From: {
                    Email: "accounts@risingtiger.com",
                    Name: "Davis Hammon - FreshPure"
                },
                To: tos,
                Subject: title,
                TextPart: body,
                HTMLPart: ''
            };
            const r = await Send([
                emailmsg
            ]);
            if (!r) {
                promise_res(null);
                return;
            }
        }
        promise_res(1);
    });
}
const Emailing = {
    Send,
    SendNotification
};
export default Emailing;
