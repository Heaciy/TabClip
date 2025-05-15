// eslint-disable-next-line no-unused-vars
import { ComponentCustomProperties } from 'vue';
import { I18n } from 'vue-i18n';

declare module '@vue/runtime-core' {
    // eslint-disable-next-line no-unused-vars
    interface ComponentCustomProperties {
        $t: I18n['t']; // 将 $t 方法的类型引入到组件的类型中
    }
}
