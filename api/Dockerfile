# Use a minimal base image
FROM ubuntu:24.04

# Set environment variables to avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 18.20.5

# Update the package repository, install necessary packages, and clean up in a single RUN command
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create the NVM directory
RUN mkdir -p $NVM_DIR

# Install NVM (Node Version Manager) and Node.js in a single RUN command
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash && \
    . "$NVM_DIR/nvm.sh" && \
    nvm install $NODE_VERSION && \
    nvm use $NODE_VERSION && \
    nvm alias default $NODE_VERSION

# Add NVM and Node.js to PATH
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# Copy your application code to the container
COPY . /app

# Set the working directory
WORKDIR /app

# Install Node.js dependencies
RUN npm install --legacy-peer-deps && npm cache clean --force

# Expose the port your app runs on
EXPOSE 3000

# Run your application
CMD ["npm", "run", "start"]
