import {  Injectable, BadRequestException, NotFoundException, UnauthorizedException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, UserFilterDto, UserNameSearchDto } from './dto/users.dto';
import * as bcrypt from 'bcrypt';
import { Gender, Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { compressAndUploadImage } from 'src/common/multer/buffer-image';
declare module 'express' {
    interface Request {
        user?: any;  // Or define a more specific type for your user
    }
}

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    // Helper function để tạo ID tùy chỉnh
    private async generateCustomId(role: Role): Promise<string> {
        const prefix = {
            [Role.CUSTOMER]: 'KH',
            [Role.RESTAURANTS]: 'ST',
            [Role.SHIPPER]: 'SH',
            [Role.ADMIN]: 'AD'
        }[role];

        // Tìm user cuối cùng của role này
        const lastUser = await this.prisma.user.findFirst({
            where: { role },
            orderBy: { id: 'desc' }
        });

        let number = 1;
        if (lastUser) {
            // Lấy số từ ID cuối cùng và tăng lên 1
            const lastNumber = parseInt(lastUser.id.slice(-3));
            number = lastNumber + 1;
        }

        // Tạo số thứ tự với padding 3 số
        return `${prefix}${number.toString().padStart(3, '0')}`;
    }

    //Lấy danh sách tài khoản
    getAllUsers = async(req: Request) => {
        let { pageIndex, pageSize } = req.query as any;

        pageIndex = +pageIndex > 0 ? +pageIndex : 1; //chuỗi convert '' sang Number
        pageSize = +pageSize > 0 ? +pageSize : 3;

        const skip = (pageIndex - 1) * pageSize;
        const totalItems = await this.prisma.user.count();
        const totalPages = Math.ceil(totalItems / pageSize);
        // skip: (page -1) * pageSize,

    const users = await this.prisma.user.findMany({
      take: pageSize, //Limit
      skip: skip, //Offset

      orderBy: {
        createdAt: 'desc',
      },
    });
  
    return {
      pageIndex: pageIndex,
      pageSize: pageSize,
      totalItems: totalItems,
      totalPages: totalPages,
      items: users || [],
    };
  }

    //Tạo tài khoản
    createUser = async (body: CreateUserDto): Promise<User> => {
        if(!body.fullName || !body.email || !body.password || !body.phone || !body.role || !body.gender || !body.birthday){
            throw new BadRequestException('Vui lòng nhập đầy đủ thông tin');
        }

        // Ngăn tạo tài khoản ADMIN trực tiếp
        if(body.role === Role.ADMIN) {
            throw new BadRequestException('Không thể tạo tài khoản ADMIN trực tiếp');
        }
        // Kiểm tra email đã tồn tại
        const existingEmail = await this.prisma.user.findFirst({
            where: { email: body.email }
        });
        if (existingEmail) {
            throw new BadRequestException('Email này đã được đăng ký');
        }

        // Kiểm tra số điện thoại đã tồn tại
        const existingPhone = await this.prisma.user.findFirst({
            where: { phone: body.phone }
        });
        if (existingPhone) {
            throw new BadRequestException('Số điện thoại này đã được đăng ký');
        }

        const customId = await this.generateCustomId(body.role as Role);
        const hashedPassword = await bcrypt.hash(body.password, 10);
        
        return this.prisma.user.create({
            data: {
                id: customId,
                fullName: body.fullName,
                email: body.email,
                password: hashedPassword,
                phone: body.phone,
                role: body.role as Role,
                gender: body.gender as Gender,
                birthday: body.birthday,
                status: true,
            },
        });
    }

    //Xóa tài khoản
    async deleteUsers(id: string, currentUser: User) {
      try {
          // Kiểm tra user có tồn tại không
          const userToDelete = await this.prisma.user.findUnique({
              where: { id }
          });
  
          if (!userToDelete) {
              throw new NotFoundException('Tài khoản không tồn tại');
          }
  
          // Chỉ ADMIN hoặc chính user mới có thể xóa
          if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
              throw new ForbiddenException('Không có quyền xóa tài khoản này');
          }
  
          // 🛠 Xóa tất cả dữ liệu liên quan trước khi xóa User
          await this.prisma.restaurant.deleteMany({ where: { userId: id } });
          await this.prisma.categories.deleteMany({ where: { id } });
          await this.prisma.food.deleteMany({ where: { id } });
  
          // Xóa User sau khi xóa tất cả dữ liệu liên quan
          await this.prisma.user.delete({ where: { id } });
  
          return {
              status: 'success',
              code: 200,
              message: 'Xóa tài khoản thành công'
          };
  
      } catch (error) {
          console.error(error);
  
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
              throw new BadRequestException(`Không thể xóa tài khoản này: ${error.message}`);
          }
          throw error;
      }
  }  

    //Lấy thông tin tài khoản
    getUserById = async (id: string, req: any) => {
      if(!id){
        throw new BadRequestException('Tài khoản không tồn tại');
      }
      if(req.user.role !== Role.ADMIN && req.user.id !== id){
        throw new UnauthorizedException('Bạn không có quyền xem thông tin tài khoản khác');
      }
      return this.prisma.user.findUnique({
            where: { id: id },
      });
    }

    //Tìm kiếm và phân trang
    getPaginatedUsers = async (filters: UserFilterDto) => {
        const { pageIndex, pageSize, keyword } = filters;
        const items_per_page = pageSize;
        const page = pageIndex;
        const search = keyword || '';
    
        const users = await this.prisma.user.findMany({
          take: items_per_page,
          skip: (page - 1) * items_per_page,
          where: {
            OR: [
              {
                fullName: { contains: search },
              },
              {
                email: { contains: search },
              },
            ],
            AND: [
              {
                status: true,
              },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
    
        const total = await this.prisma.user.count({
          where: {
            OR: [
              {
                fullName: {
                  contains: search,
                },
              },
              {
                email: {
                  contains: search,
                },
              },
            ],
            AND: [
              {
                status: true,
              },
            ],
          },
        });
    
        return {
          data: users,
          total,
          currentPage: page,
          itemsPerPage: items_per_page,
        };
    }

    //Cập nhật thông tin tài khoản
    updateUser = async (id: string, currentUserId: string, updateUserDto: UpdateUserDto) => {
        if (!id) {
            throw new BadRequestException('Tài khoản không tồn tại');
        }

        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            throw new NotFoundException('Tài khoản không tồn tại');
        }

        // Prepare update data
        const updateData: any = {
            fullName: updateUserDto.fullName,
            email: updateUserDto.email,
            phone: updateUserDto.phone,
            gender: updateUserDto.gender as Gender,
            birthday: updateUserDto.birthday,
        };

        // Only hash and update password if it's provided
        if (updateUserDto.password) {
            updateData.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        
        return this.prisma.user.update({
            where: { id },
            data: updateData,
        });
    }

    //Tìm kiếm tài khoản
    searchUsers = async (filters: UserNameSearchDto) => {
        const { name } = filters;
        const search = name || ''

        return this.prisma.user.findMany({
          where: { fullName: { contains: search } },
        });
    }
  
    //Tải ảnh đại diện    
    async uploadAvatar(file: Express.Multer.File, userId: number) {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }
    
      try {
        const avatarUrl: string = await compressAndUploadImage(file); // Avatar URL luôn là string
    
        // Cập nhật avatar trong database
        const updatedUser = await this.prisma.user.update({
          where: { id: String(userId) },
          data: { avatar: avatarUrl, updatedAt: new Date() },
          select: { id: true, fullName: true, email: true, avatar: true },
        });
    
        return {
          message: 'Avatar uploaded and compressed successfully',
          user: updatedUser,
        };
      } catch (error) {
        console.error('Upload avatar error:', error);
        throw new BadRequestException('Failed to update avatar');
      }
    }
    
    

    
    // Set quyền ADMIN
    async setAdmin(userId: string) {
        try {
            const user = await this.prisma.user.update({
                where: { id: userId },
                data: { role: Role.ADMIN },
            });
            return user;
        } catch (error) {
            console.error('Error setting user as admin:', error);
            throw new InternalServerErrorException('Could not set user as admin: ' + error.message);
        }
    }
}
