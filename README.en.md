# open-chat-admin

[中文](README.md) | [English](README.en.md)

Open IM platform PC admin console (Vue 3 + Element Plus + Vite).

## Features

- User, conversation and group management
- Client release management (Android / iOS / Windows downloads and updates)
- Open-platform application management
- Audit log search

## Stack

Vue 3 · Element Plus · Pinia · Vue Router · Vite

## Local development

```bash
npm install
npm run dev        # dev server
npm run build      # production build (includes copy validation)
npm run preview    # preview the build
```

See `.env.example` for environment variables. Configure API endpoints per environment; never commit real secrets.

## Layout

```text
src/          application source
docs/         design documents
scripts/       build and validation scripts
public/        static assets
Dockerfile    container image
nginx.conf    in-container Nginx config
```

## License

[Apache License 2.0](LICENSE), maintained by [openware-io](https://github.com/openware-io).
