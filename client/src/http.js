import axios from 'axios';
import store from './store';
// Do http request, time out after 5 sec
export default () => axios.create({
  baseURL: store.getters.baseURL,
  timeout: 5000,
  headers: {
    Authorization: `Bearer ${store.state.userStore.token}`
  }
});
