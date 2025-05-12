import { DurableObject } from 'cloudflare:workers';
import { client, v2 } from '@datadog/datadog-api-client';

let datadog: v2.MetricsApi;

export class MyDurableObject extends DurableObject {

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		if (!datadog) {
			const configuration = client.createConfiguration({
				debug: true,
				authMethods: {
					apiKeyAuth: env.DATADOG_API_KEY,
					appKeyAuth: env.DATADOG_APP_KEY,
				},
			});
			configuration.setServerVariables({
				site: "us3.datadoghq.com"
			});
			datadog = new v2.MetricsApi(configuration);
		}

		this.env = env;
	}

	async sayHello(name: string): Promise<string> {
		const params: v2.MetricsApiSubmitMetricsRequest = {
			body: {
				series: [
					{
						metric: 'cloudflare.worker.example',
						type: 3,
						points: [
							{
								timestamp: Math.floor(Date.now() / 1000),
								value: 0.7,
							},
						],
					},
				],
			},
		};


		// Plain fetch version

		// const payload = {
		// 	series: [
		// 	  {
		// 		metric: "cloudflare.workers.1",
		// 		type: 0,                                    // 0 = gauge
		// 		points: [{ timestamp: Math.floor(Date.now() / 1000), value: 0.7 }],
		// 		resources: [{ name: "dummyhost", type: "host" }],
		// 	  },
		// 	],
		//   };

		//   fetch("https://api.us3.datadoghq.com/api/v2/series", {
		// 	method: "POST",
		// 	headers: {
		// 	  Accept: "application/json",
		// 	  "Content-Type": "application/json",
		// 	  "DD-API-KEY": this.env.DATADOG_API_KEY,                // stored as a secret
		// 	},
		// 	body: JSON.stringify(payload),
		//   }).then((res) => res.json()).then((data) => {
		// 	console.log(data);
		// }).catch((error) => {
		// 	console.log("Jfkldsjklfjkldsklj");
		// 	console.error(error);
		// })


		this.ctx.waitUntil(
			datadog
				.submitMetrics(params)
				.then((data: v2.IntakePayloadAccepted) => {
					console.log('API called successfully. Returned data: ' + JSON.stringify(data));
				})
				.catch((error: any) => console.error(error)),
		);

		return `Hello, ${name}!`;
	}
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const id: DurableObjectId = env.MY_DURABLE_OBJECT.idFromName('foo');
		const stub = env.MY_DURABLE_OBJECT.get(id);
		const greeting = await stub.sayHello('world');
		return new Response(greeting);
	},
} satisfies ExportedHandler<Env>;
