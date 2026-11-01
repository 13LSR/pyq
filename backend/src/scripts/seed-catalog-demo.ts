import dotenv from "dotenv";
import { CatalogCategory, CatalogItem, sequelize } from "../models";

dotenv.config();

type DemoItem = {
  collection: "equipment" | "labs";
  categoryName: string;
  title: string;
  configuration: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
};

const demoItems: DemoItem[] = [
  {
    collection: "equipment",
    categoryName: "演示设备",
    title: "横向设备封面",
    configuration: "1200 x 600",
    description: "横图测试：图片应该铺满卡片宽度，并保持原始比例。",
    imageUrl: "https://picsum.photos/seed/catalog-equipment-wide/1200/600",
    linkUrl: "",
    sortOrder: 10,
  },
  {
    collection: "equipment",
    categoryName: "演示设备",
    title: "竖向设备封面",
    configuration: "600 x 1000",
    description: "竖图测试：图片应该按原始比例增高，不被裁切。",
    imageUrl: "https://picsum.photos/seed/catalog-equipment-tall/600/1000",
    linkUrl: "",
    sortOrder: 11,
  },
  {
    collection: "equipment",
    categoryName: "演示设备",
    title: "方形设备封面",
    configuration: "800 x 800",
    description: "方图测试：图片应该完整显示并铺满卡片宽度。",
    imageUrl: "https://picsum.photos/seed/catalog-equipment-square/800/800",
    linkUrl: "",
    sortOrder: 12,
  },
  {
    collection: "labs",
    categoryName: "演示实验",
    title: "横向实验截图",
    configuration: "1200 x 600",
    description: "横图测试：用于验证 Labs 卡片的自适应高度。",
    imageUrl: "https://picsum.photos/seed/catalog-lab-wide/1200/600",
    linkUrl: "",
    sortOrder: 10,
  },
  {
    collection: "labs",
    categoryName: "演示实验",
    title: "竖向实验截图",
    configuration: "600 x 1000",
    description: "竖图测试：保持图片完整比例，不再出现大块留白。",
    imageUrl: "https://picsum.photos/seed/catalog-lab-tall/600/1000",
    linkUrl: "",
    sortOrder: 11,
  },
  {
    collection: "labs",
    categoryName: "演示实验",
    title: "方形实验截图",
    configuration: "800 x 800",
    description: "方图测试：用于对比不同图片尺寸的展示效果。",
    imageUrl: "https://picsum.photos/seed/catalog-lab-square/800/800",
    linkUrl: "",
    sortOrder: 12,
  },
];

async function seedCatalogDemo() {
  await sequelize.authenticate();

  await sequelize.transaction(async (transaction) => {
    const categories = new Map<string, CatalogCategory>();

    for (const item of demoItems) {
      const categoryKey = `${item.collection}:${item.categoryName}`;
      let category = categories.get(categoryKey);
      if (!category) {
        const [createdCategory] = await CatalogCategory.findOrCreate({
          where: { collection: item.collection, name: item.categoryName },
          defaults: {
            collection: item.collection,
            name: item.categoryName,
            intro: item.collection === "labs" ? "用于查看 Labs 目录图片自适应效果。" : "用于查看装备目录图片自适应效果。",
            sortOrder: 1,
          },
          transaction,
        });
        category = createdCategory;
        categories.set(categoryKey, category);
      }

      await CatalogItem.findOrCreate({
        where: { categoryId: category.id, title: item.title },
        defaults: {
          categoryId: category.id,
          title: item.title,
          configuration: item.configuration,
          description: item.description,
          imageMediaId: null,
          imageUrl: item.imageUrl,
          linkUrl: item.linkUrl,
          sortOrder: item.sortOrder,
        },
        transaction,
      });
    }
  });

  console.log(`Catalog demo data seeded successfully (${demoItems.length} items).`);
}

seedCatalogDemo()
  .catch((error) => {
    console.error("Catalog demo data seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
