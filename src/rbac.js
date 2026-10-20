// 1. Papéis do sistema e as permissões de cada um (mesma ideia do exercício 1)
export const PAPEIS = {
  paciente: {
    descricao: 'Paciente',
    permissoes: new Set(['ver_historico']),
  },
  enfermeiro: {
    descricao: 'Enfermeiro(a)',
    permissoes: new Set(['ver_historico', 'medir_sinais', 'aplicar_medicamento']),
  },
  medico: {
    descricao: 'Médico(a)',
    permissoes: new Set([
      'ver_historico',
      'medir_sinais',
      'aplicar_medicamento',
      'prescrever_receita',
      'dar_alta',
    ]),
  },
  visitante: {
    descricao: 'Visitante (não cadastrado)',
    permissoes: new Set(),
  },
};

// 2. Ações controladas pelo RBAC (usadas pra montar a tabela da página)
export const ACOES = [
  { id: 'ver_historico', descricao: 'Ver histórico do paciente' },
  { id: 'medir_sinais', descricao: 'Medir sinais vitais' },
  { id: 'aplicar_medicamento', descricao: 'Aplicar medicamento' },
  { id: 'prescrever_receita', descricao: 'Prescrever receita' },
  { id: 'dar_alta', descricao: 'Dar alta ao paciente' },
];

// 3. Base de usuários simulada, ligando o e-mail do Google ao papel.
// Quem não estiver aqui entra como visitante (sem permissão nenhuma).
// Pra testar com a sua conta, troque um dos e-mails pelo seu.
export const USUARIOS = new Map([
  ['lucas@exemplo.com', { nome: 'Lucas', papel: 'paciente' }],
  ['mariana@exemplo.com', { nome: 'Mariana', papel: 'enfermeiro' }],
  ['roberto@exemplo.com', { nome: 'Roberto', papel: 'medico' }],
]);

// 4. Descobre o papel a partir do e-mail que veio no token do Google
export function obterPapel(email) {
  if (!email) return 'visitante';

  const usuario = USUARIOS.get(email.toLowerCase());
  return usuario?.papel ?? 'visitante';
}

// 5. Verifica se o papel tem a permissão pedida
export function temPermissao(papel, permissao) {
  return PAPEIS[papel]?.permissoes.has(permissao) ?? false;
}
