# 🛠️ FindFixr — Technician Discovery Platform

**FindFixr** is a full-stack application that helps users quickly discover and connect with skilled technicians (e.g., electricians, plumbers, auto-repairers) near their location. The platform supports real-time technician tracking, bookmarking/favoriting, service filtering, and profile media galleries.

## 🔧 Tech Stack
- **Backend**: NestJS + GraphQL + TypeORM + PostgreSQL + PostGIS
<!-- - **Frontend**: React + Apollo Client + Map integration -->

## ✨ Features
- 🔍 Location-based technician search
- 📍 Real-time technician location updates
- 🗂️ Technician service categories
- ❤️ User bookmarks (favorites)
- 📝 Technician reviews and ratings
- 📸 Media uploads (images/videos of work)

## 📦 Architecture
- Modular monolith (with microservice-ready modules)
- GraphQL API for all client interactions
- PostGIS-powered geospatial queries
- JWT-based authentication
- Clean, scalable folder structure

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL with PostGIS
- pnpm (or npm/yarn)

### Development Setup
```bash
# Install dependencies
pnpm install

# development
pnpm run start

# watch mode
pnpm run start:dev

# production mode
pnpm run start:prod
```

### Environment Variables (.env)
```env
DATABASE_URL=value
JWT_SECRET=value
```

## 🐳 Docker Setup (optional)
If you want a Dockerized PostGIS database:
```bash
docker-compose up -d
```

## 🧪 Testing
```bash
pnpm test
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## 📄 License
This project is licensed under the MIT License.

---

> Built with ❤️ using NestJS, GraphQL, PostgreSQL, and React.
