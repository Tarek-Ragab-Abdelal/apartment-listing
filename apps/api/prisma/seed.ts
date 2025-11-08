/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data (order matters due to foreign key constraints)
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.apartmentImage.deleteMany();
  await prisma.apartmentAmenity.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.apartment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('12345678', 12);
  await prisma.user.create({
    data: {
      email: 'tarek@nawy.com',
      passwordHash: passwordHash,
      name: 'Tarek Ragab',
      role: 'ADMIN',
      phone: '+201090477381',
      isVerified: true,
    },
  });

  await prisma.user.createMany({
    data: Array.from({ length: 5 }).map((_, i) => ({
      email: `agent${i + 1}@nawy.com`,
      passwordHash: passwordHash,
      name: faker.person.fullName(),
      role: 'ADMIN',
      phone: `+201${faker.string.numeric(9)}`, 
      isVerified: true,
    })),
  });

  await prisma.user.createMany({
    data: Array.from({ length: 10 }).map((_, i) => ({
      email: `user${i + 1}@nawy.com`,
      passwordHash: passwordHash,
      name: faker.person.fullName(),
      role: 'USER' as const,
      phone: `+201${faker.string.numeric(9)}`, 
      isVerified: true,
    })),
  });

  console.log('Creating cities...');
  await prisma.city.createMany({
    data: [
      { name: 'Cairo', country: 'Egypt' },
      { name: 'Giza', country: 'Egypt' },
      { name: 'New Cairo', country: 'Egypt' },
      { name: 'Sheikh Zayed', country: 'Egypt' },
      { name: 'Alexandria', country: 'Egypt' },
      { name: '6th of October', country: 'Egypt' },
      { name: 'El Shorouk', country: 'Egypt' },
      { name: 'Heliopolis', country: 'Egypt' },
      { name: 'Maadi', country: 'Egypt' },
      { name: 'Nasr City', country: 'Egypt' },
    ],
  });

  const cityRecords = await prisma.city.findMany();

  console.log('Creating projects...');
  const projectNames = [
    'Palm Hills', 'New Giza', 'Mountain View', 'Zed Towers',
    'Uptown Cairo', 'Mivida', 'Hyde Park', 'Swan Lake',
    'Green Valley', 'The Waterway', 'Eastown', 'Lake View',
    'The Gate', 'Cairo Festival City', 'Al Rehab', 'Madinty',
    'Taj City', 'The Village', 'Park View', 'City Edge', 
  ];

  const projectsData = projectNames.map((name) => {
    const city = faker.helpers.arrayElement(cityRecords);
    return {
      name,
      description: `${name} compound in ${city.name}, Egypt.`,
      cityId: city.id,
      address: `${name}, ${city.name}, Egypt`,
      latitude: faker.location.latitude({ min: 26, max: 31 }),
      longitude: faker.location.longitude({ min: 29, max: 32 }),
    };
  });

  await prisma.project.createMany({ data: projectsData });
  const projects = await prisma.project.findMany();

  console.log('Creating apartments...');
  const agentsList = await prisma.user.findMany({ where: { role: 'ADMIN' } });

  // * 945 apartments; because 1000 is soo lame xD
  const apartmentsData = Array.from({ length: 945 }).map(() => {
    const project = faker.helpers.arrayElement(projects);
    const agent = faker.helpers.arrayElement(agentsList);
    const bedrooms = faker.number.int({ min: 1, max: 5 });
    const bathrooms = faker.number.int({ min: 1, max: 4 });
    const area = faker.number.int({ min: 50, max: 400 });
    const price = faker.number.int({ min: 1000000, max: 20000000 });

    // 10% chance for SOLD or INACTIVE status, 90% ACTIVE
    const statusRoll = faker.number.float({ min: 0, max: 1 });
    let status: 'ACTIVE' | 'SOLD' | 'INACTIVE';
    if (statusRoll < 0.1) {
      // 10% chance for non-active status
      status = faker.helpers.arrayElement(['SOLD', 'INACTIVE']);
    } else {
      status = 'ACTIVE';
    }

    return {
      unitName: `${faker.word.noun()} Residence`,
      projectId: project.id,
      listerId: agent.id,
      bedrooms,
      bathrooms,
      areaSqm: area,
      priceEgp: price,
      address: `${project.name}, ${faker.location.streetAddress()}, ${faker.location.city()}`,
      description: faker.lorem.sentences(2),
      status,
      latitude: faker.location.latitude({ min: 26, max: 31 }),
      longitude: faker.location.longitude({ min: 29, max: 32 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
  });

  await prisma.apartment.createMany({ data: apartmentsData });

  console.log('Creating apartment images and amenities...');
  const apartments = await prisma.apartment.findMany({ take: 1000 });

  const apartmentImages = apartments.flatMap((apt) =>
    Array.from({ length: faker.number.int({ min: 1, max: 4 }) }).map((_, i) => ({
      apartmentId: apt.id,
      imageUrl: `https://picsum.photos/seed/${apt.id}-${i}/600/400`,
      position: i + 1,
    }))
  );

  const amenitiesList = [
    'Swimming Pool', 'Gym', 'Parking', 'Security', 'Playground',
    'Private Garden', 'BBQ Area', 'Concierge', 'Elevator',
    'Cafes Nearby', 'Shopping Mall Access',
  ];

  const apartmentAmenities = apartments.flatMap((apt) =>
    faker.helpers.arrayElements(amenitiesList, faker.number.int({ min: 2, max: 5 })).map((amenity: string) => ({
      apartmentId: apt.id,
      amenity,
    }))
  );

  await prisma.apartmentImage.createMany({ data: apartmentImages });
  await prisma.apartmentAmenity.createMany({ data: apartmentAmenities });

  console.log('Creating sample visits and reviews...');
  const visitsData = apartments.slice(0, 200).map((apt) => ({
    apartmentId: apt.id,
    userId: faker.helpers.arrayElement(agentsList).id,
    scheduledAt: faker.date.future(),
    confirmed: faker.datatype.boolean(),
  }));

  const reviewsData = apartments.slice(0, 300).map((apt) => ({
    apartmentId: apt.id,
    userId: faker.helpers.arrayElement(agentsList).id,
    rating: faker.number.int({ min: 3, max: 5 }),
    comment: faker.lorem.sentences(1),
  }));

  await prisma.visit.createMany({ data: visitsData });
  await prisma.review.createMany({ data: reviewsData });

  console.log('Database seeded successfully!');
  console.log(`Created ${projectsData.length} projects, ${apartmentsData.length} apartments, ${apartmentImages.length} images, and ${apartmentAmenities.length} amenities.`);
}

// Run the seeding process
(async () => {
  try {
    await main();
    await prisma.$disconnect();
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
