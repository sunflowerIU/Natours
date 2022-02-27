////alert functonality
//to remove the alert window
const hideAlert = function () {
    const alertWindow = document.querySelector('.alert')
    if (alertWindow) {
        alertWindow.parentElement.removeChild(alertWindow)
    }
}


//to make alert window which can have type of success and error
const showAlert = function (type, message) {
    //first hide alert message if there is any
    hideAlert()
    //then make alert message
    const markup = `<div class='alert alert--${type}'>${message}</div>`;
    document.querySelector('body').insertAdjacentHTML('beforebegin', markup)

    //close alert message after some time
    setTimeout(hideAlert, 2000)
}




//1. login functionality
const loginForm = document.querySelector('.form-login')
// console.log(loginForm)



//adding event listener to login form
if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault()
        const email = document.getElementById('email').value
        const password = document.getElementById('password').value
        login(email, password)
        // console.log(email, password)
    })
}

// login function using axios
const login = async (email, password) => {
    try { //using axios
        const res = await axios({
            withCredentials: true, //important because it will enable cookies to be stored
            method: 'POST',
            url: 'http://127.0.0.1:1000/api/v1/users/login',
            data: {
                email,
                password
            }
        })
        // console.log(res)

        if (res.data.status === 'Success') {
            showAlert('success', 'You have been logged in successfully.')
            // console.log('login successful')

            //goto home page
            setTimeout(location.assign('/'), 2200)

        }

    } catch (err) {
        // alert(err.response.data.message)
        showAlert('error', err.response.data.message)

    }


}


// 2. logout account
const logOutBtn = document.querySelector('.nav__el--logout')




//logout function
const logout = async () => {
    try {
        const res = await axios({
            // withCredentials:true,
            method: 'GET',
            url: 'http://127.0.0.1:1000/api/v1/users/logout'
        });

        //after logout is suceeded show laert msg and reload new page from server
        showAlert('success', 'Logged out succesfully')
        if (res.data.status === 'Success') {
            location.reload(true) //location.reload(true) when set to true, it will not reload just current page, but the whole server
            window.location.assign('/')
        }
    } catch (error) {
        // console.log(error)
        showAlert('error', 'Error logging out! Please try again.')
    }
}


if (logOutBtn) {
    logOutBtn.addEventListener('click', logout)
}