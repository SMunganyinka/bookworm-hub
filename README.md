# Book Search App

A full-stack web application to search for books by title, author, or category using the Google Books API. The backend is built with Node.js and Express, containerized with Docker, and deployed on multiple servers with HAProxy load balancing.



---

## Overview

This application allows users to search for books by keyword or category and view detailed book information. It utilizes the Google Books API for data. The backend is containerized with Docker and load balanced using HAProxy across two backend instances to ensure high availability and fault tolerance.

---

## Features

- Search books by query (title, author, subject)
- Browse books by category
- View detailed book information
- Health check endpoint showing which backend server responded (for load balancing verification)
- Load balancing with HAProxy to distribute requests evenly between two backend containers

---

## Technologies Used

- **Node.js & Express:** Backend server and API endpoints  
- **Google Books API:** External API for book data  
- **Docker & Docker Compose:** Containerization and orchestration  
- **HAProxy:** Load balancing between backend servers  
- **Vanilla JavaScript, HTML, CSS:** Frontend  
- **Axios:** HTTP requests to external API  

---

## Getting Started

### Prerequisites

- Docker and Docker Compose installed  
- Git installed  

### Clone the Repository


git clone https://github.com/SMunganyinka/book-search-app.git
cd book-search-app


Build and Run Locally
Build Docker images and run containers with Docker Compose:

docker compose build
docker compose up -d
This will start:

Two backend containers (web-01, web-02) exposing ports 8081 and 8082

One HAProxy load balancer container (lb-01) exposing port 8080

Access the Application
Open your browser and visit:


http://localhost:8080
The load balancer will distribute requests between backend servers. To verify which backend served the request, check:


http://localhost:8080/api/status
You should see a JSON response showing the serverName (e.g., "web-01" or "web-02").
---
Deployment
Lab Servers Setup
SSH into lab servers with given ports:

ssh ubuntu@web-01 -p 2211
ssh ubuntu@web-02 -p 2212
ssh ubuntu@lb-01 -p 2210
Pull your Docker image from Docker Hub on web-01 and web-02:

docker pull shakira85/book-search-app:v1
Run the backend containers on both servers using the pulled image, making sure to set the environment variable SERVER_NAME to web-01 and web-02 respectively.

On lb-01, run the HAProxy container with the provided haproxy.cfg configuration file that routes requests to the backend servers.
---
API Documentation
This app uses the Google Books API to fetch book data.

Your app exposes these backend API endpoints:

GET /api/status
Returns service health and which backend server handled the request.

GET /api/books/search/:query
Searches books by query string (title, author, subject). Supports maxResults as a query param.

GET /api/books/category/:category
Searches books by category (mapped to subject). Supports maxResults as a query param.

GET /api/books/details/:id
Fetches detailed info of a book by Google Books ID.
---
Challenges and Solutions

Passing environment variables to Docker containers:
Initially, SERVER_NAME was returning "unknown" because the environment variable was not properly set or accessed. Adding the variable in the docker-compose.yml and accessing it via process.env.SERVER_NAME fixed this.

HAProxy configuration for load balancing:
Configuring HAProxy for proper round-robin balancing and health checks took trial and error. Using the http-request set-header X-Backend-Server %[srv_name] helped to track which backend served the request.

Docker networking issues:
Ensured all containers are on the same Docker bridge network to allow seamless communication.

Handling external API failures:
Implemented try/catch blocks around Axios calls to gracefully handle API errors and provide meaningful responses.
---
Credits
Google Books API — Official book data API

Node.js and Express — Backend framework

Docker — Containerization platform

HAProxy — Load balancing software

Axios — Promise based HTTP client

