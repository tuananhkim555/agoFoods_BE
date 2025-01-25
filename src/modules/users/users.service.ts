import { HttpException, HttpStatus, Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, UserFilterDto, UserNameSearchDto } from './dto/users.dto';
import * as bcrypt from 'bcrypt';
import { Gender, Role, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

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
        const hashedPassword = await bcrypt.hash(body.password, 10);
        return this.prisma.user.create({
          data: {
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
    deleteUsers = async (id: string) => {
        return this.prisma.user.delete({
            where: { id: id },
          });
    }

    //Lấy thông tin tài khoản
    getUserById = async (id: string) => {
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
    updateUser = async (id: string, updateUserDto: UpdateUserDto) => {
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      
      return this.prisma.user.update({
        where: { id: id },
        data: {
          fullName: updateUserDto.name,
          email: updateUserDto.email,
          password: hashedPassword,
          phone: updateUserDto.phone,
          role: updateUserDto.role as Role,
          gender: updateUserDto.gender as Gender,
          birthday: updateUserDto.birthday,
        }
      });
    }

    //Tìm kiếm tài khoản
    searchUsers = async (filters: UserNameSearchDto) => {
        const { name } = filters;
        const search = name || '';
        return this.prisma.user.findMany({
          where: { fullName: { contains: search } },
        });
    }
  
    //Tải ảnh đại diện
    uploadAvatar = async (file: Express.Multer.File, userId: number) => {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        try {
            const avatarUrl = `uploads/avatars/${file.filename}`;
            
            const updatedUser = await this.prisma.user.update({
                where: { id: String(userId) },
                data: {
                    avatar: avatarUrl,
                    updatedAt: new Date(),
                },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatar: true,
                },
            });

            return {
                message: 'Avatar uploaded successfully',
                user: updatedUser,
            };
        } catch (error) {
            console.error('Upload avatar error:', error);
            throw new BadRequestException('Failed to update avatar');
        }
    }
}
    