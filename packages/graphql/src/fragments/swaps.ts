import type { FragmentOf } from 'gql.tada';
import { graphql } from '../graphql';
import { PercentValueFragment, TokenAmountFragment } from './common';

export const SwapQuoteCostsFragment = graphql(
  `fragment SwapQuoteCosts on SwapQuoteCosts {
    __typename
    networkCosts {
      ...TokenAmount
    }
    partnerFeeAmount {
      ...TokenAmount
    }
  }`,
  [TokenAmountFragment],
);
export type SwapQuoteCosts = FragmentOf<typeof SwapQuoteCostsFragment>;

export const SwapQuoteFragment = graphql(
  `fragment SwapQuote on SwapQuote {
    __typename
    suggestedSlippage {
      ...PercentValue
    }
    sellAmount {
      ...TokenAmount
    }
    buyAmount {
      ...TokenAmount
    }
    costs {
      ...SwapQuoteCosts
    }
    minimumReceived {
      ...TokenAmount
    }
  }`,
  [PercentValueFragment, TokenAmountFragment, SwapQuoteCostsFragment],
);
export type SwapQuote = FragmentOf<typeof SwapQuoteFragment>;
