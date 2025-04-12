'use strict';
/*
  First spin the server then run the following command
*/
/*
Command:
npx ts-node-dev --pretty --transpile-only -r tsconfig-paths/register src/modules/demo/tests/load/index.ts
*/
import autocannon from 'autocannon';

async function loadTestAsync() {
	const url = 'http://localhost:3000/api/v1/demo';
	const body = JSON.stringify({
		body: '31cb5787acd4d7e14b3d93aa72cc8ddb:3efb69ded0ab33cfca1ce89575ed3b18657e2d20c3da2590973aca8dcad7bb980790267f8667bd8465f2c7fb1a6947f6',
	});
	const instance = autocannon(
		{
			url,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body,
			connections: 10, // Number of concurrent connections
			duration: 60, // Duration of the test in seconds
		},
		(err, result) => {
			if (err) {
				console.error('Error during load test:', err);
			} else {
				console.log('Load test completed:', result);
			}
		}
	);

	autocannon.track(instance, { renderProgressBar: true });

	instance.on('done', () => {
		console.log('Load test finished');
	});
}

loadTestAsync()
	.then()
	.catch((ex) => console.log('ex:', ex));
