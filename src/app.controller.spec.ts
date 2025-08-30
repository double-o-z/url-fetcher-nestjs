import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FetchService } from './fetch/fetch.service';

describe('AppController', () => {
  let appController: AppController;
  let fetchService: FetchService;

  const mockFetchService = {
    getAllJobs: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: FetchService,
          useValue: mockFetchService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    fetchService = app.get<FetchService>(FetchService);
  });

  describe('root', () => {
    it('should return overview with no jobs initially', () => {
      mockFetchService.getAllJobs.mockReturnValue([]);
      
      const result = appController.getOverview();
      
      expect(result).toEqual({
        message: 'URL Fetcher Service - Overview of all submitted jobs',
        totalJobs: 0,
        jobs: []
      });
    });

    it('should return overview with jobs when they exist', () => {
      const mockJobs = [
        {
          jobId: 'test-job-1',
          status: 'completed',
          urlCount: 2,
          completedCount: 2,
          errorCount: 0
        },
        {
          jobId: 'test-job-2', 
          status: 'pending',
          urlCount: 1,
          completedCount: 0,
          errorCount: 0
        }
      ];
      
      mockFetchService.getAllJobs.mockReturnValue(mockJobs);
      
      const result = appController.getOverview();
      
      expect(result).toEqual({
        message: 'URL Fetcher Service - Overview of all submitted jobs',
        totalJobs: 2,
        jobs: mockJobs
      });
    });
  });
});
