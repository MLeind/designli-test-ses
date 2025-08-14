import { Module } from '@nestjs/common';
import { MapperService } from './map.prof';

@Module({
  providers: [MapperService],
  exports: [MapperService],
})
export class MappingModule {}
