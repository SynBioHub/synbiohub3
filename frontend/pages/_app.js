import '../styles/globals.css';
import '@fortawesome/fontawesome-svg-core/styles.css';

import { config } from '@fortawesome/fontawesome-svg-core';
import { Provider } from 'react-redux';
import { useRouter } from 'next/router';
import { useStore } from '../redux/store';
config.autoAddCss = false; // Tell Font Awesome to skip adding the CSS automatically since it's being imported above

import App from 'next/app';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

import { ToastContainer } from 'react-toastify';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Loading from '../components/Reusable/Loading';
import Setup from '../specialAccess/setup';
import { addError } from '../redux/actions';
import Errors from '../components/Error/Errors';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';

/**
* This component is the starting component for the sbh app. Uses Provider
* from react-redux so that entire app can access redux state
*/
function MyApp({ Component, pageProps }) {
    const store = useStore(pageProps.initialReduxState);
    const persister = persistStore(store);
    const [isInitializing, setIsInitializing] = useState(true);
    const [inSetupMode, setInSetupMode] = useState(false);
    const router = useRouter();

    useEffect(() => {
        console.log('Checking if in setup mode...');
        
        axios
            .get(`${publicRuntimeConfig.backend}/admin/theme`, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/plain'
                }
            })
            .then(response => {
                if (response.data.firstLaunch) {
                    setInSetupMode(true);
                } else {
                    setInSetupMode(false);
                }
                setIsInitializing(false);
            })
            .catch(error => {
                let customMessage = 'An unexpected error occurred while fetching theme data.';

                // Check if it's a network error
                if (error.message === 'Network Error') {
                    customMessage = 'Unable to connect to the backend server. Please check your network connection.';
                }
                // You can add more conditions here for different types of errors

                // Update the error object
                error.customMessage = customMessage;
                console.log(error);
                error.fullUrl = `${publicRuntimeConfig.backend}/admin/theme`;

                // Dispatch the error to your Redux store
                store.dispatch(addError(error));
            });
    }, []);

    /* eslint no-console: "off" */

    if (isInitializing) {
        return (
            <Provider store={store}>
                <PersistGate loading={null} persister={persister}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100vh'
                        }}
                    >
                        <Errors />
                        <Loading />
                    </div>
                </PersistGate>
            </Provider>
        );
    }

    return (
        <Provider store={store}>
            <PersistGate loading={null} persister={persister} >
                {inSetupMode ? (
                    <Setup setInSetupMode={setInSetupMode} />
                ) : (
                    <Component {...pageProps} key={router.asPath} />
                )}
                <ToastContainer />
            </PersistGate>
        </Provider>
    );
}

MyApp.getInitialProps = async appContext => {
    // calls page's `getInitialProps` and fills `appProps.pageProps`
    const appProperties = await App.getInitialProps(appContext);

    return { ...appProperties };
};

export default MyApp;
