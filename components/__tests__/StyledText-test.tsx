// Trigger linter refresh
import * as React from 'react';
import renderer, { act } from 'react-test-renderer';

import { MonoText } from '../StyledText';

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

it(`renders correctly`, () => {
  let tree;

  act(() => {
    tree = renderer.create(<MonoText>Snapshot test!</MonoText>).toJSON();
  });

  expect(tree).toMatchSnapshot();
});
