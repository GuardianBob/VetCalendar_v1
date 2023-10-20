<template>
  <q-page class="q-pt-xl">
    <div class="row align-start justify-center">
      <div class="col-10 col-sm-5 col-md-5 col-lg-5 text-center">
        
        <q-form           
          @submit="upload_shifts_v2">
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
          <q-input filled v-model="date" label="Verify Date" class="q-my-sm">
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
          <div class="row justify-center">
            <q-select v-model="user" :options="users" label="Select User Initials" class="q-my-sm col-8" @update:model-value="filterShifts()"/>
            <q-btn class="q-ml-md q-px-sm" color="primary" size="md" flat rounded id="clear_filters_button" @click="clearFilters" icon="cancel"/>
          </div>
          <q-btn class="q-my-sm q-px-xl" color="primary" outline id="upload_button" @click="file_upload" v-show="file">Upload File</q-btn>
          <div class="row q-py-sm">
            <div class="col-12 text-center" v-for="(shift, index) in user_shifts" :key="index">
              {{ splitDate(shift.start.dateTime) }} - <span class="text-weight-bold">{{ shift.summary }}</span>
            </div>
          </div>
          <q-btn class="outline" id="authorize_button" @click="handleAuthClick" v-show="!auth_token">
            <img width="20" style="margin-bottom:3px; margin-right:5px" src="~assets/Google_G_Logo.svg" alt="">Connect Google</q-btn>
          <q-btn
            v-if="auth_token"
            :loading="disabled"
            v-show="submit_button"
            color="primary"
            label="Add to Google Calendar"
            type="submit"
            class="q-px-lg q-mt-sm"
            :disabled="disabled"
          />
          <q-btn v-if="auth_token" class="outline" id="fetch_calendars" @click="verify_calendar">Verify Calendars</q-btn>
          <q-btn v-if="show_add2Cal" class="outline" id="fetch_calendars" @click="upload_shifts_v2">Add Google Events</q-btn>
          <q-btn class="outline" id="fetch_calendars" @click="clear_google_events">Clear Google Events</q-btn>
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
      <div id="test_add" class="col-10 col-md-10 col-sm-8 col-lg-6 col-xs-12 q-mx-sm text-center" style="max-height: fit-content;">
        <FullCalendar id="fullCalendar" ref="fullCalendar" :custom-buttons="customButtons" :options='calendarOptions'/>
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

const month_abbrev = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export default defineComponent({
  name: "FileUpload",
  components: {
    FullCalendar // make the <FullCalendar> tag available
  },

  data() {
    return {
      calendarOptions: ref({
        customButtons: ref({
          prev: {
            text: "PREV",
            click: () => {
              let calendarApi = this.$refs.fullCalendar.getApi();
              calendarApi.prev();
              // console.log("eventPrev", calendarApi.getDate());
              this.handleCalendarChange(calendarApi.getDate().toString())
            }
          },
          next: { // this overrides the next button
            text: "NEXT",
            click: () => {
                // console.log("eventNext");
                let calendarApi = this.$refs.fullCalendar.getApi();
                calendarApi.next();
                this.handleCalendarChange(calendarApi.getDate().toString())
            }
          },
          today: { // this overrides the next button
            text: "Today",
            click: () => {
                // console.log("eventNext");
                let calendarApi = this.$refs.fullCalendar.getApi();
                calendarApi.today();
                this.handleCalendarChange(calendarApi.getDate().toString())
            }
          },
        }),
        plugins: [dayGridPlugin],
        initialView: 'dayGridMonth',
        weekends: true,
        initialDate: new Date(),
        height: "auto",
        events: [
          { }
        ]
      }),
    }
  },
  setup() {
    
    const progress = ref(false)
    
    return {
      // label: "Select File",
      file: ref(null),
      date: ref(new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })),
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
      shifts: ref([]),
      shift_data: ref([]),     
      calendar_id: ref([]),
      show_add2Cal: ref(false),
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
      let new_month = ""
      let new_year = parseInt(this.date.slice(-4))
      let file_name = newValue["name"].toLowerCase()
      console.log(file_name)
      month_abbrev.forEach((month) => {
        if (file_name.includes(month.toLowerCase())) {
          console.log(month)
          new_month = month
        }        
      })      
      if (file_name.includes(new_year + 1)) {
        new_year = (new_year + 1).toString()
      }
      this.date = new_month + " " + new_year.toString()
      console.log(new_year)
      this.user = null
      // this.get_users()      
    },
    date(newValue, oldValue) {
      // console.log(newValue, oldValue)
      this.handleMonthChange()
    },
    // user(newValue, oldValue) {
    //   console.log(newValue)
    //   if (newValue != null){
    //     // this.loading = true
    //     // this.getShifts().then(() => {
    //     //   this.submit_button = true
    //     //   this.disabled = false
    //     //   this.loading = false
    //     // })
    //   }
      
    // },
  //   calendarOptions(newValue, oldValue) {
  //     console.log("new value", newValue)
  //     this.calendarOptions.events = newValue
  //   }
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

    async handleMonthChange(){
      let calendarApi = this.$refs.fullCalendar.getApi()
      let new_date = new Date('01 ' + this.date)
      // console.log(new_date.toISOString())
      calendarApi.gotoDate(new_date.toISOString())
      // console.log(this.date)
      // console.log(calendarApi.view.activeStart) // Get the first visible day of the Calendar
      // console.log(calendarApi.view.activeEnd)  // get the last visible day of the Calendar
      await this.getShifts()
      if (this.user) {
        this.filterShifts()
      }
      // console.log(this.calendarOptions.events.length)
    },

    async handleCalendarChange(cal_date){
      let new_date = cal_date.slice(4, 7) + " " + cal_date.slice(11, 15)
      // console.log(new_date)
      this.date = new_date
      // let body = {}
      // body["date"] = this.date      
      // APIService.return_shifts(this.date)
    },

    async file_upload(){
      console.log("and for ALL the marbles...!")
      if (this.file) {
        this.user_shifts = []
        localStorage.setItem("gmail", this.gmail)
        let formData = new FormData()
        let file = this.file
        await formData.append("file", file)
        await formData.append("date", this.date)
        await APIService.upload_file(formData)
        this.getShifts()
      }
    },

    async getShifts() {
      let calendarApi = this.$refs.fullCalendar.getApi()
      let start = calendarApi.view.activeStart
      let end = calendarApi.view.activeEnd
      await APIService.return_shifts({"start": start, "end": end})
      .then(res => {
        // console.log(res.data)
        if (res.data != "No Shifts"){
          this.calendarOptions.events = []
          this.shifts = []
          // console.log(events)
          this.users = res.data.users
          res.data.shifts.map(event => { 
            // console.log(event)
            this.calendarOptions.events.push({
              // Add event to displayed calendar
              "title": event["user"],
              "start": event["start"],
              // "end": shift["end"]["dateTime"],
            })
            this.shifts.push({
              // Add event to displayed calendar
              "title": event["user"],
              "start": event["start"],
              // "end": shift["end"]["dateTime"],
            })
          })
          // 
        }
      })
      console.log(this.shifts)
      calendarApi.updateSize()
    },

    async filterShifts() {
      // console.log(this.user)
      this.calendarOptions.events = []
      this.shifts.map(shift => {
        if (shift["title"] == this.user){
          // console.log("matches")
          this.calendarOptions.events.push(shift)
        }
      })
    },

    async clearFilters() {
      this.calendarOptions.events = this.shifts
      // console.log(this.shifts.length)
      this.user = null
    },

    async getShifts2() {
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
        // await formData.append("user", this.user)
        // console.log("user: ", this.user)
        // await formData.append("gmail", this.gmail)
        // console.log(file)
        // console.log("formData: ", formData)
        APIService.upload_file(formData)
        .then(res => {          
          this.calendarOptions.events = res.data ? [] : null
          console.log(res.data)
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
              // console.log(shift["summary"], shift["start"]["dateTime"], shift["end"]["dateTime"])
            //   gapi.client.calendar.events.insert({
            //   'calendarId': 'primary',
            //   'resource': blah.substring(1,blah.length-1)
            // });
              // let new_event = {
              //   "summary": shift["summary"],
              //   "location": shift["location"],
              //   "description": shift["description"],
              //   "start": {
              //     "dateTime": shift["start"]["dateTime"],
              //     "timeZone": "America/Los_Angeles"
              //   },
              //   "end": {
              //     "dateTime": shift["end"]["dateTime"],
              //     "timeZone": "America/Los_Angeles"
              //   },
              // }
              // this.user_shifts.push(new_event)

              // console.log(`title: ${shift["start"]["dateTime"]}`)
              this.calendarOptions.events.push({
              // FullCalendar.eventAdd({
                "title": shift["summary"],
                "start": shift["start"]["dateTime"],
                // "end": shift["end"]["dateTime"],
              })
              
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
          // this.calendarOptions.events.push({
          //     // FullCalendar.eventAdd({
          //       "title": "test-2",
          //       "start": "2023-06-05",
          //       "end": "2023-06-05",
          //     })
          // let myCalendar = $refs.myCalendar; 
          // myCalendar.refetchEvents();
          // console.log(this.calendarOptions.events)
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
          // FullCalendar.refetchEvents()
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
      let calendarApi = this.$refs.fullCalendar.getApi()
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
              let new_date = new Date('01 ' + res.data["month"] + this.date.slice(3))
              console.log(new_date.toISOString())
              calendarApi.gotoDate(new_date.toISOString())
              calendarApi.setOption('contentHeight', 'auto')
              calendarApi.updateSize()
            }
          }
          this.users = res.data["users"]
          this.show_users = true
          this.loading = false
          this.getShifts()
        })
      }
    },

    async list_calendars() {
      return new Promise(async (resolve, reject) => {
        const get_calendars = gapi.client.calendar.calendarList.list()
        console.log(get_calendars)
        let calendars = {}
        await get_calendars.execute((cal) => {
          console.log(cal)
          cal.items.forEach((item) => {
            console.log(item)
            // calendars.push(item.summary)
            calendars[item.id] = item.summary
            console.log(item.summary)
          })
          console.log(calendars)
          if (Object.keys(calendars).length > 0) {
            resolve(calendars)
          } else {
            reject("Error!!!")
          }
        })
      })
    },

    async add_calendar(calendar) {
      return new Promise(async (resolve, reject) => {
        const insert_calendar = gapi.client.calendar.calendars.insert(calendar);
        console.log(insert_calendar)
        await insert_calendar.execute((res) => {
          console.log(res, res.id, res.summary)
          this.calendar_id = res.id
          if (!res.error) {
            resolve(true)
          } else {
            reject(false)
          }
        })
      })
    },

    async verify_calendar() {
      this.list_calendars().then((res) => { 
        console.log(res[0]) 
        // if (res.includes("AMCS")) {
        //   console.log("It WORKED!!!!!")
        Object.entries(res).forEach(([key, value]) => {
          console.log(key , value); // key ,value
          if (value.includes("AMCS Schedule")) {
            this.calendar_id = key
            console.log(`calendar id: ${this.calendar_id}`)
          } // else {
          //   console.log("NERP! Calendar doesn't exist")
          //   
          // }
        });
        if (this.calendar_id.length > 0){
          console.log("we found a calendar!")
          this.show_add2Cal = true;
        } else {
          console.log("no calendar!")
          let new_calendar = {
            // id: 'amcsschedule@group.calendar.google.com', // Trying to create the ID causes 400 error
            summary: 'AMCS Schedule'
          }
          this.add_calendar(new_calendar).then((res) => {
            console.log("res: ", res)
            // this.verify_calendar();
            this.show_add2Cal = true;
              Notify.create({
                message: "Successfully created calendar!",
                color: "green",
              })
          })
        }
        console.log(`calendar id: ${this.calendar_id}`)
        // res.map((cal) => { 
        //   console.log(cal)
        // })
      })
    },

    async get_google_events() {
      return new Promise(async (resolve, reject) => {
        if (!this.calendar_id.length > 0) {
          // Need to fix so function waits for this to finish before trying to continue
          await this.verify_calendar()
        }
        console.log(this.date)
        let date_start = new Date(`01 ${this.date}`)
        let date_end = new Date(date_start.getFullYear(), date_start.getMonth()+1, 0, 23, 59)
        let tz_offset =  (new Date()).getTimezoneOffset() * 60000
        date_start = new Date(date_start - tz_offset).toISOString().slice(0,-5) + "Z"
        date_end = new Date(date_end - tz_offset).toISOString().slice(0,-5) + "Z"
        // date_start = date_start.toISOString().slice(0,-5) + "Z"
        // date_end = date_end.toISOString().slice(0,-5) + "Z"
        console.log(date_start)
        console.log(date_end)
        let params = {
          'calendarId': this.calendar_id,  
          'timeMin': date_start,
          'timeMax': date_end,
        }
        const get_events = gapi.client.calendar.events.list(params)
        console.log(get_events)
        let events = []
        await get_events.execute((event) => {
          // console.log(cal)
          event.items.forEach((item) => {
            // console.log(item)
            // events.push(item.id)
            events.push(item.id)
            // console.log(item.summary)
          })
          console.log(events)
          if (events.length > 0) {
            resolve(events)
          } else {
            reject("Error!!!")
          }
        })
      })
    },

    async clear_google_events() {
      this.get_google_events().then((res) => {
        console.log(res)
        if (res.length > 0) {
          var batch = gapi.client.newBatch();
          res.forEach((event) => {
            batch.add(gapi.client.calendar.events.delete({
              'calendarId': this.calendar_id,
              'eventId': event
            }));
          })
          batch.then(() => {
            console.log('all jobs done!!!')
            Notify.create({
              message: "Schedule successfully cleared",
              color: "green",
            })
          })
        }
      });
    },

    async upload_shifts_v2() {
      if (this.calendar_id.length > 0) {
        if (this.user != null) {
          var batch = gapi.client.newBatch();
          this.disabled = true
          console.log(this.user)
          this.calendarOptions.events.forEach((event) => {
            let shift_start = event.start.replace(/ /g, 'T')
            console.log(event.title, shift_start)
            let shift = {
              "summary": event.title,
              "start": {
                "dateTime": shift_start,
                "timeZone": "UTC"
              },
              "end": {
                "dateTime": shift_start,
                "timeZone": "UTC"
              },
            }
            batch.add(gapi.client.calendar.events.insert({
              'calendarId': this.calendar_id,
              'resource': shift
            }));
          })
            // ====== NOTE: this loads the schedule to Google Calendar ============= 
          // console.log(batch)
          batch.then(() => {
            this.loading = false
            this.submit_button = false
            this.user = null
            // this.user_shifts = []
            console.log('all jobs done!!!')
            Notify.create({
                message: "Schedule uploaded successfully",
                color: "green",
              })
          });
        } else {
          Notify.create({
            message: "Please select which user to sync.",
            color: "red",
            position: "center"
          })
        }
        
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
    },

    async upload_shifts_old() {
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

    // add_to_calendar() {
    //   let new_event = {
    //     'summary': 'Day',
    //     'location': 'AMCS',
    //     'description': 'Day',
    //     'start': {'dateTime': '2023-06-20T07:00:00-07:00',
    //     'timeZone': 'America/Los_Angeles'},
    //     'end': {'dateTime': '2023-06-20T19:00:00-07:00',
    //     'timeZone': 'America/Los_Angeles'}}

    //   const request = gapi.client.calendar.events.insert({
    //     'calendarId': 'primary',
    //     'resource': new_event
    //   });

    //   request.execute(function(event) {
        
    //   });

    // },

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
    this.getShifts();
    // console.log(document.getElementsByClassName('fc-toolbar-title')[0].innerText);
    // this.date = document.getElementsByClassName('fc-toolbar-title')[0].innerText 
    // let nav_buttons = document.getElementsByClassName('.fc-next-button, .fc-prev-button, .fc-today-button, .fc-month-button');
    // nav_buttons.forEach(nav => {nav.addEventListener('click', console.log("nav button clicked!"))}) 
    // document.getElementsByClassName('fc-prev-button').addEventListener('change', function(e) {
    //   console.log(document.getElementsByClassName('fc-toolbar-title')[0].innerText);
    // });
  },
  
})
</script>