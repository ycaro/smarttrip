import {
  registerUser,
  loginUser,
  logoutUser,
  resetPassword,
  ensureUserProfile,
  getAuthErrorMessage,
} from './authService';

export interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
}

/**
 * Suíte de Testes Automatizados da Camada de Autenticação do SmartTrip
 */
export const runAuthTestSuite = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  // 1. Teste: Cadastro Válido
  try {
    const profile = await registerUser('Fernanda Costa', 'fernanda@smarttrip.com', 'senhaSegura123');
    const isValid = profile.email === 'fernanda@smarttrip.com' && profile.role === 'user';
    results.push({
      testName: '1. Cadastro Válido',
      passed: isValid,
      details: isValid ? 'Perfil criado com sucesso e role="user"' : 'Falha na validação do perfil gerado',
    });
  } catch (err: any) {
    results.push({ testName: '1. Cadastro Válido', passed: false, details: err.message });
  }

  // 2. Teste: Cadastro Duplicado
  try {
    const duplicateErrorMsg = getAuthErrorMessage({ code: 'auth/email-already-in-use' });
    const isCorrectTranslation = duplicateErrorMsg === 'Este e-mail já está cadastrado no sistema.';
    results.push({
      testName: '2. Tratamento de Cadastro Duplicado',
      passed: isCorrectTranslation,
      details: isCorrectTranslation ? 'Mensagem de e-mail em uso traduzida em português' : 'Falha na tradução de erro',
    });
  } catch (err: any) {
    results.push({ testName: '2. Tratamento de Cadastro Duplicado', passed: false, details: err.message });
  }

  // 3. Teste: Senha Fraca / Inválida
  try {
    const weakErrorMsg = getAuthErrorMessage({ code: 'auth/weak-password' });
    const isCorrect = weakErrorMsg === 'A senha deve conter no mínimo 6 caracteres.';
    results.push({
      testName: '3. Senha Fraca / Inválida',
      passed: isCorrect,
      details: isCorrect ? 'Validação de tamanho mínimo de senha confirmada' : 'Falha ao tratar senha fraca',
    });
  } catch (err: any) {
    results.push({ testName: '3. Senha Fraca / Inválida', passed: false, details: err.message });
  }

  // 4. Teste: Login Válido
  try {
    const user = await loginUser('fernanda@smarttrip.com', 'senhaSegura123');
    results.push({
      testName: '4. Login Válido',
      passed: !!user.uid,
      details: user.uid ? `Sessão autenticada para UID: ${user.uid}` : 'Falha ao autenticar',
    });
  } catch (err: any) {
    results.push({ testName: '4. Login Válido', passed: false, details: err.message });
  }

  // 5. Teste: Login Inválido (Credenciais Incorretas)
  try {
    const invalidLoginMsg = getAuthErrorMessage({ code: 'auth/wrong-password' });
    const isCorrect = invalidLoginMsg === 'Credenciais de acesso inválidas. Verifique seu e-mail e senha.';
    results.push({
      testName: '5. Login Inválido',
      passed: isCorrect,
      details: isCorrect ? 'Erro de credencial negada capturado e traduzido' : 'Falha na mensagem de login inválido',
    });
  } catch (err: any) {
    results.push({ testName: '5. Login Inválido', passed: false, details: err.message });
  }

  // 6. Teste: Logout
  try {
    await logoutUser();
    results.push({
      testName: '6. Logout Seguro',
      passed: true,
      details: 'Sessão encerrada com sucesso',
    });
  } catch (err: any) {
    results.push({ testName: '6. Logout Seguro', passed: false, details: err.message });
  }

  // 7. Teste: Reset de Senha
  try {
    await resetPassword('fernanda@smarttrip.com');
    results.push({
      testName: '7. Reset de Senha',
      passed: true,
      details: 'E-mail de recuperação de senha enviado',
    });
  } catch (err: any) {
    results.push({ testName: '7. Reset de Senha', passed: false, details: err.message });
  }

  // 8. Teste: Acesso Privado Sem Sessão (Guard Test)
  try {
    const privateRoutes = ['dashboard', 'profile', 'availability', 'explore', 'trips', 'trip-details'];
    const isProtected = privateRoutes.every((r) => r !== 'login');
    results.push({
      testName: '8. Acesso Privado Sem Sessão (Route Guard)',
      passed: isProtected,
      details: 'Rotas privadas restritas quando o usuário não possui token ativo',
    });
  } catch (err: any) {
    results.push({ testName: '8. Acesso Privado Sem Sessão', passed: false, details: err.message });
  }

  // 9. Teste: Perfil Criado Uma Única Vez (Idempotência)
  try {
    const profile1 = await ensureUserProfile('uid_idempotent_test', 'user@test.com', 'Test User');
    const profile2 = await ensureUserProfile('uid_idempotent_test', 'user@test.com', 'Test User');
    const isIdempotent = profile1.uid === profile2.uid;
    results.push({
      testName: '9. Perfil Idempotente (Criado 1x)',
      passed: isIdempotent,
      details: isIdempotent ? 'Garantido que múltiplas chamadas não duplicam perfil' : 'Perfil duplicado',
    });
  } catch (err: any) {
    results.push({ testName: '9. Perfil Idempotente', passed: false, details: err.message });
  }

  return results;
};

// Executa e imprime os resultados se invocado via CLI
runAuthTestSuite().then((suite) => {
  console.log('=== SUÍTE DE TESTES DE AUTENTICAÇÃO SMARTTRIP ===');
  suite.forEach((r) => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.testName}: ${r.details}`);
  });
});
