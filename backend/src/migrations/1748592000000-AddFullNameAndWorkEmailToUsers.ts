import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFullNameAndWorkEmailToUsers1748592000000 implements MigrationInterface {
  name = 'AddFullNameAndWorkEmailToUsers1748592000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasFullName = await queryRunner.hasColumn('users', 'fullName');
    if (!hasFullName) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'fullName',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    const hasWorkEmail = await queryRunner.hasColumn('users', 'workEmail');
    if (!hasWorkEmail) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'workEmail',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasWorkEmail = await queryRunner.hasColumn('users', 'workEmail');
    if (hasWorkEmail) {
      await queryRunner.dropColumn('users', 'workEmail');
    }

    const hasFullName = await queryRunner.hasColumn('users', 'fullName');
    if (hasFullName) {
      await queryRunner.dropColumn('users', 'fullName');
    }
  }
}
