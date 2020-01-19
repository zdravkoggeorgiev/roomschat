using System;
using Microsoft.AspNetCore.SignalR;

namespace RoomsChat.Hubs
{
    public class ChatHub : Hub
    {
        public void BroadcastMessage(string name, string roomId, string message)
        {
            // Timestamp system messages
            if(name == "_SYSTEM_")
                message = DateTime.Now.ToString("[HH:MM:ss]") + message;

            Clients.All.SendAsync("broadcastMessage", name, roomId, message);
        }
    }
}