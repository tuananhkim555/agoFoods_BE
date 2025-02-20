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
import { FoodsService } from './modules/foods/foods.service';
import { FoodsModule } from './modules/foods/foods.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { CategoriesModule } from './modules/categories/categories.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { RatingModule } from './modules/rating/rating.module';
import { AdminModule } from './modules/admin/admin.module';
import { AddressModule } from './modules/address/address.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { DrinksModule } from './modules/drinks/drinks.module';
@Module({
  imports: [
    AdminModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    RestaurantsModule,
    FoodsModule,
    DrinksModule,
    RatingModule,
    AddressModule,
    CartModule,
    OrderModule,
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
      useClass: JwtAuthGuard,  // Thêm JwtAuthGuard làm global guard
    },
    JwtStrategy,
    ConfigService,
    PrismaService,
    FoodsService,    
  ],
})
export class AppModule {}

