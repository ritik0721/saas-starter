import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Row,
  Column,
} from '@react-email/components';

interface LeaveRequestSubmittedEmailProps {
  userName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  managerName: string;
  companyName: string;
}

export default function LeaveRequestSubmittedEmail({
  userName,
  leaveType,
  startDate,
  endDate,
  totalDays,
  reason,
  managerName,
  companyName,
}: LeaveRequestSubmittedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Leave Request Submitted - {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Leave Request Submitted</Heading>
          
          <Section style={section}>
            <Text style={text}>
              Hi {userName},
            </Text>
            <Text style={text}>
              Your leave request has been successfully submitted and is now pending approval.
            </Text>
          </Section>

          <Section style={section}>
            <Heading style={h2}>Request Details</Heading>
            <Row style={row}>
              <Column style={column}>
                <Text style={label}>Leave Type:</Text>
                <Text style={value}>{leaveType}</Text>
              </Column>
              <Column style={column}>
                <Text style={label}>Duration:</Text>
                <Text style={value}>{totalDays} days</Text>
              </Column>
            </Row>
            <Row style={row}>
              <Column style={column}>
                <Text style={label}>Start Date:</Text>
                <Text style={value}>{startDate}</Text>
              </Column>
              <Column style={column}>
                <Text style={label}>End Date:</Text>
                <Text style={value}>{endDate}</Text>
              </Column>
            </Row>
            {reason && (
              <Row style={row}>
                <Column style={fullColumn}>
                  <Text style={label}>Reason:</Text>
                  <Text style={value}>{reason}</Text>
                </Column>
              </Row>
            )}
          </Section>

          <Section style={section}>
            <Text style={text}>
              Your request will be reviewed by <strong>{managerName}</strong>. You'll receive an email notification once a decision has been made.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={section}>
            <Text style={footer}>
              This is an automated message from {companyName}. Please do not reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '20px 0',
  padding: '0',
};

const section = {
  padding: '24px',
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  margin: '20px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const row = {
  display: 'flex',
  margin: '16px 0',
};

const column = {
  flex: '1',
  padding: '0 8px',
};

const fullColumn = {
  flex: '1',
  padding: '0',
};

const label = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 4px 0',
};

const value = {
  color: '#333',
  fontSize: '16px',
  margin: '0',
};

const hr = {
  borderColor: '#dfe1e5',
  margin: '42px 0 26px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};
