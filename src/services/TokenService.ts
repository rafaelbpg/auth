import { v4 as v4_default } from 'uuid'
import { HttpError } from '../errors/HttpError'
import { Token } from '../types/Token';
import { User } from '../types/User';
export class TokenService {
    static TOKEN_STORAGE : string = 'tokens_'
    static USER_TOKENS : string = 'user_tokens_'
    
    static async generateToken() : Promise<string> {
      return btoa(v4_default() + "-" + v4_default()).replace("=", "").replace("=", "");
    }
    
    static async registerANewTokenForUser(userID : string, userNamespace : KVNamespace) : Promise<Token> {
      const tokenString = await this.generateToken();
      const token : Token = {
        token: tokenString,
        userID,
        expiresAt: Date.now() + 3600 * 24,
        isActive: true
      };
      const userTokenList: Token[] = JSON.parse(await userNamespace.get(`${this.USER_TOKENS}${userID}`) || "[]");
      userTokenList.push(token);
      await userNamespace.put(`${this.USER_TOKENS}${userID}`, JSON.stringify(userTokenList));
      await userNamespace.put(`${this.TOKEN_STORAGE}${tokenString}`, userID);
      return token;
    }
    static async deleteToken(tokenString : string, userNamespace : KVNamespace) {
      const userID = await userNamespace.get(`${this.TOKEN_STORAGE}${tokenString}`);
      const userTokenList = JSON.parse(await userNamespace.get(`${this.USER_TOKENS}${userID}`) || "[]").map((token) => {
        return token.token !== tokenString;
      });
      await userNamespace.put(`${this.USER_TOKENS}${userID}`, JSON.stringify(userTokenList));
      await userNamespace.delete(`${this.TOKEN_STORAGE}${tokenString}`);
    }
    static async getUserByToken(tokenString : string, userNamespace : KVNamespace): Promise<User> {
      const userID: string = await userNamespace.get(`${this.TOKEN_STORAGE}${tokenString}`);
      const token: Token = JSON.parse(await userNamespace.get(`${this.USER_TOKENS}${userID}`) || "[]").find((token2) => token2.token === tokenString);
      if (!token) {
        const errorResponse = {
          message: ["The token does not exist."],
          status: 401
        };
        throw new HttpError(errorResponse.message, errorResponse.status);
      }
      if (token.expiresAt < Date.now() && !token.isActive) {
        await this.deleteToken(tokenString, userNamespace);
        const errorResponse = {
          message: ["The token is outdated."],
          status: 401
        };
        throw new HttpError(errorResponse.message, errorResponse.status);
      }
      const user : User = JSON.parse(await userNamespace.get(userID));
      return user;
    }
  };