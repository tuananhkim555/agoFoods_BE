import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
  } from '@nestjs/common';
  import { AddressService } from './address.service';
  import { CreateUserAddressDto, UpdateUserAddressDto  } from './dto/address.dto';
  
  @Controller('user-address')
  export class AddressController {
    constructor(private readonly userAddressService: AddressService) {}
  
  
    @Get()
    findAll() {
      return this.userAddressService.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.userAddressService.findOne(id);
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserAddressDto: UpdateUserAddressDto) {
      return this.userAddressService.update(id, updateUserAddressDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.userAddressService.remove(id);
    }
  }
  