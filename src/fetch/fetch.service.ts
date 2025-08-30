import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { firstValueFrom, map } from 'rxjs';

export interface FetchResult {
  status: 'pending' | 'completed' | 'error';
  url: string;
  contentLength?: number;
  content?: Buffer; // Store content for later retrieval
  error?: string;
}

@Injectable()
export class FetchService {
  private readonly results = new Map<string, FetchResult[]>();

  constructor(private readonly httpService: HttpService) {}

  async submit(urls: string[]): Promise<string> {
    const jobId = randomUUID();
    const initialResults: FetchResult[] = urls.map((url) => ({
      url,
      status: 'pending',
    }));
    this.results.set(jobId, initialResults);

    // Process URLs in the background without awaiting
    this.processUrls(jobId, urls);

    return jobId;
  }

  private processUrls(jobId: string, urls: string[]): void {
    urls.forEach(async (url, index) => {
      try {
        const response = await firstValueFrom(
          this.httpService
            .get(url, { responseType: 'arraybuffer' })
            .pipe(map((res) => res)),
        );
        const contentLength = response.headers['content-length']
          ? parseInt(response.headers['content-length'], 10)
          : response.data.length;

        const currentResults = this.results.get(jobId);
        if (currentResults) {
          currentResults[index] = {
            ...currentResults[index],
            status: 'completed',
            contentLength,
            content: response.data,
          };
        }
      } catch (error) {
        const currentResults = this.results.get(jobId);
        if (currentResults) {
          currentResults[index] = {
            ...currentResults[index],
            status: 'error',
            error: error.message,
          };
        }
      }
    });
  }

  getResults(jobId: string): Omit<FetchResult, 'content'>[] {
    const jobResults = this.results.get(jobId);
    if (!jobResults) {
      throw new NotFoundException(`Job with ID ${jobId} not found.`);
    }
    // Return results without the bulky content
    return jobResults.map(({ content, ...rest }) => rest);
  }

  getAllJobs(): { jobId: string; status: string; urlCount: number; completedCount: number; errorCount: number }[] {
    const allJobs: { jobId: string; status: string; urlCount: number; completedCount: number; errorCount: number }[] = [];
    
    for (const [jobId, results] of this.results.entries()) {
      const completedCount = results.filter(r => r.status === 'completed').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      const pendingCount = results.filter(r => r.status === 'pending').length;
      
      let overallStatus = 'completed';
      if (pendingCount > 0) {
        overallStatus = 'pending';
      } else if (errorCount > 0 && completedCount === 0) {
        overallStatus = 'error';
      } else if (errorCount > 0) {
        overallStatus = 'partial';
      }
      
      allJobs.push({
        jobId,
        status: overallStatus,
        urlCount: results.length,
        completedCount,
        errorCount
      });
    }
    
    return allJobs.reverse(); // Most recent first
  }

  getResultContent(jobId: string, index: number): Buffer {
    const jobResults = this.results.get(jobId);
    if (!jobResults) {
      throw new NotFoundException(`Job with ID ${jobId} not found.`);
    }

    const result = jobResults[index];
    if (!result) {
      throw new NotFoundException(`Result with index ${index} not found for job ${jobId}.`);
    }

    if (result.status !== 'completed' || !result.content) {
      throw new NotFoundException(`Result with index ${index} is not completed yet or has no content.`);
    }

    return result.content;
  }
}
