let _connected_ports = [];
let _sse_event_source = null;
let _sse_connection_id = null;
let _count = 0;
self.addEventListener('connect', (e)=>{
    _count++;
    console.log("shared_worker, count: " + _count);
    const port = e.ports[0];
    _connected_ports.push(port);
    port.addEventListener('message', (msg)=>{
        handle_message(msg.data);
    });
    port.start();
    port.addEventListener('close', ()=>{
        const index = _connected_ports.indexOf(port);
        if (index > -1) {
            _connected_ports.splice(index, 1);
        }
    });
    port.postMessage({
        action: 'WORKER_CONNECTED'
    });
});
function force_stop() {
    self.close();
}
function handle_message(data) {
    switch(data.action){
        case 'SSE_INIT_CONNECTION':
            if (!_sse_event_source) {
                _sse_connection_id = data.sse_id;
                establish_sse_connection(data.sse_id);
            }
            break;
        case 'FORCE_STOP':
            force_stop();
            break;
    }
}
function establish_sse_connection(sse_id) {
    const is_localhost = self.location.hostname === 'localhost';
    let event_source_url = '';
    if (is_localhost) event_source_url = "/sse_add_listener?id=" + sse_id;
    else if (location.hostname.includes('purewater')) event_source_url = "https://webapp-805737116651.us-central1.run.app/sse_add_listener?id=" + sse_id;
    else if (location.hostname.includes('purewater')) event_source_url = "https://webapp-805737116651.us-central1.run.app/sse_add_listener?id=" + sse_id;
    else event_source_url = "https://xenwebapp-962422772741.us-central1.run.app/sse_add_listener?id=" + sse_id;
    _sse_event_source = new EventSource(event_source_url);
    _sse_event_source.onerror = (_e)=>{
    //broadcast_to_all_ports({action: 'SSE_ERROR'})
    };
    _sse_event_source.addEventListener("connected", (_e)=>{
    //broadcast_to_all_ports({action: 'SSE_CONNECTED'})
    });
    _sse_event_source.addEventListener("a_1", (e)=>{
        broadcast_to_all_ports({
            action: 'SSE_EVENT',
            trigger: 1,
            data: e.data
        });
    });
    _sse_event_source.addEventListener("a_2", (e)=>{
        broadcast_to_all_ports({
            action: 'SSE_EVENT',
            trigger: 2,
            data: e.data
        });
    });
    _sse_event_source.addEventListener("a_3", (e)=>{
        broadcast_to_all_ports({
            action: 'SSE_EVENT',
            trigger: 3,
            data: e.data
        });
    });
    _sse_event_source.addEventListener("a_4", (e)=>{
        broadcast_to_all_ports({
            action: 'SSE_EVENT',
            trigger: 4,
            data: e.data
        });
    });
}
function broadcast_to_all_ports(message) {
    _connected_ports.forEach((port)=>{
        try {
            port.postMessage(message);
        } catch (e) {
            // Port may be closed, remove it
            const index = _connected_ports.indexOf(port);
            if (index > -1) {
                _connected_ports.splice(index, 1);
            }
        }
    });
}
