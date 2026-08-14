import {
  type Cursor,
  InvariantError,
  invariant,
  ok,
  PageSize,
  type PaginatedSpokePositionManagerResult,
  ResultAsync,
  type SpokePositionManagersRequest,
  type UnexpectedError,
} from '@aave/client';
import { spokePositionManagers } from '@aave/client/actions';
import { Flags } from '@oclif/core';

import * as common from '../../common.js';

const PAGE_SIZE_OPTIONS = [PageSize.Ten, PageSize.Fifty];

export default class SpokePositionManagersCommand extends common.V4Command {
  static override description =
    'List position managers available for a specific spoke';

  static override flags = {
    spoke: common.spoke({
      required: true,
      description: 'Spoke ID to query position managers from',
    }),
    'include-inactive': Flags.boolean({
      required: false,
      default: false,
      description: 'Include inactive position managers',
    }),
    'page-size': Flags.string({
      required: false,
      default: PageSize.Ten,
      options: PAGE_SIZE_OPTIONS,
      description: 'Number of results per page',
    }),
    cursor: Flags.string({
      required: false,
      description: 'Pagination cursor returned by a previous request',
    }),
  };

  protected override headers = [
    { value: 'Name' },
    { value: 'Address' },
    { value: 'Active' },
  ];

  private getRequest(): ResultAsync<
    SpokePositionManagersRequest,
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(SpokePositionManagersCommand),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      invariant(flags.spoke, 'You must provide a spoke ID');

      return ok({
        spoke: flags.spoke,
        includeInactive: flags['include-inactive'] || undefined,
        pageSize: flags['page-size'] as PageSize,
        cursor: flags.cursor as Cursor | undefined,
      });
    });
  }

  async run(): Promise<
    PaginatedSpokePositionManagerResult | InvariantError | UnexpectedError
  > {
    const result = await this.getRequest()
      .andThen((request) => spokePositionManagers(this.client, request))
      .andThen((data) => {
        if (data.items.length === 0) {
          this.log('No position managers found for this spoke.');
          return ok(data);
        }

        this.display(
          data.items.map((manager) => [
            manager.name,
            manager.address,
            manager.active ? 'Yes' : 'No',
          ]),
        );

        if (data.pageInfo.next) {
          this.log(`\nNext cursor: ${data.pageInfo.next}`);
        }

        return ok(data);
      });

    if (result.isErr()) {
      this.error(result.error);
    }

    return result.value;
  }
}
