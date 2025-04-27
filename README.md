# Modular Monolithic Architecture

## Overview

This sample project demonstrates a modular monolithic architecture using Express.js. It aims to showcase a scalable and maintainable approach to building monolithic applications with modular components.

## Features

- Organized module structure for scalability using vertical slice architecture
- Event-driven architecture, enabling asynchronous operations and decoupled communication
- Adherence to SOLID principles to ensure clean and maintainable code
- Separation of concerns using independent modules
- AES encryption and decryption implementation for secure data transmission ensuring confidentiality and integrity
- JWT authentication with HMAC and role based authentication for secure and efficient token validation

## Technologies

- Node.js (Runtime)
- Express.js (Web framework)
- PostgreSQL (Database)
- Redis Cache
- BullMq

## Db Library

https://github.com/KishorNaik/Modular_Monolithic_Architecture_Db_Library

## .env file

- Create a .env file in the root directory of your project and add the following environment variables:

```bash
# PORT
PORT = 3000

# TOKEN
SECRET_KEY =
REFRESH_SECRET_KEY =

# LOG
LOG_FORMAT = dev
LOG_DIR = ../logs

# CORS
ORIGIN = *
CREDENTIALS = true

# Database
DB_HOST = localhost
#Local Docker
#DB_HOST=host.docker.internal
DB_PORT = 5432
DB_USERNAME = postgres
DB_PASSWORD =
DB_DATABASE = mma

# Redis
REDIS_HOST = 127.0.0.1
#Local Docker
#DB_HOST=host.docker.internal
#REDIS_USERNAME = username
#REDIS_PASSWORD = password
REDIS_DB = 0
REDIS_PORT = 6379

# RabbitMQ
RABBITMQ_URL = amqp://guest:guest@localhost:5672

#AES
ENCRYPTION_KEY=RWw5ejc0Wzjq0i0T2ZTZhcYu44fQI5M10

#Rate Limit Size
RATE_LIMITER=1000
```
