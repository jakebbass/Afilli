# SendGrid Email Service Setup

This guide walks you through setting up SendGrid to automatically send outreach emails and track open rates, clicks, and responses.

## Prerequisites

- A SendGrid account (sign up at https://sendgrid.com)
- Access to your application's environment variables
- A domain for sending emails (recommended for production)

## Step 1: Get Your SendGrid API Key

1. Log in to your SendGrid account at https://app.sendgrid.com
2. Navigate to **Settings** > **API Keys**
3. Click **Create API Key**
4. Choose **Full Access** (or at minimum, grant **Mail Send** permissions)
5. Give your key a descriptive name (e.g., "Affiliate App Production")
6. Click **Create & View**
7. **Important**: Copy the API key immediately - you won't be able to see it again!

## Step 2: Configure Environment Variable

Add your SendGrid API key to the `.env` file:

```bash
SENDGRID_API_KEY=SG.your_actual_api_key_here
```

The application will automatically use this key to send emails.

## Step 3: Configure Sender Email Address

By default, emails are sent from `outreach@yourdomain.com`. To customize this:

1. **Verify your sender email/domain in SendGrid**:
   - Go to **Settings** > **Sender Authentication**
   - Follow the steps to verify either a single email address or your entire domain
   - Domain verification is recommended for better deliverability

2. **Update the email service** (optional):
   - The default sender is configured in `src/server/services/email-service.ts`
   - You can modify the `fromEmail` and `fromName` defaults in the `sendEmail` function

## Step 4: Set Up Event Webhooks (for tracking)

To track email opens, clicks, bounces, and other events:

1. In SendGrid, go to **Settings** > **Mail Settings** > **Event Webhook**

2. Click **Create new webhook**

3. Configure the webhook:
   - **Webhook URL**: `https://your-domain.com/trpc/webhooks.sendgrid`
   - **Actions to be posted**: Select all that apply:
     - ✅ Delivered
     - ✅ Opened
     - ✅ Clicked
     - ✅ Bounced
     - ✅ Dropped
     - ✅ Spam Report
   
4. **Important**: Set the webhook to **Enabled**

5. Click **Save**

### Webhook URL Format

The webhook endpoint is accessible at:
```
https://your-domain.com/trpc/webhooks.sendgrid
```

Replace `your-domain.com` with your actual domain.

### Testing Webhooks Locally

For local development, you can use a tool like ngrok to expose your local server:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com

# Start your app on port 3000 (or your configured port)
npm run dev

# In another terminal, create a tunnel
ngrok http 3000

# Use the ngrok URL in SendGrid webhook settings
# Example: https://abc123.ngrok.io/trpc/webhooks.sendgrid
```

## Step 5: Verify the Integration

### Test Email Sending

1. Create a test lead in your application with a valid email address
2. Assign the lead to a persona
3. Start an outreach agent or manually trigger outreach
4. Check the Leads page to see the email status

### Verify Webhook Events

1. Send a test email
2. Open the email
3. Click a link in the email
4. Check the lead details in your app - you should see:
   - Email status updated to "opened" or "clicked"
   - Open count incremented
   - Timestamps for when the email was opened/clicked

## Email Tracking Features

The integration automatically tracks:

- **Delivery Status**: When emails are successfully delivered
- **Opens**: When recipients open the email (with count for multiple opens)
- **Clicks**: When recipients click links in the email (with count)
- **Bounces**: When emails bounce (hard or soft)
- **Spam Reports**: When recipients mark emails as spam
- **Failures**: When emails fail to send

All tracking data is visible in:
- The Leads page (individual lead details)
- The Dashboard (aggregate metrics)

## Email Metrics

### Lead-Level Metrics
For each lead, you can see:
- Total emails sent
- Open rate
- Click rate
- Last email sent date
- Detailed history of each email with status

### Dashboard Metrics
The dashboard displays:
- Total emails sent (last 30 days)
- Overall open rate
- Overall click rate
- Total opens across all emails

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Ensure `SENDGRID_API_KEY` is set correctly in `.env`
2. **Verify Sender**: Make sure your sender email/domain is verified in SendGrid
3. **Check Logs**: Look for error messages in the server console
4. **Test API Key**: Try sending a test email through SendGrid's web interface

### Webhooks Not Working

1. **Verify URL**: Ensure the webhook URL is correct and publicly accessible
2. **Check HTTPS**: SendGrid requires HTTPS for webhooks (use ngrok for local testing)
3. **Review SendGrid Logs**: Check **Activity** > **Event Webhook** in SendGrid for delivery status
4. **Test Manually**: Use a tool like Postman to send a test webhook payload to your endpoint

### Low Deliverability

1. **Authenticate Domain**: Set up SPF, DKIM, and DMARC records
2. **Warm Up IP**: If using a dedicated IP, gradually increase sending volume
3. **Monitor Reputation**: Check your sender reputation in SendGrid
4. **Avoid Spam Triggers**: Review email content for spam trigger words
5. **Maintain List Hygiene**: Remove bounced and unsubscribed addresses

## Best Practices

1. **Sender Reputation**:
   - Use a verified domain
   - Set up proper DNS records (SPF, DKIM, DMARC)
   - Monitor bounce and spam complaint rates

2. **Email Content**:
   - Personalize emails using lead data
   - Include an unsubscribe link
   - Avoid spam trigger words
   - Test emails before sending at scale

3. **Sending Limits**:
   - Respect SendGrid's rate limits
   - Start with small batches and scale up
   - Monitor delivery rates

4. **Compliance**:
   - Follow CAN-SPAM Act requirements
   - Include physical address
   - Honor unsubscribe requests promptly
   - Get proper consent before sending

## Rate Limits

SendGrid free tier includes:
- 100 emails/day (free tier)
- Higher limits on paid plans

If you need to send more emails, upgrade your SendGrid plan.

## Support

For SendGrid-specific issues:
- SendGrid Documentation: https://docs.sendgrid.com
- SendGrid Support: https://support.sendgrid.com

For application-specific issues:
- Check server logs for error messages
- Review the email service code in `src/server/services/email-service.ts`
- Verify database records in the `SentEmail` table
