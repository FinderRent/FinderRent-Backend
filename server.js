const mongoos = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoos.connect(DB).then(() => {
  console.log('DB connected successfuly!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listen on port: ${port}`);
});
