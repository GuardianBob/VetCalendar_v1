<template>
  <q-page class="q-pt-xl">
    <div class="row align-start justify-center">
      <div class="col-10 col-sm-5 col-md-5 col-lg-5 text-center">
        <q-btn class="outline" id="authorize_button" @click="handleAuthClick" v-show="!auth_token">
          <img width="20" style="margin-bottom:3px; margin-right:5px" src="~assets/Google_G_Logo.svg" alt="">Connect Google</q-btn>
        <q-form 
          v-if="auth_token"
          @submit="upload_shifts">
          <!-- <q-input filled v-model="gmail" required type="email" label="Gmail"></q-input> -->
          <q-file
          v-model="file"
          label="Select File"
          accept=".docx, .doc"
          class="q-my-sm"
          >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>
        <q-input filled v-model="date" label="Verify Date" v-show="file" class="q-my-sm">
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="date" mask="MMM YYYY">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Close" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-select v-model="user" :options="users" label="Select User Initials" v-show="show_users" class="q-my-sm"/>
        <div class="row q-py-sm">
          <div class="col-12 text-center" v-for="(shift, index) in user_shifts" :key="index">
            {{ splitDate(shift.start.dateTime) }} - <span class="text-weight-bold">{{ shift.summary }}</span>
          </div>
        </div>
        <q-btn
          :loading="disabled"
          v-show="submit_button"
          color="primary"
          label="Add to Google Calendar"
          type="submit"
          class="q-px-lg q-mt-sm"
          :disabled="disabled"
        />
        <br>
        <q-spinner
        v-show="loading"
        color="primary"
        size="3em"
        :thickness="3"
        />
        </q-form>
      </div>
    </div>
    <div class="row align-start justify-center">
      <div id="test_add" class="col-10 col-md-6 col-sm-8 col-lg-6 q-mx-sm text-center">
        <FullCalendar :options='calendarOptions' />
      </div>
    </div>
    <div id="google_API_test" class="col-10 text-center">
      <div id="my-signin2"></div>
      <!-- <q-btn class="outline" color="primary" id="authorize_button" @click="handleAuthClick" v-show="!auth_token">Authorize</q-btn> -->
      
      <q-btn class="outline q-my-sm" id="signout_button" @click="handleSignoutClick" v-show="auth_token">Sign Out</q-btn>
      <!-- <q-btn class="outline q-my-lg" id="signout_button" @click="get_users">Get Users</q-btn> -->

      <!-- <pre id="content" style="white-space: pre-wrap;"></pre> -->
    </div>
    
  </q-page>
</template>


<script>
import { defineComponent, ref } from 'vue'
import { useQuasar, Notify } from "quasar"
import APIService from "../../services/api"
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'

const quasar = useQuasar()
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const API_KEY = process.env.GOOGLE_API_KEY
// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = process.env.DISCOVERY_DOC;
// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = process.env.SCOPES;

export default defineComponent({
  name: "FileUpload",
  components: {
    FullCalendar // make the <FullCalendar> tag available
  },

  data() {
    return {
    }
  },
  setup() {
    
    const progress = ref(false)
    
    return {
      // label: "Select File",
      file: ref(null),
      date: ref('null'),
      calendar_button: ref(false),
      tokenClient: null,
      gapiInited: false,
      gisInited: false,
      gmail: ref(''),
      auth_token: ref(false),
      users: ref([]),
      user: ref(null),
      show_users: ref(false),
      user_shifts: ref([]),
      submit_button: ref(false),
      disabled: ref(true),
      loading: ref(false),
      calendarOptions: ref({
        plugins: [dayGridPlugin],
        initialView: 'dayGridMonth',
        weekends: true,
        events: [
        ]
      }),
      // onFileSelected(file) {
      //   this.file = file
      //   console.log(file)
      //   this.label = file.name
      // },
      // onFileRemoved(file) {
      //   this.file = null
      //   this.label = "Select File"
      // },
    };
  },
  watch: {
    file(newValue, oldValue) {
      console.log("triggered")
      this.user = null
      this.get_users()
    },
    user(newValue, oldValue) {
      console.log(newValue)
      if (newValue != null){
        this.loading = true
        this.getShifts().then(() => {
          this.submit_button = true
          this.disabled = false
          this.loading = false
        })
      }
      
    }
  },
  computed: {
    // code to take a string and return the first 10 characters 
    
      
  },
  methods: {
    splitDate(date) {
      let shift_date = new Date(date)
      let month = shift_date.toLocaleString('default', {month:'short'})
      let day = shift_date.toLocaleString('default', {weekday:'short'})
      let day_date = date.slice(8, 10)
      let date_string = `${day} - ${month} ${day_date} ${date.slice(0,4)} - ${date.slice(11, 16)}`
      return date_string
    },

    async getShifts() {
      // const request = gapi.client.calendar.events.insert({
      //   'calendarId': 'primary',
      //   'resource': event
      // });
      if (this.file) {
        this.user_shifts = []
        localStorage.setItem("gmail", this.gmail)
        let formData = new FormData()
        let file = this.file
        await formData.append("file", file)
        await formData.append("date", this.date)
        await formData.append("user", this.user)
        console.log("user: ", this.user)
        // await formData.append("gmail", this.gmail)
        console.log(file)
        console.log("formData: ", formData)
        APIService.upload_file(formData)
        .then(res => {
          
          // console.log("Add to Calendar")
          // for (let key in res.data) {
          //   console.log(key, res.data[key])
          // }
          // this.calendarOptions.events.push(
          //   { title: 'test event', date: '2023-07-05'}
          // )
          // var batch = gapi.client.newBatch();
          Object.entries(res.data).forEach(
            ([key, shift]) => {
              // let blah = JSON.stringify(value)
              // console.log(blah.substring(1,blah.length-1))
              console.log(shift["summary"], shift["start"]["dateTime"], shift["end"]["dateTime"])
            //   gapi.client.calendar.events.insert({
            //   'calendarId': 'primary',
            //   'resource': blah.substring(1,blah.length-1)
            // });
              let new_event = {
                "summary": shift["summary"],
                "location": shift["location"],
                "description": shift["description"],
                "start": {
                  "dateTime": shift["start"]["dateTime"],
                  "timeZone": "America/Los_Angeles"
                },
                "end": {
                  "dateTime": shift["end"]["dateTime"],
                  "timeZone": "America/Los_Angeles"
                },
              }
              this.user_shifts.push(new_event)
              this.calendarOptions.events.push(
                {
                  title: shift['summary'],
                  start: shift["start"]["dateTime"]
                }
              )
              console.log(this.calendarOptions.events)
              // batch.add(gapi.client.calendar.events.insert({
              //   'calendarId': 'primary',
              //   'resource': new_event
              // }));
              // console.log(new_event)
              // const request = gapi.client.calendar.events.insert({
              //   'calendarId': 'primary',
              //   'resource': new_event
              // });
              // request.execute(function(event) {
              //   console.log(event);
              // });
            }
          );
          // ====== NOTE: this loads the schedule to Google Calendar ============= 
          // batch.then(function(){
          //   console.log('all jobs done!!!')
          // });

          // Object.entries(res.data).forEach(
          //   ([key, value]) => console.log(key, value)
          // );
          // let new_shifts = Object.entries(res.data).map(([key, value]) => ({key,value}))
          // console.log(new_shifts)
          // res.data.forEach((shift) => {
          //   console.log(shift)
            
            

          //   // console.log(new_event)
          // })
  
          // console.log("res: ", res.data)
        
        })
        .catch(err => {
          Notify.create({
            message: "Something went wrong",
            color: "red",
          })
        })
      }
    },

    async get_users() {
      console.log("triggered")
      if (this.file) {
        this.loading = true
        localStorage.setItem("gmail", this.gmail)
        let formData = new FormData()
        let file = this.file
        await formData.append("file", file)
        await formData.append("date", this.date)
        // await formData.append("gmail", this.gmail)
        console.log(file)
        console.log("formData: ", formData)
        APIService.get_user_list(formData)
        .then(res => {
          console.log(res.data)
          console.log(this.date, res.data["month"])
          if (res.data["month"] != "false"){
            if (!this.date.includes(res.data["month"])){
              this.date = res.data["month"] + this.date.slice(3)
            }
          }
          this.users = res.data["users"]
          this.show_users = true
          this.loading = false
        })
      }
    },

    async upload_shifts() {
      var batch = gapi.client.newBatch();
      this.disabled = true
      this.user_shifts.forEach((shift) => {
        console.log(shift)
        batch.add(gapi.client.calendar.events.insert({
                'calendarId': 'primary',
                'resource': shift
              }));
        // ====== NOTE: this loads the schedule to Google Calendar ============= 
      })
      batch.then(() => {
        this.loading = false
        this.submit_button = false
        this.user = null
        this.user_shifts = []
        console.log('all jobs done!!!')
        Notify.create({
            message: "Schedule uploaded successfully",
            color: "green",
          })
      });
      // this.submit_button = false
    },
    
    async test_backend() {
      APIService.test_calendar().then(res => {
        console.log("res: ", res.data)
        Notify.create({
          message: "Calendar test successful",
          color: "green",
        })
      })
    },

    async test_event() {
      APIService.test_event().then(res => {
        console.log("res: ", res.data)
        Notify.create({
          message: "Event test successful",
          color: "green",
        })
      })
    },

    async test_API() {
      // var requestOptions = {
        //   method: 'POST',
        //   redirect: 'follow'
        // };
        
        // fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events/quickAdd?calendarId=primary&text=Day Shift on June 21 7am-7pm", requestOptions)
        //   .then(response => response.text())
        //   .then(result => console.log(result))
        //   .catch(error => console.log('error', error));
        let event = {
          "summary": "Day Shift on June 21 7am-7pm",
          "location": "World Wide Web",
          "description": "Testing",
          "start": {
            "dateTime": "2023-06-21T07:00:00-07:00",
            "timeZone": "America/Los_Angeles"
          },
          "end": {
            "dateTime": "2023-06-21T19:00:00-07:00",
            "timeZone": "America/Los_Angeles"
          },
        }

        const request = gapi.client.calendar.events.insert({
          'calendarId': 'primary',
          'resource': event
        });
  
        request.execute(function(event) {
          appendPre('Event created: ' + event.htmlLink);
        });
    },
    
    async get_today() {
      let today = new Date();
      let dd = today.getDate();
      let mm = today.getMonth()+1; //January is 0!
      let yyyy = today.getFullYear(); 
      console.log("today: ", today)
      // this.date = mm.toString().padStart(2, '0') + " " + yyyy;
      this.date = this.getMonthShortName(mm) + " " + yyyy
    },

    getMonthShortName(monthNo) {
      const date = new Date();
      date.setMonth(monthNo - 1);

      return date.toLocaleString('en-US', { month: 'short' });
    },

    add_to_calendar() {
      let new_event = {
        'summary': 'Day',
        'location': 'AMCS',
        'description': 'Day',
        'start': {'dateTime': '2023-06-20T07:00:00-07:00',
        'timeZone': 'America/Los_Angeles'},
        'end': {'dateTime': '2023-06-20T19:00:00-07:00',
        'timeZone': 'America/Los_Angeles'}}

      const request = gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': new_event
      });

      request.execute(function(event) {
        
      });

    },

    gapiLoaded() {
        gapi.load('client', this.initializeGapiClient);
    },

    /**
       * Callback after the API client is loaded. Loads the
       * discovery doc to initialize the API.
       */
    async initializeGapiClient() {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });
      this.gapiInited = true;
      this.maybeEnableButtons();

    },

      /**
       * Callback after Google Identity Services are loaded.
       */
    gisLoaded() {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
      });
      this.gisInited = true;
      this.maybeEnableButtons();
    },

      /**
       * Enables user interaction after all libraries are loaded.
       */
    maybeEnableButtons() {
      if (this.gapiInited && this.gisInited) {
        
        // document.getElementById('authorize_button').style.visibility = 'visible';
        

      }
    },

      /**
       *  Sign in the user upon button click.
       */
    handleAuthClick() {
      console.log("handleAuthClick")
      this.tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
          throw (resp);
        }
        this.auth_token = true;
        // document.getElementById('signout_button').style.visibility = 'visible';
        // document.getElementById('authorize_button').innerText = 'Refresh';
        // await this.listUpcomingEvents();
      };

      if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        this.tokenClient.requestAccessToken({prompt: 'consent'});
      } else {
        // Skip display of account chooser and consent dialog for an existing session.
        this.tokenClient.requestAccessToken({prompt: ''});
      }
    },

      /**
       *  Sign out the user upon button click.
       */
    handleSignoutClick() {
      const token = gapi.client.getToken();
      if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        // document.getElementById('content').innerText = '';
        // document.getElementById('authorize_button').innerText = 'Authorize';
        this.auth_token = false;
        // document.getElementById('signout_button').style.visibility = 'hidden';
      }
    },

      /**
       * Print the summary and start datetime/date of the next ten events in
       * the authorized user's calendar. If no events are found an
       * appropriate message is printed.
       */
    async listUpcomingEvents() {
      let response;
      try {
        const request = {
          'calendarId': 'primary',
          'timeMin': (new Date()).toISOString(),
          'showDeleted': false,
          'singleEvents': true,
          'maxResults': 10,
          'orderBy': 'startTime',
        };
        response = await gapi.client.calendar.events.list(request);
      } catch (err) {
        document.getElementById('content').innerText = err.message;
        return;
      }

      const events = response.result.items;
      if (!events || events.length == 0) {
        document.getElementById('content').innerText = 'No events found.';
        return;
      }
      // Flatten to string to display
      const output = events.reduce(
          (str, event) => `${str}${event.summary} (${event.start.dateTime || event.start.date})\n`,
          'Events:\n');
      document.getElementById('content').innerText = output;
    },

    async get_stored_gmail() {
      if (localStorage.getItem('gmail')) {
        this.gmail = localStorage.getItem('gmail')
      }    
    },
  },

  created() {
    this.get_today()
    
  },
  
  mounted() {
    gapi.load('client', this.initializeGapiClient);
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined later
    });
    this.gisInited = true;
    this.maybeEnableButtons();
    this.get_stored_gmail();
    this.gapiLoaded()
    this.gisLoaded()    
  },
  
})
</script>