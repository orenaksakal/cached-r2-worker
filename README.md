# Free cloud blob storage with CDN and Cache using Cloudflare

This repo includes everything you need to setup a free image storage like `vercel blob` or `supabase storage` for free behind cloudflare cache and cdn using:

- Cloudflare R2 bucket for Storage
- Cloudflare Worker for Cache, API and serving images

The repo comes pre-configured for images (image types) but you can modify the worker to work with any blob or file

## Setup

#### Prequisites

- Free cloudflare account: https://dash.cloudflare.com/sign-up
- Domain: You need a custom domain for caching to work, you can use a subdomain like cdn.yourdomain.com or images.yourdomain.com

#### Worker setup

- Add your domain to cloudflare using add site button on top
- Create R2 Bucket by clicking R2 from sidebar and clicking create bucket button
- Setup wrangler on your computer: https://developers.cloudflare.com/workers/wrangler/install-and-update/
- Clone this repo and run `npm install`
- Open `wrangler.toml` file and update `worker-name` as you wish e.g. yoursite-worker
- Set `bucket_name` and `preview_bucket_name` to match the name of the bucket you created on earlier steps
- Deploy your worker with `npx wrangler deploy`
- Go to cloudflare dashboard and click on the your worker created (under workers & pages from sidebar)
- Click to view under Customer domains and click on add domain button, enter your domain to the input box and click on add custom domain (it will take some time for domain to be assigned)
- Select settings tab and select variables from sidebar and then click on add variable button to set your authorization secret. Variable name should be: `AUTH_KEY_SECRET` and set the value as you wish (note the value of the secret will need it for PUT and DELETE requests) and click on save and deploy
- Success! We now setup the storage and bind the worker together! Lets move on to usage;

#### API Usage

API endpoint is your custom domain setup e.g. cdn.yourdomain.com or the worker domain cloudflare gives you that is like `xxx.worker.dev`

Methods allowed are

- `PUT`: for uploading images
- `GET`: for serving images with cache
- `DELETE`: for deleting images

### Examples

#### Uploading image

Remember to use base64 string without prefix of base64 .e.g remove the prefix `data:image/png;base64,` if existing.

Response will be the `path.suffix` e.g. `image.png` so you can use and reference it later on

You can also upload your images from cloudflare dashboard (useful for batch uploads)

```typescript
await fetch('https://cdn.yourdomain.com/image', {
	method: 'PUT',
	headers: {
		'Content-Type': 'application/json',
		'X-Custom-Auth-Key': 'YOUR SECRET HERE',
	},
	body: JSON.stringify({
		image: `iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAndJREFUaEPVmQlOAzEMRacnA04GPRlwMsDVuDLGy7fjdmglpAKZ5D8vsZM5bQ/+OT24/u1WAM/btr3uxqHv5/3727TBpgFIIAv3tBLMGMgkACKeocYgpgAq4kchJgA88S+70o89ZKzQojH0//ZnAuBLrU6CKES0MErmd2Msg7YgVgEs60dWtSCW8mEVQFsfEVOFDj2zAmAJQeejUCJv8KedC+iClhU61ud5dChRvrRyoQvgJaQElRamv8uk/jQKXssLHQBuE7TA1i4iHiJAAitV6QrArYRb4MhmcHkOAehU2VVvwNU6AqhYnIuXFG4VMpnE9D1r/FIQD6BiddjdgVs47iMgcx0LwBPPVpa9PmmaAJBskfH+rKUBvIflg2NFKEmUqEm8hqcGQBqzewEQX9oASgC0R7kngAdxLXoRgBfb2kvIVry6rWrjXrXJxVFh6LhV0fp5hvjVN0kANDSOAjANchQAJSf9kDXHjpRWxlsdIuopL4SseKaxpSaOJz9iG41qTRnkiEJmeVp7C67ulVaC24angeMg50DWzKWHnIlmrn0c3M0e9T7p3FERqnak+tgYtdOylc5OdmGhRKpoBWS6eKW5gACwqCNAUn3pAMOklZMa6hEKNx1KqfXRM7ElwrsipB1KHxv5d50T/NLDu/yFjAsNcsy4WpHltO1LshWAqdu1lStK6FoliuO25cSkbq+PJNCKB7hv0dU0rZ5KmPZkSVNpMJgL3guOyKDkBdoArBcjoSMmALzmjLdBuT0u9f4WyQSAF0rWetDejsS+dx6oPKvHopV6ymiX9Ucn+5kwg/jXHpAe0XedncSGomHaA9Cik4MeHuAbzpmoMZPWyJwAAAAASUVORK5CYII=`,
	}),
});
```

#### Serve images with cache

Just hit the url and image name you need with GET or with your browser https://cdn.yourdomain.com/image.png

#### Delete image

Will remove `image.png`
You can also use cloudflare dashboard for this (useful for batch removals)

```typescript
await fetch('https://cdn.yourdomain.com/image.png', {
	method: 'DELETE',
	headers: {
		'Content-Type': 'application/json',
	},
});
```

## Config

- You can change default cache time by changing the line 132 from `index.js`

```Javascript
headers.append('Cache-Control', 's-maxage=15552000'); //6 months cache
```

- To allow any file type to be uploaded get rid of the `detectType` this way you can serve any type of file

## Questions & Feedback

Reach out to me on twitter: [@orenaksakal](https://www.twitter.com/orenaksakal)

Happy hacking!
