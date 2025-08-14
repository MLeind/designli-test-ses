import { Injectable } from '@nestjs/common';
import { OutputDto } from '../ses/dto/out.dto';
import { SesEventMessage } from '../ses/dto/ses-event';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class MapperService {
  private monthNameEn(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
  // Avoid relying on OS locales for portability
    const meses = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    return isNaN(d.getTime()) ? '' : meses[d.getUTCMonth()];
  }

  private localPart(addr?: string): string {
    if (!addr) return '';
  // "Name <user@domain>" -> user@domain
    const angle = addr.match(/<([^>]+)>/);
    const email = (angle?.[1] ?? addr).trim();
    const at = email.indexOf('@');
    return at > 0 ? email.slice(0, at) : email;
  }

  private mapVerdict(v?: { status?: string }): boolean {
    return (v?.status || '').toUpperCase() === 'PASS';
  }

  mapSesEventToOutput(sesEvent: SesEventMessage): OutputDto {
    // Library-based mapping using class-transformer
    return plainToInstance(OutputDto, sesEvent, { excludeExtraneousValues: true });
  }
}
