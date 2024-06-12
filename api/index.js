import { DurableObject } from "cloudflare:workers";

export default {
    async fetch(request, env, _ctx) {
        // const url = new URL(request.url)
        // const path = url.pathname

        let id = env.TRACK_INFO.idFromName('TRACK_INFO')
        let stub = env.TRACK_INFO.get(id)

        let trackInfo
        console.log(`trackInfo request: ${request.method}`)
        switch (request.method) {
            case 'GET':
                trackInfo = await stub.get()
                return new Response(trackInfo ? JSON.stringify(trackInfo) : 'Not Found')
            case 'POST':
                trackInfo = await request.json()
                await stub.set(trackInfo)
                return new Response("OK")
            default:
                return new Response(`Not Found: ${request.method}`)
        }
    }
}

export class TrackInfo extends DurableObject {
    async set(trackInfo) {
        return await this.ctx.storage.put('trackInfo', trackInfo);
    }

    async get() {
        return await this.ctx.storage.get('trackInfo')
    }
}
