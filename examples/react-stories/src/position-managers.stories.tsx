import {
  type Cursor,
  type EvmAddress,
  type Hub,
  PageSize,
  type Spoke,
  type SpokePositionManager,
  type SpokeUserPositionManager,
  useSpokePositionManagers,
  useSpokeUserPositionManagers,
} from '@aave/react';
import type { Story } from '@ladle/react';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { Checkbox } from 'baseui/checkbox';
import { FormControl } from 'baseui/form-control';
import { ListItem, ListItemLabel } from 'baseui/list';
import { Notification } from 'baseui/notification';
import { HeadingLarge, HeadingMedium, ParagraphSmall } from 'baseui/typography';
import { type ReactNode, useState } from 'react';
import { HubSelector } from './components/HubSelector';
import { SpokeSelector } from './components/SpokeSelector';
import * as config from './config';
import { user } from './wallet';

type AvailableManagersProps = {
  cursor: Cursor | undefined;
  includeInactive: boolean;
  onNext: (cursor: Cursor) => void;
  onReset: () => void;
  spoke: Spoke;
};

function AvailableManagers({
  cursor,
  includeInactive,
  onNext,
  onReset,
  spoke,
}: AvailableManagersProps) {
  const { data, loading, error } = useSpokePositionManagers({
    spoke: spoke.id,
    includeInactive,
    pageSize: PageSize.Ten,
    cursor,
  });

  return (
    <ManagerSection
      title='Available Managers'
      description='Position managers configured for this spoke.'
      loading={loading}
      error={error?.message}
      emptyMessage='No position managers found for this spoke.'
      itemsCount={data?.items.length ?? 0}
      next={data?.pageInfo.next ?? undefined}
      onNext={onNext}
      onReset={onReset}
      canReset={Boolean(cursor)}
    >
      {data?.items.map((manager) => (
        <AvailableManagerItem key={manager.address} manager={manager} />
      ))}
    </ManagerSection>
  );
}

type ApprovedManagersProps = {
  cursor: Cursor | undefined;
  onNext: (cursor: Cursor) => void;
  onReset: () => void;
  spoke: Spoke;
  user: EvmAddress;
};

function ApprovedManagers({
  cursor,
  onNext,
  onReset,
  spoke,
  user,
}: ApprovedManagersProps) {
  const { data, loading, error } = useSpokeUserPositionManagers({
    spoke: spoke.id,
    user,
    pageSize: PageSize.Ten,
    cursor,
  });

  return (
    <ManagerSection
      title='User-Approved Managers'
      description='Managers currently approved to operate on behalf of this user.'
      loading={loading}
      error={error?.message}
      emptyMessage='No approved position managers found for this user.'
      itemsCount={data?.items.length ?? 0}
      next={data?.pageInfo.next ?? undefined}
      onNext={onNext}
      onReset={onReset}
      canReset={Boolean(cursor)}
    >
      {data?.items.map((manager) => (
        <ApprovedManagerItem key={manager.address} manager={manager} />
      ))}
    </ManagerSection>
  );
}

type ManagerSectionProps = {
  canReset: boolean;
  children: ReactNode;
  description: string;
  emptyMessage: string;
  error: string | undefined;
  itemsCount: number;
  loading: boolean;
  next: Cursor | undefined;
  onNext: (cursor: Cursor) => void;
  onReset: () => void;
  title: string;
};

function ManagerSection({
  canReset,
  children,
  description,
  emptyMessage,
  error,
  itemsCount,
  loading,
  next,
  onNext,
  onReset,
  title,
}: ManagerSectionProps) {
  const hasItems = itemsCount > 0;

  return (
    <Block
      as='section'
      padding='scale600'
      marginTop='scale600'
      $style={{
        border: '1px solid #E2E2E2',
        borderRadius: '8px',
      }}
    >
      <HeadingMedium marginTop='0' marginBottom='scale200'>
        {title}
      </HeadingMedium>
      <ParagraphSmall color='contentSecondary' marginTop='0'>
        {description}
      </ParagraphSmall>

      {loading && <Notification>Loading position managers...</Notification>}

      {error && <Notification kind='negative'>{error}</Notification>}

      {!loading && !error && !hasItems && (
        <Notification>{emptyMessage}</Notification>
      )}

      {!loading && !error && hasItems && (
        <Block as='ol' $style={{ paddingLeft: 0, listStyle: 'none' }}>
          {children}
        </Block>
      )}

      <Block display='flex' gridGap='scale400' marginTop='scale600'>
        <Button
          type='button'
          disabled={!next}
          onClick={() => next && onNext(next)}
        >
          Next page
        </Button>
        <Button type='button' disabled={!canReset} onClick={onReset}>
          Reset cursor
        </Button>
      </Block>
    </Block>
  );
}

function AvailableManagerItem({ manager }: { manager: SpokePositionManager }) {
  return (
    <ListItem
      endEnhancer={() => (
        <ParagraphSmall>
          {manager.active ? 'Active' : 'Inactive'}
        </ParagraphSmall>
      )}
    >
      <ListItemLabel description={manager.address}>
        {manager.name}
      </ListItemLabel>
    </ListItem>
  );
}

function ApprovedManagerItem({
  manager,
}: {
  manager: SpokeUserPositionManager;
}) {
  return (
    <ListItem
      endEnhancer={() => (
        <ParagraphSmall>
          {manager.active ? 'Active' : 'Inactive'}
        </ParagraphSmall>
      )}
    >
      <ListItemLabel
        description={`${manager.address} - approved ${manager.approvedOn.toLocaleString()}`}
      >
        {manager.name}
      </ListItemLabel>
    </ListItem>
  );
}

function PositionManagerLists({ spoke }: { spoke: Spoke }) {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [availableCursor, setAvailableCursor] = useState<Cursor | undefined>();
  const [approvedCursor, setApprovedCursor] = useState<Cursor | undefined>();

  const toggleInactiveManagers = (checked: boolean) => {
    setIncludeInactive(checked);
    setAvailableCursor(undefined);
  };

  return (
    <>
      <FormControl>
        <Checkbox
          checked={includeInactive}
          onChange={(event) => toggleInactiveManagers(event.target.checked)}
        >
          Include inactive managers
        </Checkbox>
      </FormControl>

      <AvailableManagers
        spoke={spoke}
        includeInactive={includeInactive}
        cursor={availableCursor}
        onNext={setAvailableCursor}
        onReset={() => setAvailableCursor(undefined)}
      />

      <ApprovedManagers
        spoke={spoke}
        user={user}
        cursor={approvedCursor}
        onNext={setApprovedCursor}
        onReset={() => setApprovedCursor(undefined)}
      />
    </>
  );
}

export const ReadLists: Story = () => {
  const [hub, setHub] = useState<Hub | null>(null);
  const [spoke, setSpoke] = useState<Spoke | null>(null);

  const handleHubSelect = (selected: Hub | null) => {
    setHub(selected);
    setSpoke(null);
  };

  return (
    <>
      <HeadingLarge>Position Manager Read Lists</HeadingLarge>
      <ParagraphSmall color='contentSecondary'>
        Inspect managers configured for a spoke and managers approved by the
        connected user.
      </ParagraphSmall>

      <HubSelector
        chainId={config.chainId}
        onChange={handleHubSelect}
        selected={hub}
      />

      <SpokeSelector hubId={hub?.id} onChange={setSpoke} selected={spoke} />

      {spoke && <PositionManagerLists key={spoke.id} spoke={spoke} />}
    </>
  );
};
