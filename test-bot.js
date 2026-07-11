import handler from './api/bot.js';

// Mock request and response
const req = {
  method: 'POST',
  body: {
    update_id: 1,
    message: {
      message_id: 1,
      chat: {
        id: 123456789,
        type: 'private'
      },
      text: '/title Software Wizard & AI Specialist'
    }
  }
};

const res = {
  status: function(code) {
    console.log('Status set to:', code);
    return this;
  },
  json: function(data) {
    console.log('JSON Response:', data);
  },
  send: function(data) {
    console.log('Send Response:', data);
  }
};

console.log("Running local test...");
await handler(req, res);
console.log("Test finished.");
