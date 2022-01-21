import {reqIdGenerate} from '../utils/reqIdGenerator';
import {Action, noParamsCreator, ResponseAction, SliceConfig} from '../actions-integration/types';    // todo move these out of actions





export interface AuthAction extends Action {
  reqId?: string;
  tail?: string;
  body: any
}

  // the reqId is actually added later by middleware
  const aCreate = ()=>({reqId: ''});  // all api calls have reqId generated here, then where can middleware get it from? header?

  // creators don't need to satisfy type
  const creators = {
    refreshToken: (refreshToken:string)=>({body:{refreshToken}}),               // refresh token will be called only by middleware with the refreshToken from state
    omsApiCatchAllError:  noParamsCreator,

    login:         (email:string, password:string)=>({body:{email,password}}),  // put it into body
    loginIdp:     aCreate,  // implement later
  };

// authType as categorized by claims (more detailed than a higher level type we might use
export type ClaimAuthType = 'PASSWORD'|'ONE_TIME_PASSWORD'|'PASSWORDLESS'|     // local logins
                             'GOOGLE' |'APPLE'            |'LINKEDIN'    |     // idps
                      'LDAP_CONNECTOR'|'OPENID_CONNECT'   |                    // some other possibilities
                       'REFRESH_TOKEN'|                                        // refresh post login, presumably
                         'USER_CREATE'|'REGISTRATION'     |'APPLICATION_TOKEN' // other (not exhaustive options)
interface Claims {
  aud: string;
  exp: number;
  iat: number;
  iss: "prometheusalts.com",
  sub: "fef1c216-be3f-4e19-8410-280e4098167b",
  jti: "f3d0adf0-a9ee-4cbd-95fa-1963dcf8ee86",
  authenticationType: ClaimAuthType,
  email: string;
  email_verified:boolean;
  applicationId: string;
  roles: string[];
}

// these are the return values of a successful login
interface SuccessfulLogin {
  accessToken: string;
  refreshToken: string;
  isRegistered: boolean;  // if isRegistered is false, it should also trigger a notification
}


export interface AuthState {

  accessToken: string | null;
  refreshToken: string | null;
  isRegistered: boolean;

  claims: Claims | { };
  firstAuthorized: number;  // timestamp
  nowAuthorized: boolean;

  refreshCount: number;  // increment with every refresh
  refreshAttempts: number; // tracks failed refresh token attempts

  loginCount: number;
  loginAttempts: number;
}

// does not contain user profile information
const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  isRegistered: false,
  claims: {},
  firstAuthorized:0,
  nowAuthorized: false,
  refreshCount: 0,
  refreshAttempts: 0,
  loginCount: 0,
  loginAttempts: 0,
} as const;

type AuthReducer = (s:AuthState,...rest: any)=>AuthState;
type AuthReducers = Record<string, AuthReducer>;

//login results
// "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im9aMGxzNC1hdWxwQ3FaS1ExWjA1Q1JEUTdRRSJ9.eyJhdWQiOiIxNDA2ZTBhNC04YTE1LTQxODEtYTBkNi04OGQyYWIxNGYxNDQiLCJleHAiOjE2NDI3MTM5MDMsImlhdCI6MTY0MjcxMzgwMywiaXNzIjoicHJvbWV0aGV1c2FsdHMuY29tIiwic3ViIjoiNWZmMTE0MjQtZjMzZC00ZTA2LWJmYzQtNzgyZTk1YTc3NjIwIiwianRpIjoiNzkxZmU0OTYtZmVkOC00ZTNmLWJiZmUtYzhhNjA1ODllOTk3IiwiYXV0aGVudGljYXRpb25UeXBlIjoiUEFTU1dPUkQiLCJlbWFpbCI6Imh6YW1pckBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXBwbGljYXRpb25JZCI6IjE0MDZlMGE0LThhMTUtNDE4MS1hMGQ2LTg4ZDJhYjE0ZjE0NCIsInJvbGVzIjpbXX0.VXgKEfliRCgA5H5-h3H1EUaC41LwdHh1Ehqw9zBLLb2GK0oQOPyOZ0QYT_r_p78DnrXCaGUd4WDItf321fznlw-gWfTGsHbI3wS9SM2zIlI6ESLxd34cIo8OGQAnN086nV_0ps9keTmafWWJ-SkJK4UVkMX7FLVLhmqeD6RImKkMGIizQ-WdTP-PynJC8xH5Uvv8QvelkYbTj-ZC0Oa9sd3KsDQSwB0n1c4iUG5saGxp0lk1-pP3aXXl6VGb0H0iHE_iC3qBdrA1dxEub3SntnoRXvB897Jb0aMmGLMZjmrchvOTxzfZTyH_ZhK-FTbdv8YxiZuJYzX0ji24AJr3SA",
//   "refreshToken": "bZXkys0xQ5bN-jVKCoREN4ixw_xEW0eZ5Ldw7LK7872ftvieTNt3KQ",
//   "isRegistered": true

// copy designated properties directly from source

const reducers:AuthReducers = {
  catchAllException:   s=>s,    // no

  refreshToken:    s=>s,
  login:           s=>s,
  refreshResponse: (s, a:ResponseAction) =>({...s, accessToken:a.response.data.token, refreshCount: s.refreshCount + 1 }),
  loginResponse:   (s, a:ResponseAction)=>({...s, ...a.response.data as SuccessfulLogin, loginCount: s.loginCount + 1}),

  // auth slice tracks failed attempts, other slices (notify, and request) track errors, and request level issues
  loginError:      (s, a:ResponseAction)=>({...s, loginAttempts: s.loginAttempts + 1}),
  loginException:  (s, a:ResponseAction)=>({...s, loginAttempts: s.loginAttempts + 1}),


  loginIdp: s=>s,
};


export const sliceConfig:SliceConfig = {name: "auth", initialState, creators, reducers};



