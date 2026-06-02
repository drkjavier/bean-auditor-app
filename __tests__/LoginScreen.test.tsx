import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import LoginScreen from '../src/presentation/screens/LoginScreen';
import {useAuthStore} from '../src/stores';

// Keep behavior compatible with tests by mocking useAuthStore as a jest mock
jest.mock('../src/stores', () => ({
  useAuthStore: jest.fn(),
}));

describe('LoginScreen', () => {
  const loginMock = jest.fn();
  let setUsernameMock: jest.Mock;

  beforeEach(() => {
    const state: any = {
      username: '',
      login: loginMock,
    };

    setUsernameMock = jest.fn((username: string) => {
      state.username = username;
    });

    (useAuthStore as jest.Mock).mockImplementation((selector: any) => selector({
      ...state,
      setUsername: setUsernameMock,
    }));
    jest.clearAllMocks();
  });

  it('renders correctly and validates inputs', async () => {
    const {getByLabelText, getByText, queryByText} = render(<LoginScreen />);

    const userInput = getByLabelText('Campo usuario');
    const passInput = getByLabelText('Campo contraseña');
    const button = getByText('Entrar');

    // Initially empty -> submission triggers errors
    fireEvent.press(button);

    await waitFor(() => expect(queryByText('Usuario requerido')).toBeTruthy());
    await waitFor(() => expect(queryByText('Contraseña requerida')).toBeTruthy());

    // Fill username and password
    fireEvent.changeText(userInput, 'admin');
    fireEvent.changeText(passInput, 'admin');

    // Mock login resolves
    (loginMock as jest.Mock).mockResolvedValueOnce(undefined);

    fireEvent.press(button);

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('admin'));
  });
});
