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
export const LOGINERROR = 'LOGINERROR';
export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';

// SEARCH
export const QUERY = 'QUERY';
export const OFFSET = 'OFFSET';
export const LIMIT = 'LIMIT';

// SUBMIT
export const SUBMITTING = 'SUBMITTING';
export const SUBMITERRORMESSAGES = 'ERRORMESSAGES';
export const SUBMITSUCCESS = 'SUBMITSUCCESS';
export const SUBMITRESET = 'SUBMITRESET';
export const WASSUBMITSUCCESS = 'WASSUBMITSUCCESS';

// BASKET
export const ADDTOBASKET = 'ADDTOBASKET';

// TRACKING
export const TRACKPAGEVISIT = 'TRACKPAGEVISIT';
