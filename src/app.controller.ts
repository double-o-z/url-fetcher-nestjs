import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { FetchService } from './fetch/fetch.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Overview')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly fetchService: FetchService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get an overview of all submitted fetch jobs' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all fetch jobs with their current status.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        totalJobs: { type: 'number' },
        jobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobId: { type: 'string' },
              status: { type: 'string', enum: ['pending', 'completed', 'error', 'partial'] },
              urlCount: { type: 'number' },
              completedCount: { type: 'number' },
              errorCount: { type: 'number' }
            }
          }
        }
      }
    }
  })
  getOverview() {
    const jobs = this.fetchService.getAllJobs();
    return {
      message: 'URL Fetcher Service - Overview of all submitted jobs',
      totalJobs: jobs.length,
      jobs
    };
  }
}
