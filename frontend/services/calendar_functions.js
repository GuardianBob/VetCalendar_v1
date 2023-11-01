class CalendarService {

  splitDate(date) {
    let shift_date = new Date(date)
    let month = shift_date.toLocaleString('default', {month:'short'})
    let day = shift_date.toLocaleString('default', {weekday:'short'})
    let day_date = date.slice(8, 10)
    let date_string = `${day} - ${month} ${day_date} ${date.slice(0,4)} - ${date.slice(11, 16)}`
    return date_string
  }

  verify_calendar() {
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
  }

  get_google_events() {
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
  }

  clear_google_events() {
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
  }

  upload_shifts_v2() {
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
  }

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
  }

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
  }

}

export default new CalendarService();