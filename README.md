# Socket.IO + Redis Job Server

A Node.js-based server for handling jobs from our main platform Quantiply and dispatching them to Electron clients via **Socket.IO**, with Redis Streams for scalable job handling.

---

## Table of Contents

1. [Project Overview](#project-overview)  
2. [Features](#features)  
3. [Folder Structure](#folder-structure) 
4. [Requirements](#requirements)  
5. [Setup & Installation](#setup--installation)  
6. [Environment Variables](#environment-variables)  
7. [Scripts](#scripts)  
8. [Running the Server](#running-the-server)  
9. [Linting & Formatting](#linting--formatting)  
10. [Contribution Guidelines](#contribution-guidelines)  

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



## Folder Structure

project-root/
├─ src/
│ ├─ config/
│ │ ├─ redisClient.js # Redis client initialization
│ │ └─ constants.js # Constants like stream/group names
│ ├─ helpers/
│ │ └─ streamHelpers.js # Helper functions for Redis Streams
│ ├─ socket/
│ │ └─ index.js # Socket.IO initialization & events
│ ├─ streams/
│ │ └─ jobsProcessor.js # Polling and processing jobs from Redis
│ └─ index.js # Entrypoint, server start & shutdown
├─ .env.example # Example environment variables
├─ package.json
├─ .gitignore
├─ prettier.config.js
└─ README.md

---



## Requirements

- Node.js v18+  
- Redis server v6+ (local or remote)  
- npm or yarn  

*Optional:*
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

*Edit .env with actual values:*
PORT → server port (default: 3000)
REDIS_URL → Redis connection URL

---



## Scripts

npm run start  ->    Starts the server (node src/index.js)
npm run lint   ->    Checks code style using ESLint
npm run format ->    Auto-formats code using Prettier

---



## Running the Server

npm run start
* Server will connect to Redis and start polling jobs.
* Socket.IO listens for Electron client connections.

*Example logs*
+ Created group jobsGroup
+ Created group responsesGroup
+ Listening on 3000 as io-4553
+ Electron client connected: W1-ivMfB***

*Note: To keep the server running after logout, use:*
* PM2: pm2 start src/index.js --name io-server

---



## Linting & Formatting

* ESLint + Prettier are configured.
* Before committing, run:
npm run lint
npm run format
*Recommended: install VS Code ESLint & Prettier extensions to get real-time feedback.*

---



## Contribution Guidelines

* Fork the repository

* Create a feature branch: git checkout -b feature/my-feature

* Make your changes

* Run npm run lint && npm run format

* Commit and push: git commit -m "Feature: Add xyz"

* Open a Pull Request

*Follow the existing code style to keep the codebase consistent.*
---