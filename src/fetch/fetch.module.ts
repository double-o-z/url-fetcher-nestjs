import { Module } from '@nestjs/common';
import { FetchController } from './fetch.controller';
import { FetchService } from './fetch.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [FetchController],
  providers: [FetchService],
  exports: [FetchService], // Export so other modules can use it
})
export class FetchModule {}
