import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RenameBottleTrueNameToGlassPosition1711756800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'bottles',
      new TableColumn({
        name: 'trueGlassPosition',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.dropColumn('bottles', 'trueName');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'bottles',
      new TableColumn({
        name: 'trueName',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.dropColumn('bottles', 'trueGlassPosition');
  }
}
