import { Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

// src/common/helpers/id-generator.helper.ts
export class IdGenerator {
    static async generateUserId(role: string, prisma: PrismaService): Promise<string> {
      const prefix = this.getRolePrefix(role);
      const count = await prisma.user.count({
        where: { role: role as Role}
      });
      const number = (count + 1).toString().padStart(3, '0');
      return `${prefix}${number}`;
    }
  
    private static getRolePrefix(role: string): string {
      switch (role) {
        case 'CUSTOMER': return 'KH';
        case 'SHIPPER': return 'SH';
        case 'RESTAURANTS': return 'ST';
        case 'ADMIN': return 'AD';
        default: return 'US';
      }
    }
  }

