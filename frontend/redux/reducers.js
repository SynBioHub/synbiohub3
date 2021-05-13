import { combineReducers } from 'redux';
import * as types from './types';

// USER REDUCER
const initialUserState = {
  username: '',
  token: '',
};

const userReducer = (state = initialUserState, { type, payload }) => {
  switch (type) {
    case types.USERNAME:
      return {
        ...state,
        username: payload,
      };
    case types.USERTOKEN:
      return {
        ...state,
        userToken: payload,
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

// COMBINED REDUCERS
const reducers = {
  user: userReducer,
  search: searchReducer,
  basket: basketReducer,
};

export default combineReducers(reducers);
