# Modular Monolithic Architecture

## Overview

This project demonstrates a modular monolithic architecture using Express.js. It aims to showcase a scalable and maintainable approach to building monolithic applications with modular components.

## Features

- Organized module structure for scalability using vertical slice architecture
- Event-driven architecture, enabling asynchronous operations and decoupled communication
- Adherence to SOLID principles to ensure clean and maintainable code
- Separation of concerns using independent modules

## Technologies

- Node.js (Runtime)
- Express.js (Web framework)
- PostgreSQL (Database)
- Redis Cache

## Db Library

## .env file

- Create a .env file in the root directory of your project and add the following environment variables:

```bash
# PORT
PORT = 3000

# LOG
LOG_FORMAT = dev
LOG_DIR = ../logs

# CORS
ORIGIN = *
CREDENTIALS = true

# RabbitMQ
RABBITMQ_URL = amqp://guest:guest@localhost:5672
```
