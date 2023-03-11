import { Hono } from 'hono'
import { poweredBy } from 'hono/powered-by'
import userRoutes from './userRoutes'

const app = new Hono()

app.use('*', poweredBy())
app.route("/user", userRoutes);
app.get("/", (c) => {
  return c.text("Hello Hono!");
});
app.onError((errors, c) => {
  const { message, status } = JSON.parse(errors.message);
  return c.json(message, status);
});

export default app
