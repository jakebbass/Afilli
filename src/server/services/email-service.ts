import sgMail from "@sendgrid/mail";
import { db } from "~/server/db";
import { env } from "~/server/env";

// Initialize SendGrid
if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  leadId: string;
  fromEmail?: string;
  fromName?: string;
}

export interface EmailWebhookEvent {
  email: string;
  timestamp: number;
  event: string;
  sg_message_id?: string;
  url?: string;
  reason?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; emailId?: number; error?: string }> {
  try {
    if (!env.SENDGRID_API_KEY) {
      console.error("SendGrid API key not configured");
      return { success: false, error: "Email service not configured" };
    }

    // Create the email record first
    const sentEmail = await db.sentEmail.create({
      data: {
        leadId: params.leadId,
        subject: params.subject,
        body: params.body,
        status: "pending",
      },
    });

    // Prepare SendGrid message
    const msg = {
      to: params.to,
      from: {
        email: params.fromEmail || "outreach@yourdomain.com",
        name: params.fromName || "Your Company",
      },
      subject: params.subject,
      html: params.body,
      // Enable click and open tracking
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: true,
        },
        openTracking: {
          enable: true,
        },
      },
      // Add custom args to identify the email in webhooks
      customArgs: {
        sentEmailId: sentEmail.id.toString(),
        leadId: params.leadId,
      },
    };

    // Send the email
    const response = await sgMail.send(msg);
    
    // Extract SendGrid message ID from response
    const sendgridId = response[0].headers["x-message-id"] as string;

    // Update the email record with sent status and SendGrid ID
    await db.sentEmail.update({
      where: { id: sentEmail.id },
      data: {
        status: "sent",
        sentAt: new Date(),
        sendgridId: sendgridId,
      },
    });

    console.log(`Email sent successfully to ${params.to}, ID: ${sentEmail.id}`);
    
    return { success: true, emailId: sentEmail.id };
  } catch (error: any) {
    console.error("Error sending email:", error);
    
    // Try to update the email record with error status
    try {
      if (error.sentEmailId) {
        await db.sentEmail.update({
          where: { id: error.sentEmailId },
          data: {
            status: "failed",
            errorMessage: error.message || "Unknown error",
          },
        });
      }
    } catch (dbError) {
      console.error("Error updating email record:", dbError);
    }
    
    return { 
      success: false, 
      error: error.response?.body?.errors?.[0]?.message || error.message || "Failed to send email" 
    };
  }
}

export async function handleWebhookEvent(event: EmailWebhookEvent): Promise<void> {
  try {
    const { email, timestamp, event: eventType, sg_message_id, url, reason } = event;
    
    if (!sg_message_id) {
      console.log("Webhook event missing sg_message_id, skipping");
      return;
    }

    // Find the email by SendGrid ID
    const sentEmail = await db.sentEmail.findUnique({
      where: { sendgridId: sg_message_id },
    });

    if (!sentEmail) {
      console.log(`Email not found for SendGrid ID: ${sg_message_id}`);
      return;
    }

    const eventDate = new Date(timestamp * 1000);
    const updateData: any = {};

    switch (eventType) {
      case "delivered":
        updateData.status = "delivered";
        updateData.deliveredAt = eventDate;
        break;

      case "open":
        updateData.status = "opened";
        updateData.openedAt = eventDate;
        updateData.openCount = { increment: 1 };
        
        // Set first opened date if not already set
        if (!sentEmail.firstOpenedAt) {
          updateData.firstOpenedAt = eventDate;
        }
        break;

      case "click":
        updateData.status = "clicked";
        updateData.clickedAt = eventDate;
        updateData.clickCount = { increment: 1 };
        
        // Set first clicked date if not already set
        if (!sentEmail.firstClickedAt) {
          updateData.firstClickedAt = eventDate;
        }
        
        // Store the clicked URL in metadata
        if (url) {
          updateData.metadata = {
            ...sentEmail.metadata,
            lastClickedUrl: url,
          };
        }
        break;

      case "bounce":
      case "dropped":
        updateData.status = "bounced";
        updateData.bouncedAt = eventDate;
        if (reason) {
          updateData.errorMessage = reason;
        }
        break;

      case "spamreport":
        updateData.status = "failed";
        updateData.errorMessage = "Marked as spam";
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
        return;
    }

    // Update the email record
    await db.sentEmail.update({
      where: { id: sentEmail.id },
      data: updateData,
    });

    // Update the lead's outreach status if email was opened or clicked
    if (eventType === "open" || eventType === "click") {
      const lead = await db.customerLead.findUnique({
        where: { id: sentEmail.leadId },
      });

      if (lead && lead.outreachStatus === "contacted") {
        await db.customerLead.update({
          where: { id: sentEmail.leadId },
          data: {
            outreachStatus: "responded",
          },
        });
      }
    }

    console.log(`Processed ${eventType} event for email ${sentEmail.id}`);
  } catch (error) {
    console.error("Error handling webhook event:", error);
  }
}

export async function handleWebhookBatch(events: EmailWebhookEvent[]): Promise<void> {
  console.log(`Processing ${events.length} webhook events`);
  
  for (const event of events) {
    await handleWebhookEvent(event);
  }
}

export async function getLeadEmailStats(leadId: string) {
  const emails = await db.sentEmail.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    totalSent: emails.length,
    delivered: emails.filter(e => ["delivered", "opened", "clicked"].includes(e.status)).length,
    opened: emails.filter(e => ["opened", "clicked"].includes(e.status)).length,
    clicked: emails.filter(e => e.status === "clicked").length,
    bounced: emails.filter(e => e.status === "bounced").length,
    failed: emails.filter(e => e.status === "failed").length,
    totalOpens: emails.reduce((sum, e) => sum + e.openCount, 0),
    totalClicks: emails.reduce((sum, e) => sum + e.clickCount, 0),
    lastSentAt: emails[0]?.sentAt || null,
    openRate: 0,
    clickRate: 0,
  };

  if (stats.delivered > 0) {
    stats.openRate = (stats.opened / stats.delivered) * 100;
    stats.clickRate = (stats.clicked / stats.delivered) * 100;
  }

  return stats;
}
