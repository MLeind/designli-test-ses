import { Injectable, BadRequestException } from '@nestjs/common';
import { simpleParser } from 'mailparser';
import * as fs from 'fs/promises';
import axios from 'axios';
import { JSDOM } from 'jsdom';

@Injectable()
export class EmailService {
  /** Process .eml from local path or URL and return the first valid JSON found */
  async processEmail(pathOrUrl: string): Promise<any> {
    if (!pathOrUrl) throw new BadRequestException('Missing ?path=');

  // 1) Load raw email
    const rawEmail = pathOrUrl.startsWith('http')
      ? Buffer.from((await axios.get(pathOrUrl, { responseType: 'arraybuffer' })).data)
      : await fs.readFile(pathOrUrl);

  // 2) Parse MIME message
    const parsed = await simpleParser(rawEmail);

  // 3) Case 1: .json attachment
    for (const att of parsed.attachments ?? []) {
      if (att.contentType === 'application/json' || att.filename?.toLowerCase().endsWith('.json')) {
        try {
          return JSON.parse(att.content.toString('utf-8'));
        } catch {
          // keep looking for other JSON sources
        }
      }
    }

  // 4) Case 2: direct .json URL in plaintext body
    if (parsed.text) {
      const urlMatch = parsed.text.match(/https?:\/\/\S+?\.json(\?\S+)?/i);
      if (urlMatch) {
        const { data } = await axios.get(urlMatch[0], { timeout: 15000 });
        return data;
      }
    }

  // 5) Case 3: link to a web page that contains a link to a .json
    if (parsed.html) {
      const dom = new JSDOM(parsed.html);
      const links = Array.from(dom.window.document.querySelectorAll('a'))
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((h) => h?.startsWith('http'));

      for (const link of links) {
        try {
          const page = await axios.get(link, { timeout: 15000 });
          // Find .json in destination HTML
          const jsonHref = this.findJsonInHtml(page.data);
          if (jsonHref) {
            const { data } = await axios.get(jsonHref, { timeout: 15000 });
            return data;
          }
          // fallback: quick regex in HTML
          const m = String(page.data).match(/https?:\/\/\S+?\.json(\?\S+)?/i);
          if (m) {
            const { data } = await axios.get(m[0], { timeout: 15000 });
            return data;
          }
        } catch {
          // continue with next link
        }
      }
    }

  throw new BadRequestException('No valid JSON found in the email.');
  }

  /** Try to find an <a href="...json"> in an HTML page */
  private findJsonInHtml(html: string): string | null {
    try {
      const dom = new JSDOM(html);
      const a = Array.from(dom.window.document.querySelectorAll('a')).find((el) =>
        (el as HTMLAnchorElement).href?.match(/\.json(\?\S+)?$/i),
      ) as HTMLAnchorElement | undefined;
      return a?.href ?? null;
    } catch {
      return null;
    }
  }
}
