"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const frontendUrl = process.env.FRONTEND_URL ??
        'http://localhost:3000';
    const originsPermitidas = [
        'http://localhost:5500',
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        frontendUrl,
    ];
    app.enableCors({
        origin: originsPermitidas,
    });
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Mesa Solidária API')
        .setDescription('API de autenticação e serviços do Mesa Solidária')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const documento = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api', app, documento);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
//# sourceMappingURL=main.js.map