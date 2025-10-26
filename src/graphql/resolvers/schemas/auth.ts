export default `
    # AUTH USER
    register(email: String!, password: String!): AuthPayload!
    forgotPassword(email: String!): ForgotPasswordResponse!
    updatePassword(
        currentPassword: String!
        newPassword: String!
    ): UpdatePasswordResponse!
`;
