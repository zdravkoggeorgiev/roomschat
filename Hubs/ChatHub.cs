using Microsoft.AspNetCore.SignalR;

namespace RoomsChat.Hubs
{
    public class ChatHub : Hub
    {
        public void BroadcastMessage(string name, string room, string message)
        {
            Clients.All.SendAsync("broadcastMessage", name, room, message);
        }

        // TODO: remove when communcation is stable
        public void Echo(string name, string message)
        {
            Clients.Client(Context.ConnectionId).SendAsync("echo", name, message + " (echo from server)");
        }
    }
}