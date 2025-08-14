import { Module } from '@nestjs/common';
import { SesService } from './ses.services';
import { SesController } from './ses.controller';
import { MappingModule } from '../map/map.module';

@Module({
  imports: [MappingModule],
  controllers: [SesController],
  providers: [SesService],
})
export class SesModule {}
