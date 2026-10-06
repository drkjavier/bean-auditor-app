/**
 * @format
 */

// Activate the dev auth bypass before the app tree loads (authStore reads the
// flag at module load). Dev builds only; release bundles strip it (__DEV__).
import './src/infrastructure/config/devBypassFlag';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
