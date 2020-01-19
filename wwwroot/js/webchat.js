document.addEventListener('DOMContentLoaded', function () {
    var generateRandomName = function() {
        return "User_" + Math.random().toString(36).substring(2, 8);
    }

    // Get the user name and store it to prepend to messages.
    var username = generateRandomName();
    var promptMessage = 'Enter your nickname:';
    do {
        username = prompt(promptMessage, username);
        if (!username || username.startsWith('_') || username.indexOf('<') > -1 || username.indexOf('>') > -1) {
            username = '';
            promptMessage = 'Invalid input, special symbols are forbidden. Enter your nickname:';
        }
    } while(!username)

    var onBeforeUnload = function (event) {
        if(connection)
            connection.send('broadcastMessage', '_SYSTEM_', '1', username + ' LEFT...');
    }

    var createMessageEntry = function (encodedName, encodedMsg) {
        var entry = document.createElement('div');
        entry.classList.add("message-entry");
        if (encodedName === "_SYSTEM_") {
            entry.innerHTML = encodedMsg;
            entry.classList.add("system-message");
        } else if (encodedName === "_ERROR_") {
            entry.innerHTML = `<div class="alert alert-danger fade in">${encodedMsg}</div>`;
        } else if (encodedName === username) {
            entry.innerHTML = `<div class="message-avatar message-own">${encodedName}:</div>` +
                `<div class="message-content">${encodedMsg}<div>`;
        } else {
            entry.innerHTML = `<div class="message-avatar">${encodedName}:</div>` +
                `<div class="message-content">${encodedMsg}<div>`;
        }
        return entry;
    }

    var GetMessageInputFromRoomId = function (roomId) {
        return document.getElementById('message-' + roomId)
    }

    var sendButtonOnClick = function (event) {
        // Get Id of the room and messageInput
        var roomId = event.srcElement.id.slice(-1);
        var messageInput = GetMessageInputFromRoomId(roomId);

        // Call the broadcastMessage method on the hub.
        if (messageInput.value) {
            connection.send('broadcastMessage', username, roomId, messageInput.value);
        }

        // Clear text box and reset focus for next comment.
        messageInput.value = '';
        messageInput.focus();
        event.preventDefault();
    };
    var messageBoxOnKeyPress = function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            var roomId = event.srcElement.id.slice(-1);
            document.getElementById('sendmessage-' + roomId).click();
            return false;
        }
    };

    // Set initial focus to message input box.
    GetMessageInputFromRoomId(1).focus();

    var bindConnectionMessage = function (connection) {
        var messageCallback = function(name, roomId, message) {
            if (!message) return;

            // Html encode display name and message.
            var encodedMsg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            var messageEntry = createMessageEntry(name, encodedMsg);
            var messageBox = document.getElementById('messages-' + roomId);

            // Append message
            messageBox.appendChild(messageEntry);
            messageBox.scrollTop = messageBox.scrollHeight;
        };
        // Create a function that the hub can call to broadcast messages.
        connection.on('broadcastMessage', messageCallback);
        connection.onclose(onConnectionError);
    }

    var onConnected = function (connection) {
        console.log('connection started');
        connection.send('broadcastMessage', '_SYSTEM_', '1', username + ' JOINED...');
        window.addEventListener("beforeunload", onBeforeUnload);

        // SendButtons onClick assignmenet
        var sendButtons = document.getElementsByClassName("sendmessage");
        Array.from(sendButtons).forEach(function(element) {
            element.addEventListener('click', sendButtonOnClick);
          });
        
        // MessageBoxes onKeyPress assignment to catch Enter key
        var messageBoxes = document.getElementsByClassName("message");
        Array.from(messageBoxes).forEach(function(element) {
            element.addEventListener('keypress', messageBoxOnKeyPress);
          });

        // Tab selectors logic
        var chatTabs = document.querySelectorAll("ul.nav-tabs > li");
        var chatTabsClick = function (event) {
            for (var i = 0; i < chatTabs.length; i++) {
                chatTabs[i].classList.remove("active");
            };
            var clickedTab = event.currentTarget;
            clickedTab.classList.add("active");
            event.preventDefault();
            var myContentPanes = document.querySelectorAll(".tab-pane");
            for (i = 0; i < myContentPanes.length; i++) {
                myContentPanes[i].classList.remove("active");
            };
            var activePaneId = event.target.getAttribute("href");
            var activePane = document.querySelector(activePaneId);
            activePane.classList.add("active");
        };
        for (i = 0; i < chatTabs.length; i++) {
            chatTabs[i].addEventListener("click", chatTabsClick)
        };
    }

    var onConnectionError = function (error) {
        if (error && error.message) {
            console.error(error.message);
        }

        var messageBox = document.getElementById('messages-1');
        var messageEntry = createMessageEntry("_ERROR_", 'Connection Error... Hit Refresh/F5 to rejoin.');
        messageBox.appendChild(messageEntry);
        messageBox.scrollTop = messageBox.scrollHeight;
    }

    var connection = new signalR.HubConnectionBuilder()
                                .withUrl('/chat')
                                .build();
    bindConnectionMessage(connection);

    document.asd_connection = connection;

    connection.start()
        .then(function () {
            onConnected(connection);
        })
        .catch(function (error) {
            console.error(error.message);
        });
});
