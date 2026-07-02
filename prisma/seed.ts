import "dotenv/config";
import { faker } from "@faker-js/faker";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type MenuItem } from "../generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const ORDER_STATUSES = ["received", "preparing", "ready", "completed"] as const;
const CATEGORY_NAMES = ["Appetizers", "Mains", "Desserts", "Drinks", "Sides"];

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.menuCategory.deleteMany();

  const categories = await Promise.all(
    CATEGORY_NAMES.map((name) =>
      prisma.menuCategory.create({ data: { name } }),
    ),
  );

  const menus = await Promise.all(
    Array.from({ length: 3 }, () =>
      prisma.menu.create({
        data: {
          name: `${faker.company.name()} Menu`,
          merchantId: faker.string.uuid(),
          isActive: faker.datatype.boolean(),
        },
      }),
    ),
  );

  const menuItems: MenuItem[] = [];
  for (const menu of menus) {
    for (let i = 0; i < 8; i++) {
      const item = await prisma.menuItem.create({
        data: {
          name: faker.food.dish(),
          description: faker.food.description(),
          price: Number(faker.commerce.price({ min: 5, max: 50, dec: 2 })),
          isAvailable: faker.datatype.boolean({ probability: 0.8 }),
          menuId: menu.id,
          categoryId: faker.helpers.arrayElement(categories).id,
        },
      });
      menuItems.push(item);
    }
  }

  for (let i = 0; i < 10; i++) {
    const items = faker.helpers.arrayElements(menuItems, { min: 1, max: 4 });
    let totalPrice = 0;

    const orderItemsData = items.map((item) => {
      const quantity = faker.number.int({ min: 1, max: 3 });
      totalPrice += item.price * quantity;
      return {
        menuItemId: item.id,
        quantity,
        priceAtOrderTime: item.price,
        remark:
          faker.helpers.maybe(() => faker.lorem.sentence(), {
            probability: 0.3,
          }) ?? "",
      };
    });

    await prisma.order.create({
      data: {
        status: faker.helpers.arrayElement([...ORDER_STATUSES]),
        totalPrice,
        orderItems: { create: orderItemsData },
      },
    });
  }

  console.log("Seeded database with dummy data");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
