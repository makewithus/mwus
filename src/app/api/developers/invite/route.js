import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const adminUser = await requireAdmin();
    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required." },
        { status: 400 }
      );
    }

    // 1. Create the user in Firebase Auth with a random placeholder password
    // We don't send this password; they will reset it via the link.
    const randomPassword = Math.random().toString(36).slice(-8) + "Aa1!";
    let userRecord;
    
    try {
      userRecord = await adminAuth.createUser({
        email,
        password: randomPassword,
        displayName: name,
      });
    } catch (error) {
      if (error.code === "auth/email-already-exists") {
        return NextResponse.json(
          { error: "A user with this email already exists." },
          { status: 400 }
        );
      }
      throw error;
    }

    // 2. Create the developer document in Firestore
    await adminDb.collection("users").doc(userRecord.uid).set({
      email,
      name,
      role: "developer",
      createdAt: new Date().toISOString(),
      status: "active"
    });

    // 3. Generate a password reset link, then email it.
    // This must never fail the request — the account already exists at this point,
    // and a thrown error here would report a 500 while leaving a half-invited developer behind.
    try {
      const resetLink = await adminAuth.generatePasswordResetLink(email);

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: process.env.SMTP_PORT || 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"MakeWithUs Portal" <noreply@makewithus.com>',
          to: email,
          subject: "You have been invited to MakeWithUs",
          html: `
            <div style="font-family: sans-serif; max-w-md; margin: 0 auto;">
              <h2>Welcome to MakeWithUs!</h2>
              <p>Hi ${name},</p>
              <p>You have been invited as a Developer to the MakeWithUs Client Tracking Portal.</p>
              <p>Please click the link below to set your password and access your dashboard:</p>
              <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 10px;">Set Password</a>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">If you have any questions, please contact the admin team.</p>
            </div>
          `,
        });
      } else {
        console.warn("SMTP credentials missing. Invite link generated but not emailed:", resetLink);
      }
    } catch (emailError) {
      console.error("Developer created, but invite email failed to send:", emailError);
    }

    return NextResponse.json({ message: "Developer invited successfully." });
  } catch (error) {
    console.error("Error inviting developer:", error);
    return NextResponse.json(
      { error: "An error occurred while inviting the developer." },
      { status: 500 }
    );
  }
}
