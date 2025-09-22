# Socket.IO + Redis Job Server

A Node.js-based server for handling jobs from our main platform Quantiply and dispatching them to Electron clients via **Socket.IO**, with Redis Streams for scalable job handling.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Requirements](#requirements)
4. [Setup & Installation](#setup-installation)
5. [Environment Variables](#environment-variables)
6. [Scripts](#scripts)
7. [Running the Server](#running-the-server)
8. [Linting & Formatting](#linting-formatting)
9. [Contribution Guidelines](#contribution-guidelines)
10. [Running Multiple Instances](#running-multiple-instances)

---

## Project Overview

This server acts as a bridge between the main platform and Electron clients:

- Listens for jobs from a Redis Stream (`jobsStream`)
- Forwards jobs to registered Electron clients via Socket.IO
- Receives responses from clients and stores them in another Redis Stream (`responsesStream`)
- Provides **graceful shutdown** to close HTTP, Socket.IO, and Redis connections safely
- Supports **multi-server scaling**

---

## Features

- Redis Streams for **reliable job queueing**
- Socket.IO for **real-time job dispatch and responses**
- Multi-client registration and tracking
- Automatic job acknowledgment (`xAck`)
- Proper error handling and logging
- Configurable via `.env`
- ESLint + Prettier integration for **consistent code style**

---

## Requirements

- Node.js v18+
- Redis server v6+ (local or remote)
- npm or yarn

_Optional:_

- VS Code with ESLint & Prettier extensions

---

## Setup & Installation

1. **Clone the repository**
   git clone <repo_url>
   cd <repo_folder>

2. **Install dependencies**
   npm install

3. **Create environment variables**
   cp .env.example .env

---

## Environment Variables

_Edit .env with actual values:_

- PORT         → Port on which the Socket.IO server will run (eg: 3000)
- REDIS_URL    → Redis connection URL 
- INSTANCE_ID  → Unique identifier for this server instance. Used to create dynamic Redis consumer groups (eg: io-server-1)
- NODE_ENV     → Set to either 'development' / 'production' accordingly.
 
_Note: For production, each instance must have a unique `INSTANCE_ID` (e.g: io-server-1, io-server-2) so that jobs are correctly claimed and processed._
---

## Scripts

- npm run start -> Starts the server (node src/index.js)
- npm run lint -> Checks code style using ESLint
- npm run format -> Auto-formats code using Prettier

---

## Running the Server

npm run start

- Server will connect to Redis and start polling jobs.
- Socket.IO listens for Electron client connections.

_Example logs_

- Created group jobsGroup
- Created group responsesGroup
- Listening on 3000 as io-4553
- Electron client connected: W1-ivMfB\*\*\*

_Note: To keep the server running after logout, use:_

- PM2: pm2 start src/index.js --name io-server

---

## Linting & Formatting

- ESLint + Prettier are configured.
- Before committing, run:

  npm run lint

  npm run format

  _Recommended: install VS Code ESLint & Prettier extensions to get real-time feedback._

---

## Contribution Guidelines

- Fork the repository

- Create a feature branch: git checkout -b feature/my-feature

- Make your changes

- Run npm run lint && npm run format

- Commit and push: git commit -m "Feature: Add xyz"

- Open a Pull Request

---

## Running Multiple Instances

- You can run multiple `io-server` instances to scale horizontally.  
- Each instance must have a unique `INSTANCE_ID` in its `.env` file (or passed as an env variable).  
- Use Nginx (or any reverse proxy) to distribute client connections across instances.

_Example:_

# Instance 1
- PORT=3000
- INSTANCE_ID=io-server-1

# Instance 2
- PORT=3001
- INSTANCE_ID=io-server-2

_Note: Both instances share the same Redis streams but track acknowledgments independently.The instance that has the correct client connected processes the job; others skip and ack_


## _Follow the existing code style to keep the codebase consistent._
