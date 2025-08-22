import { Resend } from 'resend';
import { render } from '@react-email/render';
import LeaveRequestSubmittedEmail from './leave-request-submitted';
import LeaveRequestApprovedEmail from './leave-request-approved';
import LeaveRequestRejectedEmail from './leave-request-rejected';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailData {
  to: string;
  userName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  managerName?: string;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  companyName?: string;
}

export class EmailService {
  private static companyName = process.env.COMPANY_NAME || 'Your Company';

  static async sendLeaveRequestSubmitted(data: EmailData) {
    if (!resend) {
      console.log('Resend not configured, skipping email');
      return;
    }

    try {
      const html = await render(
        LeaveRequestSubmittedEmail({
          userName: data.userName,
          leaveType: data.leaveType,
          startDate: data.startDate,
          endDate: data.endDate,
          totalDays: data.totalDays,
          reason: data.reason,
          managerName: data.managerName || 'Your Manager',
          companyName: this.companyName,
        })
      );

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@yourcompany.com',
        to: data.to,
        subject: `Leave Request Submitted - ${this.companyName}`,
        html,
      });

      console.log('Leave request submitted email sent successfully');
    } catch (error) {
      console.error('Error sending leave request submitted email:', error);
    }
  }

  static async sendLeaveRequestApproved(data: EmailData) {
    if (!resend) {
      console.log('Resend not configured, skipping email');
      return;
    }

    try {
      const html = await render(
        LeaveRequestApprovedEmail({
          userName: data.userName,
          leaveType: data.leaveType,
          startDate: data.startDate,
          endDate: data.endDate,
          totalDays: data.totalDays,
          reason: data.reason,
          approvedBy: data.approvedBy || 'Your Manager',
          companyName: this.companyName,
        })
      );

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@yourcompany.com',
        to: data.to,
        subject: `Leave Request Approved - ${this.companyName}`,
        html,
      });

      console.log('Leave request approved email sent successfully');
    } catch (error) {
      console.error('Error sending leave request approved email:', error);
    }
  }

  static async sendLeaveRequestRejected(data: EmailData) {
    if (!resend) {
      console.log('Resend not configured, skipping email');
      return;
    }

    try {
      const html = await render(
        LeaveRequestRejectedEmail({
          userName: data.userName,
          leaveType: data.leaveType,
          startDate: data.startDate,
          endDate: data.endDate,
          totalDays: data.totalDays,
          reason: data.reason,
          rejectedBy: data.rejectedBy || 'Your Manager',
          rejectionReason: data.rejectionReason || 'No reason provided',
          companyName: this.companyName,
        })
      );

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@yourcompany.com',
        to: data.to,
        subject: `Leave Request Update - ${this.companyName}`,
        html,
      });

      console.log('Leave request rejected email sent successfully');
    } catch (error) {
      console.error('Error sending leave request rejected email:', error);
    }
  }

  static async sendManagerNotification(data: EmailData & { requestId: number }) {
    if (!resend) {
      console.log('Resend not configured, skipping email');
      return;
    }

    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Leave Request Requires Approval</h2>
          <p><strong>Employee:</strong> ${data.userName}</p>
          <p><strong>Leave Type:</strong> ${data.leaveType}</p>
          <p><strong>Duration:</strong> ${data.totalDays} days</p>
          <p><strong>Period:</strong> ${data.startDate} to ${data.endDate}</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
          <p><strong>Request ID:</strong> #${data.requestId}</p>
          <br>
          <p>Please review this request in your leave management dashboard.</p>
        </div>
      `;

      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@yourcompany.com',
        to: data.to,
        subject: `Leave Request Requires Approval - ${this.companyName}`,
        html,
      });

      console.log('Manager notification email sent successfully');
    } catch (error) {
      console.error('Error sending manager notification email:', error);
    }
  }
}
