import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
  } from '@nestjs/common';
  import { Response } from 'express';
  import { responseError } from '../helpers/response.helper';
  
  @Catch()
  export class AllExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
      const response = host.switchToHttp().getResponse<Response>();
  
      let status = 500;
      let message = `Internal Server Error`;
  
      // Khu vực lỗi kiểm soát được
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        message = exception.message;
      }
  
      // console.log({ exception });
  
      const result = responseError(message, status, exception?.stack);
  
      response.status(status).json(result);
    }
  }
  
  @Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response
      .status(status)
      .json(responseError(
        exceptionResponse['message'] || exception.message,
        status,
        null
      ));
  }
}