
# Codzee Code Review Demo

A Node.js and TypeScript Task Management REST API created to
evaluate automated GitHub pull-request reviews.

## Tech Stack

- Node.js
- TypeScript
- Express.js
- Zod (request validation to be added)
- Vitest
- Supertest

## Features

- List all tasks
- Retrieve a task by ID
- Create a task
- Update a task
- Delete a task
- Health-check endpoint

## Prerequisites

- Node.js (a supported LTS release)
- npm
- Git

## Installation

```bash
npm install
```

## Run the application

```bash
npm run dev
```

The API will be available at http://localhost:3000.

## Run tests

```bash
npm test
```

## Check TypeScript

```bash
npm run typecheck
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /tasks | List tasks |
| GET | /tasks/:id | Get a task |
| POST | /tasks | Create a task |
| PATCH | /tasks/:id | Update a task |
| DELETE | /tasks/:id | Delete a task |

## Data Storage

Tasks are stored in memory. Data created at runtime is not
persisted after the server restarts.

## Purpose

This repository is used to evaluate automated code reviews
through meaningful pull requests covering validation,
correctness, testing, and performance.