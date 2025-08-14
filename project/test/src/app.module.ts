import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SesModule } from './ses/ses.module';
import { MappingModule } from './map/map.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [MappingModule,SesModule, EmailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
