# syntax=docker/dockerfile:1
# Minimal placeholder image for bizbook-crm-c.
# The repository currently contains only README.md and the Colossus deploy workflow —
# there is no application source. This serves the README as a landing page so the
# deployment succeeds and the URL responds. Replace this Dockerfile once the app exists.
FROM nginx:1.27-alpine

# Render the README into a simple HTML index so the app URL returns HTTP 200
COPY README.md /usr/share/nginx/html/README.md
RUN printf '%s\n' \
  '<!doctype html><html><head><meta charset="utf-8"><title>bizbook-crm-c</title>' \
  '<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:4rem auto;padding:0 1rem;color:#222}code{background:#f4f4f4;padding:.15rem .35rem;border-radius:3px}</style>' \
  '</head><body>' \
  '<h1>bizbook-crm-c</h1>' \
  '<p>Placeholder landing page. The repository contains no application source yet — only <code>README.md</code>.</p>' \
  '<p>Deployed by the Colossus deploy agent.</p>' \
  '</body></html>' > /usr/share/nginx/html/index.html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
