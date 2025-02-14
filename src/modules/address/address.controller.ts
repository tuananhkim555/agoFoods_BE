import { Controller, Post, Body, Req, UseGuards, Delete, Param, Get, Patch } from '@nestjs/common';
import { AddressService } from './address.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAddressDto } from './dto/address.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('api/address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('create')
  async addAddress(@Req() req, @Body() createAddressDto: CreateAddressDto) {
    try {
      const userId = req.user.id; // Lấy ID từ JWT
      return await this.addressService.addAddress(userId, createAddressDto);
    } catch (error) {
      return { status: false, message: error.message };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('all')
  async getAddress(@Req() req) {
    try {
      const userId = req.user.id;
      return await this.addressService.getAddress(userId);
    } catch (error) {
      return { status: false, message: error.message };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  async deleteAddress(@Req() req, @Param('id') addressId: string) {
    try {
      const userId = req.user.id;
      return await this.addressService.deleteAddress(userId, addressId);
    } catch (error) {
      return { status: false, message: error.message };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch('default/:id')
  async setAddressDefault(@Req() req, @Param('id') addressId: string) {
    try {
      const userId = req.user.id; // Lấy ID từ JWT
      return await this.addressService.setAddressDefault(userId, addressId);
    } catch (error) {
      return { status: false, message: error.message };
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('default')
  async getDefaultAddress(@Req() req) {
    try {
      const userId = req.user.id; // Lấy ID từ JWT
      return await this.addressService.getDefaultAddress(userId);
    } catch (error) {
      return { status: false, message: error.message };
    }
  }
}



