import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

type DuplicateRepoRow = {
  fullName: string;
  duplicateCount: number;
};

export class AddProductionSafetyIndexesAndRepoUniqueness1748685600000 implements MigrationInterface {
  name = 'AddProductionSafetyIndexesAndRepoUniqueness1748685600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const duplicateRepoRows = (await queryRunner.query(
      `
        SELECT fullName, COUNT(*) AS duplicateCount
        FROM repos
        GROUP BY fullName
        HAVING COUNT(*) > 1
      `,
    )) as DuplicateRepoRow[];

    if (duplicateRepoRows.length > 0) {
      const duplicateNames = duplicateRepoRows
        .map((row: { fullName?: string }) => row.fullName ?? 'unknown')
        .join(', ');

      throw new Error(
        `Cannot add global repository uniqueness because duplicate repos.fullName values exist: ${duplicateNames}`,
      );
    }

    await this.ensureIndex(
      queryRunner,
      'users',
      new TableIndex({
        name: 'IDX_USERS_WORK_EMAIL',
        columnNames: ['workEmail'],
      }),
    );

    await this.ensureIndex(
      queryRunner,
      'users',
      new TableIndex({
        name: 'IDX_USERS_EMAIL',
        columnNames: ['email'],
      }),
    );

    await this.ensureIndex(
      queryRunner,
      'repos',
      new TableIndex({
        name: 'UQ_REPOS_FULL_NAME',
        columnNames: ['fullName'],
        isUnique: true,
      }),
    );

    await this.ensureIndex(
      queryRunner,
      'repos',
      new TableIndex({
        name: 'IDX_REPOS_OWNER_NAME_IS_ACTIVE',
        columnNames: ['owner', 'name', 'isActive'],
      }),
    );

    await this.ensureIndex(
      queryRunner,
      'repos',
      new TableIndex({
        name: 'IDX_REPOS_USER_ID_CREATED_AT',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    await this.ensureIndex(
      queryRunner,
      'pr_analyses',
      new TableIndex({
        name: 'IDX_PR_ANALYSES_REPO_ID_CREATED_AT',
        columnNames: ['repoId', 'createdAt'],
      }),
    );

    await this.ensureIndex(
      queryRunner,
      'pr_analyses',
      new TableIndex({
        name: 'IDX_PR_ANALYSES_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );

    await this.ensureIndex(
      queryRunner,
      'pre_signups',
      new TableIndex({
        name: 'IDX_PRE_SIGNUPS_WORK_EMAIL',
        columnNames: ['workEmail'],
      }),
    );

    await this.ensureIndex(
      queryRunner,
      'pre_signups',
      new TableIndex({
        name: 'IDX_PRE_SIGNUPS_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropIndexIfExists(
      queryRunner,
      'pre_signups',
      'IDX_PRE_SIGNUPS_CREATED_AT',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'pre_signups',
      'IDX_PRE_SIGNUPS_WORK_EMAIL',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'pr_analyses',
      'IDX_PR_ANALYSES_CREATED_AT',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'pr_analyses',
      'IDX_PR_ANALYSES_REPO_ID_CREATED_AT',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'repos',
      'IDX_REPOS_USER_ID_CREATED_AT',
    );
    await this.dropIndexIfExists(
      queryRunner,
      'repos',
      'IDX_REPOS_OWNER_NAME_IS_ACTIVE',
    );
    await this.dropIndexIfExists(queryRunner, 'repos', 'UQ_REPOS_FULL_NAME');
    await this.dropIndexIfExists(queryRunner, 'users', 'IDX_USERS_EMAIL');
    await this.dropIndexIfExists(queryRunner, 'users', 'IDX_USERS_WORK_EMAIL');
  }

  private async ensureIndex(
    queryRunner: QueryRunner,
    tableName: string,
    index: TableIndex,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const hasIndex =
      table?.indices.some(
        (existingIndex) => existingIndex.name === index.name,
      ) ?? false;

    if (!hasIndex) {
      await queryRunner.createIndex(tableName, index);
    }
  }

  private async dropIndexIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const hasIndex =
      table?.indices.some(
        (existingIndex) => existingIndex.name === indexName,
      ) ?? false;

    if (hasIndex) {
      await queryRunner.dropIndex(tableName, indexName);
    }
  }
}
