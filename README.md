# Consumer Order API

A simple REST API for managing restaurant menus and consumer orders, built with Express, Prisma, and PostgreSQL.

## Prerequisites

- Node.js >= 24
- pnpm (v10.32+)
- Docker & Docker Compose — [Install Docker](https://docs.docker.com/get-docker/) if you don't have it yet

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

Normally you'd copy the example file and fill in your values:

```bash
cp .env.example .env
```

Since this is a demo project, `.env` is already included in the repo you may skip this step.

### 3. Set up the database

This single command starts Postgres via Docker, runs migrations, and seeds sample data:

```bash
pnpm run db:setup
```

Or do it step by step:

```bash
# Start Postgres
docker compose up -d

# Run migrations
pnpm run prisma:migrate

# Generate Prisma client
pnpm run prisma:generate

# Seed the database
pnpm run db:seed
```

### 4. Run the app

```bash
pnpm run dev
```

The server starts at `http://localhost:3000`.

### 5. Run the RabbitMq Consumer Server

```bash
# Open a new window
pnpm run dev:worker
```

The server starts at `http://localhost:3000`.

### Design Question

1. API contract decision: What was one non-obvious design decision you made in the API surface - a naming choice, a response shape, a status code - and why did you make it?

```
ANSWER:

One design decision I made was to always return a consistent response structure for list endpoints instead of returning a raw array.

instead of:
[
  {
    "id": "1",
    "name": "Burger"
  }
]

I design the consistent response structure
{
  "data": [],
  "meta": {
    "filter": {}, whatever filters were actually applied
    "total": 42,
    "page": 1,
    "limit": 10
  }
}

I chose a consistent response structure because it gives us room to grow the API without breaking existing clients. For example, if we need to add pagination or other metadata later, we can do that without changing the response contract. It also gives frontend developers a consistent structure across all list endpoints. This is not something I came up with myself it is a pattern used by APIs like Stripe, Notion, and Meta's Graph API.
```

2. Versioning: if a mobile client were already consuming `GET /menu` and you needed to change the response shape in a breaking way, how would you handle that?

```

ANSWER:

Since the mobile app is already consuming GET /menu, I would not introduce a breaking change directly because users may stay on older app versions for weeks or even months. If possible, I would keep the API backward compatible by adding new fields instead of modifying or removing existing ones.

If a breaking change is unavoidable, I would version the API by introducing something like GET /v2/menu while keeping GET /v1/menu available. This allows the mobile team to migrate at their own pace without impacting users on older app versions.

Once most clients have migrated and we've confirmed that traffic to v1 is minimal, I would deprecate it, communicate a clear sunset timeline to the frontend and mobile teams, and eventually remove the old endpoint.

This is also a common industry practice, companies like Meta (Facebook) use API versioning in their Graph API specifically to avoid breaking changes while allowing their APIs to evolve safely over time.

```

3. What you'd do differently with more time: Name one thing you would change or add if you had another two hours. Be specific.

```
ANSWER:

I would add a dead letter queue with retry logic for the order.created consumer.

Right now, failed messages are not retried and are effectively lost, which might be acceptable for a simple log consumer but becomes risky once the worker has real side effects like sending notifications or updating external systems. Any temporary issue like a network or database failure could lead to permanent data loss.

With more time, I would route failed messages into a DLQ so they can be inspected instead of disappearing. I would also add a retry mechanism with a limited number of attempts before sending the message to the DLQ. On top of that, I would provide a simple way to review and replay failed messages so operations can recover them when needed.

Overall, the goal is to avoid silent message loss and make the system more reliable and observable in production.
```

4. Production gap: What is the most significant thing missing from this service that would concern you before shipping it to real users?

```
ANSWER:

The biggest concern before shipping is that there is no reliable guarantee between creating the order and publishing the message to the queue.

Right now, the flow is: the order is successfully written to the database, but if publishing to RabbitMQ fails right after that, the system ends up in an inconsistent state. The customer sees a successful order, the database has it, but the kitchen never receives the event. From the user’s perspective, the order just disappears from the operational flow.

What makes this more serious is that it fails silently under normal conditions like temporary network issues or a brief RabbitMQ downtime. There is no retry or recovery mechanism, so the event is effectively lost.

The proper fix would be a transactional outbox pattern, where the order and an “event to publish” are stored in the same database transaction. A background worker then reliably publishes to RabbitMQ. This avoids distributed transaction complexity while guarantee eventual delivery. At a minimum, there should be a fallback mechanism to retry or surface failed publishes for manual recovery.
```

## Folder Structure

```

consumer-order/
├── prisma/
│ ├── migrations/ # Database migration files
│ ├── schema.prisma # Prisma schema definition
│ └── seed.ts # Database seed script
├── generated/
│ └── prisma/ # Auto-generated Prisma client and types
├── scripts/
│ └── setup-db.sh # Full database setup script
├── src/
│ ├── app.ts # Express app entrypoint (API server)
│ ├── worker.ts # RabbitMQ consumer entrypoint (worker process)
│ ├── common/
│ │ └── async-handler.ts # Express async route wrapper
│ ├── lib/
│ │ ├── errors.ts # Custom error classes
│ │ ├── logger.ts # Pino logger instance
│ │ ├── prisma.ts # Prisma client singleton
│ │ ├── queue.ts # Queue publish/consume helpers
│ │ └── rabbitmq.ts # RabbitMQ connection management
│ ├── middleware/
│ │ └── error.middleware.ts # Global error handler
│ ├── modules/
│ │ ├── menu/
│ │ │ ├── menu-item/
│ │ │ │ ├── menu-item.repository.ts
│ │ │ │ ├── menu-item.schema.ts
│ │ │ │ └── menu-item.service.ts
│ │ │ ├── menu.controller.ts
│ │ │ ├── menu.repository.ts
│ │ │ ├── menu.routes.ts
│ │ │ ├── menu.schema.ts
│ │ │ └── menu.service.ts
│ │ └── order/
│ │ ├── order-item/
│ │ │ └── order-item.schema.ts
│ │ ├── order.controller.ts
│ │ ├── order.repository.ts
│ │ ├── order.routes.ts
│ │ ├── order.schema.ts
│ │ └── order.service.ts
│ └── types/
│ └── list.ts # Shared list/pagination types
├── docker-compose.yml # PostgreSQL + RabbitMQ services
├── esbuild.config.ts # Production build config
├── tsconfig.json
└── package.json

```

### Key directories

| Directory         | Purpose                                                                                |
| ----------------- | -------------------------------------------------------------------------------------- |
| `src/lib/`        | Shared infrastructure — database, queue, logging, errors                               |
| `src/modules/`    | Feature modules, each with its own controller, service, repository, schema, and routes |
| `src/middleware/` | Express middleware (error handling)                                                    |
| `src/common/`     | Reusable utilities shared across modules                                               |
| `generated/`      | Auto-generated code (Prisma client) — do not edit                                      |
| `prisma/`         | Database schema, migrations, and seed data                                             |

### Module structure convention

Each module follows the pattern:

| File              | Responsibility                                       |
| ----------------- | ---------------------------------------------------- |
| `*.routes.ts`     | Route definitions and HTTP method mapping            |
| `*.controller.ts` | Request parsing, validation, and response formatting |
| `*.service.ts`    | Business logic and orchestration                     |
| `*.repository.ts` | Database access layer (Prisma queries)               |
| `*.schema.ts`     | Zod validation schemas and TypeScript types          |

## API Endpoints

### Menus

| Method | Endpoint           | Description                            |
| ------ | ------------------ | -------------------------------------- |
| GET    | `/menus`           | List active menus with available items |
| GET    | `/menus/items/:id` | Get a specific menu item               |
| PATCH  | `/menus/items/:id` | Update a menu item                     |

**Query params for `GET /menus`:**

| Param | Type   | Default | Description                    |
| ----- | ------ | ------- | ------------------------------ |
| name  | string | -       | Filter by name (partial match) |
| limit | number | 10      | Items per page                 |
| page  | number | 1       | Page number                    |

### Orders

| Method | Endpoint             | Description         |
| ------ | -------------------- | ------------------- |
| POST   | `/orders`            | Create a new order  |
| GET    | `/orders/:id`        | Get an order by ID  |
| PATCH  | `/orders/:id/status` | Update order status |

**Order status transitions:** `received` -> `preparing` -> `ready` -> `completed`

## Teardown

To stop and remove the database (including data and migrations):

```bash
pnpm run db:down
```

## Scripts Reference

| Script                     | Description                             |
| -------------------------- | --------------------------------------- |
| `pnpm run dev`             | Start the development server            |
| `pnpm run dev:worker`      | Start the RabbitMQ consumer server      |
| `pnpm run build`           | Build for production                    |
| `pnpm run db:setup`        | Full DB setup (Docker + migrate + seed) |
| `pnpm run db:seed`         | Seed the database                       |
| `pnpm run db:down`         | Tear down DB container and migrations   |
| `pnpm run prisma:migrate`  | Run Prisma migrations                   |
| `pnpm run prisma:generate` | Generate Prisma client                  |
