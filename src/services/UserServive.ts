import { v4 as v4_default } from 'uuid'
import { HttpError } from '../errors/HttpError';
import { Role } from '../types/Role';
import { User } from '../types/User';
import { TokenService } from './TokenService';

const hashPassword = async (password : string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  };
const verifyPassword = async (password : string, hash : string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashToCompare = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashToCompare));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex === hash;
};
export class UserServices {
    static async registerUser(request, userNamespace) : Promise<User> {
      const { email = "", password = "", name = "" } = request;
      const uuid = v4_default();
      const activationCode = v4_default();
      const timestamp = Date.now();
      const encryptedPassword = await hashPassword(password);
      const role : Role = "user";
      const user = {
        uuid,
        email,
        password: encryptedPassword,
        name,
        createdAt: timestamp,
        updatedAt: timestamp,
        isActive: false,
        activationCode,
        role
      };
      await userNamespace.put(uuid, JSON.stringify(user));
      await userNamespace.put(email, uuid);
      return user;
    }
    static async activateUser(uuid, activationCode, userNamespace) {
      const stringiffiedUser = await userNamespace.get(uuid);
      if (!stringiffiedUser) {
        const errorResponse2 = {
          message: ["The user doesn't exist"],
          status: 404
        };
        throw new HttpError(errorResponse2.message, errorResponse2.status);
      }
      const user = JSON.parse(stringiffiedUser);
      if (user.isActive) {
        const errorResponse2 = {
          message: ["The user is already activated"],
          status: 403
        };
        throw new HttpError(errorResponse2.message, errorResponse2.status);
      }
      if (user.activationCode === activationCode) {
        user.isActive = true;
        await userNamespace.put(uuid, JSON.stringify(user));
        return user;
      }
      const errorResponse = {
        message: ["The activation code doesn't match"],
        status: 401
      };
      throw new HttpError(errorResponse.message, errorResponse.status);
    }
    static async singinByEmail(payload, userNamespace) {
      const userID = await userNamespace.get(payload.email);
      if (!userID) {
        const errorResponse = {
          message: ["The e-mail is not registered"],
          status: 404
        };
        throw new HttpError(errorResponse.message, errorResponse.status);
      }
      const stringiffiedUser = await userNamespace.get(userID);
      const user = JSON.parse(stringiffiedUser);
      if (!user.isActive) {
        const errorResponse = {
          message: ["The user has not been activated yet"],
          status: 403
        };
        throw new HttpError(errorResponse.message, errorResponse.status);
      }
      if (!await verifyPassword(payload.password, user.password)) {
        const errorResponse = {
          message: ["The password doesn't match"],
          status: 401
        };
        throw new HttpError(errorResponse.message, errorResponse.status);
      }
      const token = await TokenService.registerANewTokenForUser(userID, userNamespace);
      return token;
    }
  };