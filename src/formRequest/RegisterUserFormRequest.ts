import { Context } from 'hono'
import RegisterUserFormRequestPayload from '../payloads/RegisterUserFormRequestPayload';
const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export class RegisterUserFormRequest {
  public data : RegisterUserFormRequestPayload
  public ctx : Context
  public errors : string[]
  public isValid : boolean
  constructor(data : RegisterUserFormRequestPayload, ctx : Context) {
    this.data = data;
    this.ctx = ctx;
  }
  async validate() {
    await this.rules();
    this.isValid = this.errors.length === 0;
  }
  async rules() {
    const { email = "", password = "", name = "" } = this.data;
    const userID = await this.ctx.env.USERS.get(email);
    const errors = [];
    if (!email) {
      errors.push("Email is required");
    }
    if (!password) {
      errors.push("Password is required");
    }
    if (!name) {
      errors.push("A name is required");
    }
    if (password.length <= 8) {
      errors.push("The password should have more of 8 characters");
    }
    if (email !== "" && !email.match(emailRegex)) {
      errors.push("The inserted e-mail is not valid");
    }
    if (userID) {
      errors.push("User already exists!");
    }
    this.errors = errors;
  }
};