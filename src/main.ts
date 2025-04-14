import {createApp} from 'vue';
import {createPinia} from 'pinia';
import '@/assets/css/index.css';
import App from './App.vue';
import {i18n} from "@/locales";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(i18n);
app.mount('#app');