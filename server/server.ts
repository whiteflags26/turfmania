import app from './app';

const port = process.env.PORT ?? 3000;

app.listen(port, () => console.log(`Server app listening on port ${port}!`));