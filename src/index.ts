import { DurableObject } from "cloudflare:workers";
import { client, v2 } from "@datadog/datadog-api-client";

export class MyDurableObject extends DurableObject {
	private apiInstance: v2.MetricsApi;
	
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		const configuration = client.createConfiguration({
			authMethods: {
			  apiKeyAuth: env.DATADOG_API_KEY,
			  appKeyAuth: env.DATADOG_APP_KEY,
			},
		  });
		this.apiInstance = new v2.MetricsApi(configuration);
		this.env = env;
	}

	async sayHello(name: string): Promise<string> {
		const params: v2.MetricsApiSubmitMetricsRequest = {
			body: {
			  series: [
				{
				  metric: "cloudflare.do.example",
				  type: 1,
				  points: [
					{
					  timestamp: Math.round(new Date().getTime() / 1000),
					  value: 0.7,
					},
				  ],
				  resources: [
					{
					  name: "SOME_NAME",
					  type: "host",
					},
				  ],
				},
			  ],
			},
		  };

		this.ctx.waitUntil(
			this.apiInstance
			.submitMetrics(params)
			.then((data: v2.IntakePayloadAccepted) => {
			  console.log(
				"API called successfully. Returned data: " + JSON.stringify(data)
			  );
			})
			.catch((error: any) => console.error(error))
		);

		return `Hello, ${name}!`;
	}
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const id: DurableObjectId = env.MY_DURABLE_OBJECT.idFromName("foo");
		const stub = env.MY_DURABLE_OBJECT.get(id);
		const greeting = await stub.sayHello("world");
		return new Response(greeting);
	},
} satisfies ExportedHandler<Env>;
