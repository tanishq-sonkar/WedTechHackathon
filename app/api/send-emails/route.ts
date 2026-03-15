// app/api/send-emails/route.ts
// Backend API — receives guest list + Gmail credentials from the planner,
// sends personalized RSVP emails to each guest using Nodemailer + Gmail SMTP.
// Credentials are NEVER stored — used only for this single request.

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface GuestPayload {
  name: string;
  email: string;
  message: string;
  rsvpLink: string;
}

interface RequestBody {
  senderEmail: string;
  appPassword: string;
  subject: string;
  guests: GuestPayload[];
}

// Build a beautiful HTML email from the plain text message
function buildHtmlEmail(message: string, guestName: string, rsvpLink: string, senderEmail: string): string {
  const htmlMessage = message
    .replace(/\n/g, '<br/>')
    .replace(
      new RegExp(rsvpLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      `<a href="${rsvpLink}" style="display:inline-block;background:linear-gradient(135deg,#C41E3A,#8B0000);color:white;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:bold;font-size:15px;margin:8px 0;">✉️ Click Here to RSVP</a>`
    );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Wedding Invitation</title>
</head>
<body style="margin:0;padding:0;background:#FDF8F0;font-family:'Georgia',serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#8B0000 0%,#C41E3A 50%,#B8860B 100%);border-radius:20px 20px 0 0;padding:48px 40px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">🌸 💍 🌸</div>
      <h1 style="color:white;font-size:42px;margin:0;font-style:italic;text-shadow:0 2px 10px rgba(0,0,0,0.3);">
        Wedding Invitation
      </h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;letter-spacing:2px;text-transform:uppercase;">
        You are cordially invited
      </p>
    </div>

    <!-- Gold divider -->
    <div style="height:6px;background:linear-gradient(90deg,#C41E3A,#F59E0B,#C41E3A);"></div>

    <!-- Body -->
    <div style="background:white;padding:40px;border-left:1px solid #e7e5e4;border-right:1px solid #e7e5e4;">

      <!-- Greeting -->
      <div style="background:#FFF7ED;border-radius:12px;padding:20px 24px;margin-bottom:28px;border-left:4px solid #F59E0B;">
        <p style="margin:0;font-size:18px;color:#8B0000;font-style:italic;">Dear ${guestName},</p>
      </div>

      <!-- Message -->
      <div style="color:#44403c;font-size:15px;line-height:1.8;margin-bottom:32px;">
        ${htmlMessage}
      </div>

      <!-- Decorative ornament -->
      <div style="text-align:center;margin:32px 0;color:#D4A96A;font-size:20px;letter-spacing:8px;">
        ✦ ✦ ✦
      </div>
    </div>

    <!-- Footer -->
    <div style="background:linear-gradient(135deg,#1a0a0a,#2d0d0d);border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;">
      <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0 0 4px;">
        This invitation was sent via WeddingDesk
      </p>
      <p style="color:rgba(255,255,255,0.3);font-size:10px;margin:0;">
        Sent from ${senderEmail}
      </p>
    </div>

  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { senderEmail, appPassword, subject, guests } = body;

    // Validate inputs
    if (!senderEmail || !appPassword || !subject || !guests?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create Gmail transporter using the planner's own credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: appPassword.replace(/\s/g, ''), // Remove spaces from app password
      },
    });

    // Verify credentials first
    try {
      await transporter.verify();
    } catch {
      return NextResponse.json({
        error: 'Gmail authentication failed. Please check your email and App Password.',
        results: [],
      }, { status: 401 });
    }

    // Send emails one by one with a small delay to avoid rate limits
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const guest of guests) {
      if (!guest.email) {
        results.push({ email: 'unknown', success: false, error: 'No email address' });
        continue;
      }

      try {
        await transporter.sendMail({
          from: `"Wedding Invitation 💍" <${senderEmail}>`,
          to: guest.email,
          subject,
          text: guest.message, // Plain text fallback
          html: buildHtmlEmail(guest.message, guest.name, guest.rsvpLink, senderEmail),
        });

        results.push({ email: guest.email, success: true });

        // Small delay between emails (avoid Gmail rate limits)
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (err: unknown) {
        results.push({
          email: guest.email,
          success: false,
          error: err instanceof Error ? err.message : 'Failed to send',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return NextResponse.json({
      message: `Sent ${successCount} of ${guests.length} emails successfully`,
      results,
    });

  } catch (err) {
    console.error('Email API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
