export const createAccountMutation = (email: string, password: string) => `
  mutation {
    createAccount(input: {
      email: "${email}",
      password: "${password}",
      role: Owner
    }) {
      ok
      error
    }
  }
`;
