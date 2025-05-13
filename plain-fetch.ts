const payload = {
	series: [
		{
			metric: 'cloudflare.workers.1',
			type: 0, // 0 = gauge
			points: [{ timestamp: Math.floor(Date.now() / 1000), value: 0.7 }],
			resources: [{ name: 'dummyhost', type: 'host' }],
		},
	],
};

fetch('https://api.us3.datadoghq.com/api/v2/series', {
	method: 'POST',
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json',
		'DD-API-KEY': this.env.DATADOG_API_KEY, // stored as a secret
	},
	body: JSON.stringify(payload),
})
	.then((res) => res.json())
	.then((data) => {
		console.log(data);
	})
	.catch((error) => {
		console.log('Jfkldsjklfjkldsklj');
		console.error(error);
	});
