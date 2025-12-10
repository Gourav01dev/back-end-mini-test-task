import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  type: 'product-created' | 'welcome' | 'general';
}

@Processor('email-queue')
export class EmailProcessor {
  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>) {
    const { to, subject, body, type } = job.data;
    
    console.log(`Processing email job ${job.id}`);
    console.log(`Type: ${type}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`Email sent successfully to ${to}`);
    
    return {
      sent: true,
      timestamp: new Date(),
      recipient: to,
      type,
    };
  }
  
  @Process('log-activity')
  async handleLogActivity(job: Job<any>) {
    const { activity, userId, timestamp } = job.data;
    
    console.log(`Activity Log: User ${userId} - ${activity} at ${timestamp}`);
    
    return { logged: true };
  }
}