import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSignupTable1748592060000 implements MigrationInterface {
  name = 'CreateSignupTable1748592060000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('pre_signups');

    if (!hasTable) {
      await queryRunner.createTable(
        new Table({
          name: 'pre_signups',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'name',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'workEmail',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'github',
              type: 'varchar',
              length: '500',
              isNullable: false,
            },
            {
              name: 'ipAddress',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'createdAt',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('pre_signups');

    if (hasTable) {
      await queryRunner.dropTable('pre_signups');
    }
  }
}
