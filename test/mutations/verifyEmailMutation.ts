export const verifyEmailMutation = (verificationCode: string) => `
  mutation {
    verifyEmail(input:{
      code:"${verificationCode}"
    }){
      ok
      error
    }
  }
`;
