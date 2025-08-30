import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUrl } from 'class-validator';

export class SubmitUrlsDto {
  @ApiProperty({
    description: 'An array of URLs to fetch content from.',
    example: ['https://www.google.com', 'https://www.github.com'],
    type: [String],
  })
  @IsArray()
  @IsUrl({}, { each: true })
  urls: string[];
}
