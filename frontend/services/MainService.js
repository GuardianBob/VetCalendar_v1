class MainService {
  update_path_date (date) {
    // console.log(window.location.pathname)
    // console.log(date)
    let year = date.slice(11, 15)
    let month = date.slice(4, 7)
    let pathArray = window.location.pathname.split('/');
    pathArray = pathArray.filter(path => path != "")
    // console.log(pathArray)
    pathArray[0] = year
    pathArray[1] = month
    let newPath = ""
    for (let i = 0; i < pathArray.length; i++) {
      newPath += "/";
      newPath += pathArray[i];
    }
    // console.log(newPath)
    // this.$router.replace({ path: newPath })
    return newPath
  }

  view_date () {
    let pathArray = window.location.pathname.split('/');
    pathArray = pathArray.filter(path => path != "")
    if (pathArray.length > 1) {
      // console.log(pathArray.length, pathArray)
      return { year: pathArray[0], month: pathArray[1]}
    } else if (pathArray.length == 1 ) {
      return { year: pathArray[0]}
    } else {
      return null
    }
  }
}

export default new MainService 