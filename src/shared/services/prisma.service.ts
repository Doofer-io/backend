import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { PrismaClient } from '.prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  async onModuleInit() {
    await this.$connect();
  }

  async onApplicationShutdown(signal?: string) {
    if (signal === 'SIGINT' || signal === 'SIGTERM') {
      await this.$disconnect();
    }
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    const models = Reflect.ownKeys(this).filter(
      key => typeof key === 'string' && key[0] !== '_',
    ) as string[];

    return Promise.all(models.map(modelKey => this[modelKey].deleteMany()));
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
