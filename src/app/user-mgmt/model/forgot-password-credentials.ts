/**
 * Created by Nirojan Selvanathan on 04/04/19.
 */
export class ForgotPasswordCredentials {
    constructor(
        public username: String,
        public key: string,
        public newPassword: string,
    ) {  }
}