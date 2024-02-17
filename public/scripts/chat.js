// public/scripts/chat.js
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
  
    socket.on('chat message', (data) => {
      const messages = document.getElementById('messages');
      const item = document.createElement('li');
      item.innerHTML = `<strong>${data.user}:</strong> ${data.message}`;
      messages.appendChild(item);
    });
  
    socket.on('room list', (rooms) => {
      const roomList = document.getElementById('rooms');
      roomList.innerHTML = '';
      rooms.forEach((room) => {
        const item = document.createElement('li');
        item.textContent = room;
        roomList.appendChild(item);
      });
    });
  
    document.getElementById('join-room').addEventListener('click', () => {
      const room = document.getElementById('room').value;
      if (room.trim() !== '') {
        socket.emit('join room', room);
        document.getElementById('room-title').textContent = room;
        document.getElementById('room-list').style.display = 'none';
        document.getElementById('chat-room').style.display = 'block';
      }
    });
  
    document.getElementById('send').addEventListener('click', () => {
      const messageInput = document.getElementById('msg');
      const message = messageInput.value;
      if (message.trim() !== '') {
        socket.emit('chat message', { message });
        messageInput.value = '';
      }
    });
  });
  