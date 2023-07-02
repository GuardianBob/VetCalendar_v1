<template>
  <q-page>
    <div id="Login Form">
      <q-field label="Email">
        <q-input v-model="email"></q-input>
      </q-field>
      <q-field label="Password">
        <q-input type="password" v-model="password"></q-input>
      </q-field>
      <q-field label="Remember me">
        <q-switch v-model="remember"></q-switch>
      </q-field>
      <q-field label="Submit">
        <q-button @click="submit">Submit</q-button>
      </q-field>      
    </div>
    <div id="Python_Form" v-html="python_form">
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useQuasar, Notify } from "quasar"
import APIService from "../../services/api"

export default defineComponent({
  name: "LoginPage",
  setup() {
    // const api = ref(new APIService())
    const email = ref("")
    const password = ref("")
    const remember = ref(false)
  },
  data() {
    return {
      loading: false,
      python_form: ref([])
    }
  },

  methods: {
    submit() {
      api.value.login(email.value, password.value, remember.value)
      .then(() => {
          Notify.create({
            message: "Logged in successfully",
            color: "green",
            textColor: "white",
            position: "top-right",
            timeout: 3000
          })
        })
      .catch(err => {
          Notify.create({
            message: err.response.data.message,
            color: "red",
            textColor: "white",
            position: "top-right",
            timeout: 3000
          })
        })
    },
    async get_form(){
      await APIService.get_form().then(async(results) => {
        console.log(results.data);
        this.python_form = results.data;
      })
    }
  },
  mounted() {
    this.get_form()
  }
})
</script>