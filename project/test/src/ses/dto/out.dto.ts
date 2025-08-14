import { Expose, Transform } from 'class-transformer';

type Verdict = { status?: string } | undefined;

const verdictPass = (v: Verdict) => (v?.status || '').toUpperCase() === 'PASS';
const monthNameEn = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const months = [
    'january','february','march','april','may','june','july','august','september','october','november','december'
  ];
  return isNaN(d.getTime()) ? '' : months[d.getUTCMonth()];
};
const localPart = (addr?: string) => {
  if (!addr) return '';
  const angle = addr.match(/<([^>]+)>/);
  const email = (angle?.[1] ?? addr).trim();
  const at = email.indexOf('@');
  return at > 0 ? email.slice(0, at) : email;
};

export class OutputDto {
  @Expose()
  @Transform(({ obj }) => verdictPass(obj?.receipt?.spamVerdict))
  spam!: boolean;

  @Expose()
  @Transform(({ obj }) => verdictPass(obj?.receipt?.virusVerdict))
  virus!: boolean;

  @Expose()
  @Transform(({ obj }) =>
    verdictPass(obj?.receipt?.spfVerdict) &&
    verdictPass(obj?.receipt?.dkimVerdict) &&
    verdictPass(obj?.receipt?.dmarcVerdict),
  )
  dns!: boolean;

  @Expose()
  @Transform(({ obj }) => monthNameEn(obj?.mail?.timestamp))
  month!: string;

  @Expose()
  @Transform(({ obj }) => (obj?.receipt?.processingTimeMillis ?? 0) > 1000)
  delayed!: boolean;

  @Expose()
  @Transform(({ obj }) => localPart(obj?.mail?.source))
  sender!: string;

  @Expose()
  @Transform(({ obj }) => (obj?.mail?.destination ?? []).map((a: string) => localPart(a)))
  recipients!: string[];
}
