import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE, APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './modules/auth/jwt.strategy';
import { PrismaService } from './common/prisma/prisma.service';
import { UploadService } from './common/services/upload.service';
import { FoodsService } from './modules/foods/foods.service';
import { FoodsModule } from './modules/foods/foods.module';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    FoodsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('ACCESS_TOKEN_SECRET'),
        signOptions: { 
          expiresIn: '1h'
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    JwtStrategy,
    ConfigService,
    PrismaService,
    UploadService,
    FoodsService,
  ],
})
export class AppModule {}

