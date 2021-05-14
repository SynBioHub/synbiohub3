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
  loginErrorMessage: '',
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
        token: payload.token,
      };
    case types.LOGINERROR:
      return {
        ...state,
        loggedIn: false,
        loginError: true,
        loginErrorMessage: payload,
      };
    default:
      return state;
  }
};

// SEARCH REDUCER
const initialSearchState = {
  query: '',
  offset: 0,
  active: false,
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
        query: payload,
      };
    case types.OFFSET:
      return {
        ...state,
        offset: payload,
      };
    case types.SEARCHINGOPEN:
      return {
        ...state,
        active: payload,
      };
    default:
      return state;
  }
};

// BASKET REDUCER
const initialBasketState = {
  basket: [],
};

/**
 * This reducer initializes and allows state concering the basket in the search panel to
 * be updated
 */
const basketReducer = (state = initialBasketState, { type, payload }) => {
  switch (type) {
    case types.ADDTOBASKET:
      return {
        ...state,
        basket: payload.concat(...state.basket.filter((item) => payload.findIndex((compare) => compare.uri === item.uri) < 0)),
      };
    default:
      return state;
  }
};

// TRACKER REDUCER
const initialTrackingState = {
  pageVisited: false,
};

/**
 * This reducer is used to track basic user use so that components such as the
 * login component can function properly
 */
const trackingReducer = (state = initialTrackingState, { type, payload }) => {
  switch (type) {
    case types.TRACKPAGEVISIT:
      return {
        ...state,
        pageVisited: payload,
      };
    default:
      return state;
  }
};

// COMBINED REDUCERS
// combine all reducers for sbh to use
const reducers = {
  user: userReducer,
  search: searchReducer,
  basket: basketReducer,
  tracking: trackingReducer,
};

export default combineReducers(reducers);
