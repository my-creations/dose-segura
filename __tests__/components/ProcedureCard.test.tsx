import React from 'react';
import { render } from '@testing-library/react-native';

import { ProcedureCard } from '@/components/ProcedureCard';
import { builtinProcedures } from '@/procedures/builtin';
import type { Procedure } from '@/types/procedure';

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

const userProcedure: Procedure = {
  id: 'user-card',
  title: 'Meu procedimento',
  materials: ['Luvas'],
  steps: ['Identificar o doente', 'Documentar'],
  attention: ['Protocolo local'],
  source: 'user',
  updatedAt: '2026-09-02T00:00:00.000Z',
};

describe('ProcedureCard', () => {
  it('renders a built-in procedure title and badge', () => {
    const procedure = builtinProcedures[0]!;
    const { getByText, getByTestId } = render(<ProcedureCard procedure={procedure} />);

    expect(getByText(procedure.title)).toBeTruthy();
    expect(getByText('Incluído')).toBeTruthy();
    expect(getByTestId(`procedure-card-${procedure.id}`)).toBeTruthy();
  });

  it('renders a user procedure badge and summary counts', () => {
    const { getByText } = render(<ProcedureCard procedure={userProcedure} />);

    expect(getByText('Meu procedimento')).toBeTruthy();
    expect(getByText('Meu')).toBeTruthy();
    expect(getByText('1 materiais · 2 passos')).toBeTruthy();
  });
});
