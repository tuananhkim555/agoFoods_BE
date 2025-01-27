import { HttpException, HttpStatus, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

    // Helper function để tạo ID tùy chỉnh
    private async generateCustomId(role: Role): Promise<string> {
        const prefix = {
            [Role.CUSTOMER]: 'KH',
            [Role.STORE]: 'ST',
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
    deleteUsers = async (id: string, currentUserId: string) => {
        // Kiểm tra user có tồn tại không
        const user = await this.prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            throw new BadRequestException('Tài khoản ID không tồn tại hoặc không đúng ID');
        }

        // Kiểm tra xem người dùng có đang cố xóa tài khoản của người khác không
        
      

        return this.prisma.user.delete({
            where: { id }
        });
    }

    //Lấy thông tin tài khoản
    getUserById = async (id: string) => {
      if(!id){
        throw new BadRequestException('Tài khoản không tồn tại');
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

        // Check if user is modifying their own account
        if (id !== currentUserId) {
            throw new BadRequestException('Bạn chỉ có thể chỉnh sửa thông tin tài khoản của chính mình');
        }

        // Prevent direct role changes
        if (updateUserDto.role && updateUserDto.role !== existingUser.role) {
            throw new BadRequestException('Không được phép thay đổi vai trò người dùng trực tiếp');
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
        const search = name || '';
        return this.prisma.user.findMany({
          where: { fullName: { contains: search } },
        });
    }
  
    //Tải ảnh đại diện
    uploadAvatar = async (file: Express.Multer.File, userId: number, p0: string) => {
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

    //Đăng ký cửa hàng
    async registerStore(
        userId: string, 
        storeData: {
            storeName: string;
            storeDescription: string;
            storeAddress: string;
        }
    ) {
        // Kiểm tra user có tồn tại không
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Tạo store mới
        const store = await this.prisma.store.create({
            data: {
                name: storeData.storeName,
                address: storeData.storeAddress,
                userId: userId,
                idCard: '',           // Add default or get from storeData
                birthDate: new Date(), // Add default or get from storeData
                hometown: '',         // Add default or get from storeData
                openTime: new Date(), // Add default or get from storeData
                closeTime: new Date() // Add default or get from storeData
            }
        });

        // Cập nhật role của user thành STORE
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { role: Role.STORE }
        });

        return {
            message: 'Store registered successfully',
            store,
            user: updatedUser
        };
    }

    // Set quyền ADMIN
    setAdminRole = async (userId: string) => {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { role: Role.ADMIN }
        });
    }
}
    