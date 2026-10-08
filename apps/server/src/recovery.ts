// Product owner explicitly deferred email delivery until production (08/10/2026).
// No token issuance, fake delivery, automatic email verification or success response.
export async function sendRecoveryEmail(): Promise<never> {
  throw new Error('RECOVERY_NOT_CONFIGURED');
}
