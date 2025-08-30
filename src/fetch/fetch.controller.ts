import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { FetchService } from './fetch.service';
import { SubmitUrlsDto } from './dto/submit-urls.dto';
import type { Response } from 'express';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Fetch')
@Controller('fetch')
export class FetchController {
  constructor(private readonly fetchService: FetchService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a list of URLs for fetching' })
  @ApiResponse({ status: 201, description: 'Job submitted successfully.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid URLs provided.' })
  async submitUrls(@Body() submitUrlsDto: SubmitUrlsDto) {
    const jobId = await this.fetchService.submit(submitUrlsDto.urls);
    return { jobId };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get the status of a fetch job' })
  @ApiParam({ name: 'id', description: 'The UUID of the fetch job.' })
  @ApiResponse({ status: 200, description: 'The status of the job.' })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  getResults(@Param('id', ParseUUIDPipe) id: string) {
    return this.fetchService.getResults(id);
  }

  @Get(':id/:index/content')
  @ApiOperation({ summary: 'Get the fetched content of a specific URL' })
  @ApiParam({ name: 'id', description: 'The UUID of the fetch job.' })
  @ApiParam({ name: 'index', description: 'The index of the URL in the original submission.' })
  @ApiResponse({ status: 200, description: 'The raw content of the URL.' })
  @ApiResponse({ status: 404, description: 'Job, index, or content not found, or job not completed.' })
  getResultContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('index', ParseIntPipe) index: number,
    @Res() res: Response,
  ) {
    const content = this.fetchService.getResultContent(id, index);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(content);
  }
}
