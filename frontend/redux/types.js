// REDUX ACTION TYPES

/*
This file stores all the 'types', which are used by the reducers (see ./reducers.js)
and actions (see ./actions.js) to update the redux state. These types are stored here,
rather than being typed out twice in actions and reducers, for consistency (reduces typos)
and code reusability.
*/

// USER
export const USERNAME = 'USERNAME';
export const USERTOKEN = 'USERTOKEN';
export const LOGGEDIN = 'LOGGEDIN';

// SEARCH
export const QUERY = 'QUERY';
export const OFFSET = 'OFFSET';
export const SEARCHINGOPEN = 'SEARCHINGOPEN';

// BASKET
export const ADDTOBASKET = 'ADDTOBASKET';