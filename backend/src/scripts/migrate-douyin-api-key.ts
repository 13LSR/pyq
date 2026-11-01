import dotenv from "dotenv";
import sequelize from "../config/database";

dotenv.config();

/** Adds the admin-managed Douyin parser API key column. */
export async function migrateDouyinApiKey() {
  try {
    await sequelize.query(
      "ALTER TABLE site_settings ADD COLUMN douyin_api_key VARCHAR(255) NOT NULL DEFAULT ''"
    );
    console.log("Applied: ADD COLUMN douyin_api_key VARCHAR(255) NOT NULL DEFAULT ''");
  } catch (error: any) {
    const message = String(error?.message || error);
    if (/duplicate column|already exists/i.test(message)) {
      console.log("Already present: douyin_api_key");
    } else {
      throw error;
    }
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    await migrateDouyinApiKey();
  } catch (error) {
    console.error("Douyin API key migration failed:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close().catch(() => {});
  }
}

if (require.main === module) {
  void main();
}
