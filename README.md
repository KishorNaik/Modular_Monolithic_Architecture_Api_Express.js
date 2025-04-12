# RabbitMq demo using expressJs and Event driven approach

- Publisher and Subscriber mode
- Request and Reply mode

## Install Docker Desktop

- https://www.docker.com/products/docker-desktop

## Install RabbitMq Docker Image

- Run the following commands to start a RabbitMQ container:

```bash
# Pull the RabbitMQ Docker image
docker pull rabbitmq:3-management

# Run the RabbitMQ container
docker run -d --hostname my-rabbit --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

- 5672 is the port for AMQP (used by your application to connect to RabbitMQ).

- 15672 is the port for the RabbitMQ management UI (accessible via http://localhost:15672).

- You can access the RabbitMQ management UI with the default credentials:
    - Username: guest
    - Password: guest

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
