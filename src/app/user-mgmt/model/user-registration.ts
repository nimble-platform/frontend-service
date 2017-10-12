import { Credentials } from './credentials';
import { User } from './user';

export class UserRegistration {

    public user: User;
    public credentials: Credentials;

    public static initEmpty() {
        let ur = new UserRegistration();
        ur.user = new User('', '', '', '', '', '', '', '', '');
        ur.credentials = new Credentials('', '');
        return ur;
    }
}