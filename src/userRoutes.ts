
import { Context, Hono } from "hono";
import { HttpError } from "./errors/HttpError";
import { RegisterUserFormRequest } from "./formRequest/RegisterUserFormRequest";
import RegisterUserFormRequestPayload from "./payloads/RegisterUserFormRequestPayload";
import { UserServices } from "./services/UserServive";

var userRoutes = new Hono();
userRoutes.post("/", registerUser);
userRoutes.get("/:uuid/code/:activationCode", activateUser);
userRoutes.post("/signin", signinByEmail);
async function registerUser(ctx: Context) {
  const data : RegisterUserFormRequestPayload = await ctx.req.json();
  const userID = await ctx.env.USERS.get(data.email);
  const registerRequest = new RegisterUserFormRequest(data, ctx);
  await registerRequest.validate();
  if (!registerRequest.isValid) {
    throw new HttpError(registerRequest.errors, 406);
  }
  return ctx.json(await UserServices.registerUser(registerRequest.data, ctx.env.USERS));
}
async function activateUser(ctx) {
  const { uuid = "", activationCode = "" } = ctx.req.paramData;
  const user = await UserServices.activateUser(uuid, activationCode, ctx.env.USERS);
  return ctx.json(user);
}
async function signinByEmail(ctx) {
  const payload = await ctx.req.json();
  const token = await UserServices.singinByEmail(payload, ctx.env.USERS);
  return ctx.json(token);
}

export default userRoutes