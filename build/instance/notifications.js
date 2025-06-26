import { FieldValue } from "@google-cloud/firestore";
const GetSchedules = (db)=>new Promise(async (res, _rej)=>{
        const r = await db.collection('users').get().catch(()=>null);
        if (!r) {
            res(null);
            return;
        }
        const users = r.docs.map((m)=>({
                id: m.id,
                ...m.data()
            }));
        const pertinenet_user_data = users.map((m)=>{
            return {
                email: m.id,
                fname: m.fname,
                lname: m.lname,
                notifications: m.notifications,
                ts: m.ts
            };
        });
        res(pertinenet_user_data);
    });
const AddSchedule = (db, schedule)=>new Promise(async (res, _rej)=>{
        const userRef = db.collection('users').doc(schedule.user_email);
        const scheduleObj = {
            interval: schedule.interval,
            start: schedule.start,
            duration: schedule.duration,
            timezone_offset: schedule.timezone_offset
        };
        await userRef.update({
            "notifications.schedules": FieldValue.arrayUnion(scheduleObj)
        });
        res(1);
    });
const RemoveSchedule = (db, schedule)=>new Promise(async (res, _rej)=>{
        const userRef = db.collection('users').doc(schedule.user_email);
        const scheduleObj = {
            interval: schedule.interval,
            start: schedule.start,
            duration: schedule.duration,
            timezone_offset: schedule.timezone_offset
        };
        await userRef.update({
            "notifications.schedules": FieldValue.arrayRemove(scheduleObj)
        });
        res(1);
    });
const UpdateSchedule = (db, oldSchedule, newSchedule)=>new Promise(async (res, _rej)=>{
        const userRef = db.collection('users').doc(oldSchedule.user_email);
        const oldScheduleObj = {
            interval: oldSchedule.interval,
            start: oldSchedule.start,
            duration: oldSchedule.duration,
            timezone_offset: oldSchedule.timezone_offset
        };
        const newScheduleObj = {
            interval: newSchedule.interval,
            start: newSchedule.start,
            duration: newSchedule.duration,
            timezone_offset: newSchedule.timezone_offset
        };
        // Use a transaction to ensure atomicity when removing old and adding new schedule
        const transaction = await db.runTransaction(async (t)=>{
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) {
                throw new Error("User document does not exist!");
            }
            const userData = userDoc.data();
            const schedules = userData.notifications?.schedules || [];
            // Remove the old schedule and add the new one
            const updatedSchedules = schedules.filter((s)=>!(s.interval === oldScheduleObj.interval && s.start === oldScheduleObj.start && s.duration === oldScheduleObj.duration && s.timezone_offset === oldScheduleObj.timezone_offset));
            updatedSchedules.push(newScheduleObj);
            t.update(userRef, {
                "notifications.schedules": updatedSchedules
            });
            return true;
        });
        res(transaction ? 1 : null);
    });
const SetAlwaysNotify = (db, user_email, alwaysnotify)=>new Promise(async (res, _rej)=>{
        const userRef = db.collection('users').doc(user_email);
        const updateobj = {
            "notifications.alwaysnotify": alwaysnotify
        };
        await userRef.update(updateobj);
        res(1);
    });
const SetTag = (db, user_email, action, tag)=>new Promise(async (res, _rej)=>{
        const userRef = db.collection('users').doc(user_email);
        if (action === 'add') {
            await userRef.update({
                "notifications.tags": FieldValue.arrayUnion(tag)
            });
        } else if (action === 'remove') {
            await userRef.update({
                "notifications.tags": FieldValue.arrayRemove(tag)
            });
        }
        res(1);
    });
const Notifications = {
    GetSchedules,
    AddSchedule,
    RemoveSchedule,
    UpdateSchedule,
    SetAlwaysNotify,
    SetTag
};
export default Notifications;
