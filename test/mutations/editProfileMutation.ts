export const editProfileMutation = (email: string) => `
  mutation {
    editProfile(input:{
      email:"${email}"
    }){
      ok
      error
    }
  }
`;
