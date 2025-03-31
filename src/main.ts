import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import VChart from 'vue-echarts'
import 'echarts'
// 移除不存在的样式文件导入
// import './styles/index.css'

const app = createApp(App)

app.use(router)
app.use(store)
app.use(ElementPlus)
app.component('v-chart', VChart)

app.mount('#app')

console.log(process.env)

