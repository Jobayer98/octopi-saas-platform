import "dotenv/config";

export class AppEnv {
  // database env variable
  static DATABASE_URL = process.env.DATABASE_URL;

  // server env variable
  static PORT = process.env.PORT || 4000;
}
