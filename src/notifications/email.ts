// Email Notification Service using Resend

import { NormalizedJob } from '../types';
import { APP_CONFIG } from '../config';

export interface EmailOptions {
  recipient: string;
  newJobs: NormalizedJob[];
  totalDiscovered: number;
  apiKey?: string;
  dashboardUrl?: string;
}

export class EmailNotificationService {
  /**
   * Sends a modern, responsive HTML digest of newly discovered jobs
   */
  public async sendNewJobsDigest(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { recipient, newJobs, totalDiscovered, apiKey, dashboardUrl } = options;

    if (!apiKey) {
      return { success: false, error: 'RESEND_API_KEY is not configured in Worker secrets.' };
    }

    if (!recipient || newJobs.length === 0) {
      return { success: true, error: 'No new jobs or empty recipient.' };
    }

    const highMatches = newJobs.filter(j => (j.matchScore?.overallScore || 0) >= 80);
    const remoteJobs = newJobs.filter(j => j.remoteType === 'remote');

    const subject = `JobRadar — ${newJobs.length} new jobs found`;

    const html = this.buildHtmlEmail({
      newJobs,
      totalDiscovered,
      highMatchCount: highMatches.length,
      remoteCount: remoteJobs.length,
      dashboardUrl: dashboardUrl || 'https://jobradar.pages.dev',
    });

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'JobRadar/1.0',
        },
        body: JSON.stringify({
          from: APP_CONFIG.notifications.defaultFromEmail,
          to: [recipient],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Resend error: ${response.status} - ${errorText}` };
      }

      const data = (await response.json()) as { id: string };
      return { success: true, messageId: data.id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  private buildHtmlEmail(params: {
    newJobs: NormalizedJob[];
    totalDiscovered: number;
    highMatchCount: number;
    remoteCount: number;
    dashboardUrl: string;
  }): string {
    const topMatches = params.newJobs.slice(0, 5);

    const jobRows = topMatches
      .map(
        j => `
        <div style="padding: 14px 18px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 15px; font-weight: 600; color: #0f172a;">${this.escape(j.company)}</span>
            <span style="font-size: 13px; font-weight: 600; color: #2563eb; background: #eff6ff; padding: 2px 8px; border-radius: 9999px;">
              ${j.matchScore?.overallScore || 0}% Match
            </span>
          </div>
          <div style="font-size: 14px; font-weight: 500; color: #334155; margin-top: 4px;">${this.escape(j.title)}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
            ${j.remoteType === 'remote' ? '● Remote ' : ''}
            ${j.location.length > 0 ? `● ${this.escape(j.location.join(', '))}` : ''}
          </div>
          <div style="margin-top: 10px;">
            <a href="${this.escape(j.applicationUrl)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; font-size: 12px; font-weight: 600; color: #ffffff; background: #0f172a; padding: 6px 12px; border-radius: 6px; text-decoration: none;">
              Open Original Job &rarr;
            </a>
          </div>
        </div>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>JobRadar Alert</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a;">
          <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
            <div style="background: #0f172a; padding: 24px 28px; color: #ffffff;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">JobRadar</h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #94a3b8;">Your personal job-search assistant</p>
            </div>
            <div style="padding: 24px 28px;">
              <div style="margin-bottom: 20px;">
                <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">${params.newJobs.length} new jobs found</h2>
                <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">
                  <strong>${params.highMatchCount}</strong> strong matches (&gt;80%) &bull;
                  <strong>${params.remoteCount}</strong> remote opportunities.
                </p>
              </div>

              <div style="margin-bottom: 24px;">
                ${jobRows}
              </div>

              <div style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                <a href="${this.escape(params.dashboardUrl)}" style="display: inline-block; background: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 8px; text-decoration: none;">
                  Open JobRadar Dashboard &rarr;
                </a>
              </div>
            </div>
            <div style="background: #f8fafc; padding: 14px 28px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9;">
              This is a personal automated notification from JobRadar.
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export const emailService = new EmailNotificationService();
