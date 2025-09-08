import { CATEGORIES } from "src/constants/categories";
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategories1688200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "category" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR NOT NULL,
        "coverImg" VARCHAR NOT NULL,
        "slug" VARCHAR UNIQUE NOT NULL
      );
    `);

    for (const cat of CATEGORIES) {
      await queryRunner.query(
        `INSERT INTO "category"(name, "coverImg", slug) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (slug) DO NOTHING`,
        [cat.name, cat.coverImg, cat.slug],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /* 카테고리 마이그레이션 삭제 방지 전략 = down() 주석처리해 비워두기 */
    // await queryRunner.query(
    //   `DELETE FROM category WHERE slug IN ('chicken','dessert','hamburger','jjajangmyeon','pizza','sushi','tteokbokki')`,
    // );
  }
}
