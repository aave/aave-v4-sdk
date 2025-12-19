import {
  type ChainId,
  type EvmAddress,
  type SpokeId,
  type UserPosition,
  useUserPosition,
  useUserPositions,
} from '@aave/react';
import { Block } from 'baseui/block';
import { HeadingXSmall, ParagraphSmall } from 'baseui/typography';

function PositionDetails({ position }: { position: UserPosition }) {
  return (
    <Block as='article'>
      <HeadingXSmall>
        <strong>{position.spoke.name}</strong> position on{' '}
        <strong>{position.spoke.chain.name}</strong>
      </HeadingXSmall>
      <ParagraphSmall>
        <strong>Total Supplied</strong>&nbsp;
        <span>
          {position.totalSupplied.current.value.toDisplayString(2)}{' '}
          {position.totalSupplied.current.symbol}
        </span>
      </ParagraphSmall>
      <ParagraphSmall>
        <strong>Total Collateral</strong>&nbsp;
        <span>
          {position.totalCollateral.current.value.toDisplayString(2)}{' '}
          {position.totalCollateral.current.symbol}
        </span>
      </ParagraphSmall>
      <ParagraphSmall>
        <strong>Total Debt</strong>&nbsp;
        <span>
          {position.totalDebt.current.value.toDisplayString(2)}{' '}
          {position.totalDebt.current.symbol}
        </span>
      </ParagraphSmall>
      <ParagraphSmall>
        <strong>Net APY</strong>&nbsp;
        <span>{position.netApy.normalized.toDisplayString(2)}%</span>
      </ParagraphSmall>
      {position.healthFactor.current && (
        <ParagraphSmall>
          <strong>Health Factor</strong>&nbsp;
          <span>{position.healthFactor.current.toDisplayString(2)}</span>
        </ParagraphSmall>
      )}
    </Block>
  );
}

export type SingleUserPositionProps = {
  spokeId: SpokeId;
  user: EvmAddress;
};

export function SingleUserPosition({ spokeId, user }: SingleUserPositionProps) {
  const { data } = useUserPosition({
    userSpoke: {
      spoke: spokeId,
      user,
    },
  });

  if (!data) {
    return null;
  }

  return <PositionDetails position={data} />;
}

export type AllUserPositionsProps = {
  user: EvmAddress;
  chainId: ChainId;
};

export function AllUserPositions({ user, chainId }: AllUserPositionsProps) {
  const { data } = useUserPositions({
    user,
    filter: {
      chainIds: [chainId],
    },
  });

  return (
    <>
      {data?.map((position) => (
        <PositionDetails key={position.id} position={position} />
      ))}
    </>
  );
}
