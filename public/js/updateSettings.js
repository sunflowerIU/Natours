const dataForm = document.querySelector('.form-user-data')
const passwordForm = document.querySelector('.form-user-settings')

///A. to update user data
if (dataForm) {
    dataForm.addEventListener('submit', function (e) {
        e.preventDefault()
        const form = new FormData()
        form.append('name', document.querySelector('#name').value)
        form.append('email', document.querySelector('#email').value)
        form.append('photo', document.querySelector('#photo').files[0])
        console.log(form)
        updateData(form)
    })
}


///updating user data by axios
const updateData = async (data) => {
    try {
        const res = await axios({
            method: 'PATCH',
            url: '/api/v1/users/updateMe',
            data
        })

        if (res.data.status = 'Success') {
            showAlert('success', 'Data updated successfully.')
            window.location.reload()
        }
    } catch (err) {
        showAlert('error', err.response.data.message)
    }
}



// B. update my password
if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {


        e.preventDefault()
        const currentPassword = document.getElementById('password-current').value
        const password = document.getElementById('password').value
        const passwordConfirm = document.getElementById('password-confirm').value


        //if the confirm password and new pass are not same
        if (passwordConfirm !== password) {
            showAlert('error', 'Your password confirm doesn\'t match with your new password.')
        }


        //if followig condition are true
        if (passwordConfirm && password && currentPassword && password === passwordConfirm) {

            //add .btn--password class to save password btn so that we can change text of btn when needed
            const saveBtn = document.querySelector('.btn--password')
            saveBtn.innerHTML = 'Updating Password...'

            await updateMyPassword(currentPassword, password, passwordConfirm) //because updateMyPassword is async function

            //after the password has been updated then clear all fields
            document.getElementById('password-current').value = ''
            document.getElementById('password').value = ''
            document.getElementById('password-confirm').value = ''

            //put btn text same as before
            saveBtn.innerHTML = 'save password'

        }

    })
}

//update password by axios
const updateMyPassword = async (currentPassword, password, passwordConfirm) => {
    try {
        const res = await axios({
            method: 'PATCH',
            url: '/api/v1/users/updateMyPassword',
            data: {
                currentPassword,
                password,
                passwordConfirm
            }

        })
        //if success
        if (res.data.status = "Success") {
            showAlert('success', 'Password updated successfully')
        }
    } catch (err) {
        showAlert('error','Incorrect current password.')
    }
}