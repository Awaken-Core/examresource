# Cloudflare R2 image uploads

The CMS sends image files directly from the browser to R2 using a signed URL. R2 credentials remain only in `apps/server/.env`.

## 1. Create an R2 bucket and API token

Create a bucket, then create an R2 API token limited to that bucket with **Object Read & Write** permission. Set the resulting account ID, access key ID, secret access key, bucket name, and public delivery URL in `apps/server/.env` using the matching names in `.env.example`.

Use a custom domain (recommended) or the bucket's `r2.dev` public URL for `R2_PUBLIC_BASE_URL`. It must serve objects publicly because article images are public.

## 2. Configure R2 CORS

In the bucket CORS settings, add your frontend origins. For local development and production, the policy should look like this (replace the production domain):

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.example"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Security behavior

- Only authenticated `admin` and `editor` accounts can request an upload URL.
- URLs expire after five minutes and only sign a single object key.
- The API accepts JPEG, PNG, WebP, and GIF files up to 10 MB.
- The client must send the exact `Content-Type` provided during signing.
