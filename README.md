# Mid-Level Node.js Project

A comprehensive project management API built with Node.js, Express, GraphQL, and PostgreSQL.

## Quick Start

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.1. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## API Guidelines

### Overview

This project provides both REST and GraphQL APIs for a comprehensive project management system with the following features:

- User authentication and authorization
- Workspace and project management
- Task management with role-based access control
- Admin functionality
- Audit logging and notifications

### Architecture

- **Runtime**: Bun (v1.3.1+)
- **Framework**: Express.js
- **GraphQL**: Apollo Server Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Language**: TypeScript

### API Endpoints

#### Base URLs

- **REST API**: `http://localhost:4000`
- **GraphQL Playground**: `http://localhost:4000/graphql`

#### REST API Endpoints

##### Authentication (`/auth`)

- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info

##### Workspaces (`/workspace`)

- `POST /workspace` - Create workspace
- `GET /workspace/:workspaceId` - Get workspace details

##### Projects (`/project`)

- `GET /project` - List projects

##### Admin (`/admin`)

- Admin-specific endpoints

##### Health Check

- `GET /health` - Health check endpoint

#### GraphQL API

The GraphQL API provides comprehensive CRUD operations for all entities:

##### Queries

- User queries
- Workspace queries
- Project queries
- Task queries

##### Mutations

- Authentication mutations (login, register, password reset)
- Workspace mutations (create, update, delete, member management)
- Project mutations (create, update, delete, member management)
- Task mutations (create, update, delete, assign)

### Authentication

#### JWT Token Strategy

- **Access Token**: Short-lived (30 days), used for API requests
- **Refresh Token**: Long-lived, used to obtain new access tokens
- **Storage**: HTTP-only cookies for security

#### Headers

```http
Authorization: Bearer <access_token>
```

#### Cookie-based Authentication

- `accessToken`: HTTP-only cookie containing access token
- `refreshToken`: HTTP-only cookie containing refresh token

### Data Models

#### Core Entities

**User**

- `id`: Unique identifier
- `email`: User email (unique)
- `password`: Hashed password
- `globalStatus`: ACTIVE, BANNED, ADMIN
- `createdAt`, `updatedAt`: Timestamps

**Workspace**

- `id`: Unique identifier
- `name`: Workspace name
- `description`: Optional description
- `createdAt`, `updatedAt`: Timestamps
- `members`: Array of workspace members

**Project**

- `id`: Unique identifier
- `name`: Project name
- `workspaceId`: Parent workspace
- `createdAt`, `updatedAt`: Timestamps
- `members`: Array of project members
- `tasks`: Array of project tasks

**Task**

- `id`: Unique identifier
- `title`: Task title
- `description`: Optional description
- `status`: TODO, IN_PROGRESS, DONE, BLOCKED
- `projectId`: Parent project
- `assignee`: Assigned user
- `dueDate`: Optional due date
- `createdAt`, `updatedAt`: Timestamps

#### Role-Based Access Control

**Workspace Roles**

- `OWNER`: Full control over workspace
- `ADMIN`: Administrative privileges
- `MEMBER`: Standard member access
- `VIEWER`: Read-only access

**Project Roles**

- `PROJECT_LEAD`: Lead project management
- `CONTRIBUTOR`: Can create and modify tasks
- `PROJECT_VIEWER`: Read-only project access

### Security

#### Authentication Security

- Passwords are hashed using bcrypt
- JWT tokens are signed with secret keys
- Refresh tokens are stored securely in database
- Device tracking for security monitoring

#### Authorization

- Role-based access control (RBAC)
- Workspace and project-level permissions
- Middleware-based route protection

#### Data Protection

- Input validation and sanitization
- SQL injection prevention via Prisma ORM
- XSS protection through proper encoding

#### Code Structure

```
src/
├── graphql/               # GraphQL schema and resolvers
│   ├── resolvers/         # Directory for resolver modules
│   ├── resolvers.ts       # Main resolver entry point
│   ├── schema.ts          # Main GraphQL schema entry point
│   └── context.ts         # GraphQL context
├── routes/                # REST API routes
│   ├── middlewares/       # Custom middleware
│   └── controllers/       # Route controllers
├── prisma/                # Database configuration
├── utils/                 # Utility functions
└── index.ts               # Application entry point
```

#### Database Management

- Prisma migrations for schema changes
- Connection pooling for performance
- Transaction support for data consistency

#### Environment Variables

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
NODE_ENV="development|production"
```

### Testing

#### API Testing

Use the provided HTTP files in `.dev/requests/` for testing:

- `admin.http` - Admin endpoints
- `auth.http` - Authentication endpoints
- `project.http` - Project management endpoints
- `task.http` - Task management endpoints
- `workspace.http` - Workspace management endpoints
