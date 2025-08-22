import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { leaveRequests, users, leaveTypes, leaveAllowances } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a manager (owner or admin)
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const timeRange = searchParams.get('timeRange') || '6months';
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Calculate date range
    const end = new Date();
    const start = subMonths(end, timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12);

    // Fetch data based on parameters
    const [leaveRequestsData, leaveAllowancesData] = await Promise.all([
      // Fetch leave requests
      db
        .select({
          id: leaveRequests.id,
          userName: users.name,
          userEmail: users.email,
          leaveTypeName: leaveTypes.name,
          startDate: leaveRequests.startDate,
          endDate: leaveRequests.endDate,
          totalDays: leaveRequests.totalDays,
          status: leaveRequests.status,
          reason: leaveRequests.reason,
          createdAt: leaveRequests.createdAt,
          approvedAt: leaveRequests.approvedAt,
        })
        .from(leaveRequests)
        .innerJoin(users, eq(leaveRequests.userId, users.id))
        .innerJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
        .where(
          and(
            gte(leaveRequests.createdAt, start),
            lte(leaveRequests.createdAt, end)
          )
        )
        .orderBy(desc(leaveRequests.createdAt)),

      // Fetch leave allowances
      db
        .select({
          userName: users.name,
          userEmail: users.email,
          year: leaveAllowances.year,
          totalDays: leaveAllowances.totalDays,
          usedDays: leaveAllowances.usedDays,
        })
        .from(leaveAllowances)
        .innerJoin(users, eq(leaveAllowances.userId, users.id))
        .where(eq(leaveAllowances.year, year))
        .orderBy(users.name),
    ]);

    if (format === 'csv') {
      return generateCSV(leaveRequestsData, leaveAllowancesData, timeRange, year);
    } else if (format === 'pdf') {
      return generatePDF(leaveRequestsData, leaveAllowancesData, timeRange, year);
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
}

function generateCSV(leaveRequests: any[], leaveAllowances: any[], timeRange: string, year: number) {
  let csvContent = '';

  // Add Leave Requests section
  csvContent += 'LEAVE REQUESTS\n';
  csvContent += 'ID,Employee Name,Email,Leave Type,Start Date,End Date,Total Days,Status,Reason,Created Date,Approved Date\n';
  
  leaveRequests.forEach(request => {
    csvContent += `${request.id},"${request.userName || ''}","${request.userEmail || ''}","${request.leaveTypeName || ''}","${request.startDate || ''}","${request.endDate || ''}","${request.totalDays || ''}","${request.status || ''}","${request.reason || ''}","${request.createdAt || ''}","${request.approvedAt || ''}"\n`;
  });

  csvContent += '\n\nLEAVE ALLOWANCES\n';
  csvContent += 'Employee Name,Email,Year,Total Days,Used Days,Remaining Days,Utilization Rate (%)\n';
  
  leaveAllowances.forEach(allowance => {
    const remainingDays = allowance.totalDays - allowance.usedDays;
    const utilizationRate = allowance.totalDays > 0 ? ((allowance.usedDays / allowance.totalDays) * 100).toFixed(1) : '0';
    csvContent += `"${allowance.userName || ''}","${allowance.userEmail || ''}","${allowance.year || ''}","${allowance.totalDays || ''}","${allowance.usedDays || ''}","${remainingDays || ''}","${utilizationRate || ''}"\n`;
  });

  // Add summary statistics
  const totalRequests = leaveRequests.length;
  const approvedRequests = leaveRequests.filter(req => req.status === 'approved').length;
  const approvalRate = totalRequests > 0 ? ((approvedRequests / totalRequests) * 100).toFixed(1) : '0';
  const totalDays = leaveRequests.reduce((sum, req) => sum + Number(req.totalDays || 0), 0);

  csvContent += '\n\nSUMMARY STATISTICS\n';
  csvContent += `Time Range,${timeRange}\n`;
  csvContent += `Year,${year}\n`;
  csvContent += `Total Requests,${totalRequests}\n`;
  csvContent += `Approved Requests,${approvedRequests}\n`;
  csvContent += `Approval Rate,${approvalRate}%\n`;
  csvContent += `Total Leave Days,${totalDays}\n`;

  const headers = new Headers();
  headers.set('Content-Type', 'text/csv');
  headers.set('Content-Disposition', `attachment; filename="leave-analytics-${timeRange}-${year}.csv"`);

  return new NextResponse(csvContent, {
    status: 200,
    headers,
  });
}

function generatePDF(leaveRequests: any[], leaveAllowances: any[], timeRange: string, year: number) {
  // For now, return a simple text representation
  // In a real implementation, you'd use a PDF library like jsPDF or Puppeteer
  
  let pdfContent = '';
  pdfContent += 'LEAVE ANALYTICS REPORT\n';
  pdfContent += `Generated on: ${new Date().toLocaleDateString()}\n`;
  pdfContent += `Time Range: ${timeRange}\n`;
  pdfContent += `Year: ${year}\n\n`;
  
  pdfContent += 'SUMMARY\n';
  pdfContent += `Total Leave Requests: ${leaveRequests.length}\n`;
  pdfContent += `Approved Requests: ${leaveRequests.filter(req => req.status === 'approved').length}\n`;
  pdfContent += `Total Leave Days: ${leaveRequests.reduce((sum, req) => sum + Number(req.totalDays || 0), 0)}\n\n`;
  
  pdfContent += 'DETAILED DATA\n';
  pdfContent += 'This is a placeholder for PDF generation. In production, use a proper PDF library.\n';

  const headers = new Headers();
  headers.set('Content-Type', 'text/plain');
  headers.set('Content-Disposition', `attachment; filename="leave-analytics-${timeRange}-${year}.txt"`);

  return new NextResponse(pdfContent, {
    status: 200,
    headers,
  });
}
