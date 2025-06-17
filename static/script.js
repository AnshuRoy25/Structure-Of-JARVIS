
async function send() {
    const modelname = document.getElementById("modelSelector").value;
    const input = document.getElementById('userinput')
    const userinput = input.value 

    if (userinput === '') {
        return
    }

    input.value = ""

    const messages = document.getElementById('messages')
    messages.innerHTML += `You: ${userinput} <br>`

    const response = await fetch('/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userinput: userinput, modelname: modelname })
    })

    const data = await response.json()

    messages.innerHTML += `JARVIS: ${data.reply} <br>`


}

