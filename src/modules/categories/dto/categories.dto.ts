import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';

export class Categories {
    @ApiProperty({
        description: 'The title of the category',
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        description: 'The value of the category',
    })
    @IsString()
    @IsNotEmpty()
    value: string;

    @ApiProperty({
        description: 'The image URL of the category',
    })
    @IsString()
    @IsNotEmpty()
    imageUrl: string;


    @IsEnum(CategoryType)
    type: CategoryType;


    @ApiProperty({ required: false })
    @IsOptional()
    createdAt?: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    updatedAt?: Date;

    @ApiProperty({ required: false })
    @IsOptional()
    version?: number;

}
  
