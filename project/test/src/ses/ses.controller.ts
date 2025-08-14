import { Body, Controller, Post } from '@nestjs/common';
import { SesService } from './ses.services';
import { SesSnsEventDto } from './dto/ses-event';
import { OutputDto } from './dto/out.dto';

@Controller('map')
export class SesController {
  constructor(private readonly svc: SesService) {}

  /** Accepts AWS SNS→SES JSON (or raw SES) and returns the target JSON */
  @Post()
  map(@Body() body: SesSnsEventDto | Record<string, any>): OutputDto {
    return this.svc.transform(body as any);
  }
}
