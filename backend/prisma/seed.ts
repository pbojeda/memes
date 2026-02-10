import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { productTypeSeedData } from './data/productTypes';

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('Seeding product types...');

  for (const pt of productTypeSeedData) {
    await prisma.productType.upsert({
      where: { slug: pt.slug },
      update: {},
      create: pt,
    });
  }

  console.log(`Seeded ${productTypeSeedData.length} product types.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
