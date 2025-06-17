async function login() {

    const messages = document.getElementById('message')

    const credential_1 = document.getElementById('username')
    const username = credential_1.value
    const credential_2 = document.getElementById('password')
    const password = credential_2.value

    credential_1.value = ''
    credential_2.value = ''

    if (username === "" || password === "") {
        messages.innerHTML = `Please fill in all fields`
    }
    else {

         const response = await fetch('/login-account', {
             method: 'POST',
             headers: {
                'Content-Type': 'application/json',
             },
             body: JSON.stringify({ username:username, password: password })
         })

         data = await response.json()
         
         messages.innerHTML = `${data.reply}`

         if (data.reply === "Login Successful") {
            setTimeout(() => {
            window.location.href = '/home-page';
            }, 1000);
         }
            
        
    }

}