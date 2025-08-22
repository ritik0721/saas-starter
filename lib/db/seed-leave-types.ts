import { db } from './drizzle';
import { leaveTypes } from './schema';

async function seedLeaveTypes() {
  try {
    console.log('🌱 Seeding leave types...');
    
    const existingTypes = await db.select().from(leaveTypes);
    
    if (existingTypes.length === 0) {
      await db.insert(leaveTypes).values([
        {
          name: 'Annual Leave',
          color: '#10B981',
          isPaid: true,
          requiresApproval: true,
        },
        {
          name: 'Sick Leave',
          color: '#EF4444',
          isPaid: true,
          requiresApproval: false,
        },
        {
          name: 'Personal Leave',
          color: '#8B5CF6',
          isPaid: false,
          requiresApproval: true,
        },
        {
          name: 'Maternity/Paternity',
          color: '#F59E0B',
          isPaid: true,
          requiresApproval: true,
        },
        {
          name: 'Unpaid Leave',
          color: '#6B7280',
          isPaid: false,
          requiresApproval: true,
        },
      ]);
      
      console.log('✅ Leave types seeded successfully!');
    } else {
      console.log('ℹ️ Leave types already exist, skipping seed...');
    }
  } catch (error) {
    console.error('❌ Error seeding leave types:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedLeaveTypes().then(() => process.exit(0));
}

export { seedLeaveTypes };
