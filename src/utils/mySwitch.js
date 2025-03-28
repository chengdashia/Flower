import { ref } from 'vue'
let flag = ref(true)
const mySwitch = () => {
    const pre_box = document.querySelector('.pre-box')
    const img = document.querySelector("#avatar")
    if (flag.value) {
        pre_box.style.transform = "translateX(100%)"
        pre_box.style.backgroundColor = "#c9e0ed"
        img.src = require("@/assets/img/flower.png")
    }
    else {
        pre_box.style.transform = "translateX(0%)"
        pre_box.style.backgroundColor = "#f9db9b"
        img.src = require("@/assets/img/daisy.png")
    }
    flag.value = !flag.value
}
export default mySwitch