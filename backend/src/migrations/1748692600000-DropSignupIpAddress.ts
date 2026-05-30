import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropSignupIpAddress1748692600000 implements MigrationInterface {
  name = 'DropSignupIpAddress1748692600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('signups');

    if (!hasTable) {
      return;
    }

    const table = await queryRunner.getTable('signups');
    const ipAddressColumn = table?.findColumnByName('ipAddress');

    if (ipAddressColumn) {
      await queryRunner.dropColumn('signups', 'ipAddress');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('signups');

    if (!hasTable) {
      return;
    }

    const table = await queryRunner.getTable('signups');
    const ipAddressColumn = table?.findColumnByName('ipAddress');

    if (!ipAddressColumn) {
      await queryRunner.addColumn(
        'signups',
        new TableColumn({
          name: 'ipAddress',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }
  }
}
