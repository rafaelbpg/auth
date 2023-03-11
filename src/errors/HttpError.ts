export class HttpError {
    constructor(message : string[], status : number) {
      const errors = {
        message,
        status
      };
      return new Error(JSON.stringify(errors))
    }
  }