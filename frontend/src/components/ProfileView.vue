<template>
  <!-- <q-page class="q-pt-xl"> -->
    <div>
    <!-- <q-form >
      <h5 class="text-primary q-py-none q-my-sm">{{ pageTitle }}</h5>
      <div class="row justify-around text-center q-ma-md">
        <div outline class="col-4 q-px-md q-mx-md">
          <q-input v-model="userData.email" label="E-Mail Address" label-color="black" dense class="q-my-sm" disable ></q-input>
        </div>
        <div class="col-4 q-px-md q-mx-md">
          <q-input v-model="userData.firstName" dense class="q-my-sm" label="First Name" disable></q-input>
        </div>
        <div class="col-4 q-px-md q-mx-md">
          <q-input v-model="userData.lastName" label="Last Name" dense class="q-my-sm" disable></q-input>
        </div>
        <div class="col-4 q-px-md q-mx-md">
          <q-input v-model="userData.nickname" label="Nickname" dense class="q-my-sm" disable></q-input>
        </div>
        <div class="col-4 q-px-md q-mx-md">
          <q-input v-model="userData.address" label="Address" dense class="q-my-sm" disable></q-input>
        </div>
        <div class="col-4 q-px-md q-mx-md">
          <q-input v-model="userData.address2" label="Address2" dense class="q-my-sm" disable></q-input>
        </div>
        <div class="col-4 q-px-md q-mx-md">
          <q-input v-model="userData.userLevel" label="User Level" dense class="q-my-sm" disable></q-input>
        </div>
        <div class="col-4 q-px-md q-mx-md">
          <q-input v-model="userData.apt" label="Apt" dense class="q-my-sm" disable></q-input>
        </div>
        <div class="col-4 q-px-md q-mx-md">
          <q-input v-model="userData.city" label="City" dense class="q-my-sm" disable></q-input>
        </div>
        <div class="col-4 q-px-md q-mx-md">
          <q-input v-model="userData.state" label="State" dense class="q-my-sm" disable></q-input>
        </div>
        <div class="col-4 q-px-md q-mx-md">
          <q-input v-model="userData.zip" label="Zip" dense class="q-my-sm" disable></q-input>
        </div>
        <div class="col-4 q-px-md q-mx-md"></div>          
        
      </div>
    </q-form> -->
    <q-form >
        <h5 class="text-primary q-py-none q-my-sm">{{ pageTitle }}</h5>
        <div class="row justify-around text-center q-ma-md">
          <!-- <div outline class="col-4 q-px-md q-mx-md" > -->
            <div v-for="(label, key) in userInfoLabels" :key="key" outline class="col-4 q-px-md q-mx-md">
              <q-input v-model="userData[key]" :label="label" dense class="q-my-sm" disable></q-input>
            </div>
          <!-- </div> -->
        </div>
      </q-form>
    </div>
  <!-- </q-page> -->
</template>

<script>
import { defineComponent, ref } from 'vue';
import { useQuasar, Notify } from "quasar";
// import dummyData from "data/dummyData.json";
// import { useDummyData } from 'stores/dummy-data';
import { storeToRefs } from 'pinia';

export default {
  name: "ProfileView",
  props: [ "userInfoLabels", "userInfo" ],
  setup() {
    // const store = useDummyData();
    return {
      // store,
      info: ref(false),
      userData: ref({}),
      pageTitle: ref('User Details'),
      columnLabels: ref({ })
    }
  },

  watch: {
    userInfo(newValue, oldValue) {
      this.userData = this.userInfo
    },
    password2(newValue, oldValue) {
      // form_pass.value = newValue
      console.log(newValue)
      if (newValue.length >= 8 && newValue == this.password) {
        this.passDisabled = false
      } else if (newValue.length >= 8 && newValue != this.password) {
      } else {
        this.passDisabled = true
      }
    },
  },

  mounted() {
    // this.userData = this.userInfo;
    this.columnLabels = this.userInfoLabels;
    console.log(this.userData)
    // Object.keys(this.userData).forEach(key => {
    //   console.log(key)
    // })
  }
};
</script>


