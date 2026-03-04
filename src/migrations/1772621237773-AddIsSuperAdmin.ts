import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsSuperAdmin1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "isSuperAdmin" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /* 슈퍼어드민 컬럼 삭제 방지 전략 = down() 주석처리 가능 */
    // await queryRunner.query(`
    //   ALTER TABLE "user"
    //   DROP COLUMN IF EXISTS "isSuperAdmin"
    // `);
  }
}
