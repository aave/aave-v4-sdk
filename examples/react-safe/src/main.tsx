import { AaveProvider } from '@aave/react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { client } from './client';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <AaveProvider client={client}>
    <App />
  </AaveProvider>,
);
