async function create() {

    const messages = document.getElementById('message')

    const credential_1 = document.getElementById('username')
    const username = credential_1.value
    const credential_2 = document.getElementById('password')
    const password = credential_2.value
    const credential_3 = document.getElementById('confirm-password')
    const confirmPassword = credential_3.value

    credential_1.value = ''
    credential_2.value = ''
    credential_3.value = ''

    if (username === "" || password === "" || confirmPassword === "") {
        messages.innerHTML = `Please fill in all fields`
    }
    else if (password !== confirmPassword) {
        messages.innerHTML = `Passwords do not match`
    }
    else {

         const response = await fetch('/create-account', {
             method: 'POST',
             headers: {
                'Content-Type': 'application/json',
             },
             body: JSON.stringify({ username:username, password: password })
         })

         data = await response.json()
         
         messages.innerHTML = `${data.reply}`
        
    }

}