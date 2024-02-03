// This is the entry point for your Worker code.
// The following is an example of a Worker that serves an image from a bucket via cloudflare cache and cdn

// The following are the signatures of the image types
const signatures = {
	R0lGODdh: { mimeType: 'image/gif', suffix: 'gif' },
	R0lGODlh: { mimeType: 'image/gif', suffix: 'gif' },
	iVBORw0KGgo: { mimeType: 'image/png', suffix: 'png' },
	'/9j/': { mimeType: 'image/jpg', suffix: 'jpg' },
	UklGR: { mimeType: 'image/webp', suffix: 'webp' },
};

// Detect the type of the image
const detectType = (b64) => {
	for (const s in signatures) {
		if (b64.indexOf(s) > -1) {
			return signatures[s];
		}
	}
};

// Check if the request has a valid header
const hasValidHeader = (request, env) => {
	return request.headers.get('X-Custom-Auth-Key') === env.AUTH_KEY_SECRET;
};

// Used for authorizing requests
function authorizeRequest(request, env, key) {
	switch (request.method) {
		case 'PUT':
		case 'DELETE':
			return hasValidHeader(request, env);
		case 'GET':
			return true;
		default:
			return false;
	}
}

// The fetch event listener
export default {
	async fetch(request, env, context) {
		// Create a new URL object using the request URL
		const url = new URL(request.url);
		// Extract the key from the URL
		const key = url.pathname.slice(1);

		// Construct the cache key from the cache URL
		const cacheKey = new Request(url.toString(), request);
		const cache = caches.default;

		// Check if the request is authorized
		if (!authorizeRequest(request, env, key)) {
			return new Response('Forbidden', { status: 403 });
		}

		switch (request.method) {
			// If the request method is PUT, get the image base64 from the request body
			case 'PUT':
				const json = await request.json();
				const base64 = json.image;

				if (!base64) {
					return new Response('Image not found', { status: 401 });
				}

				// Detect the type of the image
				const type = detectType(base64);
				if (!type) {
					return new Response('Invalid Image', { status: 401 });
				}

				// Convert the base64 to a Uint8Array
				const imageBody = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
				// Construct the image name a.k.a. key with the correct suffix
				const newKey = `${key}.${type.suffix}`;

				// Store the image in the bucket with correct metadata
				await env.BUCKET.put(newKey, imageBody, {
					httpMetadata: { contentType: type.mimeType },
				});

				// Return the name aka key of the image that can be used to serve the image e.g. /image.jpg
				return new Response(newKey);
			case 'GET':
				try {
					// Check whether the value is already available in the cache
					// if not, you will need to fetch it from R2, and store it in the cache
					// for future access
					let response = await cache.match(cacheKey);

					// If the response is present in the cache, return it
					if (response) {
						console.log(`Cache hit for: ${request.url}.`);
						return response;
					}

					console.log(`Response for request url: ${request.url} not present in cache. Fetching and caching request.`);

					// If not in cache, get it from R2
					const objectKey = url.pathname.slice(1);
					const object = await env.BUCKET.get(objectKey);

					if (object === null) {
						return new Response('Object Not Found', { status: 404 });
					}

					// Set the appropriate object headers
					const headers = new Headers();
					object.writeHttpMetadata(headers);
					headers.set('etag', object.httpEtag);

					if (object === null) {
						return new Response('Object Not Found', { status: 404 });
					}

					object.writeHttpMetadata(headers);
					headers.set('etag', object.httpEtag);

					// Cache API respects Cache-Control headers. Setting s-max-age to 10
					// will limit the response to be in cache for 10 seconds max
					// Any changes made to the response here will be reflected in the cached value
					headers.append('Cache-Control', 's-maxage=15552000'); //6 months cache

					response = new Response(object.body, {
						headers,
					});

					// Store the fetched response as cacheKey
					// Use waitUntil so you can return the response without blocking on
					// writing to cache
					context.waitUntil(cache.put(cacheKey, response.clone()));

					// Return the image response
					return response;
				} catch (e) {
					return new Response('Error thrown ' + e.message);
				}
			case 'DELETE':
				// Delete the image from the bucket
				await env.BUCKET.delete(key); // key is the image name e.g. image.jpg
				return new Response('Deleted!');

			default:
				return new Response('Method Not Allowed', {
					status: 405,
					headers: {
						Allow: 'PUT, GET, DELETE',
					},
				});
		}
	},
};
