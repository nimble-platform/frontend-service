/**
 * Created by jinnerbi on 03/07/17.
 */
export class ResetPasswordCredentials {
    constructor(
        public oldPassword: string,
        public newPassword: string,
    ) {  }
}