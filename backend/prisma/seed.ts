/**
 * CommUnity Platform - Database Seed Script
 *
 * Seeds initial data for development:
 * - MarketplacePartner (Amazon)
 * - Sample Causes
 * - Test Donator and Recipient profiles
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create Amazon marketplace partner
  const amazon = await prisma.marketplacePartner.upsert({
    where: { name: 'Amazon' },
    update: {},
    create: {
      name: 'Amazon',
      apiEndpoint: 'https://webservices.amazon.com/paapi5',
      apiKeyHash: 'placeholder-hash', // Will be replaced with actual encrypted key
      affiliateProgramId: 'amazon-associates',
      commissionRate: 4.0, // 4% commission rate
      isActive: true,
      apiRateLimit: 8640, // 8,640 requests per day
    },
  })
  console.log('✓ Created marketplace partner:', amazon.name)

  // Create sample causes
  const causes = [
    {
      name: 'Housing Support',
      description: 'Help individuals and families secure stable housing',
      category: 'Housing',
      isActive: true,
    },
    {
      name: 'Food Security',
      description: 'Provide nutritious meals and food assistance',
      category: 'Food',
      isActive: true,
    },
    {
      name: 'Medical Care',
      description: 'Support access to essential medical services and supplies',
      category: 'Medical',
      isActive: true,
    },
    {
      name: 'Education Access',
      description: 'Enable learning opportunities and educational resources',
      category: 'Education',
      isActive: true,
    },
    {
      name: 'Family Support',
      description: 'Assist families in need with essential items and services',
      category: 'General',
      isActive: true,
    },
  ]

  for (const cause of causes) {
    const created = await prisma.cause.upsert({
      where: { name: cause.name },
      update: {},
      create: cause,
    })
    console.log('✓ Created cause:', created.name)
  }

  // Create test donator user
  const testDonator = await prisma.user.upsert({
    where: { email: 'donator@test.com' },
    update: {},
    create: {
      email: 'donator@test.com',
      emailVerified: true,
      passwordHash: '$2b$10$dummy.hash.for.testing', // bcrypt hash for 'password123'
      role: 'donator',
      donatorProfile: {
        create: {
          displayName: 'Test Donator',
          totalDonated: 0,
          donationCount: 0,
          recipientsHelped: 0,
        },
      },
    },
  })
  console.log('✓ Created test donator:', testDonator.email)

  // Create test recipient user
  const testRecipient = await prisma.user.upsert({
    where: { email: 'recipient@test.com' },
    update: {},
    create: {
      email: 'recipient@test.com',
      emailVerified: true,
      passwordHash: '$2b$10$dummy.hash.for.testing',
      role: 'recipient',
      recipientProfile: {
        create: {
          recipientType: 'individual',
          displayName: 'Test Recipient Family',
          story: 'This is a test recipient profile for development purposes. A family of four seeking assistance with basic needs.',
          location: 'San Francisco, CA, USA',
          photoUrls: [],
          verificationStatus: 'verified',
          verificationBadge: 'verified',
        },
      },
    },
  })
  console.log('✓ Created test recipient:', testRecipient.email)

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      emailVerified: true,
      passwordHash: '$2b$10$dummy.hash.for.testing',
      role: 'admin',
    },
  })
  console.log('✓ Created admin user:', adminUser.email)

  console.log('🌱 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
