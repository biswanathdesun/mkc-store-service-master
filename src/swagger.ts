import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('MKC Store service apis.')
    .setDescription('All store service apis for MKC project.')
    .setVersion('1.0')
    .addServer(process.env.HOST_URL)
    .addTag('APIS')
    .addBearerAuth({
      in: 'header',
      type: 'apiKey',
      name: 'Authorization',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}
