import dotenv from "dotenv";
import sequelize from "../config/database";

dotenv.config();

async function apply(statement: string, label: string) {
  try {
    await sequelize.query(statement);
    console.log(`Applied: ${label}`);
  } catch (error: any) {
    const message = String(error?.message || error);
    if (/duplicate column|already exists/i.test(message)) {
      console.log(`Already present: ${label}`);
      return;
    }
    throw error;
  }
}

/** Adds the optional JSON tag list used by article filtering. */
export async function migratePostTags() {
  await apply(
    "ALTER TABLE posts ADD COLUMN tags JSON NULL",
    "posts.tags"
  );
}

async function main() {
  try {
    await sequelize.authenticate();
    await migratePostTags();
  } catch (error) {
    console.error("Post tags migration failed:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close().catch(() => {});
  }
}

if (require.main === module) {
  void main();
}
