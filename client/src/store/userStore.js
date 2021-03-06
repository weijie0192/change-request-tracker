/**
 * @author Wei Zheng
 * @description store authentication data and user information
 */

import HTTP from '../http';
import router from '../router';

export default {
  namespaced: true,
  /**
   * state attribute
   */
  state: {
    user: {
      email: null
    },
    ex_error: null,
    token: null,
    loading: false,
    flagList: null,
    notifyList: null,
    msgList: null,
    registrationCode: null,
    refresh: 0,
    msgRefreshData: null
  },

  /**
   * do action related to current state
   */
  actions: {
    // fetch user profile
    fetchUser({ commit }) {
      return (
        HTTP()
          .get('/user')
          // if user exist set user information in state, else set error message then redirect to login view
          .then(({ data }) => {
            if (data) {
              commit('setUser', data);
            } else {
              this.dispatch(
                'errorStore/setExceptionError',
                'Cannot find the user. Try to Re-login.'
              );
              router.push('/login');
            }
          })
          .catch(() => {
            this.dispatch(
              'errorStore/setExceptionError',
              'Cannot find the user. Try to Re-login.'
            );
            router.push('/login');
          })
      );
    },

    // get navigation menu list for current user by request
    // request type: notification, flag, and unread message.
    fetchNavMenu({ commit }, request) {
      HTTP()
        .get(`/util/${request}`)
        .then(({ data }) => {
          commit(`${request}Commit`, data);
        })
        .catch((e) => {
          this.dispatch('errorStore/setGlobalError', e);
          // router.push('/login');
        });
    },

    clearNewNotification({ dispatch }, target) {
      HTTP()
        .put(`/util/notification/clear-new/${target}`)
        .then(() => {
          // refresh notification menu
          dispatch('fetchNavMenu', 'notification');
        })
        .catch((e) => {
          this.dispatch('errorStore/setGlobalError', e);
        });
    },

    // clear all new messages
    clearNewMsg({ dispatch, commit }) {
      HTTP()
        .put('message/clear-new')
        .then(() => {
          // refresh msg menu
          dispatch('fetchNavMenu', 'msg');
          // refresh mailbox
          commit('refreshMailbox', { refresh: true });
        })
        .catch((e) => {
          this.dispatch('errorStore/setGlobalError', e);
        });
    },

    // set exception error action
    setExceptionError({ commit }, string) {
      commit('setExceptionError', string);
    },

    // set token and everything to null
    logoutClear({ state, commit }) {
      commit('flagCommit', null);
      commit('msgCommit', null);
      commit('notificationCommit', null);
      commit('setToken', null);
      commit('setUser', { email: state.user.email });
      this.commit('crStore/setCRList', null);
    },

    // login user
    loginUser({ commit, dispatch }, token) {
      // set token
      commit('setToken', token);
      // fetech information
      dispatch('fetchUser');
      dispatch('fetchNavMenu', 'flag');
      dispatch('fetchNavMenu', 'notification');
      dispatch('fetchNavMenu', 'msg');
      dispatch('setExceptionError', null);
      document.body.className = 'skin-black sidebar-mini';
      document.body.style.overflowY = 'auto';
      document.body.style.background = '#d2d6de';
      router.push('/');
    }
  },

  /**
   * get state information
   */
  getters: {
    // check if user is logged in
    isLoggedIn(state) {
      //! return true when empty, another ! make it return false when empty
      return !!state.token;
    },

    // check if user is admin
    isAdmin(state) {
      return state.user.role === 'Developer' || state.user.role === 'Admin';
    },

    // check if user is developer
    isDev(state) {
      return state.user.role === 'Developer';
    },

    // return email of current user
    email(state) {
      return state.user.email;
    }
  },

  /**
   * Make changes to the state
   */
  mutations: {
    refreshMailbox(state, msgRefreshData) {
      state.msgRefreshData = msgRefreshData;
    },

    // add refresh time
    addRefresh(state) {
      state.refresh += 1;
    },

    // set registration code
    setRegistrationCode(state, code) {
      state.registrationCode = code;
    },

    // set user flagged list
    flagCommit(state, flagList) {
      state.flagList = flagList;
    },

    // set user flagged list
    notificationCommit(state, notifyList) {
      state.notifyList = notifyList;
    },

    // set user msg list
    msgCommit(state, msgList) {
      state.msgList = msgList;
      state.freshMailboxID = !state.freshMailboxID;
    },

    // login user information include token
    setUser(state, user) {
      state.user = user;
    },

    // set token after successfully login
    setToken(state, token) {
      state.token = token;
    },

    // toggle loading status
    setLoading(state, status) {
      state.loading = status;
    },

    // set exception errors
    setExceptionError(state, string) {
      state.user.password = null;
      state.ex_error = string;
    }
  }
};
