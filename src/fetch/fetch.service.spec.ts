import { Test, TestingModule } from '@nestjs/testing';
import { FetchService } from './fetch.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError, NEVER } from 'rxjs';
import { NotFoundException } from '@nestjs/common';
import { AxiosResponse } from 'axios';

describe('FetchService', () => {
  let service: FetchService;
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FetchService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<FetchService>(FetchService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submit', () => {
    it('should return a job ID and initialize results as pending', async () => {
      // Mock with NEVER to prevent completion during this test
      mockHttpService.get.mockReturnValue(NEVER);
      
      const urls = ['http://example.com'];
      const jobId = await service.submit(urls);

      expect(typeof jobId).toBe('string');
      // Immediately check results before any async processing completes
      const results = service.getResults(jobId);
      expect(results).toEqual([{ url: 'http://example.com', status: 'pending' }]);
    });
  });

  describe('processUrls (tested via submit)', () => {
    it('should process a successful fetch and update status to completed', async () => {
      const url = 'http://success.com';
      const mockResponse: AxiosResponse = {
        data: Buffer.from('Success'),
        status: 200,
        statusText: 'OK',
        headers: { 'content-length': '7' },
        config: {} as any,
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const jobId = await service.submit([url]);

      await new Promise(resolve => setTimeout(resolve, 100));

      const results = service.getResults(jobId);
      expect(results[0].status).toBe('completed');
      expect(results[0].contentLength).toBe(7);
    });

    it('should process a failed fetch and update status to error', async () => {
      const url = 'http://fail.com';
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Network Error')));

      const jobId = await service.submit([url]);

      await new Promise(resolve => setTimeout(resolve, 100));

      const results = service.getResults(jobId);
      expect(results[0].status).toBe('error');
      expect(results[0].error).toBe('Network Error');
    });
  });

  describe('getResults', () => {
    it('should throw NotFoundException for an invalid job ID', () => {
      expect(() => service.getResults('invalid-id')).toThrow(NotFoundException);
    });

    it('should return results without content', async () => {
        const url = 'http://success.com';
        const mockResponse: AxiosResponse = {
          data: Buffer.from('Success'),
          status: 200,
          statusText: 'OK',
          headers: { 'content-length': '7' },
          config: {} as any,
        };
        mockHttpService.get.mockReturnValue(of(mockResponse));
  
        const jobId = await service.submit([url]);
        await new Promise(resolve => setTimeout(resolve, 100));

        const results = service.getResults(jobId);
        expect(results[0]).not.toHaveProperty('content');
        expect(results[0].status).toBe('completed');
    });
  });

  describe('getAllJobs', () => {
    it('should return empty array when no jobs exist', () => {
      const result = service.getAllJobs();
      expect(result).toEqual([]);
    });

    it('should return job summaries with correct status calculations', async () => {
      // Create multiple jobs with different statuses
      mockHttpService.get.mockReturnValue(of({
        data: Buffer.from('Success'),
        status: 200,
        statusText: 'OK',
        headers: { 'content-length': '7' },
        config: {} as any,
      }));

      const jobId1 = await service.submit(['http://success1.com', 'http://success2.com']);
      
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Network Error')));
      const jobId2 = await service.submit(['http://fail.com']);

      mockHttpService.get.mockReturnValue(NEVER);
      const jobId3 = await service.submit(['http://pending.com']);

      // Wait for async processing of first two jobs
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = service.getAllJobs();
      
      expect(result).toHaveLength(3);
      expect(result[0].jobId).toBe(jobId3); // Most recent first
      expect(result[0].status).toBe('pending');
      expect(result[1].jobId).toBe(jobId2);
      expect(result[1].status).toBe('error');
      expect(result[2].jobId).toBe(jobId1);
      expect(result[2].status).toBe('completed');
    });
  });

  describe('getResultContent', () => {
    let jobId: string;

    beforeEach(async () => {
        const url = 'http://success.com';
        const mockResponse: AxiosResponse = {
          data: Buffer.from('Success'),
          status: 200,
          statusText: 'OK',
          headers: { 'content-length': '7' },
          config: {} as any,
        };
        mockHttpService.get.mockReturnValue(of(mockResponse));
        jobId = await service.submit([url]);
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should return the content for a valid job and index', () => {
      const content = service.getResultContent(jobId, 0);
      expect(content).toBeInstanceOf(Buffer);
      expect(content.toString()).toBe('Success');
    });

    it('should throw NotFoundException for an invalid job ID', () => {
      expect(() => service.getResultContent('invalid-id', 0)).toThrow(NotFoundException);
    });

    it('should throw NotFoundException for an invalid index', () => {
      expect(() => service.getResultContent(jobId, 99)).toThrow(NotFoundException);
    });

    it('should throw NotFoundException if the job is not completed', async () => {
        // Use the NEVER observable to prevent completion
        mockHttpService.get.mockReturnValue(NEVER);
        
        const pendingJobId = await service.submit(['http://pending.com']);
        
        // Check that status remains pending
        const results = service.getResults(pendingJobId);
        expect(results[0].status).toBe('pending');

        // Then check for the exception when trying to get content
        expect(() => service.getResultContent(pendingJobId, 0)).toThrow(NotFoundException);
    });
  });
});
