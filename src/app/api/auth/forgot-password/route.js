import { adminAuth } from "@/lib/firebase/admin";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate Firebase password reset link using Admin SDK
    let resetLink;
    try {
      resetLink = await adminAuth.generatePasswordResetLink(email);
    } catch (error) {
      // If user doesn't exist, we still return success to prevent email enumeration
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ success: true });
      }
      throw error;
    }

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email Template
    const mailOptions = {
      from: process.env.SMTP_FROM || '"MakeWithUs Portal" <noreply@makewithus.com>',
      to: email,
      subject: "Reset your MakeWithUs Portal Password",
      text: `Hello,\n\nFollow this link to reset your MakeWithUs Portal password for your ${email} account.\n\n${resetLink}\n\nIf you didn't ask to reset your password, you can ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>MakeWithUs Portal</h2>
          <p>Hello,</p>
          <p>Follow this link to reset your MakeWithUs Portal password for your <strong>${email}</strong> account.</p>
          <p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">If you didn't ask to reset your password, you can ignore this email.</p>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
