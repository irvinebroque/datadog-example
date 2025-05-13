import { DurableObject } from 'cloudflare:workers';
import { client, v2 } from '@datadog/datadog-api-client';

let datadogMetrics: v2.MetricsApi;
let datadogLogs: v2.LogsApi;
let writeMetric: (name: string, value: number) => void;
let logError: (error: Error) => void;

export class MyDurableObject extends DurableObject {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		if (!datadogMetrics) {
			const configuration = client.createConfiguration({
				debug: true,
				authMethods: {
					apiKeyAuth: env.DATADOG_API_KEY,
					appKeyAuth: env.DATADOG_APP_KEY,
				},
			});
			configuration.setServerVariables({
				site: 'us3.datadoghq.com',
			});
			datadogMetrics = new v2.MetricsApi(configuration);
			writeMetric = (name: string, value: number): void => {
				const params: v2.MetricsApiSubmitMetricsRequest = {
					body: {
						series: [
							{
								metric: name,
								type: 3,
								points: [
									{
										timestamp: Math.floor(Date.now() / 1000),
										value,
									},
								],
							},
						],
					},
				};

				this.ctx.waitUntil(
					datadogMetrics
						.submitMetrics(params)
						.then((data: v2.IntakePayloadAccepted) => {
							console.log('API called successfully. Returned data: ' + JSON.stringify(data));
						})
						.catch((error: any) => console.error(error)),
				);
			};
		}

		if (!datadogLogs) {
			const configuration = client.createConfiguration({
				debug: true,
				authMethods: {
					apiKeyAuth: env.DATADOG_API_KEY,
					appKeyAuth: env.DATADOG_APP_KEY,
				},
			});
			configuration.setServerVariables({
				site: 'us3.datadoghq.com',
			});
			datadogLogs = new v2.LogsApi(configuration);
			logError = (error: Error): void => {
				const params: v2.LogsApiSubmitLogRequest = {
					body: [
						{
							ddsource: 'cloudflare-worker',
							ddtags: 'some-tag',
							hostname: 'some-hostname',
							message: `${new Date().toISOString()} ERROR ${error.message}`,
							service: 'my-service',
						},
					],
				};
				this.ctx.waitUntil(
					datadogLogs
						.submitLog(params)
						.then((data: any) => {
							console.log('API called successfully. Returned data: ' + JSON.stringify(data));
						})
						.catch((error: any) => console.error(error)),
				);
			};
		}

		this.env = env;
	}

	async sayHello(name: string): Promise<string> {
		writeMetric('cloudflare.worker.example', 0.7);
		try {
			throw new Error('test');
		} catch (error) {
			logError(error as Error);
		}
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
