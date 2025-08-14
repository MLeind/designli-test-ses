import { Injectable } from '@nestjs/common';
import { MapperService } from '../map/map.prof';
import { SesSnsEventDto, SesEventMessage } from './dto/ses-event';
import { OutputDto } from './dto/out.dto';

@Injectable()
export class SesService {
  constructor(private readonly mapperService: MapperService) {}

  /** Body can be SNS→SES (Records[].Sns.Message = JSON string) or a raw SES message. */
  transform(body: SesSnsEventDto | SesEventMessage): OutputDto {
    const maybeRecords: any = (body as any)?.Records;
    let sesMsg: SesEventMessage;
    // Check if we have SNS records with a Message field
    if (Array.isArray(maybeRecords) && maybeRecords[0]) {
      const record = maybeRecords[0];
      
      if (record.Sns?.Message) {
        // SNS case: Message is a JSON string (SES)
        sesMsg = JSON.parse(record.Sns.Message);
      } else if (record.ses) {
        // Direct AWS SES: Records[0].ses
        sesMsg = {
          mail: record.ses.mail,
          receipt: record.ses.receipt,
          notificationType: 'Received', // default value
          eventType: record.eventSource || 'aws:ses'
        };
      } else {
        // Fallback: use the entire record
        sesMsg = record as SesEventMessage;
      }
    } else {
      // Case: raw SES JSON already provided
      sesMsg = body as SesEventMessage;
    }

    return this.mapperService.mapSesEventToOutput(sesMsg);
  }
}
