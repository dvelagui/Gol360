export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/invalid-password':
      return 'Correo o contraseña incorrectos.';
    case 'auth/user-not-found':
      return 'No existe una cuenta con ese correo.';
    case 'auth/invalid-email':
      return 'El correo no es válido.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.';
    case 'auth/network-request-failed':
      return 'Problema de conexión. Verifica tu internet.';
    case 'auth/user-disabled':
      return 'Esta cuenta está deshabilitada. Contacta soporte.';
    default:
      return 'No pudimos iniciar sesión. Inténtalo de nuevo.';
  }
}
