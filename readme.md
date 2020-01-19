Simple robust web chat with .net core 3.1 and SignalR 

* I dont use Groups for rooms, because clients will have all rooms at once, so no need to separate them.

TODO:
* Separate HUB logic from UI logic in webchat.js. Spread it to 2 or 3 js files files.
* Template generation - chat List to be moved on Server-Side, for security reason
* CSS styles for different rooms to be generated dynamically
* Extend join/leave notfication to all rooms
* Add "unread messages" indicator on inactive chats