import * as types from './types'
// USER ACTIONS


// SEARCHING ACTIONS
export const setSearchingActive = (isOpen) => (dispatch) => {
  dispatch({
    type: types.SEARCHINGOPEN,
    payload: isOpen
  })
}

export const setSearchQuery = (query) => (dispatch) => {
  dispatch({
    type: types.QUERY,
    payload: query
  })
}

export const setOffset = (newOffset) => (dispatch) => {
  dispatch({
    type: types.OFFSET,
    payload: newOffset
  })
}

// BASKET ACTIONS
export const addToBasket = (uriArray) => (dispatch) => {
  dispatch({
    type: types.ADDTOBASKET,
    payload: uriArray
  })
}
