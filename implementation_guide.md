# NestJS URL Fetcher Service on GCP - Implementation Guide

This document outlines the step-by-step instructions for building, testing, and deploying the URL Fetcher service as per the project requirements.

### Phase 1: Environment Setup and Project Initialization

1.  **Connect to GCP Instance:**
    *   Save the provided private key to a file (e.g., `gcp_key`).
    *   Set the correct permissions for the key file: `chmod 400 gcp_key`.
    *   Connect to the instance via SSH: `ssh -i <path_to>/gcp_key candidate@<IP_ADDRESS>`.

2.  **Install Dependencies:**
    *   Update the package manager: `sudo apt-get update`.
    *   Install Node.js and npm. We recommend using `nvm` (Node Version Manager) for flexibility.
        ```bash
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
        source ~/.bashrc
        nvm install --lts
        nvm use --lts
        ```
    *   Install the NestJS CLI globally: `npm install -g @nestjs/cli`.

3.  **Create NestJS Project:**
    *   Generate a new project: `nest new url-fetcher-service`.
    *   Navigate into the project directory: `cd url-fetcher-service`.

### Phase 2: Proof of Concept (POC) Implementation

1.  **Create a New Module:**
    *   Generate a module to encapsulate the feature's logic.
        ```bash
        nest generate module fetch
        nest generate controller fetch
        nest generate service fetch
        ```
    *   This creates `fetch.module.ts`, `fetch.controller.ts`, and `fetch.service.ts` inside `src/fetch`.

2.  **Define Data Models (DTOs):**
    *   Install validation packages: `npm install class-validator class-transformer`.
    *   Create a DTO for the POST request body in `src/fetch/dto/submit-urls.dto.ts`:
        ```typescript
        import { IsArray, IsUrl } from 'class-validator';

        export class SubmitUrlsDto {
          @IsArray()
          @IsUrl({}, { each: true })
          urls: string[];
        }
        ```

3.  **Implement the Service (`fetch.service.ts`):**
    *   This service will handle the core logic: storing URLs and fetching their content.
    *   Install `@nestjs/axios` for making HTTP requests: `npm install @nestjs/axios axios`.
    *   Import `HttpModule` in `fetch.module.ts`.
    *   Use a simple in-memory array or map to store the results for the POC.
    *   The `submit` method should accept URLs, initiate fetching in the background (do not `await` the fetch process in the controller), and return an identifier for the job.
    *   The `getResults` method will return the stored results.

4.  **Implement the Controller (`fetch.controller.ts`):**
    *   Define the `POST` and `GET` endpoints.
    *   Use the `SubmitUrlsDto` with `ValidationPipe` to validate incoming POST requests.
    *   The `POST` endpoint will call the service's `submit` method.
    *   The `GET` endpoint will call the service's `getResults` method.

5.  **Run the Application:**
    *   Start the development server: `npm run start:dev`.
    *   The application will be accessible on `http://<INSTANCE_IP>:3000` by default. The requirements mention port 8080, so adjust the port in `src/main.ts` if needed: `await app.listen(8080);`.

6.  **Add API Documentation (Swagger):**
    *   Install the required package: `npm install @nestjs/swagger`.
    *   In `src/main.ts`, configure `SwaggerModule` to build and serve the API documentation on the `/api` endpoint.
    *   Decorate the controller methods and DTOs with `@ApiOperation`, `@ApiResponse`, `@ApiProperty`, etc., to provide clear and descriptive documentation for each endpoint and model.

7.  **Add Overview Endpoint:**
    *   Enhance the `FetchService` with a `getAllJobs()` method that returns a summary of all submitted jobs.
    *   Update the root controller (`AppController`) to show an overview of all jobs instead of a simple "Hello World" message.
    *   Export the `FetchService` from `FetchModule` so it can be injected into other controllers.
    *   This provides users with a quick way to see all their submitted jobs and their current status.

### Phase 3: Testing

1.  **Unit Testing (`fetch.service.spec.ts`):**
    *   Write unit tests for the `FetchService`.
    *   Mock the `HttpService` to simulate successful and failed URL fetch attempts without making real network calls.
    *   Test edge cases: empty URL list, invalid URLs, and server errors during fetch.

2.  **End-to-End (E2E) Testing (`/test/app.e2e-spec.ts`):**
    *   Write E2E tests to verify the complete flow.
    *   Simulate a `POST` request with a list of URLs.
    *   Poll the `GET` endpoint to check if the results are processed and returned correctly.
    *   Use `supertest` (included with NestJS starter) to perform the HTTP requests against the running application instance.
    *   Test the validation pipe by sending malformed data.

### Phase 4: Documentation and Deployment

1.  **Code Commenting:**
    *   Ensure all public methods in services and controllers have clear JSDoc comments explaining their purpose, parameters, and return values.
    *   Comment complex or non-obvious blocks of code.

2.  **Create a `README.md`:**
    *   **Project Title and Description:** A brief overview of the service.
    *   **API Endpoints:** Document the `POST` and `GET` endpoints, including request body/params and example responses.
        *   `POST /fetch`
        *   `GET /fetch/:id` (if using job IDs) or `GET /fetch`
    *   **Setup and Installation:** Instructions on how to clone the repository and install dependencies (`npm install`).
    *   **Running the Application:**
        *   Development mode: `npm run start:dev`
        *   Production mode: `npm run build`, `npm run start:prod`
    *   **Running Tests:** `npm run test` (unit) and `npm run test:e2e`.

3.  **Final Deployment on GCP:**
    *   Build the application for production: `npm run build`.
    *   Run the production server. It's highly recommended to use a process manager like `pm2` to keep the service running.
        ```bash
        npm install -g pm2
        pm2 start dist/main.js --name url-fetcher
        ```
    *   Verify the service is accessible publicly on the specified port (80 or 8080).

### Phase 5: Future Enhancements (Planning)

Consider and document plans for future improvements:

*   **Scalability:**
    *   **Job Queue:** Replace in-memory background processing with a robust job queue system (e.g., Bull with Redis) to handle a large volume of requests and provide retry mechanisms.
    *   **Database:** Replace the in-memory store with a persistent database (e.g., PostgreSQL, MongoDB) to store job statuses and fetched content permanently.
*   **User Experience:**
    *   **WebSockets:** Implement a WebSocket gateway to push real-time status updates to clients as URLs are fetched, rather than requiring them to poll the GET endpoint.
*   **User Interface (UI):**
    *   Plan for a simple front-end application (e.g., using React, Vue, or Angular) that provides a form to submit URLs and a dashboard to view the results and their statuses in real-time.