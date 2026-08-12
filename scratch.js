const axios = require('axios');
axios.get('https://transportrweb.sdssoftltd.co.uk/api/social-links') // wait, I don't know the full URL
  .then(console.log)
  .catch(console.error);
