import "../../../defs.js";
const WEEK_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];
const SECONDS_IN_WEEK = 604800; // 7 days * 24 hours * 60 minutes * 60 seconds
const SECONDS_IN_DAY = 86400; // 24 hours * 60 minutes * 60 seconds
const ATTRIBUTES = {
    propa: ""
};
class VNotifications extends HTMLElement {
    m = {
        all_users: [],
        geozones: [
            {
                name: "geozone_1",
                display: "Zone 1",
                zone: 1
            },
            {
                name: "geozone_2",
                display: "Zone 2",
                zone: 2
            },
            {
                name: "geozone_3",
                display: "Zone 3",
                zone: 3
            },
            {
                name: "geozone_4",
                display: "Zone 4",
                zone: 4
            },
            {
                name: "geozone_5",
                display: "Zone 5",
                zone: 5
            },
            {
                name: "geozone_6",
                display: "Zone 6",
                zone: 6
            },
            {
                name: "geozone_7",
                display: "Zone 7",
                zone: 7
            },
            {
                name: "geozone_8",
                display: "Zone 8",
                zone: 8
            },
            {
                name: "geozone_9",
                display: "Zone 9",
                zone: 9
            },
            {
                name: "geozone_10",
                display: "Zone 10",
                zone: 10
            }
        ]
    };
    a = {
        ...ATTRIBUTES
    };
    s = {
        all_active_users: [],
        all_inactive_users: [],
        editing_detail: null,
        editing_schedule: null,
        show_schedule_addedit: 0,
        show_detailedit: 0
    };
    shadow;
    static get observedAttributes() {
        return Object.keys(ATTRIBUTES);
    }
    constructor(){
        super();
        this.shadow = this.attachShadow({
            mode: 'open'
        });
    }
    async connectedCallback() {
        await $N.CMech.ViewConnectedCallback(this);
        this.dispatchEvent(new Event('hydrated'));
    }
    async attributeChangedCallback(name, oldval, newval) {
        $N.CMech.AttributeChangedCallback(this, name, oldval, newval);
    }
    disconnectedCallback() {
        $N.CMech.ViewDisconnectedCallback(this);
    }
    kd(loadeddata, loadstate) {
        if (loadstate === "initial" || loadstate === "datachanged") {
            this.m.all_users = loadeddata.get({
                type: 2,
                path: "users_info_for_notifications"
            });
        }
        this.fleshitout();
    }
    sc(state_changes = {}) {
        this.s = Object.assign(this.s, state_changes);
        render(this.template(this.s, this.m), this.shadow);
    }
    fleshitout() {
        this.s.all_active_users = this.m.all_users.filter((user)=>user.notifications.schedules.length > 0).sort((a, b)=>{
            const lastNameComparison = a.lname.localeCompare(b.lname);
            return lastNameComparison !== 0 ? lastNameComparison : a.fname.localeCompare(b.fname);
        });
        this.s.all_inactive_users = this.m.all_users.filter((user)=>user.notifications.schedules.length === 0).sort((a, b)=>{
            const lastNameComparison = a.lname.localeCompare(b.lname);
            return lastNameComparison !== 0 ? lastNameComparison : a.fname.localeCompare(b.fname);
        });
        this.s.all_active_users.forEach((u)=>u.notifications.schedules = u.notifications.schedules.sort((a, b)=>a.start - b.start));
    }
    show_detailedit(e) {
        const email = e.currentTarget.parentElement.parentElement.dataset.active_user_email;
        const index = this.m.all_users.findIndex((user)=>user.email === email);
        this.s.editing_detail = {
            user_email: this.m.all_users[index].email,
            name: this.m.all_users[index].fname + " " + this.m.all_users[index].lname,
            alwaysnotify: this.m.all_users[index].notifications.alwaysnotify,
            tags: this.m.all_users[index].notifications.tags
        };
        this.s.show_detailedit = 1;
        this.sc();
    }
    show_add_schedule_interface(e) {
        let email = e.currentTarget.parentElement.parentElement.dataset.active_user_email;
        if (!email) {
            email = e.currentTarget.parentElement.parentElement.dataset.inactive_user_email;
        }
        this.s.editing_schedule = {
            user_email: email,
            index: null,
            userfriendly: {
                from: {
                    day: 0,
                    time: "00:00"
                },
                to: {
                    day: 0,
                    time: "00:00"
                },
                timezone_offset: 6
            }
        };
        this.s.show_schedule_addedit = 1;
        this.sc();
    }
    show_edit_schedule_interface(e) {
        const schedule_index = Number(e.currentTarget.parentElement.parentElement.dataset.index);
        const email = e.currentTarget.parentElement.parentElement.parentElement.parentElement.dataset.active_user_email;
        let schedule_to_edit = this.s.all_active_users.find((user)=>user.email === email).notifications.schedules[schedule_index];
        schedule_to_edit = JSON.parse(JSON.stringify(schedule_to_edit));
        const schedule_userfriendly = convert_schedule_to_userfriendly(schedule_to_edit);
        this.s.editing_schedule = {
            userfriendly: schedule_userfriendly,
            user_email: email,
            index: schedule_index
        };
        this.s.show_schedule_addedit = 1;
        this.sc();
    }
    cancel_schedule_addedit() {
        this.s.show_schedule_addedit = 2;
        this.sc();
    }
    save_schedule = (is_add, e)=>new Promise(async (res)=>{
            const user = this.m.all_users.find((u)=>u.email === this.s.editing_schedule.user_email);
            const from = this.s.editing_schedule.userfriendly.from;
            const to = this.s.editing_schedule.userfriendly.to;
            const from_total_seconds = from.day * SECONDS_IN_DAY + hhmm_to_seconds(from.time);
            const to_total_seconds = to.day * SECONDS_IN_DAY + hhmm_to_seconds(to.time);
            if (to_total_seconds <= from_total_seconds) {
                alert("End time must be later than start time.");
                e.detail.resolved();
                res();
                return;
            }
            const schedule_userfriendly = {
                from,
                to,
                timezone_offset: this.s.editing_schedule.userfriendly.timezone_offset
            };
            const new_schedule_data = convert_userfriendly_to_schedule(schedule_userfriendly);
            const api_url = is_add ? '/api/pwt/notifications/add_user_schedule' : '/api/pwt/notifications/update_user_schedule';
            let schedule_payload;
            if (is_add) {
                schedule_payload = {
                    newSchedule: {
                        interval: new_schedule_data.interval,
                        start: new_schedule_data.start,
                        duration: new_schedule_data.duration,
                        timezone_offset: new_schedule_data.timezone_offset,
                        user_email: this.s.editing_schedule.user_email
                    }
                };
            } else {
                const original_schedule = user.notifications.schedules[this.s.editing_schedule.index];
                schedule_payload = {
                    oldSchedule: {
                        interval: original_schedule.interval,
                        start: original_schedule.start,
                        duration: original_schedule.duration,
                        timezone_offset: original_schedule.timezone_offset,
                        user_email: user.email
                    },
                    newSchedule: {
                        interval: new_schedule_data.interval,
                        start: new_schedule_data.start,
                        duration: new_schedule_data.duration,
                        timezone_offset: new_schedule_data.timezone_offset,
                        user_email: user.email
                    }
                };
            }
            const httpopts = {
                method: "POST",
                body: JSON.stringify(schedule_payload)
            };
            const r = await $N.FetchLassie(api_url, httpopts, {});
            if (!r.ok) {
                res();
                return;
            }
            if (is_add) {
                user.notifications.schedules.push(new_schedule_data);
            } else {
                user.notifications.schedules[this.s.editing_schedule.index] = new_schedule_data;
            }
            this.s.show_schedule_addedit = 2;
            e.detail.resolved();
            this.fleshitout();
            this.sc();
            res();
        });
    add_schedule = (e)=>this.save_schedule(true, e);
    update_schedule = (e)=>this.save_schedule(false, e);
    async remove_schedule(e) {
        const schedule_index = Number(e.currentTarget.parentElement.parentElement.dataset.index);
        const user_email = e.currentTarget.parentElement.parentElement.parentElement.parentElement.dataset.active_user_email;
        const user = this.m.all_users.find((u)=>u.email === user_email);
        const schedule_to_remove = user.notifications.schedules[schedule_index];
        const payload = {
            oldSchedule: {
                interval: schedule_to_remove.interval,
                start: schedule_to_remove.start,
                duration: schedule_to_remove.duration,
                timezone_offset: schedule_to_remove.timezone_offset,
                user_email: user_email
            }
        };
        const httpopts = {
            method: "POST",
            body: JSON.stringify(payload)
        };
        const r = await $N.FetchLassie('/api/pwt/notifications/remove_user_schedule', httpopts, {});
        if (r.ok) {
            user.notifications.schedules.splice(schedule_index, 1);
            this.sc();
        } else {
            alert("Failed to remove schedule.");
        }
    }
    update_schedule_from(part, field, value) {
        let fromday = this.s.editing_schedule?.userfriendly.from.day;
        let fromtime = this.s.editing_schedule?.userfriendly.from.time;
        let today = this.s.editing_schedule?.userfriendly.to.day;
        let totime = this.s.editing_schedule?.userfriendly.to.time;
        if (part === 'from') {
            if (field === 'day') fromday = Number(value);
            else if (field === 'time') fromtime = String(value);
        } else if (part === 'to') {
            if (field === 'day') today = Number(value);
            else if (field === 'time') totime = String(value);
        }
        const from_total_seconds = fromday * SECONDS_IN_DAY + hhmm_to_seconds(fromtime);
        const to_total_seconds = today * SECONDS_IN_DAY + hhmm_to_seconds(totime);
        if (to_total_seconds < from_total_seconds) {
            today = fromday;
            totime = fromtime;
        }
        this.s.editing_schedule.userfriendly.from.day = fromday;
        this.s.editing_schedule.userfriendly.from.time = fromtime;
        this.s.editing_schedule.userfriendly.to.day = today;
        this.s.editing_schedule.userfriendly.to.time = totime;
        this.sc();
        this.shadow.querySelector('#time-to').value = this.s.editing_schedule.userfriendly.to.time;
    }
    async toggle_always_notify(e) {
        const user_email = this.s.editing_detail?.user_email;
        const alwaysnotify = e.detail.newval === "true" ? true : false;
        const payload = {
            user_email,
            alwaysnotify
        };
        const httpopts = {
            method: "POST",
            body: JSON.stringify(payload)
        };
        await $N.FetchLassie('/api/pwt/notifications/set_user_alwaysnotify', httpopts, {});
        this.m.all_users.find((u)=>u.email === user_email).notifications.alwaysnotify = alwaysnotify;
        this.fleshitout();
        this.sc();
    }
    async toggle_geozone(e) {
        const user_email = this.s.editing_detail?.user_email;
        const geozone_index = Number(e.currentTarget.dataset.index);
        const geozone = this.m.geozones[geozone_index];
        const user = this.m.all_users.find((u)=>u.email === user_email);
        const tag = geozone.name;
        const has_tag = user.notifications.tags.includes(tag);
        const action = has_tag ? 'remove' : 'add';
        const payload = {
            user_email,
            action,
            tag
        };
        const httpopts = {
            method: "POST",
            body: JSON.stringify(payload)
        };
        const r = await $N.FetchLassie('/api/pwt/notifications/set_user_tag', httpopts, {});
        if (!r.ok) {
            return;
        }
        if (action === 'add') {
            user.notifications.tags.push(tag);
        } else {
            const tag_index = user.notifications.tags.indexOf(tag);
            if (tag_index !== -1) {
                user.notifications.tags.splice(tag_index, 1);
            }
        }
        this.fleshitout();
        this.sc();
    }
    renderhelp_date_time_point(what, point) {
        const timeValue = point.time || "00:00"; // Default to 00:00 if undefined                                                                                                                
        return html`                                                                                                                                                                             
            <div class="schedule-section ${what}-section">                                                                                                                                       
                <h3 class="section-header">${what === 'from' ? 'From' : 'To'}</h3>                                                                                                               

                <div class="schedule-row day-row">                                                                                                                                               
                    <label class="row-label">Day:</label>                                                                                                                                        
                    <div class="weekdays-radio">                                                                                                                                                 
                        ${WEEK_DAYS.map((day, index)=>html`                                                                                                                                    
                            <label class="weekday-label ${index === point.day ? 'selected' : ''}" title="${day}">                                                                                
                                <input                                                                                                                                                           
                                    type="radio"                                                                                                                                                 
                                    name="weekday-${what}"                                                                                                                                       
                                    value="${index}"                                                                                                                                             
                                    .checked="${point.day === index}"                                                                                                                            
                                    @change="${()=>this.update_schedule_from(what, 'day', index)}"                                                                                             
                                >                                                                                                                                                                
                                ${day.substring(0, 2)}                                                                                                                                           
                            </label>                                                                                                                                                             
                        `)}                                                                                                                                                                      
                    </div>                                                                                                                                                                       
                </div>                                                                                                                                                                           

                <div class="schedule-row time-row">                                                                                                                                              
                    <label class="row-label">Time:</label>                                                                                                                                       
                    <input                                                                                                                                                                       
                        id="time-${what}"                                                                                                                                                        
                        type="time"                                                                                                                                                              
                        class="time-input"                                                                                                                                                       
                        .value="${timeValue}"                                                                                                                                                    
                        step="900"                                                                                                                                                               
                        @change="${(e)=>{
            this.update_schedule_from(what, 'time', e.target.value);
        }}"                                                                                                                                                                      
                        title="Select time (24-hour format)"                                                                                                                                     
                    />                                                                                                                                                                           
                </div>                                                                                                                                                                           
            </div>                                                                                                                                                                               
        `;
    }
    renderhelp_schedule_userfriendly(sch) {
        const converted = convert_schedule_to_userfriendly(sch);
        const from = converted.from;
        const to = converted.to;
        const fromTime = convert_to_12hour(from.time);
        const toTime = convert_to_12hour(to.time);
        return Lit_UnsafeHtml(`
			<span class="from_day">${WEEK_DAYS[from.day].substring(0, 3)}</span>
			<span class="from_time">${fromTime}</span>
			<span class="separator">-</span>
			<span class="to_day">${WEEK_DAYS[to.day].substring(0, 3)}</span>
			<span class="to_time">${toTime}</span>
		`);
    }
    template = (_s, _m)=>{
        return html`{--css--}{--html--}`;
    };
}
customElements.define('v-notifications', VNotifications);
function convert_to_12hour(time24) {
    if (!time24 || !time24.includes(':')) return time24;
    const [hours, minutes] = time24.split(':').map((num)=>parseInt(num, 10));
    if (isNaN(hours) || isNaN(minutes)) return time24;
    const period = hours >= 12 ? 'pm' : 'am';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
    return `${hours12}:${minutes.toString().padStart(2, '0')}${period}`;
}
function hhmm_to_seconds(time_str) {
    const parts = time_str.split(':');
    if (parts.length !== 2) {
        console.error("Invalid time string format (HH:MM):", time_str);
        return 0;
    }
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.error("Invalid time values in string (HH:MM):", time_str);
        return 0;
    }
    return hours * 3600 + minutes * 60;
}
function seconds_to_hhmm(daytimeseconds) {
    const total_minutes = Math.floor(daytimeseconds / 60);
    const hours = Math.floor(total_minutes / 60);
    const minutes = total_minutes % 60;
    const hours_str = String(hours).padStart(2, '0');
    const minutes_str = String(minutes).padStart(2, '0');
    return `${hours_str}:${minutes_str}`;
}
function convert_schedule_to_userfriendly(schedule) {
    const { start, duration, timezone_offset } = schedule;
    const from = convert_utc_seconds_to_day_time(start, timezone_offset);
    const to = convert_utc_seconds_to_day_time(start + duration, timezone_offset);
    return {
        from,
        to,
        timezone_offset
    };
}
function convert_utc_seconds_to_day_time(start, timezone_offset) {
    const local_seconds = start - timezone_offset * 3600;
    const local_day = Math.floor(local_seconds / SECONDS_IN_DAY);
    const local_time_seconds = Math.floor(local_seconds % SECONDS_IN_DAY);
    return {
        day: local_day,
        time: seconds_to_hhmm(local_time_seconds)
    };
}
function convert_day_time_to_utc_seconds(day, time_str, timezone_offset_hours) {
    const time_seconds = hhmm_to_seconds(time_str);
    const local_seconds = day * SECONDS_IN_DAY + time_seconds;
    const utc_seconds = local_seconds + timezone_offset_hours * 3600;
    return utc_seconds;
}
function convert_userfriendly_to_schedule(schedule_uf) {
    const { from, to, timezone_offset } = schedule_uf;
    const start_utc_seconds = convert_day_time_to_utc_seconds(from.day, from.time, timezone_offset);
    const end_utc_seconds = convert_day_time_to_utc_seconds(to.day, to.time, timezone_offset);
    const duration = end_utc_seconds - start_utc_seconds;
    return {
        interval: SECONDS_IN_WEEK,
        start: start_utc_seconds,
        duration: duration,
        timezone_offset: timezone_offset
    };
}
