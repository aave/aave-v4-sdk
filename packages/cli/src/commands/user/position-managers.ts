import {
  type Cursor,
  type EvmAddress,
  InvariantError,
  invariant,
  ok,
  PageSize,
  type PaginatedSpokeUserPositionManagerResult,
  ResultAsync,
  type SpokeUserPositionManagersRequest,
  type UnexpectedError,
} from '@aave/client';
import { spokeUserPositionManagers } from '@aave/client/actions';
import { Flags } from '@oclif/core';

import * as common from '../../common.js';

const PAGE_SIZE_OPTIONS = [PageSize.Ten, PageSize.Fifty];

function formatDateTime(date: Date): string {
  return date.toISOString();
}

export default class UserPositionManagersCommand extends common.V4Command {
  static override description =
    'List position managers approved by a user for a specific spoke';

  static override flags = {
    address: common.address({
      required: false,
      description: 'User address (defaults to PRIVATE_KEY wallet address)',
    }),
    spoke: common.spoke({
      required: true,
      description: 'Spoke ID to query user position managers from',
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
    { value: 'Approved On' },
  ];

  private getRequest(): ResultAsync<
    SpokeUserPositionManagersRequest,
    InvariantError | UnexpectedError
  > {
    return ResultAsync.fromPromise(
      this.parse(UserPositionManagersCommand),
      (error) => new InvariantError(String(error)),
    ).andThen(({ flags }) => {
      const user = common.userAddressFromFlagOrEnv(
        flags.address as EvmAddress | undefined,
      );

      invariant(flags.spoke, 'You must provide a spoke ID');

      return ok({
        spoke: flags.spoke,
        user,
        pageSize: flags['page-size'] as PageSize,
        cursor: flags.cursor as Cursor | undefined,
      });
    });
  }

  async run(): Promise<
    PaginatedSpokeUserPositionManagerResult | InvariantError | UnexpectedError
  > {
    const result = await this.getRequest()
      .andThen((request) => spokeUserPositionManagers(this.client, request))
      .andThen((data) => {
        if (data.items.length === 0) {
          this.log('No approved position managers found for this user.');
          return ok(data);
        }

        this.display(
          data.items.map((manager) => [
            manager.name,
            manager.address,
            manager.active ? 'Yes' : 'No',
            formatDateTime(manager.approvedOn),
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
