import {
  MigrationInterface,
  QueryRunner,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CleanTableAndColumnNames1748692000000 implements MigrationInterface {
  name = 'CleanTableAndColumnNames1748692000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.dropForeignKeyByColumn(queryRunner, 'pr_analyses', 'repoId');
    await this.dropForeignKeyByColumn(queryRunner, 'repos', 'userId');

    await this.renameTableIfNeeded(queryRunner, 'repos', 'repositories');
    await this.renameTableIfNeeded(
      queryRunner,
      'pr_analyses',
      'pull_request_analyses',
    );
    await this.renameTableIfNeeded(queryRunner, 'pre_signups', 'signups');

    await this.renameColumnIfNeeded(
      queryRunner,
      'repositories',
      'webhookId',
      'githubWebhookId',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'pull_request_analyses',
      'findings',
      'reportMarkdown',
    );

    await this.recreateIndex(
      queryRunner,
      'repositories',
      'UQ_REPOS_FULL_NAME',
      new TableIndex({
        name: 'UQ_REPOSITORIES_FULL_NAME',
        columnNames: ['fullName'],
        isUnique: true,
      }),
    );
    await this.recreateIndex(
      queryRunner,
      'repositories',
      'IDX_REPOS_OWNER_NAME_IS_ACTIVE',
      new TableIndex({
        name: 'IDX_REPOSITORIES_OWNER_NAME_IS_ACTIVE',
        columnNames: ['owner', 'name', 'isActive'],
      }),
    );
    await this.recreateIndex(
      queryRunner,
      'repositories',
      'IDX_REPOS_USER_ID_CREATED_AT',
      new TableIndex({
        name: 'IDX_REPOSITORIES_USER_ID_CREATED_AT',
        columnNames: ['userId', 'createdAt'],
      }),
    );
    await this.recreateIndex(
      queryRunner,
      'pull_request_analyses',
      'IDX_PR_ANALYSES_REPO_ID_CREATED_AT',
      new TableIndex({
        name: 'IDX_PULL_REQUEST_ANALYSES_REPO_ID_CREATED_AT',
        columnNames: ['repoId', 'createdAt'],
      }),
    );
    await this.recreateIndex(
      queryRunner,
      'pull_request_analyses',
      'IDX_PR_ANALYSES_CREATED_AT',
      new TableIndex({
        name: 'IDX_PULL_REQUEST_ANALYSES_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );
    await this.recreateIndex(
      queryRunner,
      'signups',
      'IDX_PRE_SIGNUPS_WORK_EMAIL',
      new TableIndex({
        name: 'IDX_SIGNUPS_WORK_EMAIL',
        columnNames: ['workEmail'],
      }),
    );
    await this.recreateIndex(
      queryRunner,
      'signups',
      'IDX_PRE_SIGNUPS_CREATED_AT',
      new TableIndex({
        name: 'IDX_SIGNUPS_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );

    await this.ensureForeignKey(
      queryRunner,
      'repositories',
      new TableForeignKey({
        name: 'FK_REPOSITORIES_USER_ID',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await this.ensureForeignKey(
      queryRunner,
      'pull_request_analyses',
      new TableForeignKey({
        name: 'FK_PULL_REQUEST_ANALYSES_REPO_ID',
        columnNames: ['repoId'],
        referencedTableName: 'repositories',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropForeignKeyByName(
      queryRunner,
      'pull_request_analyses',
      'FK_PULL_REQUEST_ANALYSES_REPO_ID',
    );
    await this.dropForeignKeyByName(
      queryRunner,
      'repositories',
      'FK_REPOSITORIES_USER_ID',
    );

    await this.recreateIndex(
      queryRunner,
      'signups',
      'IDX_SIGNUPS_CREATED_AT',
      new TableIndex({
        name: 'IDX_PRE_SIGNUPS_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );
    await this.recreateIndex(
      queryRunner,
      'signups',
      'IDX_SIGNUPS_WORK_EMAIL',
      new TableIndex({
        name: 'IDX_PRE_SIGNUPS_WORK_EMAIL',
        columnNames: ['workEmail'],
      }),
    );
    await this.recreateIndex(
      queryRunner,
      'pull_request_analyses',
      'IDX_PULL_REQUEST_ANALYSES_CREATED_AT',
      new TableIndex({
        name: 'IDX_PR_ANALYSES_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );
    await this.recreateIndex(
      queryRunner,
      'pull_request_analyses',
      'IDX_PULL_REQUEST_ANALYSES_REPO_ID_CREATED_AT',
      new TableIndex({
        name: 'IDX_PR_ANALYSES_REPO_ID_CREATED_AT',
        columnNames: ['repoId', 'createdAt'],
      }),
    );
    await this.recreateIndex(
      queryRunner,
      'repositories',
      'IDX_REPOSITORIES_USER_ID_CREATED_AT',
      new TableIndex({
        name: 'IDX_REPOS_USER_ID_CREATED_AT',
        columnNames: ['userId', 'createdAt'],
      }),
    );
    await this.recreateIndex(
      queryRunner,
      'repositories',
      'IDX_REPOSITORIES_OWNER_NAME_IS_ACTIVE',
      new TableIndex({
        name: 'IDX_REPOS_OWNER_NAME_IS_ACTIVE',
        columnNames: ['owner', 'name', 'isActive'],
      }),
    );
    await this.recreateIndex(
      queryRunner,
      'repositories',
      'UQ_REPOSITORIES_FULL_NAME',
      new TableIndex({
        name: 'UQ_REPOS_FULL_NAME',
        columnNames: ['fullName'],
        isUnique: true,
      }),
    );

    await this.renameColumnIfNeeded(
      queryRunner,
      'pull_request_analyses',
      'reportMarkdown',
      'findings',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'repositories',
      'githubWebhookId',
      'webhookId',
    );

    await this.renameTableIfNeeded(queryRunner, 'signups', 'pre_signups');
    await this.renameTableIfNeeded(
      queryRunner,
      'pull_request_analyses',
      'pr_analyses',
    );
    await this.renameTableIfNeeded(queryRunner, 'repositories', 'repos');

    await this.ensureForeignKey(
      queryRunner,
      'repos',
      new TableForeignKey({
        name: 'FK_REPOS_USER_ID',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await this.ensureForeignKey(
      queryRunner,
      'pr_analyses',
      new TableForeignKey({
        name: 'FK_PR_ANALYSES_REPO_ID',
        columnNames: ['repoId'],
        referencedTableName: 'repos',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  private async renameTableIfNeeded(
    queryRunner: QueryRunner,
    from: string,
    to: string,
  ): Promise<void> {
    const hasFromTable = await queryRunner.hasTable(from);
    const hasToTable = await queryRunner.hasTable(to);

    if (hasFromTable && !hasToTable) {
      await queryRunner.renameTable(from, to);
    }
  }

  private async renameColumnIfNeeded(
    queryRunner: QueryRunner,
    tableName: string,
    from: string,
    to: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);

    if (!table) {
      return;
    }

    const fromColumn = table.findColumnByName(from);
    const toColumn = table.findColumnByName(to);

    if (fromColumn && !toColumn) {
      await queryRunner.renameColumn(tableName, from, to);
    }
  }

  private async recreateIndex(
    queryRunner: QueryRunner,
    tableName: string,
    oldIndexName: string,
    nextIndex: TableIndex,
  ): Promise<void> {
    await this.dropIndexIfExists(queryRunner, tableName, oldIndexName);
    await this.ensureIndex(queryRunner, tableName, nextIndex);
  }

  private async ensureIndex(
    queryRunner: QueryRunner,
    tableName: string,
    index: TableIndex,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const hasIndex =
      table?.indices.some((existingIndex) => {
        const sameName = existingIndex.name === index.name;
        const sameUniqueness = existingIndex.isUnique === !!index.isUnique;
        const sameColumns =
          existingIndex.columnNames.length === index.columnNames.length &&
          existingIndex.columnNames.every(
            (columnName, indexPosition) =>
              columnName === index.columnNames[indexPosition],
          );

        return sameName || (sameUniqueness && sameColumns);
      }) ?? false;

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

  private async ensureForeignKey(
    queryRunner: QueryRunner,
    tableName: string,
    foreignKey: TableForeignKey,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const hasForeignKey =
      table?.foreignKeys.some(
        (existingForeignKey) =>
          existingForeignKey.name === foreignKey.name ||
          (existingForeignKey.columnNames.join(',') ===
            foreignKey.columnNames.join(',') &&
            existingForeignKey.referencedTableName ===
              foreignKey.referencedTableName),
      ) ?? false;

    if (!hasForeignKey) {
      await queryRunner.createForeignKey(tableName, foreignKey);
    }
  }

  private async dropForeignKeyByName(
    queryRunner: QueryRunner,
    tableName: string,
    foreignKeyName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const foreignKey = table?.foreignKeys.find(
      (existingForeignKey) => existingForeignKey.name === foreignKeyName,
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey(tableName, foreignKey);
    }
  }

  private async dropForeignKeyByColumn(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);

    if (!table) {
      return;
    }

    const foreignKey = table.foreignKeys.find((existingForeignKey) =>
      existingForeignKey.columnNames.includes(columnName),
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey(tableName, foreignKey);
    }
  }
}
