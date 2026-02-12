import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cetraproapp.com' },
    update: {},
    create: {
      email: 'admin@cetraproapp.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      phone: '+1234567890',
      role: UserRole.ADMIN,
      isActive: true,
      notes: 'Default admin account created during seeding',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create test users
  const userPassword = await bcrypt.hash('user123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@cetraproapp.com' },
    update: {},
    create: {
      email: 'user1@cetraproapp.com',
      passwordHash: userPassword,
      name: 'John Doe',
      phone: '+1234567891',
      role: UserRole.USER,
      isActive: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@cetraproapp.com' },
    update: {},
    create: {
      email: 'user2@cetraproapp.com',
      passwordHash: userPassword,
      name: 'Jane Smith',
      phone: '+1234567892',
      role: UserRole.USER,
      isActive: true,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'user3@cetraproapp.com' },
    update: {},
    create: {
      email: 'user3@cetraproapp.com',
      passwordHash: userPassword,
      name: 'Bob Johnson',
      phone: '+1234567893',
      role: UserRole.USER,
      isActive: true,
    },
  });

  console.log('✅ Test users created:', [user1.email, user2.email, user3.email]);

  // Create a sample project (optional)
  const project = await prisma.project.create({
    data: {
      title: 'Sample Project - Website Redesign',
      description: 'Complete redesign of company website with modern UI/UX',
      proposedAmount: 5000.00,
      requiredApprovals: 2,
      createdById: admin.id,
      status: 'PENDING',
    },
  });

  console.log('✅ Sample project created:', project.title);

  console.log('🎉 Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('Admin: admin@cetraproapp.com / admin123');
  console.log('User 1: user1@cetraproapp.com / user123');
  console.log('User 2: user2@cetraproapp.com / user123');
  console.log('User 3: user3@cetraproapp.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
