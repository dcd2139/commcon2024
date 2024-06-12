import { DurableObject } from "cloudflare:workers";

// To deploy (make sure in api dir)  [pre-req npm install wrangler]
//   npx wrangler deploy
export default {
    async fetch(request, env, _ctx) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
            "Access-Control-Max-Age": "86400",
        };

        const url = new URL(request.url)
        const path = url.pathname

        console.log(`trackInfo request: ${request.method}, ${path}`)

        if (path === '/ai') {
            console.log('trackInfo ai request')
            let answer
            try {
                answer = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
                    prompt: "What is the origin of the phrase 'Hello, World'"
                });
            } catch (e) {
                return new Response(e.message)
            }

            return new Response(JSON.stringify(answer), {
                headers: {
                    ...corsHeaders,
                    "Access-Control-Allow-Headers": request.headers.get(
                        "Access-Control-Request-Headers"
                    ),
                }
            });
        }

        let id = env.TRACK_INFO.idFromName('TRACK_INFO')
        let stub = env.TRACK_INFO.get(id)

        let trackInfo
        switch (request.method) {
            case 'GET':
                trackInfo = await stub.get()
                return new Response((trackInfo ? JSON.stringify(trackInfo) : 'Not Found'), {
                    headers: {
                        ...corsHeaders,
                        "Access-Control-Allow-Headers": request.headers.get(
                            "Access-Control-Request-Headers"
                        ),
                    }
                })
            case 'POST':
                trackInfo = await request.json()
                await stub.set(trackInfo)
                return new Response("OK", {
                    headers: {
                        ...corsHeaders,
                        "Access-Control-Allow-Headers": request.headers.get(
                            "Access-Control-Request-Headers"
                        ),
                    }
                })
            default:
                return new Response(`Not Found: ${request.method}`, {
                    headers: {
                        ...corsHeaders,
                        "Access-Control-Allow-Headers": request.headers.get(
                            "Access-Control-Request-Headers"
                        ),
                    }
                })
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
