/* eslint-disable @typescript-eslint/no-unused-vars */
import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE = 'responseMessage';
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE, message);
