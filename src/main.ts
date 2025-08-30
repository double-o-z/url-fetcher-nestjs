import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = 8080;

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  const config = new DocumentBuilder()
    .setTitle('URL Fetcher Service')
    .setDescription('An API to asynchronously fetch content from a list of URLs.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger UI available at: http://localhost:${port}/api`);

  // Automatically open the Swagger UI in development mode only
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { default: open } = await import('open');
      await open(`http://localhost:${port}/api`);
    } catch (error) {
      console.log('Could not auto-open browser:', error.message);
    }
  }
}
bootstrap();
