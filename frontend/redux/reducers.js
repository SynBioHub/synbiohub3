import { combineReducers } from 'redux';

import * as types from './types';

/*
This file contains the reducers that redux uses to initialize and update
the redux state. This redux state is used by components in sbh for rendering.
To see how these reducers are utilizes to update state, see ./actions.js
*/

// USER REDUCER
const initialUserState = {
  username: '',
  token: '',
  loggedIn: false,
  loginError: false,
  loginErrorMessage: ''
};

/**
 * This reducer initializes and allows state concering the sbh user to
 * be updated
 */
const userReducer = (state = initialUserState, { type, payload }) => {
  switch (type) {
    case types.LOGIN:
      return {
        ...state,
        loggedIn: true,
        loginError: false,
        loginErrorMessage: '',
        username: payload.username,
        token: payload.token
      };
    case types.LOGINERROR:
      return {
        ...state,
        loggedIn: false,
        loginError: true,
        loginErrorMessage: payload
      };
    case types.LOGOUT:
      return initialUserState;
    default:
      return state;
  }
};

// SEARCH REDUCER
const initialSearchState = {
  query: '',
  offset: 0,
  limit: 50
};

/**
 * This reducer initializes and allows state concering search on sbh to
 * be updated
 */
const searchReducer = (state = initialSearchState, { type, payload }) => {
  switch (type) {
    case types.QUERY:
      return {
        ...state,
        query: payload
      };
    case types.OFFSET:
      return {
        ...state,
        offset: payload
      };
    case types.LIMIT:
      return {
        ...state,
        limit: payload
      };
    default:
      return state;
  }
};

// SUBMIT REDUCER
const initialSubmitState = {
  submitting: false,
  showSubmitProgress: false,
  filesUploading: [],
  failedFiles: [],
  fileFailed: false,
  canSubmitTo: [],
  gettingCanSubmitTo: false
};

/**
 * This reducer initializes and allows state concerning design submission to be
 * updated
 */
const submitReducer = (state = initialSubmitState, { type, payload }) => {
  switch (type) {
    case types.SUBMITRESET:
      return {
        ...state,
        submitting: payload,
        filesUploading: [],
        failedFiles: [],
        fileFailed: false
      };
    case types.SUBMITTING:
      return {
        ...state,
        submitting: payload
      };
    case types.SHOWSUBMITPROGRESS:
      return {
        ...state,
        showSubmitProgress: payload
      };
    case types.FILESUPLOADING:
      return {
        ...state,
        filesUploading: payload
      };
    case types.FAILEDFILES:
      return {
        ...state,
        failedFiles: payload
      };
    case types.FILEFAILED:
      return {
        ...state,
        fileFailed: payload
      };
    case types.CANSUBMITTO:
      return {
        ...state,
        canSubmitTo: payload
      };
    case types.GETTINGCANSUBMITTO:
      return {
        ...state,
        gettingCanSubmitTo: payload
      };
    default:
      return state;
  }
};

// COLLECTION REDUCER
const initialCollectionCreateState = {
  promptNewCollection: false,
  creatingCollection: false,
  creatingCollectionErrors: [],
  buttonText: 'New Collection'
};

const collectionCreateReducer = (
  state = initialCollectionCreateState,
  { type, payload }
) => {
  switch (type) {
    case types.PROMPTNEWCOLLECTION:
      return {
        ...state,
        promptNewCollection: payload
      };
    case types.CREATINGCOLLECTION:
      return {
        ...state,
        creatingCollection: payload
      };
    case types.CREATINGCOLLECTIONERRORS:
      return {
        ...state,
        creatingCollectionErrors: payload
      };
    case types.CREATINGCOLLECTIONBUTTONTEXT:
      return {
        ...state,
        buttonText: payload
      };
    default:
      return state;
  }
};

// BASKET REDUCER
const initialBasketState = {
  basket: []
};

/**
 * This reducer initializes and allows state concerning the basket in the search panel to
 * be updated
 */
const basketReducer = (state = initialBasketState, { type, payload }) => {
  return type === types.ADDTOBASKET
    ? {
        ...state,
        basket: [
          ...payload,
          ...state.basket.filter(
            item => payload.findIndex(compare => compare.uri === item.uri) < 0
          )
        ]
      }
    : state;
};

// TRACKER REDUCER
const initialTrackingState = {
  pageVisited: false
};

/**
 * This reducer is used to track basic user use so that components such as the
 * login component can function properly
 */
const trackingReducer = (state = initialTrackingState, { type, payload }) => {
  return type === types.TRACKPAGEVISIT
    ? {
        ...state,
        pageVisited: payload
      }
    : state;
};

// COMBINED REDUCERS
// combine all reducers for sbh to use
const reducers = {
  user: userReducer,
  search: searchReducer,
  submit: submitReducer,
  collectionCreate: collectionCreateReducer,
  basket: basketReducer,
  tracking: trackingReducer
};

export default combineReducers(reducers);
