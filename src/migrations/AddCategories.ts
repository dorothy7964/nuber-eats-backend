import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategories1688200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const categories = [
      { name: "chicken", coverImg: "chicken.png", slug: "chicken" },
      { name: "dessert", coverImg: "dessert.png", slug: "dessert" },
      { name: "hamburger", coverImg: "hamburger.png", slug: "hamburger" },
      {
        name: "jjajangmyeon",
        coverImg: "jjajangmyeon.png",
        slug: "jjajangmyeon",
      },
      { name: "pizza", coverImg: "pizza.png", slug: "pizza" },
      { name: "sushi", coverImg: "sushi.png", slug: "sushi" },
      { name: "tteokbokki", coverImg: "tteokbokki.png", slug: "tteokbokki" },
    ];

    for (const cat of categories) {
      await queryRunner.query(
        `INSERT INTO category(name, "coverImg", slug) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
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
