import { AaveProvider } from '@aave/react';
import type { GlobalProvider } from '@ladle/react';
import { BaseProvider, DarkTheme, LightTheme } from 'baseui';
// biome-ignore lint/correctness/noUnusedImports: IDE won't play ball with definitions in this folder
import React from 'react';
import { Client as Styletron } from 'styletron-engine-monolithic';
import { Provider as StyletronProvider } from 'styletron-react';

const engine = new Styletron();

import { client } from '../src/client';

export const Provider: GlobalProvider = ({ children, globalState }) => {
  return (
    <StyletronProvider value={engine}>
      <BaseProvider
        theme={{
          ...(globalState.theme === 'dark' ? DarkTheme : LightTheme),
          direction: globalState.rtl ? 'rtl' : 'ltr',
        }}
      >
        <AaveProvider client={client}>{children}</AaveProvider>
      </BaseProvider>
    </StyletronProvider>
  );
};
