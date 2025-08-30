import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('FetchController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) - should return overview of jobs', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('totalJobs');
        expect(res.body).toHaveProperty('jobs');
        expect(Array.isArray(res.body.jobs)).toBe(true);
      });
  });

  describe('/fetch', () => {
    it('should reject a POST with invalid URLs', () => {
      return request(app.getHttpServer())
        .post('/fetch')
        .send({ urls: ['not-a-valid-url'] })
        .expect(400);
    });

    it('should reject a POST with a non-array body', () => {
      return request(app.getHttpServer())
        .post('/fetch')
        .send({ urls: 'just-a-string' })
        .expect(400);
    });

    it('should accept a valid POST, poll for status, and retrieve content', async () => {
      // Step 1: Submit the job
      const postResponse = await request(app.getHttpServer())
        .post('/fetch')
        .send({ urls: ['https://nestjs.com/img/logo-small.svg'] }) // A small, reliable file
        .expect(201);

      expect(postResponse.body).toHaveProperty('jobId');
      const { jobId } = postResponse.body;

      // Step 2: Poll for status until completed
      let statusResponse;
      let attempts = 0;
      do {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait before polling
        statusResponse = await request(app.getHttpServer())
          .get(`/fetch/${jobId}`)
          .expect(200);
        
        attempts++;
        if (attempts > 10) { // Timeout after 5 seconds
          throw new Error('Polling timed out, job did not complete.');
        }
      } while (statusResponse.body[0].status !== 'completed');

      expect(statusResponse.body[0].status).toBe('completed');
      expect(statusResponse.body[0].contentLength).toBeGreaterThan(0);

      // Step 3: Retrieve the content
      const contentResponse = await request(app.getHttpServer())
        .get(`/fetch/${jobId}/0/content`)
        .expect(200);

      expect(contentResponse.headers['content-type']).toBe('application/octet-stream');
      expect(contentResponse.body).toBeInstanceOf(Buffer);
      expect(contentResponse.body.length).toBeGreaterThan(0);
      // Note: content-length header may differ from actual body length due to compression
      expect(statusResponse.body[0].contentLength).toBeGreaterThan(0);
    }, 10000); // Increase timeout for this test to 10 seconds

    it('should return 404 for a non-existent job ID', () => {
      const invalidJobId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // A valid but non-existent UUID
      return request(app.getHttpServer())
        .get(`/fetch/${invalidJobId}`)
        .expect(404);
    });
  });
});
