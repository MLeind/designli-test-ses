import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export class SnsRecord {
  @IsObject() Sns!: { Message: string };
}

export class SesSnsEventDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => SnsRecord)
  Records!: SnsRecord[];
}

/** Tipos “internos” del mensaje SES (lo mínimo que necesita) */
export type VerdictStatus = { status?: 'PASS' | 'FAIL' | 'GRAY' | string };

export interface SesReceivingReceipt {
  processingTimeMillis?: number;
  spamVerdict?: VerdictStatus;
  virusVerdict?: VerdictStatus;
  spfVerdict?: VerdictStatus;
  dkimVerdict?: VerdictStatus;
  dmarcVerdict?: VerdictStatus;
}

export interface SesMail {
  timestamp?: string;              // ISO string
  source?: string;                 // "Sender Name <sender@example.com>" o "sender@example.com"
  destination?: string[];          // ["user@dominio.com", ...]
}

export interface SesEventMessage {
  notificationType?: string;       // variantes antiguas
  eventType?: string;              // “Delivery”, “Bounce”, etc. (event publishing)
  mail?: SesMail;
  receipt?: SesReceivingReceipt;   // presente en “receiving”
}

// Concrete class for Automapper source typing (interfaces are erased at runtime)
export class SesEventMessageClass implements SesEventMessage {
  notificationType?: string;
  eventType?: string;
  mail?: SesMail;
  receipt?: SesReceivingReceipt;
}
