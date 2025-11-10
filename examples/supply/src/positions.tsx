import {
  type ChainId,
  type EvmAddress,
  type UserPosition,
  useUserPosition,
  useUserPositions,
} from '@aave/react-next';

function PositionDetails({ position }: { position: UserPosition }) {
  return (
    <article>
      <small>
        <p>
          <strong>{position.spoke.name}</strong> position on{' '}
          <strong>{position.spoke.chain.name}</strong>
        </p>
        <p>
          <strong>Total Supplied</strong>&nbsp;
          <span>
            {position.totalSupplied.current.value.toDisplayString(2)}{' '}
            {position.totalSupplied.current.symbol}
          </span>
        </p>
        <p>
          <strong>Total Collateral</strong>&nbsp;
          <span>
            {position.totalCollateral.current.value.toDisplayString(2)}{' '}
            {position.totalCollateral.current.symbol}
          </span>
        </p>
        <p>
          <strong>Total Debt</strong>&nbsp;
          <span>
            {position.totalDebt.current.value.toDisplayString(2)}{' '}
            {position.totalDebt.current.symbol}
          </span>
        </p>
        <p>
          <strong>Net APY</strong>&nbsp;
          <span>{position.netApy.normalized.toDisplayString(2)}%</span>
        </p>
        {position.healthFactor && (
          <p>
            <strong>Health Factor</strong>&nbsp;
            <span>{position.healthFactor.current?.toDisplayString(2)}</span>
          </p>
        )}
      </small>
    </article>
  );
}

export type SingleUserPositionProps = {
  chainId: ChainId;
  spoke: EvmAddress;
  user: EvmAddress;
};

export function SingleUserPosition({
  chainId,
  spoke,
  user,
}: SingleUserPositionProps) {
  const { data } = useUserPosition({
    userSpoke: {
      spoke: {
        address: spoke,
        chainId,
      },
      user,
    },
  });

  if (!data) {
    return null;
  }

  return <PositionDetails position={data} />;
}

export type AllUserPositionsProps = {
  address: EvmAddress;
  chainId: ChainId;
};

export function AllUserPositions({ address, chainId }: AllUserPositionsProps) {
  const { data } = useUserPositions({
    user: address,
    filter: {
      chainIds: [chainId],
    },
  });

  return (
    <div>
      <h2>User Positions</h2>
      {data?.map((position) => (
        <PositionDetails key={position.id} position={position} />
      ))}
    </div>
  );
}
