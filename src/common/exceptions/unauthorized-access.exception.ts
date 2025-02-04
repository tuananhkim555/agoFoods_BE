import { ForbiddenException } from "@nestjs/common";

export class UnauthorizedAccessException extends ForbiddenException {
    constructor() {
      super('Người dùng không được phép thực hiện chức năng này');
    }
  }