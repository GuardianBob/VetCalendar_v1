import { api } from "boot/axios";
import axios from 'axios'

class APIService {
  get_todo() {
    console.log("at api")
    return api.get('/api/todos/');
  }

  get_form() {
    console.log("at api")
    return api.get('/login/');
  }

  login(data) {
    return api.post("/login/validate", data);
  }

  upload_file(formData) {
    console.log("uploading", formData);
    // return api.post("/upload_file", { file })
    let upload_url = ''
    if (process.env.DEV_ENV == "true") {
      upload_url = `http://${process.env.REST_API_HOST}:${process.env.REST_API_PORT}/upload_file`
    } else {
      upload_url = `https://${process.env.REST_API_LIVE}/upload_file`
    }
    // upload_url = `https://${process.env.REST_API_LIVE}/upload_file`
    console.log("url", upload_url);
    return axios({
      method: "post",
      url: upload_url,
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    })
  }

  return_shifts(date) {
    return api.post('/return_shifts', {date})
  }

  test_calendar() {
    return api.post('/calendar/test');
  }

  test_event() {
    return api.post('/calendar/test_event');
  }

  get_user_list(formData) {
    let upload_url = ''
    if (process.env.DEV_ENV == "true") {
      upload_url = `http://${process.env.REST_API_HOST}:${process.env.REST_API_PORT}/return_user_list`
    } else {
      upload_url = `https://${process.env.REST_API_LIVE}/return_user_list`
    }
    // upload_url = `https://${process.env.REST_API_LIVE}/return_user_list`
    console.log("url", upload_url);
    return axios({
      method: "post",
      url: upload_url,
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    })
  }

}

export default new APIService();