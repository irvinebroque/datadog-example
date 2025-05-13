# Cloudflare Workers + Datadog TypeScript SDK

> [!NOTE]  
> This uses the us3.datadoghq.com site. You must sign up for a Datadog account in US3, or you must modify this code in order to use a different Datadog site. Otherwise, you may see events/metrics/logs "accepted" and receive a 202 back from Datadog, and not see the data anywhere in Datadog itself.

This plus `irvinebroque/datadog-example-tail-consumer` show the following:

- Write a metric from a Cloudflare Worker to Datadog (using `ctx.waitUntil`)
- Send logs to Datadog immediately after the Worker invocation ends, using a Tail Worker
- Send errors to Datadog immediately after the Worker invocation ends, using a Tail Worker (errors in Datadog are a type of log)

This uses [`@datadog/datadog-api-client`](https://github.com/DataDog/datadog-api-client-typescript) — but you can just use the Datadog REST API directly.

## Requirements

- A Datadog account
- A Datadog API key
- A Datadog App key
