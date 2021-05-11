import { combineReducers } from 'redux'
import * as types from './types'

// USER REDUCER
const initialUserState = {
   username: '',
   userToken: ''
};
const userReducer = (state = initialUserState, { type, payload}) => {
   switch(type) {
      case types.USERNAME:
         return {
            ...state,
            username: payload
         }
      case types.USERTOKEN:
         return {
            ...state,
            userToken: payload
         }
      default:
         return state
   }
}

// SEARCH REDUCER
const initialSearchState = {
   query: '',
   offset: 0,
   count: 0,
   active: false
}

const searchReducer = (state = initialSearchState, { type, payload }) => {
   switch(type) {
      case types.QUERY:
         return {
            ...state,
            query: payload
         }
      case types.OFFSET:
         return {
            ...state,
            offset: payload
         }
      case types.COUNT:
         return {
            ...state,
            count: payload
         }
      case types.SEARCHINGOPEN:
         return {
            ...state,
            active: payload
         }
      default:
         return state
   }
}

// COMBINED REDUCERS
const reducers = {
   user: userReducer,
   search: searchReducer
}

export default combineReducers(reducers)