import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('Clearing database...');

  try {
    // Delete in order to respect foreign key constraints
    await prisma.message.deleteMany();
    console.log('Cleared messages');
    
    await prisma.conversation.deleteMany();
    console.log('Cleared conversations');
    
    await prisma.apartmentImage.deleteMany();
    console.log('Cleared apartment images');
    
    await prisma.apartmentAmenity.deleteMany();
    console.log('Cleared apartment amenities');
    
    await prisma.watchlist.deleteMany();
    console.log('Cleared watchlists');
    
    await prisma.review.deleteMany();
    console.log('Cleared reviews');
    
    await prisma.visit.deleteMany();
    console.log('Cleared visits');
    
    await prisma.apartment.deleteMany();
    console.log('Cleared apartments');
    
    await prisma.project.deleteMany();
    console.log('Cleared projects');
    
    await prisma.city.deleteMany();
    console.log('Cleared cities');
    
    await prisma.user.deleteMany();
    console.log('Cleared users');

    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await clearDatabase();
      console.log('Done!');
      process.exit(0);
    } catch (error) {
      console.error('Failed:', error);
      process.exit(1);
    }
  })();
}

export { clearDatabase };