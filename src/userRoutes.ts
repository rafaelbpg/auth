
import { Context, Hono } from "hono";
import { HttpError } from "./errors/HttpError";
import { RegisterUserFormRequest } from "./formRequest/RegisterUserFormRequest";
import RegisterUserFormRequestPayload from "./payloads/RegisterUserFormRequestPayload";
import SigningUserFormRequestPayload from "./payloads/SigningUserFormRequestPayload";
import { UserServices } from "./services/UserServive";
import { User } from "./types/User";

var userRoutes = new Hono();
userRoutes.post("/", registerUser);
userRoutes.get("/:uuid/code/:activationCode", activateUser);
userRoutes.post("/signin", signinByEmail);
userRoutes.get('/whois', whois);

async function registerUser(ctx: Context) : Promise<Response> {
  const data : RegisterUserFormRequestPayload = await ctx.req.json();
  const userID = await ctx.env.USERS.get(data.email);
  const registerRequest = new RegisterUserFormRequest(data, ctx);
  await registerRequest.validate();
  if (!registerRequest.isValid) {
    throw new HttpError(registerRequest.errors, 406);
  }
  return ctx.json(await UserServices.registerUser(registerRequest.data, ctx.env.USERS));
}
async function activateUser(ctx: Context) : Promise<Response> {
  const { uuid = "", activationCode = "" } = ctx.req.paramData;
  const user = await UserServices.activateUser(uuid, activationCode, ctx.env.USERS);
  return ctx.json(user);
}
async function signinByEmail(ctx: Context) : Promise<Response> {
  const payload : SigningUserFormRequestPayload = await ctx.req.json();
  const token = await UserServices.singinByEmail(payload, ctx.env.USERS);
  return ctx.json(token);
}
async function whois(ctx: Context): Promise<Response>{
    const tokenString = ctx.req.header('Authorization') || ''
    const user : User = await UserServices.whois(tokenString, ctx.env.USERS)
    return ctx.json(user)
}
export default userRoutes