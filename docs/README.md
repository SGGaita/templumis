# TemplumIS documentation

Professional product documentation for **TemplumIS** — open-infrastructure institutional intelligence for enrollment, student success, financial aid, grants, and rankings.

The same content is published in the web app at **`/documentation`** (linked from the site footer).

| Section | In-app | This repository |
|---------|--------|-----------------|
| Overview | [/documentation](../frontend/src/app/documentation/page.jsx) | This page |
| User guide | `/documentation/user-guide` | [USER_GUIDE.md](./USER_GUIDE.md) |
| Technical documentation (architecture + metadata schema) | `/documentation/technical` | [TECHNICAL.md](./TECHNICAL.md) |
| API documentation | `/documentation/api` | [API.md](./API.md) |

Interactive OpenAPI (Swagger) remains at `/docs` on the API host (`http://localhost:8001/docs` or `http://localhost/docs` via Nginx).

Related operations docs:

- [CI/CD](./CI_CD.md)
- [Deployment](../DEPLOYMENT.md)
- [Docker commands](../DOCKER_COMMANDS.md)
