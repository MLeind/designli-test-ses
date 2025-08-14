import { Controller, Get, Query } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get()
  async email(@Query('path') path: string) {
    return this.emailService.processEmail(path);
  }
}
