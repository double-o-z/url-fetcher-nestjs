# URL Fetcher Service

This is a NestJS-based service for asynchronously fetching content from a list of URLs.

## Description

This project is a proof-of-concept for a senior software engineer assignment. It implements a service that accepts a list of URLs, fetches their content in the background, and provides endpoints to check the status and retrieve the content of the fetched URLs.

### Design Decision: A Scalable Approach to Content Retrieval

The initial requirement suggested that a `GET` request to the service should return the full content of all submitted URLs. I identified this as a potential design flaw with significant scalability issues:

1.  **High Memory Consumption**: Storing the full content of multiple large files (e.g., images, videos, large documents) in memory to serve a single API request could easily exhaust the server's resources and lead to crashes.
2.  **Large API Payloads**: A response containing the raw content of multiple URLs could be extremely large (megabytes or even gigabytes). This would result in slow response times, high bandwidth usage, and potential timeouts for the client.
3.  **Poor User Experience**: Clients would be forced to download a massive payload, even if they only needed the content of a single URL.

To address these issues, I implemented a more robust and scalable asynchronous pattern:

1.  **Submit Job (`POST /fetch`)**: A client submits a list of URLs. The server immediately accepts the job and returns a unique `jobId`. This operation is fast and non-blocking.
2.  **Check Job Status (`GET /fetch/:id`)**: The client can use the `jobId` to poll for the status of the job. This endpoint returns metadata for each URL (status, content length, errors), but **not** the full content. This keeps the response small and fast.
3.  **Retrieve Specific Content (`GET /fetch/:id/:index/content`)**: Once a URL's status is 'completed', the client can make a specific request to this endpoint to retrieve the actual content for that single URL.

This approach ensures that the server's memory usage remains manageable, API responses are lightweight, and the client has fine-grained control over what data it downloads. It is a standard pattern for handling long-running, resource-intensive tasks in a web service.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Usage

### 1. Get Overview of All Jobs

Get a summary of all submitted fetch jobs.

**Request:**
`GET /`

**Response:**
```json
{
  "message": "URL Fetcher Service - Overview of all submitted jobs",
  "totalJobs": 2,
  "jobs": [
    {
      "jobId": "uuid-2",
      "status": "pending",
      "urlCount": 1,
      "completedCount": 0,
      "errorCount": 0
    },
    {
      "jobId": "uuid-1", 
      "status": "completed",
      "urlCount": 2,
      "completedCount": 2,
      "errorCount": 0
    }
  ]
}
```

**Job Status Values:**
- `pending`: Some URLs are still being fetched
- `completed`: All URLs fetched successfully
- `error`: All URLs failed to fetch
- `partial`: Some URLs succeeded, some failed

### 2. Submit URLs for Processing

### 2. Submit URLs for Processing

Send a `POST` request with a list of URLs.

**Request:**
`POST /fetch`
```json
{
  "urls": [
    "https://www.google.com",
    "https://www.github.com"
  ]
}
```

**Response:**
```json
{
  "jobId": "your-unique-job-id"
}
```

### 3. Check Job Status

Use the `jobId` to check the status of the fetch operations.

**Request:**
`GET /fetch/your-unique-job-id`

**Response:**
```json
[
    {
        "url": "https://www.google.com",
        "status": "completed",
        "contentLength": 64589
    },
    {
        "url": "https://www.github.com",
        "status": "pending"
    }
]
```

### 4. Retrieve URL Content

Once a URL's status is `completed`, retrieve its content using the `jobId` and the URL's index from the original request array.

**Request:**
`GET /fetch/your-unique-job-id/0/content`

**Response:**
The raw content of the URL (e.g., HTML, image data, etc.).

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

