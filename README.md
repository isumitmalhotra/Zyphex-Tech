# ZyphexTech Project

This is a Next.js application with a PostgreSQL database and Prisma ORM.

## Backend Implementation - Phase 1

### Database Setup

- **Prisma ORM**: Used for database modeling and querying
- **PostgreSQL**: Primary database

### Database Schema

The initial database schema includes the following models:

- **User**: Application users with authentication details
- **Client**: Client information and contact details
- **Project**: Project details with relationships to clients, users, and teams
- **Team**: Team information with relationships to users and projects

### API Routes

The following API routes have been implemented:

#### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

#### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/[id]` - Get project by ID
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

#### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create a new client
- `GET /api/clients/[id]` - Get client by ID
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

#### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create a new team
- `GET /api/teams/[id]` - Get team by ID
- `PUT /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Delete team

### Getting Started

1. **Setup Environment Variables**

   Create a `.env` file in the root directory with the following variables:

   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/zyphextech?schema=public"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Generate Prisma Client**

   ```bash
   pnpm exec prisma generate
   ```

4. **Run Database Migrations**

   ```bash
   pnpm exec prisma migrate dev --name init
   ```

5. **Start Development Server**

   ```bash
   pnpm dev
   ```

## Next Steps

- Implement authentication with NextAuth.js
- Add middleware for route protection
- Implement frontend components to interact with the API
- Add validation for API requests
- Implement error handling and logging