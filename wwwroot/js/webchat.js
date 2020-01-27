document.addEventListener('DOMContentLoaded', function () {
    // Object to keep variables we can need later
    // It's final goal is to separate chat logic from UI
    // To a chat component, which should be only configured with settings, and it could be attached to UI/HTML pages
    // TODO: Get rid of global var later
    var rooms = window._rooms = {};

    // TODO: move roomsList structure to BackEnd for security reasons
    rooms.list = ["family", "friends", "work"];
    var windowTemplate = rooms.list.map((item, index) => `<div id="tab-${index}" class="tab-pane ${index === 0 ? "active" : ""}">
                       
    <div class="${item}-tab messages" id="messages-${index}"></div>
                                                                    <div class="bottom-row"> 
                                                                        <textarea id="message-${index}" class="message"
                                                                                    placeholder="Type message and press Enter to send..."></textarea>
                                                                        <button class="sendmessage" id="sendmessage-${index}">Send</button>
                                                                    </div>
                                                                </div>`).join("");
    var buttonsTemplate = rooms.list.map((item, index) => `<li class="${index === 0 ? "active" : ""}">
                                                                    <a class="${item}" href="#tab-${index}">${item}</a>
                                                              </li>`).join("");
    document.getElementById("nav").innerHTML = buttonsTemplate;
    document.getElementById("tab").innerHTML = windowTemplate;

    rooms.tabs = document.querySelectorAll("ul.nav-tabs > li");
    rooms.messageBoxes = [];
    for (let i = 0; i < rooms.list.length; i++) 
        rooms.messageBoxes[i] = document.getElementById('messages-' + i);
    rooms.message = [];
    for (let i = 0; i < rooms.list.length; i++) 
        rooms.message[i] = document.getElementById('message-' + i);
    rooms.sendBtn = [];
    for (let i = 0; i < rooms.list.length; i++) 
        rooms.sendBtn[i] = document.getElementById('sendmessage-' + i);

    // Set initial focus to message input box.
    rooms.message[1].focus();
        
    // ---------------------------------------------------------------------------------------------------
    
    var addDivToMessageBox = function (roomId, messageDiv) {
        rooms.messageBoxes[roomId].appendChild(messageDiv);
        rooms.messageBoxes[roomId].scrollTop = rooms.messageBoxes[roomId].scrollHeight;
    }
    var addDivToAllmessageBoxes = function (messagediv) {
        for (let i = 0; i < rooms.messageBoxes.length; i++) {
            addDivToMessageBox(i, i == 0 ? messagediv : messagediv.cloneNode(true));
        }
    }
    var AppenndMessage = function (messageType, message, roomId) {
        // TODO:make structure for possible messageTypes so they become extendable
        var div;
        if (messageType === "_SYSTEM_") {
            div = createDiv("_SYSTEM_",message);
            addDivToAllmessageBoxes(div);
            return;
        }

        if (messageType === username) {
            div = createDiv("_SAME_USER_",message, messageType)
        } else {
            div = createDiv("_MESSAGE_",message, messageType);
        }
        addDivToMessageBox(roomId, div);
    }

    // TODO this is UI, not chat function.
    // It should be given as parammter, or to be easly replaced
    var createDiv = function (divType, message, headMessage) {
        var div = document.createElement('div');
        div.classList.add("message-div");
        if (divType === "_SYSTEM_") {
            div.innerHTML = `<div class="system">${message}</div>`;
        } else if (divType === "_ERROR_") {
            div.innerHTML = `<div class="alert alert-danger fade in">${message}</div>`;
        } else if (divType === "_SAME_USER_") {
            div.innerHTML = `<div class="message-avatar own">${headMessage}:</div>` +
                `<div class="message-content">${message}<div>`;
        } else if (divType === "_MESSAGE_") {
            div.innerHTML = `<div class="message-avatar">${headMessage}:</div>` +
                `<div class="message-content">${message}<div>`;
        }
        return div;
    }
    
    // ---------------------------------------------------------------------------------------------------
    // helper functions w/o business logic
    
    var generateRandomName = function() {
        return "User_" + Math.random().toString(36).substring(2, 8);
    }

    // Get the user username and store it to prepend to messages.
    var username = generateRandomName();
    var promptMessage = 'Enter your nickname:';
    do {
        username = prompt(promptMessage, username);
        if (!username || username.startsWith('_') || username.indexOf('<') > -1 || username.indexOf('>') > -1 || username.length > 13)  {
            username = '';
            promptMessage = 'Invalid input, 13 symbols max, special symbols are forbidden. Enter your nickname:';
        }
    } while(!username)
    
    // ---------------------------------------------------------------------------------------------------

    // Notify for leaving on browser close
    var onBeforeUnload = function (event) {
        if(connection)
            connection.send('broadcastMessage', '_SYSTEM_', '1', username + ' LEFT...');
    }

    var sendButtonOnClick = function (event) {
        // Get Id of the room and messageInput
        var roomId = event.srcElement.id.slice(-1);
        var messageInput = rooms.message[roomId];

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
        // On Enter key - send message
        if (event.keyCode === 13) {
            event.preventDefault();
            var roomId = event.srcElement.id.slice(-1);
            rooms.sendBtn[roomId].click();
            return false;
        }
    };

    var bindConnectionMessage = function (connection) {
        var messageCallback = function(username, roomId, rawMessage) {
            if (!rawMessage) return;

            // Html encode display username and message.
            var message = rawMessage.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            AppenndMessage(username, message, roomId);
        };
        // Create a function that the hub can call to broadcast messages.
        connection.on('broadcastMessage', messageCallback);
        connection.onclose(onConnectionError);
    }

    var onConnected = function (connection) {
        console.log('connection started');
        connection.send('broadcastMessage', '_SYSTEM_', '1', username + ' JOINED...');
        window.addEventListener("beforeunload", onBeforeUnload);

        // TODO: this should be parametrized, instead of global
        // SendButtons onClick assignmenet
        window._rooms.sendBtn.forEach(function(element) {
            element.addEventListener('click', sendButtonOnClick);
          });
        
        // messageBoxes onKeyPress assignment to catch Enter key
        window._rooms.messageBoxes.forEach(function(element) {
            element.addEventListener('keypress', messageBoxOnKeyPress);
          });

        var tabs = window._rooms.tabs;
        // Tab selectors logic
        var roomTabClick = function (event) {
            for (var i = 0; i < tabs.length; i++) {
                tabs[i].classList.remove("active");
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
        for (i = 0; i < tabs.length; i++) {
            tabs[i].addEventListener("click", roomTabClick)
        };
    }

    // Notify user on connection problems
    var onConnectionError = function (error) {
        if (error && error.message) {
            console.error(error.message);
        }
        var messagediv = createDiv("_ERROR_", 'Connection Error... Hit Refresh/F5 to rejoin.');
        addDivToAllmessageBoxes(messagediv);
    }

    // Initialize Hub connection
    var connection = new signalR.HubConnectionBuilder()
                                .withUrl('/chat')
                                .build();
    bindConnectionMessage(connection);

    connection.start()
        .then(function () {
            onConnected(connection);
        })
        .catch(function (error) {
            console.error(error.message);
        });
});