export const userProfileQuery = (userId: number) => `
  {
    userProfile(userId: ${userId}) {
      ok
      error
      user {
        id
      }
    }
  }
`;
