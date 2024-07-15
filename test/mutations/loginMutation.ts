export const loginMutation = (email: string, password: string) => `
  mutation {
    login(input:{
      email:"${email}",
      password:"${password}",
    }) {
      ok
      error
      token
    }
  }
`;
